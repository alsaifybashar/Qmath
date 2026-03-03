/**
 * Utility helpers shared across all JSXGraph visualization templates.
 */

/** Convert a math expression string (with ^ for exponentiation) into a safe JS function of x. */
export function makeJSFunction(expr: string): (x: number) => number {
    try {
        const js = expr
            .replace(/\^/g, '**')
            .replace(/(\d)\s*([a-zA-Z])/g, '$1*$2'); // 2x → 2*x
        return new Function('x', `
            "use strict";
            const {sin,cos,tan,asin,acos,atan,atan2,sinh,cosh,tanh,
                   exp,log,sqrt,cbrt,abs,ceil,floor,round,sign,pow,hypot} = Math;
            const ln = Math.log, lg = Math.log10, PI = Math.PI, E = Math.E;
            const arcsin = Math.asin, arccos = Math.acos, arctan = Math.atan;
            try { return +(${js}); } catch(e) { return NaN; }
        `) as (x: number) => number;
    } catch {
        return () => NaN;
    }
}

/** Convert a math expression string into a safe JS function of (x, y). */
export function makeJSFunction2D(expr: string): (x: number, y: number) => number {
    try {
        const js = expr.replace(/\^/g, '**');
        return new Function('x', 'y', `
            "use strict";
            const {sin,cos,tan,asin,acos,atan,sinh,cosh,tanh,
                   exp,log,sqrt,cbrt,abs,ceil,floor,round,sign,pow} = Math;
            const ln = Math.log, PI = Math.PI, E = Math.E;
            try { return +(${js}); } catch(e) { return NaN; }
        `) as (x: number, y: number) => number;
    } catch {
        return () => NaN;
    }
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
    primary:   '#6366f1', // violet  — main curve
    secondary: '#ef4444', // red     — secondary curve / tangent
    tertiary:  '#10b981', // emerald — area fill / third curve
    amber:     '#f59e0b', // amber   — special points
    blue:      '#3b82f6', // blue    — fourth element
    orange:    '#f97316', // orange  — sliders / labels
    fillOpacity: 0.25,
} as const;
