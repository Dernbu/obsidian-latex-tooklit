import { Editor } from "obsidian";

// Something similar to a singleton pattern, I guess?
// Has a stack of inputmodes.

export abstract class LatexEnvUtility {

	private static OPERATOR_PRIORITY: Map<string, number> = new Map([
		["$", -1],
		["^", 4],
		["_", 4],
		["*", 3],
		["/", 3],
		["+", 2],
		["-", 2],
		[" ", -1]
	]);

	public static getOperatorPriority(operator: string): number {
		return this.OPERATOR_PRIORITY.get(operator);
	}

	private static isOperator(operator: string): boolean {
		return this.OPERATOR_PRIORITY.has(operator);
	}

	public static isOpeningBracket(punctuation: string): boolean {
		return "([{".includes(punctuation);
	}

	public static isClosingBracket(punctuation: string): boolean {
		return ")]}".includes(punctuation);
	}

	public static toClosingbracket(bracket: string): string {
		switch (bracket) {
			case ")":
				return "(";
			case "(":
				return ")";
			case "]":
				return "[";
			case "[":
				return "]";
			case "}":
				return "{";
			case "{":
				return "}";

		}
		return undefined;
	}

	public static readonly isAnyLatexEnv = (
		editor: Editor,
		linePos: number,
		charPos: number
	): boolean => {
		return this.isMathEnv(editor, linePos, charPos).inlineEnv || this.isMathEnv(editor, linePos, charPos).eqnEnv;
	};

	// Very cool memoization with hashmaps
	private static doesLineEndInMath = new Map<string, boolean>();
	private static lineArray: Array<string> = [];

	// Check if it is an in-line math environment or just a equation math environment
	public static isMathEnv(
		editor: Editor,
		linePos: number,
		charPos: number
	): Record<string, boolean> {
		function isMathEnv(
			isInlineEnv: boolean,
			isEqnEnv: boolean,
			prevCharIsDollar: boolean,
			stringLeft: string): Record<string, boolean> {

			if (stringLeft.length == 0) {
				return {
					inlineEnv: prevCharIsDollar ? !isInlineEnv : isInlineEnv,
					eqnEnv: isEqnEnv
				};
			}

			const currentCharIsDollar = stringLeft.charAt(0) == "$";
			// console.log({isInlineEnv: isInlineEnv,
			// 	isEqnEnv: isEqnEnv,
			// 	stringLeft: stringLeft,
			// 	prevCharIsDollar: prevCharIsDollar,
			// 	currentCharIsDollar: currentCharIsDollar});
			
			const nextString = stringLeft.slice(1);

			if (isEqnEnv) {
				if (!prevCharIsDollar) {
					return isMathEnv(false, true, currentCharIsDollar, nextString);
				} else if (!currentCharIsDollar) {
					return isMathEnv(false, true, false, nextString);
				} else {
					return isMathEnv(false, false, false, nextString);
				}

			}

			if (isInlineEnv) {
				// $ ... $$ --> math eqn env
				if (currentCharIsDollar && prevCharIsDollar) {
					return isMathEnv(false, true, false, nextString);

					// $... $... --> look at next
				} else if (currentCharIsDollar && !prevCharIsDollar) {
					return isMathEnv(true, false, true, nextString);

					// $ ... $<yay>
				} else if (!currentCharIsDollar && prevCharIsDollar) {
					return isMathEnv(false, false, false, nextString);

					// $ ... <no $ in sight>
				} else {
					return isMathEnv(isInlineEnv, isEqnEnv, false, nextString);
				}
			}

			// Not in inline or equation environment
			if (!currentCharIsDollar && !prevCharIsDollar) {
				return isMathEnv(false, false, false, nextString);
			} else if (currentCharIsDollar && !prevCharIsDollar) {
				return isMathEnv(false, false, true, nextString);
			} else if (!currentCharIsDollar && prevCharIsDollar) {
				return isMathEnv(true, false, false, nextString);
			} else {
				return isMathEnv(false, true, false, nextString);
			}


		}

		const lineToScan = editor.getLine(linePos);
		
		// True --> re-evaluates all subsequent lines
		let needToEvaluate = false;
		for(let i = 0; i < linePos; i ++){
			const currentLine = editor.getLine(i);
			const mapKey = i.toString() + currentLine;
			// Line hasn't been evaluated yet
			if(this.lineArray[i] == undefined){
				this.doesLineEndInMath.set(mapKey, isMathEnv(false, this.doesLineEndInMath.get(this.lineArray[i-1]), false, editor.getLine(i)).eqnEnv);
				this.lineArray[i] = mapKey;
				needToEvaluate = true;
				continue;
			}

			// Line has changed
			if(!this.doesLineEndInMath.has(mapKey)){
				this.doesLineEndInMath.set(mapKey, isMathEnv(false, this.doesLineEndInMath.get(this.lineArray[i-1]), false, editor.getLine(i)).eqnEnv);
				this.doesLineEndInMath.delete(this.lineArray[i]);
				this.lineArray[i] = mapKey;
				needToEvaluate = true;
				continue;
			}

			// Something previous has changed
			if(needToEvaluate){
				const evaluatedLine = isMathEnv(false, this.doesLineEndInMath.get(this.lineArray[i-1]), false, editor.getLine(i)).eqnEnv;
				// Hey, its normal again!
				if(this.doesLineEndInMath.get(mapKey) == evaluatedLine){
					needToEvaluate = false;
					continue;
				// Still need to eval
				}else{
					this.doesLineEndInMath.set(mapKey, evaluatedLine);
				}
			}
			
			// isLineEqnEnv = isMathEnv(false, isLineEqnEnv, false, editor.getLine(i)).eqnEnv;
			// console.log(isLineEqnEnv);
		}
		// console.log(this.doesLineEndInMath);
		return isMathEnv(false, this.doesLineEndInMath.get(this.lineArray[linePos-1]), false, lineToScan.slice(0, charPos));
	}

	public static getFractionNumeratorStartPos(line: string, slashPos: number): number {

		function helper(line: string, startPos: number, priority: number): number {
			const char = line.charAt(startPos)
			// console.log("Char: " + char);
			// console.log(LatexEnvUtility.isClosingBracket(char));

			if (startPos == -1) {
				return startPos + 1;
			}

			if (LatexEnvUtility.isClosingBracket(char)) {
				let pos = startPos;
				while (!(line.charAt(pos) == LatexEnvUtility.toClosingbracket(char))) {
					pos--;
					if (pos == -1) {
						throw Error("Unpaired Brackets?");
					}
				}
				return helper(line, pos - 1, priority);
			}

			if (!LatexEnvUtility.isOperator(char)) {
				return helper(line, startPos - 1, priority);
			}

			if (LatexEnvUtility.getOperatorPriority(char) < priority) {
				return startPos + 1;
			}
			


			if (LatexEnvUtility.getOperatorPriority(char) > priority) {
				return helper(line, startPos - 1, priority);
			}

			if (LatexEnvUtility.getOperatorPriority(char) > priority) {
				return helper(line,
					helper(line, startPos - 1, LatexEnvUtility.getOperatorPriority(line.charAt(startPos)))
					, priority);
			}
		}

		return helper(line, slashPos - 1, 3);
	}


}