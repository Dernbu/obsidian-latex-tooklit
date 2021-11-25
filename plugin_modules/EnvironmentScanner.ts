import { Editor, EditorPosition } from "obsidian";

// Singleton class again
// Has a stack of inputmodes.
export class EnvironmentScanner {

	private constructor(){}
	private static instance = new this();
	public static getInstance = () => this.instance;

	private editor: Editor;
	private lineEnvironments = new Map<string, LineEnvironmentState>();
	private lineTexts: Array<string> = [];

	private getLineEnv(lineNumber: number): LineEnvironmentState{
		// LineNumber is zero-indexed
		if(lineNumber == -1){
			return LineEnvironmentState.textLineEnv();
		}

		// Adding the line number at the start prevents any duplicates from causing problems with memo
		const lineText = this.editor.getLine(lineNumber);
		const saltedLineText = lineNumber.toString() + this.editor.getLine(lineNumber);

		// Here we have memoisation with hashmaps
		if(this.lineEnvironments.has(saltedLineText)){
			return this.lineEnvironments.get(saltedLineText);

		}else{
			// If the key isn't found in the hashmap, it means that the line has changed, so remove key in map
			this.lineEnvironments.delete(this.lineTexts[lineNumber]); 

			// Get Current Line Env
			const currentLineEnv = LineEnvironmentState.charEnvToLineEnv(this.getCharEnv(lineNumber, lineText.length));

			// Memoise
			this.lineEnvironments.set(saltedLineText, currentLineEnv);

			return currentLineEnv;
		}
	}

	// Tokens represent possible strings that demarcate the start/end of an environment.
	// The order of the array is important
	private static POSSIBLE_MARKDOWN_TOKENS = new Map([
		[/\$\$/,"$$"],
		[/\$/, "$"],
		[/```/,	"```"],
		[/`/,"`"],
		[/\\/,"\\"]
	]);

	private static POSSIBLE_LATEX_TOKENS = new Map([
		[/\$\$/,"$$"],
		[/\$/, "$"],
		[/(\\text{)/, "\\text{"],
		[/{/,"{"],
		[/}/, "}"]
	]);

	private static POSSIBLE_CODE_TOKENS = new Map([
		[/```/,	"```"],
		[/`/,"`"]
	]);

	private static POSSIBLE_TOKEN_STARTS : Array<string>= [
		"$",
		"$$",
		"`",
		"```",
		"\\"
	];

	getCursorEnv(cursor: EditorPosition) : CharEnvironmentState{
		return this.getCharEnv(cursor.line, cursor.ch);
	}

	public getCharEnv(lineNumber: number, charNumber: number): CharEnvironmentState{
		
		// The empty string is for regex expressions the [^<char>]
		const line : string = this.editor.getLine(lineNumber).slice(0, charNumber);

		let currentCharEnv = CharEnvironmentState.lineEnvToCharEnv(this.getLineEnv(lineNumber - 1));

		let currentToken = "";

		// This counts the number of brackets in latex text environments, to handle expressions such as 
		// $\text{{}}$
		let latexTextEnvBracketCount = 0;
		for(let i = 0; i < charNumber; i ++){

			let tokenIndex = line.length;
			let noMoreTokens = true
			let possibleTokens = null;

			// console.log(currentCharEnv);
			if(currentCharEnv.isMarkdownEnv()){
				possibleTokens = EnvironmentScanner.POSSIBLE_MARKDOWN_TOKENS;
			}else if(currentCharEnv.isLatexEnv()){
				possibleTokens = EnvironmentScanner.POSSIBLE_LATEX_TOKENS;
			}else if(currentCharEnv.isCodeEnv()){
				possibleTokens = EnvironmentScanner.POSSIBLE_CODE_TOKENS;
			}else{
				throw Error("Environment Not Recognized");
			}

			possibleTokens.forEach((token: string, regex: RegExp) => {
				const index = line.slice(i, line.length).search(regex);

				// console.log("Searching for: " + regex + " from " + line.slice(i, line.length) +" and got: " + index);
				// console.log(tokenIndex);
				if (index != -1 && index+i < tokenIndex){
					tokenIndex = index + i;
					currentToken = token;
					noMoreTokens = false;
				}			
			});
			if(noMoreTokens){
				break;
			}
			i = tokenIndex + currentToken.length - 1;
			
			console.log("currentCharEnv: " + currentCharEnv);
			console.log("Currenttoken: " + currentToken);
			// Previous environment is markdown
			if(currentCharEnv.isMarkdownEnv()){
				// Going into multiline latex environment
				if(currentToken == "$$"){
					currentCharEnv = CharEnvironmentState.makeMultiLineLatexEnv();
					continue;
				}
				// Going into singleline latex environment
				if(currentToken == "$"){
					currentCharEnv = CharEnvironmentState.makeInlineLatexEnv();
					console.log(currentCharEnv);
					continue;
				}
				// Going into multiline code environment
				if(currentToken == "```"){
					currentCharEnv = CharEnvironmentState.makeMultiLineCodeEnv();
					continue;
				}
				// Going into single line code environment
				if(currentToken == "`"){
					currentCharEnv = CharEnvironmentState.makeInlineCodeEnv();
					continue;
				}

				// Going into escape character environment
				if(currentToken == "\\" && line.lastIndexOf("\\") == i){
					console.log("Hi");
					currentCharEnv = CharEnvironmentState.makeEscapeCharEnv();
					continue;
				}
			}
			// Previous environment is latex (inline)
			if(currentCharEnv.isInlineLatexEnv()){
				// Skip until we get a dollar sign
				if(currentToken == "$"){
					currentCharEnv = CharEnvironmentState.makeMarkdownTextEnv();
					continue;
				}
				if(currentToken == "$$"){
					currentCharEnv = CharEnvironmentState.makeMultiLineLatexEnv();
					continue;
				}
				if(currentToken == "\\text{"){
					latexTextEnvBracketCount = 0;
					currentCharEnv = CharEnvironmentState.enterLatexTextEnv(currentCharEnv);
					continue;
				}
				// Other tokens do not matter in inline latex environments
				continue;
			}
			// Previous environment is latex (multi-line)
			if(currentCharEnv.isMultiLineLatexEnv()){
				// Skip until we get a dollar sign
				if(currentToken == "$$"){
					currentCharEnv = CharEnvironmentState.makeMarkdownTextEnv();
					continue;
				}
				if(currentToken == "\\text{"){
					latexTextEnvBracketCount = 0;
					currentCharEnv = CharEnvironmentState.enterLatexTextEnv(currentCharEnv);
					continue;
				}
				// Other tokens do not matter in multiline latex environments
				continue;
			}
			if(currentCharEnv.isLatexTextEnv()){
				if(currentToken == "{"){
					latexTextEnvBracketCount ++;
					continue;
				}
				if(currentToken == "}"){
					if(latexTextEnvBracketCount == 0){
						currentCharEnv = CharEnvironmentState.endLatexTextEnv(currentCharEnv);
						continue;
					}else{
						latexTextEnvBracketCount --;
					}
					
				}
			}
			// Previous environment is code (inline)
			if(currentCharEnv.inlineCodeEnv){
				if(currentToken == "`"){
					currentCharEnv = CharEnvironmentState.makeMarkdownTextEnv();
					continue;
				}
				// Other tokens do not matter in inline code environments
				continue;
			}
			// Previous environment is code (multi-line)
			if(currentCharEnv.multiLinecodeEnv){
				if(currentToken == "```"){
					currentCharEnv = CharEnvironmentState.makeMarkdownTextEnv();
					continue;
				}
				// Other tokens do not matter in multiline code environments
				continue;
			}
			
			
		}

		return currentCharEnv;
	}
	
	public updateEditor(editor: Editor){
		this.editor = editor;
	}

}

interface EnvironmentState {
	// is mark down env? (Default, this means that it isnt latex of code environment).
	markdownTextEnv: boolean;

	// Latex environtents, last one is \text{<text>}.
	inlineLatexEnv: boolean;
	multiLineLatexEnv: boolean;
	latexTextEnv: boolean;

	// Code environment
	inlineCodeEnv: boolean;
	multiLinecodeEnv: boolean;

	// Escape character environment (backslash in Text)
	escapeCharacterEnv: boolean;
	
	isMarkdownEnv() : boolean;
	isLatexEnv() : boolean;
	isCodeEnv () : boolean;
}

class CharEnvironmentState implements EnvironmentState{
	public markdownTextEnv;
	public inlineLatexEnv;
	public multiLineLatexEnv;
	public latexTextEnv;
	public inlineCodeEnv;
	public multiLinecodeEnv;
	public escapeCharacterEnv;

	private constructor (
		markdownTextEnv: boolean, 
		inlineLatexEnv: boolean,
		multiLineLatexEnv: boolean,
		latexTextEnv: boolean,
		inlineCodeEnv: boolean,
		multiLinecodeEnv: boolean,
		escapeCharacterEnv: boolean
	){
		this.markdownTextEnv = markdownTextEnv;
		this.inlineLatexEnv = inlineLatexEnv;
		this.multiLineLatexEnv = multiLineLatexEnv;
		this.latexTextEnv = latexTextEnv;
		this.inlineCodeEnv = inlineCodeEnv;
		this.multiLinecodeEnv = multiLinecodeEnv;
		this.escapeCharacterEnv = escapeCharacterEnv;
	}

	// All of these are be constructors
	public static makeMarkdownTextEnv = () => 	new this(true, false, false, false, false, false, false);
	public static makeInlineLatexEnv = () => 	new this(false, true, false, false, false, false, false);
	public static makeMultiLineLatexEnv = () => new this(false, false, true, false, false, false, false);
	public static makeInlineCodeEnv = () => 	new this(false, false, false, false, true, false, false);
	public static makeMultiLineCodeEnv = () => 	new this(false, false, false, false, false, true, false);
	public static makeEscapeCharEnv = () => 	new this(false, false, false, false, false, false, true);

	public static enterLatexTextEnv(latexEnv: CharEnvironmentState){
		if(!latexEnv.isLatexEnv()){
			throw Error("Latex env --> text environment is not in a latex environment!");
		}

		const isInline = latexEnv.inlineLatexEnv;
		return new this(false, isInline, !isInline, true, false, false, false);
	}

	public static endLatexTextEnv(latexEnv: CharEnvironmentState){
		if(!latexEnv.latexTextEnv){
			throw Error("Latex Text env --> latex environment is not in a latex text environment!");
		}

		const isInline = latexEnv.inlineLatexEnv;
		return new this(false, isInline, !isInline, false, false, false, false);

	}

	public static lineEnvToCharEnv(lineEnv: LineEnvironmentState){
		return new this(lineEnv.isMarkdownEnv(), false, lineEnv.isLatexEnv(), false, false, lineEnv.isCodeEnv(), false);
	}

	// Get environment functions
	public readonly isMarkdownEnv = () : boolean => this.markdownTextEnv;
	public readonly isLatexTextEnv = () : boolean => this.latexTextEnv;
	public readonly isLatexEnv = () : boolean => this.inlineLatexEnv || this.multiLineLatexEnv;
	public readonly isCodeEnv = () : boolean => this.inlineCodeEnv || this.multiLinecodeEnv;
	public readonly isEscapeCharacterEnv = () : boolean => this.escapeCharacterEnv;

	public readonly isMultiLineLatexEnv = () : boolean => this.multiLineLatexEnv && !this.latexTextEnv;
	public readonly isInlineLatexEnv = () : boolean => this.inlineLatexEnv && !this.latexTextEnv;

	public toString = (): string => {
		return  JSON.stringify({markdownTextEnv: this.markdownTextEnv,
		inlineLatexEnv: this.inlineLatexEnv,
		multiLineLatexEnv: this.multiLineLatexEnv,
		latexTextEnv: this.latexTextEnv,
		inlineCodeEnv: this.inlineCodeEnv,
		multiLinecodeEnv: this.multiLinecodeEnv,
		escapeCharacterEnv: this.escapeCharacterEnv});
	}

}


// This class is the class that describes the environment of a line at the end of the line.
// Most importantly, the multi-line environments that will be carried onto the next line.
class LineEnvironmentState implements EnvironmentState{
	
	inlineLatexEnv = false;
	inlineCodeEnv = false;
	escapeCharacterEnv = false;
	latexTextEnv = false;

	markdownTextEnv: boolean;
	multiLineLatexEnv: boolean;
	multiLinecodeEnv: boolean;
	
	public readonly isMarkdownEnv = () : boolean => this.markdownTextEnv;
	public readonly isLatextextEnv = () : boolean => this.latexTextEnv;
	public readonly isLatexEnv = () : boolean => this.inlineLatexEnv || this.multiLineLatexEnv;
	public readonly isCodeEnv = () : boolean => this.inlineCodeEnv || this.multiLinecodeEnv;
	
	constructor (textEnv: boolean, latexEnv: boolean, codeEnv: boolean){
		this.markdownTextEnv = textEnv;
		this.multiLineLatexEnv = latexEnv;
		this.multiLinecodeEnv = codeEnv;
	}

	public static charEnvToLineEnv(charEnv : CharEnvironmentState){
		return new this(charEnv.isMarkdownEnv(), charEnv.isLatexEnv(), charEnv.isCodeEnv());
	}

	public static textLineEnv(){
		return new this(true, false, false);
	}

	public static latexLineEnv(){
		return new this(false, true, false);
	}

	public static codeLineEnv(){
		return new this(false, false, true);
	}

}

