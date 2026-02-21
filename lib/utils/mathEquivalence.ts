/**
 * Utility functions for evaluating and comparing mathematical formats.
 * Designed to handle decimals, commas, fractions, and simple LaTeX expressions.
 */

/**
 * Evaluates a simple mathematical string into a numeric value.
 * Handles formats like:
 * - "0.5"
 * - "0,5"
 * - "1/2"
 * - "\frac{1}{2}"
 * - "-3/4"
 */
export function evaluateToNumber(input: string): number | null {
    if (!input || typeof input !== 'string') return null;

    let normalized = input.trim().replace(/\s+/g, '');

    // Replace comma with dot for decimals
    normalized = normalized.replace(',', '.');

    // Handle LaTeX \frac{a}{b} and -\frac{a}{b}
    const fracMatch = normalized.match(/^(-?)\\frac\{([^{}]+)\}\{([^{}]+)\}$/);
    if (fracMatch) {
        const sign = fracMatch[1] === '-' ? -1 : 1;
        const num = parseFloat(fracMatch[2]);
        const den = parseFloat(fracMatch[3]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
            return sign * (num / den);
        }
    }

    // Handle plain fraction a/b
    if (normalized.includes('/')) {
        const parts = normalized.split('/');
        if (parts.length === 2) {
            const num = parseFloat(parts[0]);
            const den = parseFloat(parts[1]);
            // Ensure both parts were fully parsed as numbers (e.g., no variables like x/2)
            if (!isNaN(num) && !isNaN(den) && den !== 0 &&
                num.toString() === parts[0] && den.toString() === parts[1]) {
                return num / den;
            }
        }
    }

    // Handle standard number
    const val = parseFloat(normalized);
    if (!isNaN(val) && /^-?\d+(\.\d+)?$/.test(normalized)) {
        return val;
    }

    return null;
}

/**
 * Checks if two mathematical answers are conceptually equivalent.
 * Applies numeric evaluation first, then falls back to normalized string matching.
 */
export function checkMathEquivalence(studentAnswer: string | number, correctAnswer: any): boolean {
    if (studentAnswer === undefined || studentAnswer === null ||
        correctAnswer === undefined || correctAnswer === null) {
        return false;
    }

    const studentStr = String(studentAnswer).trim();
    const correctStr = String(correctAnswer).trim();

    // 1. Direct string match
    if (studentStr.toLowerCase() === correctStr.toLowerCase()) {
        return true;
    }

    // 2. Numerical evaluation (handles 0.5, 0,5, 1/2, \frac{1}{2})
    const studentNum = evaluateToNumber(studentStr);
    const correctNum = typeof correctAnswer === 'number' ? correctAnswer : evaluateToNumber(correctStr);

    if (studentNum !== null && correctNum !== null) {
        // Use a small tolerance for floating point math
        return Math.abs(studentNum - correctNum) < 1e-6;
    }

    // 3. Fallback: normalize simple spacing and try again
    const normalize = (s: string) => s.replace(/\s+/g, '').replace(',', '.').toLowerCase();

    // Additional LaTeX normalization for string fallback (e.g., if it has variables)
    // Simplify \frac{x}{2} to x/2 for basic matching
    const normalizeLatex = (s: string) => {
        let n = normalize(s);
        // Basic replacement of \frac{a}{b} to a/b
        n = n.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (match, num, den) => {
            // Strip wrapper if it's just a single letter/number
            const wrapNum = /^[a-z0-9]+$/i.test(num) ? num : `(${num})`;
            const wrapDen = /^[a-z0-9]+$/i.test(den) ? den : `(${den})`;
            return `${wrapNum}/${wrapDen}`;
        });
        return n;
    };

    if (normalizeLatex(studentStr) === normalizeLatex(correctStr)) {
        return true;
    }

    return false;
}
