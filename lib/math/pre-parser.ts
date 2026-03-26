/**
 * Pre-parser for student math input.
 *
 * Converts informal student notation into a form that math.js can parse.
 * This is critical: without it, correct answers like "2x", "x^2", "2(x+1)"
 * would fail even though they are mathematically valid.
 */

export function preParseInput(input: string): string {
    let s = input.trim();
    if (!s) return s;

    // 1. Normalize unicode math symbols
    s = s
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/π/g, 'pi')
        .replace(/∞/g, 'Infinity');

    // 2. Normalize whitespace
    s = s.replace(/\s+/g, ' ').trim();

    // 3. LaTeX: \frac{a}{b} → (a)/(b)
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_m, num, den) => {
        const wn = needsParens(num) ? `(${num})` : num;
        const wd = needsParens(den) ? `(${den})` : den;
        return `${wn}/${wd}`;
    });

    // 4. LaTeX: \sqrt{a} → sqrt(a)
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');
    s = s.replace(/\\sqrt\s+(\w)/g, 'sqrt($1)');

    // 5. LaTeX: trig functions \sin, \cos, \tan, \ln, \log
    s = s.replace(/\\(sin|cos|tan|ln|log|exp|sqrt)\b/g, '$1');

    // 6. LaTeX: \cdot → *
    s = s.replace(/\\cdot/g, '*');
    s = s.replace(/\\times/g, '*');

    // 7. Remove remaining backslashes from simple LaTeX (e.g. \pi → pi already done)
    s = s.replace(/\\([a-zA-Z]+)/g, '$1');

    // 8. Implicit multiplication: "2x" → "2*x"
    //    number immediately followed by letter/open paren
    s = s.replace(/(\d)([a-zA-Z(])/g, '$1*$2');

    // 9. Implicit multiplication: "x(" → "x*(" and ")x" → ")*x" and ")(→")*("
    s = s.replace(/([a-zA-Z\d)])(\()/g, '$1*$2');
    s = s.replace(/(\))([a-zA-Z\d(])/g, '$1*$2');

    // 10. Implicit multiplication: "2 x" (space between number and variable)
    s = s.replace(/(\d)\s+([a-zA-Z])/g, '$1*$2');

    // 11. Exponentiation: "x^2" is already valid in math.js — keep as-is
    //     But "x**2" is also valid; no change needed.

    // 12. Handle "e^x" → "e^x" (math.js understands 'e' as Euler's number)

    // 13. Absolute value: |x| → abs(x)
    //     Simple single-variable case only
    s = s.replace(/\|([^|]+)\|/g, 'abs($1)');

    return s;
}

/** Whether a sub-expression needs parentheses when used as numerator/denominator */
function needsParens(s: string): boolean {
    return s.includes('+') || s.includes('-') || s.includes('*') || s.includes('/');
}

/**
 * Attempt to produce a human-readable preview string (KaTeX-friendly LaTeX)
 * from partially-typed student input.
 * Used only for display, not for grading.
 */
export function toDisplayLatex(input: string): string {
    let s = input.trim();
    if (!s) return '';

    // Keep LaTeX as-is if it already starts with backslash commands
    if (s.startsWith('\\')) return s;

    // Convert a/b → \frac{a}{b} for simple fractions
    const simpleFrac = /^(-?[a-zA-Z0-9]+)\/(-?[a-zA-Z0-9]+)$/.exec(s);
    if (simpleFrac) return `\\frac{${simpleFrac[1]}}{${simpleFrac[2]}}`;

    // Convert x^2 → x^{2}, x^(2) → x^{2}
    s = s.replace(/\^([a-zA-Z0-9]+)/g, '^{$1}');
    s = s.replace(/\^\(([^)]+)\)/g, '^{$1}');

    // sqrt(x) → \sqrt{x}
    s = s.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

    // trig
    s = s.replace(/\b(sin|cos|tan|ln|log)\(/g, '\\$1(');

    return s;
}
