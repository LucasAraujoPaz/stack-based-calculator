const OPERATIONS = Object.freeze({
    PUSH_NUMBER: 0,
    NEGATE: 1,
    SUM: 2,
    SUBTRACT: 3,
    MULTIPLY: 4,
    DIVIDE: 5,
    MODULO: 6,
    EXPONENTIATE: 7,
    HALT: 8,
});

/**
 * @param {number[]} bytecode
 * @returns {number}
 */
function run(bytecode) {
    if (bytecode.length === 0) throw new Error("Empty bytecode");
    
    /** @type {number[]} */
    const stack = [];
    const pop = () => stack.pop() ?? (() => {throw new Error("Empty stack")})() ;
    let index = 0;
    let a, b;
    
    loop:
    while (bytecode[index] !== OPERATIONS.HALT) {
        const operation = /** @type {typeof runtime.OPERATIONS[keyof typeof runtime.OPERATIONS]} */ (bytecode[index++]);
        switch (operation) {
            case OPERATIONS.PUSH_NUMBER: stack.push(bytecode[index++]); break;
            
            case OPERATIONS.NEGATE: stack.push( - pop() ); break;
            
            case OPERATIONS.SUM: b = pop(), a = pop(), stack.push( a + b ); break;
            case OPERATIONS.SUBTRACT: b = pop(), a = pop(), stack.push( a - b ); break;
            case OPERATIONS.MULTIPLY: b = pop(), a = pop(), stack.push( a * b ); break;
            case OPERATIONS.DIVIDE: b = pop(), a = pop(), stack.push( a / b ); break;
            case OPERATIONS.MODULO: b = pop(), a = pop(), stack.push( a % b ); break;
            case OPERATIONS.EXPONENTIATE: b = pop(), a = pop(), stack.push( a ** b ); break;
            
            case OPERATIONS.HALT: break loop;
        }
    }
    return pop();
}

const runtime = { OPERATIONS, run };
export {runtime};