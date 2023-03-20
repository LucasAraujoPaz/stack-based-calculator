import { lexer } from "./lexer.mjs";
import { runtime } from "./runtime.mjs";

class Compiler {

    /**
     * @param {import("./lexer.mjs").Token[]} tokens
     */
    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
        /** @type {number[]}*/
        this.bytecode = [];
    }

    /** @param {string} sourceCode */
    static compile(sourceCode) {
        const tokens = lexer.getTokens(sourceCode);
        const compiler = new Compiler(tokens);
        compiler.#program();
        return compiler.bytecode;
    }

    /** @param {string} sourceCode */
    static run(sourceCode) {
        return runtime.run( Compiler.compile(sourceCode) );
    }

    #program() {
        this.#expression(lexer.PRECEDENCE.UNIT);
        this.#emit(runtime.OPERATIONS.HALT);
    }

    /** @param {number} precedence */
    #expression(precedence) {
        const left = this.#consume();
        if (!left) throw new Error("Expression expected");
        const prefix = left.parseRule.prefix;
        if (!prefix) throw new Error("Expression expected");
        prefix(this);

        while (precedence <= (this.#current()?.parseRule.infixPrecedence || -1)) {
            const operator = this.#consume();
            const infix = operator?.parseRule.infix;
            if (!infix) throw new Error("Operator expected");
            infix(this);
        }
    }

    group() {
        this.#expression(lexer.PRECEDENCE.UNIT);
        this.#consume({parseRule: lexer.TOKENS.RIGHT_PARENTHESIS, errorMessage: "Right parenthesis required after group"});
    }

    unaryExpression() {
        const operator = this.#previous();
        this.#expression(lexer.PRECEDENCE.UNARY);
        
        switch (operator.parseRule) {
            case lexer.TOKENS.NUMERIC_NEGATION: this.#emit(runtime.OPERATIONS.NEGATE); break;
            default: throw new Error("Invalid unary operator");
        }
    }

    binaryExpression() {
        const operator = this.#previous();
        const associativity = operator.parseRule === lexer.TOKENS.EXPONENTIATION ? 0 : 1;
        this.#expression(operator.parseRule.infixPrecedence + associativity);

        switch (operator.parseRule) {
            case lexer.TOKENS.EXPONENTIATION: this.#emit(runtime.OPERATIONS.EXPONENTIATE); break;
            case lexer.TOKENS.MULTIPLIED_BY: this.#emit(runtime.OPERATIONS.MULTIPLY); break;
            case lexer.TOKENS.DIVIDED_BY: this.#emit(runtime.OPERATIONS.DIVIDE); break;
            case lexer.TOKENS.MODULUS: this.#emit(runtime.OPERATIONS.MODULO); break;
            case lexer.TOKENS.PLUS: this.#emit(runtime.OPERATIONS.SUM); break;
            case lexer.TOKENS.NUMERIC_NEGATION: this.#emit(runtime.OPERATIONS.SUBTRACT); break;
            default: throw new Error("Invalid binary operator");
        }
    }

    unit() {
        const numberValue = Number(this.#previous().lexeme);
        this.#emit(runtime.OPERATIONS.PUSH_NUMBER);
        this.#emitNumber(numberValue);
    }
    
    #current() {
        return this.tokens.at(this.index);
    }
    
    #previous() {
        return this.tokens[this.index - 1];
    }
    
    /**
     * @param {{
     * parseRule: import("./lexer.mjs").ParseRule,
     * errorMessage: string
     * }=} requiredType
     */
    #consume(requiredType) {
        const token = this.tokens.at(this.index);
        if (requiredType && token?.parseRule !== requiredType.parseRule) throw new Error(requiredType.errorMessage)
        ++this.index;
        return token;
    }

    /** @param {typeof runtime.OPERATIONS[keyof typeof runtime.OPERATIONS]} operation */
    #emit(operation) {
        this.bytecode.push(operation);
    }

    /** @param {number} number */
    #emitNumber(number) {
        this.bytecode.push(number);
    }
}

console.log( Compiler.compile(lexer.testText) )
console.log( Compiler.run(lexer.testText) );

export {Compiler};
