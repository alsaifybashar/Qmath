/**
 * Utility helpers shared across all JSXGraph visualization templates.
 */
import { compileSafeExpression } from '@/lib/math/safe-expression';

export function makeJSFunctionForSymbols(expr: string, symbols: readonly string[]): (...values: number[]) => number {
    try {
        const compiled = compileSafeExpression(expr, { symbols });
        return (...values: number[]) => {
            try {
                const scope = Object.fromEntries(symbols.map((symbol, index) => [symbol, values[index]]));
                const result = compiled.evaluate(scope);
                return typeof result === 'number' && Number.isFinite(result) ? result : Number.NaN;
            } catch {
                return Number.NaN;
            }
        };
    } catch {
        return () => Number.NaN;
    }
}

/** Convert a math expression string (with ^ for exponentiation) into a safe JS function of x. */
export function makeJSFunction(expr: string): (x: number) => number {
    return makeJSFunctionForSymbols(expr, ['x']);
}

/** Convert a math expression string into a safe JS function of (x, y). */
export function makeJSFunction2D(expr: string): (x: number, y: number) => number {
    return makeJSFunctionForSymbols(expr, ['x', 'y']);
}

/** Numerical derivative via central differences. */
export function numDeriv(f: (x: number) => number, x: number, h = 1e-6): number {
    return (f(x + h) - f(x - h)) / (2 * h);
}

/** Numerical integral via the composite trapezoid rule. */
export function numIntegral(f: (x: number) => number, a: number, b: number, n = 300): number {
    if (Math.abs(b - a) < 1e-12) return 0;
    const h = (b - a) / n;
    let sum = 0.5 * (f(a) + f(b));
    for (let i = 1; i < n; i++) sum += f(a + i * h);
    return h * sum;
}

/** Exact integer factorial (safe up to n=18). */
export function factorial(n: number): number {
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

/** Shared JSXGraph board options used across all templates. */
export const BOARD_BASE_OPTS = {
    showCopyright: false,
    showNavigation: false,
    keepaspectratio: false,
} as const;

/** App colour palette for consistent visual style. */
export const C = {
    primary:   '#28afb0', // violet  — main curve
    secondary: '#ef4444', // red     — secondary curve / tangent
    tertiary:  '#10b981', // emerald — area fill / third curve
    amber:     '#dfa81b', // amber   — special points
    blue:      '#3585a3', // blue    — fourth element
    orange:    '#e87c2b', // orange  — sliders / labels
    fillOpacity: 0.25,
} as const;
