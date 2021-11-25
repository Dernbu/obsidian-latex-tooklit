import { Editor, EditorPosition } from "obsidian";

export class InputMode {

    private static editor: Editor;

    public static updateEditor = (editor: Editor) => this.editor = editor;

    // This will function as a stack.
    private static instances: InputMode[] = [];
    // stack pop
    private static pop() {
        return this.instances.pop();
    }

    // Peek top val of stack
    private static peek() {
        return this.instances[this.instances.length - 1];
    }

    // Stack push
    private static push(inputMode: InputMode) {
        return this.instances.push(inputMode);
    }

    public static getInstances(): InputMode[] {
        if (!InputMode.instances) {
            InputMode.instances = new Array<InputMode>();
        }

        return InputMode.instances;
    }

    public static getTopInputMode() {
        return InputMode.peek();
    }

    public static endTopInputMode(endingEvent: KeyboardEvent) {
        const inputModeInstance = InputMode.pop();
        if (inputModeInstance == undefined) {
            return undefined;
        }
        return inputModeInstance.endInputMode(endingEvent);
    }

    public static endAllInputModes(endingEvent: KeyboardEvent) {
        // console.log(this.getInstances());
        while (this.getInstances().length > 0) {
            this.endTopInputMode(endingEvent);
        }
    }

    public static killTopInputMode() {
        const inputModeInstance = InputMode.pop();
        if (inputModeInstance == undefined) {
            return undefined;
        }
        return inputModeInstance.killInputMode();
    }

    public static killAllInputModes() {
        while (this.getInstances().length > 0) {
            this.killTopInputMode();
        }
    }

    public static endInputModesByFilter(filter: (element: InputMode) => boolean, endingEvent: KeyboardEvent) {
        this.instances.forEach((inputMode) => {
            if (filter(inputMode)) {
                inputMode.endInputMode(endingEvent);
            }
        })
    }

    public static endInputModeByType(type: string, endingEvent: KeyboardEvent) {
        this.endInputModesByFilter((inputMode: InputMode) => inputMode.inputModeType == type, endingEvent);
    }

    public static endInputModeByTypes(types: Array<string>, endingEvent: KeyboardEvent) {
        this.endInputModesByFilter((inputMode: InputMode) => types.includes(inputMode.inputModeType), endingEvent);
    }

    public static killInputModesByFilter(filter: (element: InputMode) => boolean) {
        this.instances.forEach((inputMode) => {
            if (filter(inputMode)) {
                inputMode.killInputMode();
            }
        })
    }

    public static killInputModeByType(type: string) {
        this.killInputModesByFilter((inputMode: InputMode) => inputMode.inputModeType == type);
    }

    public static killInputModeByTypes(types: Array<string>) {
        this.killInputModesByFilter((inputMode: InputMode) => types.includes(inputMode.inputModeType));
    }

    public static startInputMode(inputType: 'superscript-latex', inputStartPos: EditorPosition): number;
    public static startInputMode(inputType: 'superscript-markdown', inputStartPos: EditorPosition): number;
    public static startInputMode(inputType: 'subscript-latex', inputStartPos: EditorPosition): number;
    public static startInputMode(inputType: 'subscript-markdown', inputStartPos: EditorPosition): number;
    public static startInputMode(inputType: 'fraction-latex', inputStartPos: EditorPosition): number;
    public static startInputMode(inputType: string, inputStartPos: EditorPosition) {
        let endingHandler = null;
        switch (inputType) {
            case 'subscript-latex':
                endingHandler = (endingEvent: KeyboardEvent) => {
                    // Update cursor object
                    const cursor = this.editor.getCursor();
                    if (endingEvent.key == " ") {
                        endingEvent.preventDefault();
                    }

                    // Check if the underscore has been deleted
                    if (this.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("_") != inputStartPos.ch) {
                        return;
                    }

                    console.log("Subscript latex!");

                    const subscriptString = this.editor.getRange({ line: inputStartPos.line, ch: inputStartPos.ch + 1 },
                        { line: inputStartPos.line, ch: cursor.ch });

                    this.editor.replaceRange("{" + subscriptString + "}", { line: inputStartPos.line, ch: inputStartPos.ch + 1 },
                        { line: inputStartPos.line, ch: cursor.ch });

                    // Check if underscore is the same place as the cursor (i.e. /|)
                    if (subscriptString == "") {
                        this.editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
                    }


                };
                break;
            case 'subscript-markdown':
                endingHandler = (endingEvent: KeyboardEvent) => {
                    // Update cursor object
                    const cursor = this.editor.getCursor();


                    if (endingEvent.key == " ") {
                        endingEvent.preventDefault();
                    }

                    // Check if the underscore has been deleted
                    if (this.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("_") != inputStartPos.ch) {
                        return;
                    }
                    console.log("HI:");

                    const subScriptString = this.editor.getRange({ line: inputStartPos.line, ch: inputStartPos.ch + 1 },
                        { line: inputStartPos.line, ch: cursor.ch });

                    this.editor.replaceRange("<sub>" + subScriptString + "</sub>",
                        { line: inputStartPos.line, ch: inputStartPos.ch },
                        { line: inputStartPos.line, ch: cursor.ch });

                    // Check if underscore is the same place as the cursor (i.e. _|)
                    if (subScriptString == "") {
                        this.editor.setCursor({ line: cursor.line, ch: cursor.ch + 4 });
                    }

                };
                break;
            case 'superscript-latex':
                endingHandler = (endingEvent: KeyboardEvent) => {
                    // Update cursor object
                    const cursor = this.editor.getCursor();

                    if (endingEvent.key == " ") {
                        endingEvent.preventDefault();
                    }

                    // Check if the carrot has been deleted
                    if (this.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^") != inputStartPos.ch) {
                        return;
                    }

                    const superscriptString = this.editor.getRange({ line: inputStartPos.line, ch: inputStartPos.ch + 1 },
                        { line: inputStartPos.line, ch: cursor.ch - 1 });

                    this.editor.replaceRange("{" + superscriptString + "}", { line: inputStartPos.line, ch: inputStartPos.ch + 1 },
                        { line: inputStartPos.line, ch: cursor.ch - 1 });

                    // Check if underscore is the same place as the cursor (i.e. /|)
                    if (superscriptString == "") {
                        this.editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
                    }


                };
                break;
            case 'superscript-markdown':
                endingHandler = (endingEvent: KeyboardEvent) => {
                    // Update cursor object
                    const cursor = this.editor.getCursor();

                    if (endingEvent.key == " ") {
                        endingEvent.preventDefault();
                    }

                    console.log(this.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^"));
                    console.log(inputStartPos);
                    // Check if the underscore has been deleted
                    if (this.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("^") != inputStartPos.ch) {
                        return;
                    }

                    const superScriptString = this.editor.getRange({ line: inputStartPos.line, ch: inputStartPos.ch + 1 },
                        { line: inputStartPos.line, ch: cursor.ch });

                    this.editor.replaceRange("<sup>" + superScriptString + "</sup>", { line: inputStartPos.line, ch: inputStartPos.ch },
                        { line: inputStartPos.line, ch: cursor.ch });

                    // Check if underscore is the same place as the cursor (i.e. _|)
                    if (superScriptString == "") {
                        this.editor.setCursor({ line: cursor.line, ch: cursor.ch + 4 });
                    }


                }
                break;
            case "fraction-latex":
                endingHandler = (endingEvent: KeyboardEvent) => {

                    // Stop space press
                    if (endingEvent.key == " ") {
                        endingEvent.preventDefault();
                    }

                    // refresh cursor object
                    const cursor = this.editor.getCursor();

                    // Check if the slash has been deleted
                    if (this.editor.getLine(cursor.line).slice(0, cursor.ch).lastIndexOf("/") != inputStartPos.ch) {
                        return;
                    }

                    // Get numerqator'
                    const breakPoints = ["$", "+", "-", " "];
                    const reverseBrackets = new Map([
                        ["}", "{"],
                        ["]", "["],
                        [")", "("]
                    ]);

                    const line = this.editor.getLine(cursor.line);
                    let numStartPos = 0;
                    for (numStartPos = inputStartPos.ch; numStartPos > 0; numStartPos--) {
                        const currentChar = line.charAt(numStartPos)
                        if (breakPoints.contains(currentChar)) {
                            numStartPos ++;
                            break;
                        }

                        if(reverseBrackets.has(currentChar)){
                            const reverseBracket = reverseBrackets.get(currentChar);
                            let bracketNum = 0;
                            numStartPos --;

                            while(numStartPos > 1){
                                const char = line.charAt(numStartPos);
                                if(char == currentChar){
                                    bracketNum ++;
                                }else if(char == reverseBracket){
                                    if(bracketNum == 0){
                                        break;
                                    }
                                    bracketNum --;
                                }
                                numStartPos --;
                            }
                        }
                    }

                    let numeratorString = this.editor.getRange({ line: inputStartPos.line, ch: numStartPos },
                        { line: inputStartPos.line, ch: inputStartPos.ch });
                    
                    if(reverseBrackets.get(numeratorString.charAt(numeratorString.length - 1)) == numeratorString.charAt(0)){
                        numeratorString = numeratorString.slice(1, numeratorString.length - 1);
                    }
                    const denominatorString = this.editor.getRange({ line: inputStartPos.line, ch: inputStartPos.ch + 1 },
                        { line: inputStartPos.line, ch: cursor.ch });

                    this.editor.replaceRange("\\frac{" + numeratorString + "}{" + denominatorString + "}",
                        { line: inputStartPos.line, ch: numStartPos },
                        { line: inputStartPos.line, ch: cursor.ch });

                    // Check if underscore is the same place as the cursor (i.e. /|)
                    if (numeratorString == "" && denominatorString == "") {
                        this.editor.setCursor({ line: cursor.line, ch: cursor.ch + 5 });
                        return;
                    }
                    if (denominatorString == "") {
                        this.editor.setCursor({ line: cursor.line, ch: cursor.ch + 7 });
                    }

                }
                break;

        }

        return InputMode.push(new this(inputType, endingHandler));
    }

    private constructor(inputType: string, endingHandler: (endingEvent: KeyboardEvent) => void) {
        this.inputModeType = inputType;
        this.inputMode = true;
        this.inputEndHandler = endingHandler;
    }

    public inputMode = false;
    public inputEndHandler: (endingEvent: KeyboardEvent) => void = null;
    public inputModeType = "";



    // End ing a mode calls its handler to end the mode
    private endInputMode(endingEvent: KeyboardEvent) {
        if (this.inputMode) {
            if (this.inputEndHandler != null) {
                console.log("Ending Input Mode!");
                this.inputEndHandler(endingEvent);
            }
            this.inputMode = false;
        }
    }

    // Kill = no handler
    private killInputMode = () => this.inputMode = false;

}