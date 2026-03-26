/**
 * Pre-parser for student math input.
 *
 * Converts informal student notation into a form that math.js can parse.
 * Supports:
 *   - Multi-variable implicit multiplication (3xy → 3*x*y)
 *   - Extended LaTeX (frac, sqrt, trig, ceiling/floor, log with base)
 *   - Unicode math symbols (×, ÷, °, ², ³, π, ∞, ⌈⌉, ⌊⌋, i)
 *   - Absolute value bars |expr|
 *   - Degree-to-radian conversion (sin 30° → sin(30*pi/180))
 *   - Log with explicit base (log_2(x), log₂(x) → log(x,2))
 *   - Complex literal (2+3i → 2+3*i)
 */

const MAX_INPUT_LENGTH = 512;

export function preParseInput(input: string): string {
    let s = input.trim();
    if (!s) return s;

    // Guard: cap length to prevent DoS
    if (s.length > MAX_INPUT_LENGTH) s = s.slice(0, MAX_INPUT_LENGTH);

    // ── 1. Normalize unicode math symbols ─────────────────────────────
    s = s
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')       // unicode minus
        .replace(/–/g, '-')       // en-dash
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/⁴/g, '^4')
        .replace(/π/g, 'pi')
        .replace(/∞/g, 'Infinity')
        .replace(/±/g, '+')       // treat ± as + for grading (C handling)
        .replace(/⌈([^⌉]+)⌉/g, 'ceil($1)')
        .replace(/⌊([^⌋]+)⌋/g, 'floor($1)');

    // ── 2. Normalize whitespace ────────────────────────────────────────
    s = s.replace(/\s+/g, ' ').trim();

    // ── 3. LaTeX: \frac{a}{b} → (a)/(b) ──────────────────────────────
    // Handle nested frac by iterating until stable
    let prev = '';
    while (prev !== s) {
        prev = s;
        s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_m, num, den) => {
            const wn = needsParens(num) ? `(${num})` : num;
            const wd = needsParens(den) ? `(${den})` : den;
            return `${wn}/${wd}`;
        });
    }

    // ── 4. LaTeX: \sqrt[n]{a} and \sqrt{a} ───────────────────────────
    s = s.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, '($2)^(1/$1)');
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');
    s = s.replace(/\\sqrt\s+(\w)/g, 'sqrt($1)');

    // ── 5. LaTeX: log with base ───────────────────────────────────────
    // \log_{2}(x) or \log_2(x) → log(x, 2)
    s = s.replace(/\\?log_\{?(\w+)\}?\s*\(([^)]+)\)/g, 'log($2,$1)');
    s = s.replace(/\\?log_\{?(\w+)\}?\s+(\w)/g, 'log($2,$1)');
    // Unicode subscript digits for log base: log₂(x)
    s = s.replace(/log([₀₁₂₃₄₅₆₇₈₉]+)\s*\(([^)]+)\)/g, (_m, sub, arg) => {
        const base = sub.split('').map((c: string) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).join('');
        return `log(${arg},${base})`;
    });

    // ── 6. LaTeX: trig/exp/log functions ─────────────────────────────
    s = s.replace(/\\(sin|cos|tan|cot|sec|csc|ln|log|exp|sqrt|arcsin|arccos|arctan)\b/g, '$1');

    // ── 7. Degree conversion: sin(30°) → sin(30*pi/180) ──────────────
    s = s.replace(/(-?\d+(?:\.\d+)?)\s*°/g, '($1*pi/180)');
    s = s.replace(/\\circ/g, '*pi/180');

    // ── 8. LaTeX: \cdot, \times ───────────────────────────────────────
    s = s.replace(/\\cdot/g, '*');
    s = s.replace(/\\times/g, '*');

    // ── 9. LaTeX: ceiling/floor ───────────────────────────────────────
    s = s.replace(/\\lceil\s*([^\\]+?)\\rceil/g, 'ceil($1)');
    s = s.replace(/\\lfloor\s*([^\\]+?)\\rfloor/g, 'floor($1)');

    // ── 10. Remove remaining LaTeX backslash-commands ─────────────────
    s = s.replace(/\\([a-zA-Z]+)/g, '$1');

    // ── 11. Absolute value bars |expr| → abs(expr) ───────────────────
    // Handles nested content (single level), e.g. |x+1| → abs(x+1)
    s = s.replace(/\|([^|]+)\|/g, 'abs($1)');

    // ── 12. Complex numbers: trailing i → *i ─────────────────────────
    // e.g. "3i" → "3*i", "2+3i" → "2+3*i" (but "pi" must not be touched)
    s = s.replace(/(\d)i\b/g, '$1*i');

    // ── 13. Implicit multiplication — number × letter or paren ────────
    // "2x" → "2*x", "2(x" → "2*(x"
    s = s.replace(/(\d)([a-zA-Z(])/g, '$1*$2');

    // ── 14. Implicit multiplication — multi-variable "xy" → "x*y" ────
    // Only between single lowercase letters (avoids "sin" → "s*i*n")
    s = s.replace(/\b([a-z])\s*([a-z])\b/g, '$1*$2');

    // ── 15. Implicit multiplication — letter × open paren ─────────────
    // "x(" → "x*(", ")x" → ")*x", ")(" → ")*("
    s = s.replace(/([a-zA-Z\d)])\(/g, '$1*(');
    s = s.replace(/\)([a-zA-Z\d(])/g, ')*$1');

    // ── 16. Implicit multiplication — number + space + variable ───────
    // "2 x" → "2*x"
    s = s.replace(/(\d)\s+([a-zA-Z])/g, '$1*$2');

    // ── 17. Repair broken pi / trig after implicit mul passes ─────────
    s = s.replace(/p\*i/g, 'pi');
    s = s.replace(/s\*i\*n/g, 'sin');
    s = s.replace(/c\*o\*s/g, 'cos');
    s = s.replace(/t\*a\*n/g, 'tan');
    s = s.replace(/l\*n/g, 'ln');
    s = s.replace(/e\*x\*p/g, 'exp');
    s = s.replace(/s\*q\*r\*t/g, 'sqrt');
    s = s.replace(/a\*b\*s/g, 'abs');
    s = s.replace(/c\*e\*i\*l/g, 'ceil');
    s = s.replace(/f\*l\*o\*o\*r/g, 'floor');
    s = s.replace(/I\*n\*f\*i\*n\*i\*t\*y/g, 'Infinity');

    return s;
}

/** Whether a sub-expression needs parentheses when used as numerator/denominator */
function needsParens(s: string): boolean {
    return s.includes('+') || s.includes('-') || s.includes('*') || s.includes('/');
}

/**
 * Produce a KaTeX-friendly LaTeX preview from partially-typed student input.
 * Used only for display rendering, not for grading.
 */
export function toDisplayLatex(input: string): string {
    let s = input.trim();
    if (!s) return '';

    // Keep LaTeX as-is if it already starts with backslash commands
    if (s.startsWith('\\')) return s;

    // Convert a/b → \frac{a}{b} for simple fractions (no nested ops)
    const simpleFrac = /^(-?[a-zA-Z0-9]+)\/(-?[a-zA-Z0-9]+)$/.exec(s);
    if (simpleFrac) return `\\frac{${simpleFrac[1]}}{${simpleFrac[2]}}`;

    // Convert x^2 → x^{2}, x^(n) → x^{n}
    s = s.replace(/\^([a-zA-Z0-9]+)/g, '^{$1}');
    s = s.replace(/\^\(([^)]+)\)/g, '^{$1}');

    // sqrt(x) → \sqrt{x}
    s = s.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

    // abs(x) → |x|
    s = s.replace(/abs\(([^)]+)\)/g, '|$1|');

    // ceil/floor
    s = s.replace(/ceil\(([^)]+)\)/g, '\\lceil $1 \\rceil');
    s = s.replace(/floor\(([^)]+)\)/g, '\\lfloor $1 \\rfloor');

    // trig
    s = s.replace(/\b(sin|cos|tan|ln|log|exp|arcsin|arccos|arctan)\(/g, '\\$1(');

    // pi → \pi, Infinity → \infty
    s = s.replace(/\bpi\b/g, '\\pi');
    s = s.replace(/\bInfinity\b/g, '\\infty');

    // *  → \cdot for display
    s = s.replace(/\*/g, ' \\cdot ');

    return s;
}
