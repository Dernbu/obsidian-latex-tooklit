import { Console } from 'console';
import { App, Editor, moment, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { listenerCount } from 'process';
import { moveCursor } from 'readline';
import { start } from 'repl';
import { LatexEnvUtility } from 'utility-modules/LatexEnvUtility';
import { InputMode } from 'utility-modules/InputMode';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		console.log("Loading!");

		console.log("Initialising Input Modes:")

		// this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
		// 	console.log("Key Down!");
		// 	console.log(evt.key);  
		// });

		this.registerDomEvent(document, 'keydown', (event: KeyboardEvent) => {
			console.log("Key Pressed!");
			console.log(event.key);
			switch (event.key) {
				// Handle $$ Environments
				case '$':
					InputMode.endAllInputModes(event);
					this.handleDollar(event);
					return;
				// Subscript
				case '_':
					InputMode.endInputModeByTypes(["superscript", "subscript"], event);
					this.handleUnderscore(event);
					return;
				// Superscript
				case '^':
					InputMode.endInputModeByTypes(["superscript", "subscript"], event);
					this.handleCarrot(event);
					return;
				// Fast fraction (latex)
				case '/':
					InputMode.endAllInputModes(event);
					this.handleForwardSlash(event);
					return;
				// // Auto-complete brackets (latex, no selection)
				// // This has some complications and doesn't work, so whatever
				// case '(':
				// case '[':
				// case '{':
				// 	this.handleBracket(event);
				// 	return;

				// Space
				case ' ':
					InputMode.endAllInputModes(event);
					return;
			}
		});

		// this.registerDomEvent(document, 'keyup', (evt: KeyboardEvent) => {
		// 	console.log("Key Up!");
		// });

		// // Drop event => kill all input modes
		this.registerEvent(this.app.workspace.on('editor-drop', InputMode.killAllInputModes));
		// // Quick preview 
		// this.registerEvent(this.app.workspace.on('quick-preview', this.inputModes.killAllModes));
		// this.registerEvent(this.app.workspace.on('active-leaf-change', this.inputModes.killAllModes));
		// this.registerEvent(this.app.workspace.on('file-open', this.inputModes.killAllModes));
		// this.registerEvent(this.app.vault.on('create', this.inputModes.killAllModes));
		// this.registerEvent(this.app.vault.on('delete', this.inputModes.killAllModes));
		// this.registerEvent(this.app.vault.on('closed', this.inputModes.killAllModes));


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));



		// this.addCommand({
		// 	id: "test-id",
		// 	name: "Insert $ symbols",
		// 	editorCallback: (editor: Editor) => {
		// 		const selection = editor.getSelection();
		// 		editor.replaceSelection("$" + selection + "$");
		// 	//   editor.replaceRange(moment().format("YYYY-MM-DD"), editor.getCursor());
		// 		editor.setCursor(editor.getCursor().ch-2);
		// 	},
		//   });

	}

	private readonly handleDollar = (
		event: KeyboardEvent
	): void => {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();


		const currentLine = editor.getLine(cursor.line);
		const mathEnvStatus = LatexEnvUtility.isMathEnv(editor, cursor.line, cursor.ch);
		console.log(mathEnvStatus);

		const selection = editor.getSelection();

		// Nothing selected
		if (selection === '') {

			// $ ... |$ => $ ... $|, but not $|$ => $$|
			if (!mathEnvStatus.eqnEnv && mathEnvStatus.inlineEnv && currentLine.charAt(cursor.ch) == "$" && currentLine.charAt(cursor.ch - 1) != "$") {
				editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
				editor.replaceRange("", { line: cursor.line, ch: cursor.ch }, { line: cursor.line, ch: cursor.ch + 1 });
				return;
			}

			// $$...$|$ => $$...$$|
			if (mathEnvStatus.eqnEnv && mathEnvStatus.inlineEnv && currentLine.slice(cursor.ch - 1, cursor.ch + 1) == "$$") {
				editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
				editor.replaceRange("", { line: cursor.line, ch: cursor.ch }, { line: cursor.line, ch: cursor.ch + 1 });
				return;
			}

			// $$$| => $$$$|
			if (mathEnvStatus.eqnEnv && mathEnvStatus.inlineEnv && currentLine.slice(cursor.ch - 3, cursor.ch) == "$$$	") {
				console.log("HI2");
				editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
				editor.replaceRange("", { line: cursor.line, ch: cursor.ch }, { line: cursor.line, ch: cursor.ch + 1 });
				return;
			}

			// $$...|$$ => $$...$|$
			if (mathEnvStatus.eqnEnv && currentLine.slice(cursor.ch, cursor.ch + 2) == "$$") {
				editor.setCursor({ line: cursor.line, ch: cursor.ch });
				editor.replaceRange("", { line: cursor.line, ch: cursor.ch }, { line: cursor.line, ch: cursor.ch + 1 });
				return;
			}

			// If 	$ ... $| => $$ ... $$| 
			if (!mathEnvStatus.inlineEnv && LatexEnvUtility.isMathEnv(editor, cursor.line, cursor.ch - 1).inlineEnv) {
				const prevDollarIndex = currentLine.slice(0, cursor.ch - 1).lastIndexOf("$");
				editor.replaceRange("$", { line: cursor.line, ch: prevDollarIndex });
				return;
			}

			// | => $|$
			if (!mathEnvStatus.inlineEnv) {
				editor.replaceSelection("$");
				// editor.replaceSelection("$$");
				// editor.replaceRange("", {line: cursor.line, ch: cursor.ch}, {line: cursor.line, ch: cursor.ch+1})
				// editor.setCursor(cursor.line, cursor.ch);
				editor.setSelection({ line: cursor.line, ch: cursor.ch });

			}

			// $|$ => $$|$$.
			if (mathEnvStatus.inlineEnv) {
				editor.replaceSelection("$");
				editor.setCursor(cursor.line, cursor.ch);
			}
			return;

			// Something selected
		} else {
			editor.replaceSelection("$" + selection);
			return;
		}
	}
	private readonly handleUnderscore = (
		event: KeyboardEvent
	): void => {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();

		const currentLine = editor.getLine(cursor.line);
		const mathEnvStatus = LatexEnvUtility.isMathEnv(editor, cursor.line, cursor.ch);

		const underscorePos = {
			line: cursor.line,
			ch: cursor.ch
		};
		if (editor.getSelection() == "") {
			editor.replaceSelection("_");
			event.preventDefault();
		}
		if (LatexEnvUtility.isAnyLatexEnv(editor, cursor.line, cursor.ch)) {
			InputMode.startInputMode('subscript', (endingEvent: KeyboardEvent) => {
				// Update cursor object
				const cursor = view.editor.getCursor();

				// Check if underscore is the same place as the cursor (i.e. /|)
				if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("/") == cursor.ch - 1) {
					editor.replaceSelection("\frac{}{}");
				}

				// Check if the underscore has been deleted
				if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("_") == underscorePos.ch) {
					editor.replaceRange("{", { line: underscorePos.line, ch: underscorePos.ch + 1 });
					editor.replaceSelection("}");

					if (endingEvent.key == " ") {
						endingEvent.preventDefault();
					}
				}
			});
		} else {
			InputMode.startInputMode("subscript", (endingEvent: KeyboardEvent) => {
				// Update cursor object
				const cursor = view.editor.getCursor();

				// Check if underscore is the same place as the cursor (i.e. _|)
				if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^") == cursor.ch - 1) {
					return;
				}

				// Check if the underscore has been deleted
				if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("_") == underscorePos.ch) {
					editor.replaceRange("<sub>", { line: underscorePos.line, ch: underscorePos.ch },
						{ line: underscorePos.line, ch: underscorePos.ch + 1 });
					editor.replaceSelection("</sub>");
				}
			});
		}
		// console.log("Underscore Pressed!");
	}
	private readonly handleCarrot = (
		event: KeyboardEvent
	): void => {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();

		const currentLine = editor.getLine(cursor.line);
		const mathEnvStatus = LatexEnvUtility.isMathEnv(editor, cursor.line, cursor.ch);

		const carrotPos = {
			line: cursor.line,
			ch: cursor.ch
		};

		// console.log(carrotPos);
		if (LatexEnvUtility.isAnyLatexEnv(editor, cursor.line, cursor.ch)) {
			InputMode.startInputMode("superscript", (endingEvent: KeyboardEvent) => {
				// Update cursor object
				const cursor = view.editor.getCursor();

				// Check if carrot is the same place as the cursor (i.e. ^|)
				if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^") == cursor.ch - 1) {
					return;
				}

				// Check if the underscore has been deleted
				if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^") == carrotPos.ch) {
					editor.replaceRange("{", { line: carrotPos.line, ch: carrotPos.ch + 1 });
					editor.replaceSelection("}");
					if (endingEvent.key == " ") {
						endingEvent.preventDefault();
					}
				}
			});
		} else {
			InputMode.startInputMode("superscript", (endingEvent: KeyboardEvent) => {
				// Update cursor object
				const cursor = view.editor.getCursor();

				// Check if carrot is the same place as the cursor (i.e. ^|)
				if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^") == cursor.ch - 1) {
					return;
				}

				// Check if the underscore has been deleted
				if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^") == carrotPos.ch) {
					editor.replaceRange("<sup>", { line: carrotPos.line, ch: carrotPos.ch },
						{ line: carrotPos.line, ch: carrotPos.ch + 1 });
					editor.replaceSelection("</sup>");
				}
			});
		}
	}
	private handleForwardSlash(event: KeyboardEvent) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();
		

		const currentLine = editor.getLine(cursor.line);
		// Autofraction only in math environments
		// TODO Latex math env also detects multi-line eqn environments
		if (!LatexEnvUtility.isAnyLatexEnv(editor, cursor.line, cursor.ch)) {
			return;
		}

		const forwardSlashPos = {
			line: cursor.line,
			ch: cursor.ch
		};

		console.log("Entering forward slash input mode!");

		InputMode.startInputMode("fraction", (endingEvent: KeyboardEvent) => {
			// refresh cursor object
			let cursor = view.editor.getCursor();

			// Check if the underscore has been deleted
			if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("/") != forwardSlashPos.ch) {
				return;
			}

			// Make the \frac{...}{...}!
			const fractionStartPos = LatexEnvUtility.getFractionNumeratorStartPos(view.editor.getLine(cursor.line), forwardSlashPos.ch);

			editor.replaceRange("}{", forwardSlashPos, { line: forwardSlashPos.line, ch: forwardSlashPos.ch + 1 });
			editor.replaceRange("\\frac{", { line: forwardSlashPos.line, ch: fractionStartPos });
			console.log(forwardSlashPos);
			editor.replaceSelection("}");

			// refresh the cursor
			cursor = view.editor.getCursor();
			console.log(editor.getRange({ line: cursor.line, ch: cursor.ch - 4 }, { line: cursor.line, ch: cursor.ch }));

			// Stop space press
			if (endingEvent.key == " ") {
				endingEvent.preventDefault();
			}

			// \frac{}{}| => \frac{ |}{}
			if (editor.getRange({ line: cursor.line, ch: cursor.ch - 4 }, { line: cursor.line, ch: cursor.ch }) == "{}{}") {
				editor.setCursor({ line: cursor.line, ch: cursor.ch - 3 });
				return;
			}

			// \frac{...}{}| =>\frac{...}{ |}
			if (editor.getRange({ line: cursor.line, ch: cursor.ch - 2 }, { line: cursor.line, ch: cursor.ch }) == "{}") {
				editor.setCursor({ line: cursor.line, ch: cursor.ch - 1 });
				return;
			}


		});


	}
	// private handleBracket(event: KeyboardEvent) {
	// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	const editor = view.editor;
	// 	const cursor = editor.getCursor();

	// 	const currentLine = editor.getLine(cursor.line);
	// 	// Selection must be "" and in math mode
	// 	if(editor.getSelection() != "" || !LatexEnvUtility.isAnyLatexEnv(editor.getLine(cursor.line), cursor.ch)){
	// 		return;
	// 	}

	// 	editor.replaceRange(LatexEnvUtility.toClosingbracket(event.key), {line: cursor.line, ch: cursor.ch})
	// }
	onunload() {
		console.log("Unloading!");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Latex Toolkit for Obsidian - Settings' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

// Something similar to a singleton pattern, I guess?
// Has a stack of inputmodes.

