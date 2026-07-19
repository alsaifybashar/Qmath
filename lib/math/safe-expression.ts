import { parse, type EvalFunction, type MathNode } from 'mathjs';

const ALLOWED_FUNCTIONS = new Set([
    'abs', 'acos', 'arccos', 'arcsin', 'arctan', 'asin', 'atan', 'atan2',
    'cbrt', 'ceil', 'cos', 'cosh', 'exp', 'floor', 'hypot', 'lg', 'ln',
    'log', 'log10', 'max', 'min', 'pow', 'round', 'sign', 'sin', 'sinh',
    'sqrt', 'tan', 'tanh',
]);

const ALLOWED_OPERATORS = new Set([
    'add', 'subtract', 'multiply', 'divide', 'pow', 'unaryMinus', 'unaryPlus', 'factorial',
]);

const DEFAULT_SYMBOLS = new Set(['x', 'y', 'z', 'n', 't', 'C', 'i', 'e', 'E', 'pi', 'PI']);

export interface SafeExpressionOptions {
    symbols?: Iterable<string>;
    maxLength?: number;
    maxNodes?: number;
    maxDepth?: number;
}

function assertSafeNode(
    node: MathNode,
    allowedSymbols: Set<string>,
    limits: Required<Pick<SafeExpressionOptions, 'maxNodes' | 'maxDepth'>>,
    state: { nodes: number },
    depth: number,
): void {
    state.nodes += 1;
    if (state.nodes > limits.maxNodes) throw new Error('Expression is too complex');
    if (depth > limits.maxDepth) throw new Error('Expression is nested too deeply');

    switch (node.type) {
        case 'ConstantNode': {
            const value = (node as MathNode & { value: unknown }).value;
            if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1_000_000) {
                throw new Error('Expression contains an invalid constant');
            }
            break;
        }
        case 'SymbolNode': {
            const name = (node as MathNode & { name: string }).name;
            if (!allowedSymbols.has(name) && !ALLOWED_FUNCTIONS.has(name)) {
                throw new Error('Expression contains an unsupported symbol');
            }
            break;
        }
        case 'OperatorNode': {
            const fn = (node as MathNode & { fn: string }).fn;
            if (!ALLOWED_OPERATORS.has(fn)) throw new Error('Expression contains an unsupported operator');
            break;
        }
        case 'FunctionNode': {
            const fnNode = node as MathNode & { fn: { type: string; name?: string } };
            if (fnNode.fn.type !== 'SymbolNode' || !fnNode.fn.name || !ALLOWED_FUNCTIONS.has(fnNode.fn.name)) {
                throw new Error('Expression contains an unsupported function');
            }
            break;
        }
        case 'ParenthesisNode':
            break;
        default:
            // Reject assignment, object, array, accessor, block, range,
            // conditional, function-assignment and other executable syntax.
            throw new Error('Expression contains unsupported syntax');
    }

    node.forEach((child) => assertSafeNode(child, allowedSymbols, limits, state, depth + 1));
}

export function compileSafeExpression(
    expression: string,
    options: SafeExpressionOptions = {},
): EvalFunction {
    const maxLength = options.maxLength ?? 256;
    if (expression.length < 1 || expression.length > maxLength) {
        throw new Error('Expression length is invalid');
    }

    const allowedSymbols = new Set(DEFAULT_SYMBOLS);
    for (const symbol of options.symbols ?? []) allowedSymbols.add(symbol);

    const node = parse(expression);
    assertSafeNode(
        node,
        allowedSymbols,
        { maxNodes: options.maxNodes ?? 64, maxDepth: options.maxDepth ?? 12 },
        { nodes: 0 },
        0,
    );
    return node.compile();
}

export function evaluateSafeExpression(
    expression: string,
    scope: Record<string, number>,
): unknown {
    return compileSafeExpression(expression, { symbols: Object.keys(scope) }).evaluate(scope);
}
