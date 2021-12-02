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
	editor: Editor;

	private updateEditor() {
		this.editor = this.app.workspace.getActiveViewOfType(MarkdownView).editor;
	}

	async onload() {
		await this.loadSettings();
		console.log("Loading!");

		console.log("Initialising Input Modes:")

		this.registerDomEvent(document, 'keydown', (event: KeyboardEvent) => {
			// // BACKSPACE KEY DOESN't WORK TODO
			this.updateEditor();
			EnvironmentScanner.getInstance().updateEditor(this.editor);
			switch (event.key) {
				case "Escape":
					EnvironmentScanner.getInstance().updateEditor(this.editor);
					console.log("" + EnvironmentScanner.getInstance().getCursorEnv(this.editor.getCursor()));
					InputMode.killAllInputModes();
					return;
				// case "Backspace":
				// 	console.log("prev" + this.getPrevNChars(1));
				// 	console.log("next" + this.getNextNChars(1));
				// 	event.stopPropagation();
				// 	this.handleBackspace(event);
				// 	return;
			}

		});

		this.registerDomEvent(document, 'keypress', (event: KeyboardEvent) => {
			// console.log("Key Pressed!");
			// console.log(event.key);
			this.updateEditor();
			switch (event.key) {
				// Handle $$ Environments
				case '$':
					this.handleDollar(event);
					return;
				// Subscript
				case '_':
					this.handleUnderscore(event);
					return;
				// Superscript
				case '^':
					// InputMode.endInputModeByTypes(["superscript", "subscript"], event);
					this.handleCarrot(event);
					return;
				// Fast fraction (latex)
				case '/':
					this.handleForwardSlash(event);
					return;
				// Auto-complete brackets in math mode
				case '(':
					this.handleRoundOpenBracket(event);
					return;
				case '[':
					this.handleSquareOpenBracket(event);
					return;
				case '{':
					this.handleCurlyOpenBracket(event);
					return;
				case '|':
					this.handlePipe(event);
					return;
					// Auto-escape brackets in math mode
					case ')':
						this.handleRoundCloseBracket(event);
						return;
					// case ']':
					// 	this.handleSquareCloseBracket(event);
					// 	return;
					// case '}':
					// 	this.handleCurlyCloseBracket(event);
					// 	return;
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

				// Space
				case ' ':
					InputMode.endAllInputModes(event);
					return;
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
	private static AUTOCOMPLETE_SYMBOLS = new Map<string, string>([
		["$", "$"]
	]);

	// private handleBackspace(event: KeyboardEvent): void {
	// 	const cursor = this.editor.getCursor();
	// 	const selection = this.editor.getSelection();

	// 	event.stopImmediatePropagation();
	// 	event.stopPropagation();
	// 	event.preventDefault();

	// 	if (selection != "") {
	// 		return;
	// 	}
	// 	console.log("prev" + this.getPrevNChars(1));
	// 	console.log("next" + this.getNextNChars(1));
	// 	if (MyPlugin.AUTOCOMPLETE_SYMBOLS.has(this.getPrevNChars(1)) &&
	// 		MyPlugin.AUTOCOMPLETE_SYMBOLS.get(this.getPrevNChars(1)) == this.getNextNChars(1)) {
	// 		event.preventDefault();
	// 		this.editor.replaceRange("", { line: cursor.line, ch: cursor.ch - 1 }, { line: cursor.line, ch: cursor.ch - 1 });
	// 	}
	// }

	private handleDollar(event: KeyboardEvent): void {
		EnvironmentScanner.getInstance().updateEditor(this.editor);
		const cursor = this.editor.getCursor();
		const currentCharEnv = EnvironmentScanner.getInstance().getCursorEnv(cursor);


		InputMode.endAllInputModes(event);
		// Dollar signs not for code environments
		if (currentCharEnv.isCodeEnv()) {
			return;
		}

		// <> = selected
		// | => $|$, <abc> => $abc$|
		// $..$| => $$..$$|
		if (currentCharEnv.isMarkdownEnv() || currentCharEnv.isLatexTextEnv()) {
			event.preventDefault();
			const selection = this.editor.getSelection();

			// $..$| => $$..$$|
			console.log(EnvironmentScanner.getInstance().getCharEnv(cursor.line, cursor.ch - 2).isInlineLatexEnv());
			if (EnvironmentScanner.getInstance().getCharEnv(cursor.line, cursor.ch - 2).isInlineLatexEnv()) {
				console.log(this.editor.getLine(cursor.line).slice(0, cursor.ch - 1));
				const prevDollarPos = this.editor.getLine(cursor.line).slice(0, cursor.ch - 1).lastIndexOf("$");

				this.editor.replaceRange("$" + this.editor.getRange(
					{ line: cursor.line, ch: prevDollarPos }, cursor) + "$", { line: cursor.line, ch: prevDollarPos }, cursor);
				return;
			}

			this.editor.replaceSelection("$" + selection + "$");
			if (selection == "") {
				this.editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
				return;
			}
			return;
		}

		// $|$ => $$|$$, $abc|$ => $abc$|, $abc| => $abc$|
		if (currentCharEnv.isInlineLatexEnv()) {
			const selection = this.editor.getSelection();
			const nextChar = this.getNextNChars(1);
			const prevChar = this.getPrevNChars(1);

			if (selection == "") {
				// $|$ => $$|$$
				if (prevChar == "$" && nextChar == "$") {
					event.preventDefault();
					this.editor.replaceSelection("$$");
					this.editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
					return;
				}
				// $abc|$ => $abc$|
				if (nextChar == "$") {
					event.preventDefault();
					this.moveCursorForward(this.editor);
					return;
				}
			} else {
				return;
			}
		}

		// $$|$$ => $$$|$, $$$|$ => $$$$|, $$$| => $$$$|
		if (currentCharEnv.isMultiLineLatexEnv()) {
			const selection = this.editor.getSelection();

			if (selection == "") {
				// $$|$$ => $$$|$
				if (this.getNextNChars(2) == "$$") {
					event.preventDefault();
					this.moveCursorForward(this.editor);
					return;
				}
				// $$$|$ => $$$$|
				if (this.getNextNChars(1) == "$" && this.getPrevNChars(1) == "$") {
					event.preventDefault();
					this.moveCursorForward(this.editor);
					return;
				}
				// $$$| => $$$$|
				if (this.getPrevNChars(1) == "$") {
					return;
				}
			}
		}
	}



	private handleUnderscore(event: KeyboardEvent): void {
		EnvironmentScanner.getInstance().updateEditor(this.editor);
		const cursor = this.editor.getCursor();

		// Override auto pairing of underscores
		if (this.editor.getSelection() == "") {
			this.editor.replaceSelection("_");
			event.preventDefault();
		}

		const currentEnvironment = EnvironmentScanner.getInstance().getCursorEnv(cursor);

		if (currentEnvironment.isLatexEnv() || currentEnvironment.isLatexTextEnv()) {
			InputMode.endInputModeByTypes(["subscript-latex", "superscript-latex"], event);
			InputMode.updateEditor(this.editor);
			const cursor = this.editor.getCursor();
			InputMode.startInputMode("subscript-latex", {line: cursor.line, ch: cursor.ch - 1});
		} else if (currentEnvironment.isMarkdownEnv()) {
			InputMode.endInputModeByTypes(["subscript-markdown", "superscript-markdown"], event);
			InputMode.updateEditor(this.editor);
			const cursor = this.editor.getCursor();
			InputMode.startInputMode("subscript-markdown", {line: cursor.line, ch: cursor.ch - 1});
		} else {
			return;
		}
	}

	private handleCarrot(event: KeyboardEvent): void {
		EnvironmentScanner.getInstance().updateEditor(this.editor);
		const cursor = this.editor.getCursor();

		const currentEnvironment = EnvironmentScanner.getInstance().getCursorEnv(cursor);
		if (currentEnvironment.isLatexEnv() || currentEnvironment.isLatexTextEnv()) {
			InputMode.endInputModeByTypes(["subscript-latex", "superscript-latex"], event);
			InputMode.updateEditor(this.editor);
			const cursor = this.editor.getCursor();
			InputMode.startInputMode("superscript-latex", {line: cursor.line, ch: cursor.ch});
		} else if (currentEnvironment.isMarkdownEnv()) {
			InputMode.endInputModeByTypes(["subscript-markdown", "superscript-markdown"], event);
			InputMode.updateEditor(this.editor);
			const cursor = this.editor.getCursor();
			InputMode.startInputMode("superscript-markdown", {line: cursor.line, ch: cursor.ch});
		} else {
			return;
		}
	}


	private handleForwardSlash(event: KeyboardEvent): void {
		EnvironmentScanner.getInstance().updateEditor(this.editor);
		const cursor = this.editor.getCursor();

		// Autofraction only in math environments, and
		// Check toggle for Autofraction
		if (EnvironmentScanner.getInstance().getCursorEnv(cursor).isLatexEnv()) {
			InputMode.endAllInputModes(event);
			InputMode.updateEditor(this.editor);
			const cursor = this.editor.getCursor();
			InputMode.startInputMode("fraction-latex", {line: cursor.line, ch: cursor.ch});
			return;
		}

	}

	private handleRoundOpenBracket(event: KeyboardEvent): void {
		EnvironmentScanner.getInstance().updateEditor(this.editor);
		event.preventDefault();	
		const cursor = this.editor.getCursor();
		const selection = this.editor.getSelection();

		this.editor.replaceSelection(event.key + selection + MyPlugin.OPEN_TO_CLOSE_BRACKETS.get(event.key));

		if(selection == ""){
			this.editor.setCursor({line: cursor.line, ch: cursor.ch + 1});
			InputMode.startInputMode("autoescaperoundbracket", cursor);
		}
	}

	private handleSquareOpenBracket(event: KeyboardEvent): void {
		EnvironmentScanner.getInstance().updateEditor(this.editor);
		event.preventDefault();	
		const cursor = this.editor.getCursor();
		const selection = this.editor.getSelection();

		this.editor.replaceSelection(event.key + selection + MyPlugin.OPEN_TO_CLOSE_BRACKETS.get(event.key));

		if(selection == ""){
			this.editor.setCursor({line: cursor.line, ch: cursor.ch + 1});
			InputMode.startInputMode("autoescapesquarebracket", cursor);
		}
	}

	private handleCurlyOpenBracket(event: KeyboardEvent): void {
		EnvironmentScanner.getInstance().updateEditor(this.editor);
		event.preventDefault();	
		const cursor = this.editor.getCursor();
		const selection = this.editor.getSelection();

		this.editor.replaceSelection(event.key + selection + MyPlugin.OPEN_TO_CLOSE_BRACKETS.get(event.key));

		if(selection == ""){
			this.editor.setCursor({line: cursor.line, ch: cursor.ch + 1});
			InputMode.startInputMode("autoescapecurlybracket", cursor);
		}
	}
	
	private handlePipe(event: KeyboardEvent): void {
		EnvironmentScanner.getInstance().updateEditor(this.editor);
		event.preventDefault();	
		const cursor = this.editor.getCursor();
		const selection = this.editor.getSelection();

		this.editor.replaceSelection(event.key + selection + MyPlugin.OPEN_TO_CLOSE_BRACKETS.get(event.key));

		if(selection == ""){
			this.editor.setCursor({line: cursor.line, ch: cursor.ch + 1});
			InputMode.startInputMode("autoescapepipebracket", cursor);
		}
	}

	private static OPEN_TO_CLOSE_BRACKETS = new Map([
		["(",")"],
		["[","]"],
		["{","}"],
		["|","|"]
	]);

	private static CLOSE_TO_OPEN_BRACKETS = new Map([
		["(",")"],
		["[","]"],
		["{","}"],
		["|","|"]
	]);

	private handleRoundCloseBracket(event: KeyboardEvent): void {
		EnvironmentScanner.getInstance().updateEditor(this.editor);
		const cursor = this.editor.getCursor();
		const selection = this.editor.getSelection();

		const currentEnvironment = EnvironmentScanner.getInstance().getCursorEnv(cursor);
		if ((currentEnvironment.isLatexEnv() || currentEnvironment.isLatexTextEnv()) && selection == "" && 
			this.editor.getRange(cursor, {line: cursor.line, ch: cursor.ch + 1})) {
			event.preventDefault();	
			this.autoEscapeBracket(event);
		} else if (currentEnvironment.isMarkdownEnv()) {
			return;
		} else {
			return;
		}

	}

	// private handleSquareCloseBracket(event: KeyboardEvent): void {
	// 	EnvironmentScanner.getInstance().updateEditor(this.editor);
	// 	if(InputMode.isInInputModeByType("autoescapebracket-latex")){
	// 		InputMode.endInputModeByType("autoescapebracket-latex", event);
	// 	}
	// }

	// private handleCurlyCloseBracket(event: KeyboardEvent): void {
	// 	EnvironmentScanner.getInstance().updateEditor(this.editor);

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

	// 	InputMode.startInputMode("fraction", );
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

	private getNextNChars(chars: number): string {
		const cursor = this.editor.getCursor();
		return this.editor.getRange(cursor, { line: cursor.line, ch: cursor.ch + chars });
	}
	private getPrevNChars(chars: number): string {
		const cursor = this.editor.getCursor();
		return this.editor.getRange({ line: cursor.line, ch: cursor.ch - chars }, cursor);
	}
	private moveCursorForward(editor: Editor): void {
		const cursor = editor.getCursor();

		editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });

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

