export class InputMode {
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



    public static startInputMode(inputType: 'superscript', endingHandler: (endingEvent: KeyboardEvent) => void): number;
    public static startInputMode(inputType: 'subscript', endingHandler: (endingEvent: KeyboardEvent) => void): number;
    public static startInputMode(inputType: 'fraction', endingHandler: (endingEvent: KeyboardEvent) => void): number;
    public static startInputMode(inputType: string, endingHandler: (endingEvent: KeyboardEvent) => void) {
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