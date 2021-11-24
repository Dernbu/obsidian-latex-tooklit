// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { App, Editor, MarkdownView, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { EnvironmentScanner } from 'plugin_modules/EnvironmentScanner';
import { InputMode } from 'plugin_modules/InputMode';
// import { moveCursor } from 'readline';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	autoCompleteSuperscriptTextMode_toggle: boolean
	autoCompleteSuperscriptMathMode_toggle: boolean
	autoCompleteSubscriptTextMode_toggle: boolean
	autoCompleteSubscriptMathMode_toggle: boolean
	autoFastFraction_toggle: boolean
	autoEncloseRoundBracketsMathMode_toggle: boolean
	autoEncloseSquareBracketsMathMode_toggle: boolean
	autoEncloseCurlyBracketsMathMode_toggle: boolean
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	autoCompleteSuperscriptTextMode_toggle: true,
	autoCompleteSuperscriptMathMode_toggle: true,
	autoCompleteSubscriptTextMode_toggle: true,
	autoCompleteSubscriptMathMode_toggle: true,
	autoFastFraction_toggle: true,
	autoEncloseRoundBracketsMathMode_toggle: true,
	autoEncloseSquareBracketsMathMode_toggle: true,
	autoEncloseCurlyBracketsMathMode_toggle: true
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	async onload() {
		await this.loadSettings();
		console.log("Loading!");

		console.log("Initialising Input Modes:")

		this.registerDomEvent(document, 'keydown',  (event: KeyboardEvent) => {
			console.log("Key Down!");
			console.log(event.key);

			if(event.key == "Escape"){
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView).editor;
				EnvironmentScanner.getInstance().updateEditor(editor);
				console.log("" + EnvironmentScanner.getInstance().getCursorEnv(editor.getCursor()));
			}

		});
		// this.registerDomEvent(document, 'keydown', (event: KeyboardEvent) => {
		// 	console.log("Key Down!");
		// 	console.log(event.key);
		// 	switch (event.key) {
		// 		case 'Escape':
		// 			InputMode.killAllInputModes();
		// 			return;
		// 		case 'ArrowLeft':
		// 		case 'ArrowRight':
		// 		case 'ArrowUp':
		// 		case 'ArrowDown':
		// 			InputMode.killAllInputModes();
		// 			return;
		// 	}
		// });
		const editor = this.app.workspace.getActiveViewOfType(MarkdownView).editor;
		EnvironmentScanner.getInstance().updateEditor(editor);
		this.registerDomEvent(document, 'keypress', (event: KeyboardEvent) => {
			console.log("Key Pressed!");
			console.log(event.key);
			switch (event.key) {
				// Handle $$ Environments
				case '$':
					InputMode.endAllInputModes(event);
					this.handleDollar(event);
					return;
			// 	// Subscript
			// 	case '_':
			// 		InputMode.endInputModeByTypes(["superscript", "subscript"], event);
			// 		this.handleUnderscore(event);
			// 		return;
			// 	// Superscript
			// 	case '^':
			// 		InputMode.endInputModeByTypes(["superscript", "subscript"], event);
			// 		this.handleCarrot(event);
			// 		return;
			// 	// Fast fraction (latex)
			// 	case '/':
			// 		InputMode.endAllInputModes(event);
			// 		this.handleForwardSlash(event);
			// 		return;
			// 	// // Auto-complete brackets in math mode
			// 	case '(':
			// 	case '[':
			// 	case '{':
			// 		this.handleOpenBracket(event);
			// 		return;
			// 	// Auto-escape brackets in math mode
			// 	case ')':
			// 	case ']':
			// 	case '}':
			// 		InputMode.endInputModeByTypes(["superscript", "subscript"], event);
			// 		this.handleClosingBracket(event);
			// 		return;
			// 	case '+':
			// 	case '-':
			// 	case '*':
			// 	case ',':
			// 	case '|':
			// 	case '\\':
			// 		InputMode.endInputModeByTypes(["superscript", "subscript"], event);
			// 		return;

			// 	// Space
			// 	case ' ':
			// 		InputMode.endAllInputModes(event);
			// 		return;
			// 	case 'Escape':
			// 		console.log("Escape Pressed");
			// 		InputMode.killAllInputModes();
			// 		return;
			}
		});

		// this.registerDomEvent(document, 'keyup', (evt: KeyboardEvent) => {
		// 	console.log("Key Up!");
		// });

		// // Drop event => kill all input modes
		this.registerEvent(this.app.workspace.on('editor-drop', InputMode.killAllInputModes));
		// // Quick preview 
		// this.registerEvent(this.app.workspace.on('quick-preview', InputMode.killAllInputModes));
		// this.registerEvent(this.app.workspace.on('active-leaf-change', InputMode.killAllInputModes));
		this.registerEvent(this.app.workspace.on('file-open', InputMode.killAllInputModes));
		// this.registerEvent(this.app.vault.on('create', InputMode.killAllInputModes));
		// this.registerEvent(this.app.vault.on('delete', InputMode.killAllInputModes));
		// this.registerEvent(this.app.vault.on('closed', InputMode.killAllInputModes));


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

	/**
	 * Keyboard Event Handlers
	 */
	private handleDollar(event: KeyboardEvent): void {
		

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();

		const currentCharEnv = EnvironmentScanner.getInstance().getCursorEnv(cursor);
		// Dollar signs not for code environments
		if(currentCharEnv.isCodeEnv()){
			return;
		}

		// <> = selected
		// | => $|$, <abc> => $abc$|
		if(currentCharEnv.isMarkdownEnv() || currentCharEnv.isLatexTextEnv()){
			event.preventDefault();
			const selection = editor.getSelection();
			editor.replaceSelection("$" + selection + "$");
			if(selection == ""){
				editor.setCursor({line: cursor.line, ch: cursor.ch + 1});
			}
			return;
		}

		// $|$ => $$|$$, $abc|$ => $abc$|, $abc| => $abc$|
		if(currentCharEnv.isInlineLatextEnv()){
			const selection = editor.getSelection();
			const nextChar = this.getNextNChars(editor, 1);
			const prevChar = this.getPrevNChars(editor, 1);

			if(selection == ""){
				// $|$ => $$|$$
				if(prevChar == "$" && nextChar == "$"){
					event.preventDefault();		
					editor.replaceSelection("$$");
					editor.setCursor({line: cursor.line, ch: cursor.ch+1});
					return;
				}
				// $abc|$ => $abc$|
				if(nextChar == "$"){	
					event.preventDefault();		
					this.moveCursorForward(editor);
					return;
				}
			}else{
				return;
			}
		}

		// $$|$$ => $$$|$, $$$|$ => $$$$|, $$$| => $$$$|
		if(currentCharEnv.isMultiLineLatexEnv()){
			const selection = editor.getSelection();

			if(selection == ""){
				// $$|$$ => $$$|$
				if(this.getNextNChars(editor, 2) == "$$"){
					event.preventDefault();
					this.moveCursorForward(editor);
					return;
				}
				// $$$|$ => $$$$|
				if(this.getNextNChars(editor, 1) == "$" && this.getPrevNChars(editor, 1) == "$"){
					event.preventDefault();
					this.moveCursorForward(editor);
					return;
				}
				// $$$| => $$$$|
				if(this.getPrevNChars(editor, 1) == "$"){
					return;
				}
			}
		}
	}

	private getNextNChars(editor: Editor, chars: number): string { 
		const cursor = editor.getCursor();
		return editor.getRange(cursor, {line: cursor.line, ch: cursor.ch + chars});
	}	
	private getPrevNChars(editor: Editor, chars: number): string { 
		const cursor = editor.getCursor();
		return editor.getRange({line: cursor.line, ch: cursor.ch - chars}, cursor);
	}	
	private moveCursorForward(editor: Editor) : void {
		const cursor = editor.getCursor();

		editor.setCursor({line: cursor.line, ch: cursor.ch + 1});
		
	}
	// 		/***
	// 		 * Misc
	// 		 */
	// 		// $$$| => $$$$|
	// 		if (mathEnvStatus.eqnEnv && mathEnvStatus.inlineEnv && currentLine.slice(cursor.ch - 3, cursor.ch) == "$$$") {
	// 			editor.replaceSelection("$");
	// 			event.preventDefault();
	// 			return;
	// 		}



	// 		// Something selected
	// 	} else {
	// 		editor.replaceSelection("$" + selection);
	// 		return;
	// 	}
	// }

	// private handleUnderscore(event: KeyboardEvent): void {
	// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	const editor = view.editor;
	// 	const cursor = editor.getCursor();

	// 	// Override auto pairing of underscores
	// 	if (editor.getSelection() == "") {
	// 		editor.replaceSelection("_");
	// 		event.preventDefault();
	// 	}

	// 	if (EnvironmentScanner.isAnyLatexEnv(editor, cursor.line, cursor.ch)) {
	// 		this.startSubscriptMathMode();
	// 	} else {
	// 		this.startSubscriptHTMLMode();
	// 	}
	// }

	// private handleCarrot(event: KeyboardEvent): void {
	// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	const editor = view.editor;
	// 	const cursor = editor.getCursor();

	// 	// console.log(carrotPos);
	// 	if (EnvironmentScanner.isAnyLatexEnv(editor, cursor.line, cursor.ch)) {
	// 		this.startSuperscriptMathMode();
	// 	} else {
	// 		this.startSuperscriptHTMLMode();
	// 	}
	// }

	// private handleForwardSlash(event: KeyboardEvent): void {
	// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	const editor = view.editor;
	// 	const cursor = editor.getCursor();

	// 	// Autofraction only in math environments, and
	// 	// Check toggle for Autofraction
	// 	if (EnvironmentScanner.isAnyLatexEnv(editor, cursor.line, cursor.ch) && this.settings.autoFastFraction_toggle) {
	// 		this.startAutoFractionMathMode();
	// 		return;
	// 	}

	// }

	// private handleOpenBracket(event: KeyboardEvent): void {
	// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	const editor = view.editor;
	// 	const cursor = editor.getCursor();

	// 	// Selection must be "" and in math mode
	// 	if (editor.getSelection() == "" && EnvironmentScanner.isAnyLatexEnv(editor, cursor.line, cursor.ch)) {
	// 		this.autoCloseOpenBracket(event);
	// 		return;
	// 	}
	// }

	// private handleClosingBracket(event: KeyboardEvent): void {
	// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	const editor = view.editor;
	// 	const cursor = editor.getCursor();

	// 	// Selection must be "" and in math mode
	// 	if (editor.getSelection() != "" || !EnvironmentScanner.isAnyLatexEnv(editor, cursor.line, cursor.ch)) {
	// 		return;
	// 	}

	// 	if (editor.getRange(cursor, { line: cursor.line, ch: cursor.ch + 1 }) == event.key) {
	// 		this.escapeEnvironment(event);
	// 	}

	// }

	private startSubscriptMathMode() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();


		// I don't know why i have to do this -1, but whatever
		const underscorePos = { line: cursor.line, ch: cursor.ch - 1 };

		InputMode.startInputMode('subscript', (endingEvent: KeyboardEvent) => {
			// Update cursor object
			const cursor = view.editor.getCursor();

			if (endingEvent.key == " ") {
				endingEvent.preventDefault();
			}

			// Check if the underscore has been deleted
			if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("_") == underscorePos.ch) {

				const subscriptString = editor.getRange(
					{ line: underscorePos.line, ch: underscorePos.ch + 1 },
					{ line: underscorePos.line, ch: cursor.ch });

				editor.replaceRange("{" + subscriptString + "}",
					{ line: underscorePos.line, ch: underscorePos.ch + 1 },
					{ line: underscorePos.line, ch: cursor.ch });

				// Check if underscore is the same place as the cursor (i.e. /|)
				if (subscriptString == "") {
					editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
				}
			}

		});
	}

	private startSubscriptHTMLMode() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();


		// I don't know why i have to do this -1, but whatever
		const underscorePos = { line: cursor.line, ch: cursor.ch - 1 };

		InputMode.startInputMode("subscript", (endingEvent: KeyboardEvent) => {
			// Update cursor object
			const cursor = view.editor.getCursor();


			if (endingEvent.key == " ") {
				endingEvent.preventDefault();
			}

			// Check if the underscore has been deleted
			if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("_") == underscorePos.ch) {
				const subScriptString = editor.getRange(
					{ line: underscorePos.line, ch: underscorePos.ch + 1 },
					{ line: cursor.line, ch: cursor.ch });
				editor.replaceRange("<sub>" + subScriptString + "</sub>",
					{ line: underscorePos.line, ch: underscorePos.ch },
					{ line: cursor.line, ch: cursor.ch });

				// Check if underscore is the same place as the cursor (i.e. _|)
				if (subScriptString == "") {
					editor.setCursor({ line: cursor.line, ch: cursor.ch + 4 });
				}
			}


		});
	}

	private startSuperscriptMathMode() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();


		const carrotPos = { line: cursor.line, ch: cursor.ch };

		InputMode.startInputMode("superscript", (endingEvent: KeyboardEvent) => {
			// Update cursor object
			const cursor = view.editor.getCursor();

			if (endingEvent.key == " ") {
				endingEvent.preventDefault();
			}
			
			// Check if the carrot has been deleted
			if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^") == carrotPos.ch) {
				const superscriptString = editor.getRange(
					{ line: carrotPos.line, ch: carrotPos.ch + 1 },
					{ line: carrotPos.line, ch: cursor.ch });

				editor.replaceRange("{" + superscriptString + "}",
					{ line: carrotPos.line, ch: carrotPos.ch + 1 },
					{ line: carrotPos.line, ch: cursor.ch });

				// Check if underscore is the same place as the cursor (i.e. /|)
				if (superscriptString == "") {
					editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
				}
			}

		});
	}

	private startSuperscriptHTMLMode() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();


		// I don't know why i have to do this -1, but whatever
		const carrotPos = { line: cursor.line, ch: cursor.ch };

		InputMode.startInputMode("superscript", (endingEvent: KeyboardEvent) => {
			// Update cursor object
			const cursor = view.editor.getCursor();

			// Check if the underscore has been deleted
			if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^") == carrotPos.ch) {
				const superScriptString = editor.getRange(
					{ line: carrotPos.line, ch: carrotPos.ch + 1 },
					{ line: cursor.line, ch: cursor.ch });
				editor.replaceRange("<sup>" + superScriptString + "</sup>",
					{ line: carrotPos.line, ch: carrotPos.ch },
					{ line: cursor.line, ch: cursor.ch });

				// Check if underscore is the same place as the cursor (i.e. _|)
				if (superScriptString == "") {
					editor.setCursor({ line: cursor.line, ch: cursor.ch + 4 });
				}
			}

		});
	}

	// private startAutoFractionMathMode() {
	// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	const editor = view.editor;
	// 	const cursor = editor.getCursor();


	// 	// Autofraction only in math environments
	// 	if (!EnvironmentScanner.isAnyLatexEnv(editor, cursor.line, cursor.ch)) {
	// 		return;
	// 	}

	// 	// Toggle for Autofraction
	// 	if (!this.settings.autoFastFraction_toggle) {
	// 		return;
	// 	}

	// 	const forwardSlashPos = {
	// 		line: cursor.line,
	// 		ch: cursor.ch
	// 	};

	// 	InputMode.startInputMode("fraction", (endingEvent: KeyboardEvent) => {

	// 		// Stop space press
	// 		if (endingEvent.key == " ") {
	// 			endingEvent.preventDefault();
	// 		}

	// 		// refresh cursor object
	// 		let cursor = view.editor.getCursor();

	// 		// Check if the underscore has been deleted
	// 		if (view.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("/") != forwardSlashPos.ch) {
	// 			return;
	// 		}

	// 		// Make the \frac{...}{...}!
	// 		const fractionStartPos = EnvironmentScanner.getFractionNumeratorStartPos(view.editor.getLine(cursor.line), forwardSlashPos.ch);

	// 		let numeratorString = editor.getRange(
	// 			{ line: forwardSlashPos.line, ch: fractionStartPos },
	// 			forwardSlashPos);
	// 		let denominatorString = editor.getRange(
	// 			{ line: forwardSlashPos.line, ch: forwardSlashPos.ch + 1 },
	// 			cursor);

	// 		// If numerator is enclosed, go and remove the brackets
	// 		if (EnvironmentScanner.toClosingbracket(numeratorString.charAt(0)) == numeratorString.charAt(numeratorString.length - 1)) {
	// 			numeratorString = numeratorString.slice(1, numeratorString.length - 1);
	// 		}

	// 		// If denominator is enclosed, go and remove the brackets
	// 		if (EnvironmentScanner.toClosingbracket(denominatorString.charAt(0)) == denominatorString.charAt(denominatorString.length - 1)) {
	// 			denominatorString = denominatorString.slice(1, denominatorString.length - 1);
	// 		}

	// 		editor.replaceRange("\\frac{" + numeratorString + "}{" + denominatorString + "}",
	// 			{ line: forwardSlashPos.line, ch: fractionStartPos },
	// 			cursor);

	// 		// refresh the cursor
	// 		cursor = view.editor.getCursor();
	// 		console.log(editor.getRange({ line: cursor.line, ch: cursor.ch - 4 }, { line: cursor.line, ch: cursor.ch }));

	// 		// \frac{}{}| => \frac{ |}{}
	// 		if (editor.getRange({ line: cursor.line, ch: cursor.ch - 4 }, { line: cursor.line, ch: cursor.ch }) == "{}{}") {
	// 			editor.setCursor({ line: cursor.line, ch: cursor.ch - 3 });
	// 			return;
	// 		}

	// 		// \frac{...}{}| =>\frac{...}{ |}
	// 		if (editor.getRange({ line: cursor.line, ch: cursor.ch - 2 }, { line: cursor.line, ch: cursor.ch }) == "{}") {
	// 			editor.setCursor({ line: cursor.line, ch: cursor.ch - 1 });
	// 			return;
	// 		}


	// 	});
	// }
	
	// private autoCloseOpenBracket(event: KeyboardEvent) {
	// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	const editor = view.editor;
	// 	const cursor = editor.getCursor();

	// 	event.preventDefault();
	// 	editor.replaceSelection(event.key + EnvironmentScanner.toClosingbracket(event.key));
	// 	editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
	// }

	// private escapeEnvironment(event: KeyboardEvent) {
	// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	const editor = view.editor;
	// 	const cursor = editor.getCursor();
	// 	event.preventDefault();
	// 	editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
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

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

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
			.setName("autoCompleteSuperscriptTextMode_toggle")
			.setDesc("autoCompleteSuperscriptTextMode_toggle")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.autoCompleteSuperscriptTextMode_toggle)
				.onChange(async (value) => {
					this.plugin.settings.autoCompleteSuperscriptTextMode_toggle = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}));

		new Setting(containerEl)
			.setName("autoCompleteSuperscriptMathMode_toggle")
			.setDesc("autoCompleteSuperscriptMathMode_toggle")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.autoCompleteSuperscriptMathMode_toggle)
				.onChange(async (value) => {
					this.plugin.settings.autoCompleteSuperscriptMathMode_toggle = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}));
		new Setting(containerEl)
			.setName("autoCompleteSubscriptTextMode_toggle")
			.setDesc("autoCompleteSubscriptTextMode_toggle")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.autoCompleteSubscriptTextMode_toggle)
				.onChange(async (value) => {
					this.plugin.settings.autoCompleteSubscriptTextMode_toggle = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}));
		new Setting(containerEl)
			.setName("autoCompleteSubscriptMathMode_toggle")
			.setDesc("autoCompleteSubscriptMathMode_toggle")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.autoCompleteSubscriptMathMode_toggle)
				.onChange(async (value) => {
					this.plugin.settings.autoCompleteSubscriptMathMode_toggle = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}));
		new Setting(containerEl)
			.setName("autoFastFraction_toggle")
			.setDesc("autoFastFraction_toggle")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.autoFastFraction_toggle)
				.onChange(async (value) => {
					this.plugin.settings.autoFastFraction_toggle = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}));
		new Setting(containerEl)
			.setName("autoEncloseRoundBracketsMathMode_toggle")
			.setDesc("autoEncloseRoundBracketsMathMode_toggle")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.autoEncloseRoundBracketsMathMode_toggle)
				.onChange(async (value) => {
					this.plugin.settings.autoEncloseRoundBracketsMathMode_toggle = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}));
		new Setting(containerEl)
			.setName("autoEncloseSquareBracketsMathMode_toggle")
			.setDesc("autoEncloseSquareBracketsMathMode_toggle")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.autoEncloseSquareBracketsMathMode_toggle)
				.onChange(async (value) => {
					this.plugin.settings.autoEncloseSquareBracketsMathMode_toggle = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}));
		new Setting(containerEl)
			.setName("autoEncloseCurlyBracketsMathMode_toggle")
			.setDesc("autoEncloseCurlyBracketsMathMode_toggle")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.autoEncloseCurlyBracketsMathMode_toggle)
				.onChange(async (value) => {
					this.plugin.settings.autoEncloseCurlyBracketsMathMode_toggle = value;
					await this.plugin.saveData(this.plugin.settings);
					this.display();
				}));



	}
}

