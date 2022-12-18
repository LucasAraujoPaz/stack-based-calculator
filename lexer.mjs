const PRECEDENCE = Object.freeze({
    NONE: 0,
    UNIT: 1,
    TERM: 2,
    FACTOR: 3,
    EXPONENTIATION: 4,
    UNARY: 5,
});
/** @exports Token */
/** 
 * @typedef {{
 * regex: RegExp, 
 * prefix?: (p: import("./compiler.mjs").Compiler) => void, 
 * infix?: (p: import("./compiler.mjs").Compiler) => void,
 * infixPrecedence: number,
 * }} ParseRule 
 * */

/** 
 * @typedef { "NUMBER" | "EXPONENTIATION" | "LEFT_PARENTHESIS" | "RIGHT_PARENTHESIS" | 
 * "MULTIPLIED_BY" | "DIVIDED_BY" | "MODULUS" | "PLUS" | "NUMERIC_NEGATION" | "WHITESPACE" | "ANYTHING_ELSE"
 * } TokenType
 */

/** 
 * @type {Record<TokenType, ParseRule>} 
 * */
const TOKENS = {
    NUMBER: { regex: /\d+(\.\d+)?/, prefix: p => p.unit(), infixPrecedence: PRECEDENCE.NONE },
    EXPONENTIATION: { regex: /\*\*/, infix: p => p.binaryExpression(), infixPrecedence: PRECEDENCE.EXPONENTIATION },

    LEFT_PARENTHESIS: { regex: /\(/, prefix: p => p.group(), infixPrecedence: PRECEDENCE.NONE },
    RIGHT_PARENTHESIS: { regex: /\)/, infixPrecedence: PRECEDENCE.NONE },
    
    
    MULTIPLIED_BY: { regex: /\*/, infix: p => p.binaryExpression(), infixPrecedence: PRECEDENCE.FACTOR },
    DIVIDED_BY: { regex: /\//, infix: p => p.binaryExpression(), infixPrecedence: PRECEDENCE.FACTOR },
    MODULUS: { regex: /%/, infix: p => p.binaryExpression(), infixPrecedence: PRECEDENCE.FACTOR },
    PLUS: { regex: /\+/, infix: p => p.binaryExpression(), infixPrecedence: PRECEDENCE.TERM },
    NUMERIC_NEGATION: { regex: /-/, 
        prefix: p => p.unaryExpression(), infix: p => p.binaryExpression(), infixPrecedence: PRECEDENCE.TERM
    },

    WHITESPACE: { regex: /\s+/, infixPrecedence: 0 },
    ANYTHING_ELSE: { regex: /\S+/, infixPrecedence: 0 },
};

const matcher = RegExp(Object.entries(TOKENS)
    .map(value => `(?<${value[0]}>${value[1].regex.source})`)
    .join('|'), "g"
);

function lineGetter(/** @type {string} */ text) {

    let i = 0, line = 1;

    return function getLine(/** @type {number} */ index) {
        while (i < Math.min(index, text.length)) {
            if (text[i] === '\n')
                ++line;
            ++i;
        }
        return line;
    }
}

/** 
 * @typedef {{
 * parseRule: ParseRule
 * lexeme: string, 
 * line: number
 * }} Token 
 * */

/** 
 * @param {string} text 
 * @returns {Token[]}
*/
function getTokens(text) {
    const iterator = text.matchAll(matcher);

    const getLine = lineGetter(text);

    /** @type {Token[]} */
    const tokens = [];
    for (const i of iterator) {
        const groups = i.groups ?? (() => { throw new Error("No group") })();
        const entries = Object.entries(groups).filter(e => e[1] !== undefined);
        if (entries.length === 0)
            throw new Error("No match");
        if (entries.length > 1)
            throw new Error("More than 1 match");

        const [tokenType, lexeme] = entries[0];

        if (tokenType === "WHITESPACE")
            continue;

        const token = {
            parseRule: TOKENS[/** @type {TokenType} */ (tokenType)],
            lexeme,
            line: getLine(i.index ?? (() => { throw new Error("No index") })())
        };

        if (tokenType === "ANYTHING_ELSE")
            throw new Error(`Unexpected symbol: "${token.lexeme}" at line ${token.line}`);

        tokens.push(token);
    }

    return tokens;
}

const testText =
`
13 - 43 + - 64 * (11 ** 12 ** -13) / 24 * ( - - 31 / 27) % 483
`;

const lexer = { TOKENS, PRECEDENCE, getTokens, testText };
export { lexer };