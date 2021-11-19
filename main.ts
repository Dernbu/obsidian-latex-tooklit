import { App, Editor, moment, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { listenerCount } from 'process';
import { moveCursor } from 'readline';

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
		// this.registerEvent(this.app.workspace.on("editor-change", () =>{
		// 	console.log("Editor Change!");
		// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 	const editor = view.editor;
		// 	const cursor = editor.getCursor();
			 
		// 	const key = editor.getLine(cursor.line).charAt(cursor.ch-1);
			
		// 	console.log(key);
			
		// }));

		// this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
		// 	console.log("Key Down!");
		// 	console.log(evt.key);  
		// });
		
		this.registerDomEvent(document, 'keypress', (event: KeyboardEvent) => {
			console.log("Key Pressed!");
			console.log(event.key); 
			switch(event.key){
				case '$':
					this.handleDollarDown(event);
					return;
			}
		});		

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// this.registerDomEvent(document, 'keyup', (evt: KeyboardEvent) => {
		// 	console.log("Key Up!");
		// });
		
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
	private readonly handleDollarDown = (
		event: KeyboardEvent
	): void => {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = view.editor;
		const cursor = editor.getCursor();
		
		const createInlineLatexEvn = (): void => {
			const selection = editor.getSelection();
			// Nothing selected
			if(selection === ''){
				editor.replaceSelection("$");
				editor.setCursor(cursor.line, cursor.ch);
			// Something selected
			}else{
				editor.replaceSelection("$" + selection);
			}
		}
		const isMathEnv = (
			lineToScan : String,
			end: number
			): Object => {
			const isMathEnv = (
				isInlineEnv : boolean, 
				isEqnEnv : boolean,
				prevCharIsDollar : boolean,
				stringLeft: String): Object => {
				
				if(stringLeft.length == 0){
					return {
						inlineEnv: prevCharIsDollar? !isInlineEnv : isInlineEnv,
						eqnEnv: isEqnEnv
					};
				}

				const currentCharIsDollar = stringLeft.charAt(0) == "$";
				const nextString = stringLeft.slice(1);

				if(isEqnEnv){
					if(!prevCharIsDollar){
						return isMathEnv(false, true, currentCharIsDollar, nextString);
					}else if(!currentCharIsDollar){
						return isMathEnv(false, true, false, nextString);
					}else{
						return isMathEnv(false, false, false, nextString);
					}

				}

				if(isInlineEnv){
					// $ ... $$ --> math eqn env
					if(currentCharIsDollar && prevCharIsDollar){
						return isMathEnv(false, true, false, nextString);
					
					// $... $... --> look at next
					}else if(currentCharIsDollar && !prevCharIsDollar){
						return isMathEnv(true, false, true, nextString);
					
					// $ ... $<yay>
					}else if(!currentCharIsDollar && prevCharIsDollar){
						return isMathEnv(false, false, false, nextString);
					
					// $ ... <no $ in sight>
					}else{
						return isMathEnv(isInlineEnv, isEqnEnv, false, nextString);
					}
				}

				// Not in inline or equation environment
				if(!currentCharIsDollar && !prevCharIsDollar){
					return isMathEnv(false, false, false, nextString);
				}else if(currentCharIsDollar && !prevCharIsDollar){
					return isMathEnv(false, false, true, nextString);
				}else if(!currentCharIsDollar && prevCharIsDollar){
					return isMathEnv(true, false, false, nextString);
				}else{
					return isMathEnv(false, true, false, nextString);
				}


			};
			return isMathEnv(false, false, false, currentLine.slice(0, end));
		};
		const currentLine = editor.getLine(cursor.line);
		const mathEnvStatus = isMathEnv(currentLine, cursor.ch);
		console.log(mathEnvStatus);

		// if(mathEnvStatus.inlineEnv){
		// 	return;
		// }
		// if(mathEnvStatus.eqnEnv){
		// 	return;
		// }

		// If not in a math environment,
		const selection = editor.getSelection();
		console.log("Char: " + currentLine.charAt(cursor.ch));
		console.log("Char Before: " + currentLine.charAt(cursor.ch-1));
		// Nothing selected
		if(selection === ''){
			
			// $ ... |$ => $ ... $|, but not $|$ => $$|
			if(!mathEnvStatus.eqnEnv && mathEnvStatus.inlineEnv && currentLine.charAt(cursor.ch) == "$" && currentLine.charAt(cursor.ch-1) != "$"){
				console.log("HI1");
				editor.setCursor({line:cursor.line, ch: cursor.ch+1});
				editor.replaceRange("", {line:cursor.line, ch:cursor.ch}, {line:cursor.line, ch:cursor.ch+1});
				return;
			}

			// $$...$|$ => $$...$$|
			if(mathEnvStatus.eqnEnv && mathEnvStatus.inlineEnv && currentLine.slice(cursor.ch-1, cursor.ch + 1) == "$$"){
				console.log("HI2");
				editor.setCursor({line:cursor.line, ch: cursor.ch+1});
				editor.replaceRange("", {line:cursor.line, ch:cursor.ch}, {line:cursor.line, ch:cursor.ch+1});
				return;
			}

			// $$...|$$ => $$...$|$
			if(mathEnvStatus.eqnEnv && currentLine.slice(cursor.ch, cursor.ch+2) == "$$"){
				editor.setCursor({line:cursor.line, ch: cursor.ch});
				editor.replaceRange("", {line:cursor.line, ch:cursor.ch}, {line:cursor.line, ch:cursor.ch+1});
				return;
			}

			// If 	$ ... $|, (| = cursor) then
			// make $$ ... $$| 
			if(!mathEnvStatus.inlineEnv && isMathEnv(currentLine, cursor.ch-1).inlineEnv){
				const prevDollarIndex = currentLine.slice(0, cursor.ch-1).lastIndexOf("$");
				editor.replaceRange("$", {line:cursor.line, ch:prevDollarIndex});
				return;
			}
			
			// | => $|$
			if(!mathEnvStatus.inlineEnv){
				editor.replaceSelection("$");
				// editor.replaceSelection("$$");
				// editor.replaceRange("", {line: cursor.line, ch: cursor.ch}, {line: cursor.line, ch: cursor.ch+1})
				// editor.setCursor(cursor.line, cursor.ch);
				editor.setSelection({line:cursor.line, ch:cursor.ch});
				
		}
			
			// $|$ => $$|$$.
			if(mathEnvStatus.inlineEnv){
				editor.replaceSelection("$");
				editor.setCursor(cursor.line, cursor.ch);
		}
			return;
			
		// Something selected
		}else{
			editor.replaceSelection("$" + selection);
			return;
		}
	};

	onunload() {
		console.log("Unloading!");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// private readonly handleKeyDown = (
	// 	event: KeyboardEvent,
	// ): void => {
	// 	console.log("pressed!");
	// }

	

}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
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
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Latex Toolkit for Obsidian - Settings'});

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
