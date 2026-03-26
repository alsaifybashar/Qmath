/**
 * CAS-based answer grader.
 *
 * Uses math.js to compare the student's answer and the correct answer
 * symbolically. Instead of string matching, we evaluate the difference
 * student_answer − correct_answer at multiple random points.
 * If the difference is ≈ 0 at all test points, the answers are equivalent.
 *
 * This handles: x²+C, C+x², 2x²/2+C, (x+1)²-1+x etc.
 */

import { preParseInput } from './pre-parser';

type GradeResult = {
    isCorrect: boolean;
    /** Raw numeric error at test points (useful for debugging) */
    maxError: number;
    /** Parsed student expression (after pre-parsing) */
    parsedStudent: string;
};

// Test variable values to probe equivalence
const TEST_POINTS = [
    { x: 1 },
    { x: 2 },
    { x: -1 },
    { x: 0.5 },
    { x: Math.PI / 4 },
    { x: 3 },
];

const TOLERANCE = 1e-6;

/**
 * Grade a student's math answer against the correct answer.
 *
 * @param studentInput - Raw student input (e.g. "2x", "x^2+C", "(x+1)^2-1")
 * @param correctAnswer - The reference answer (e.g. "x^2", "2*x")
 * @param options.ignoreConstant - If true, treat answers as equal if they differ
 *   only by an additive constant (for indefinite integrals).
 * @param options.variable - The variable name (default: "x")
 */
export async function gradeAnswer(
    studentInput: string,
    correctAnswer: string,
    options: {
        ignoreConstant?: boolean;
        variable?: string;
    } = {}
): Promise<GradeResult> {
    const { ignoreConstant = false, variable = 'x' } = options;

    const parsedStudent = preParseInput(studentInput);
    const parsedCorrect = preParseInput(correctAnswer);

    try {
        // Dynamic import so this only loads on server or in a worker
        const math = await import('mathjs');

        // Compile both expressions
        const studentExpr = math.compile(parsedStudent);
        const correctExpr = math.compile(parsedCorrect);

        let maxError = 0;
        let allValid = true;

        for (const scope of TEST_POINTS) {
            try {
                const sv = studentExpr.evaluate({ ...scope, C: 0 });
                const cv = correctExpr.evaluate({ ...scope, C: 0 });

                if (typeof sv !== 'number' || typeof cv !== 'number') {
                    allValid = false;
                    break;
                }
                if (!isFinite(sv) || !isFinite(cv)) continue; // skip poles

                const diff = Math.abs(sv - cv);
                maxError = Math.max(maxError, diff);
            } catch {
                allValid = false;
                break;
            }
        }

        if (!allValid) {
            return { isCorrect: false, maxError: Infinity, parsedStudent };
        }

        if (maxError < TOLERANCE) {
            return { isCorrect: true, maxError, parsedStudent };
        }

        // If ignoreConstant: check if the difference is a constant across all points
        if (ignoreConstant) {
            const diffs: number[] = [];
            let constantDiff = true;

            for (const scope of TEST_POINTS) {
                try {
                    const sv = studentExpr.evaluate({ ...scope, C: 0 });
                    const cv = correctExpr.evaluate({ ...scope, C: 0 });
                    if (typeof sv !== 'number' || typeof cv !== 'number') {
                        constantDiff = false;
                        break;
                    }
                    if (!isFinite(sv) || !isFinite(cv)) continue;
                    diffs.push(sv - cv);
                } catch {
                    constantDiff = false;
                    break;
                }
            }

            if (constantDiff && diffs.length >= 2) {
                const spread = Math.max(...diffs) - Math.min(...diffs);
                if (spread < TOLERANCE) {
                    return { isCorrect: true, maxError, parsedStudent };
                }
            }
        }

        return { isCorrect: false, maxError, parsedStudent };
    } catch {
        // Parse error — fall back to string comparison
        const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
        const isCorrect = norm(parsedStudent) === norm(parsedCorrect);
        return { isCorrect, maxError: isCorrect ? 0 : Infinity, parsedStudent };
    }
}

/**
 * Lightweight synchronous check using pre-parsing + numeric eval.
 * Use this for client-side immediate feedback before the full CAS result.
 */
export function quickGrade(
    studentInput: string,
    correctAnswer: string,
    tolerance = 1e-6
): boolean {
    try {
        const parsedStudent = preParseInput(studentInput);
        const parsedCorrect = preParseInput(correctAnswer);

        // Only works for pure numeric expressions (no variables)
        const evalSimple = (expr: string): number | null => {
            try {
                // Use Function constructor safely for numeric-only expressions
                if (/[a-zA-Z]/.test(expr)) return null;
                // eslint-disable-next-line no-new-func
                const result = new Function(`"use strict"; return (${expr})`)();
                return typeof result === 'number' ? result : null;
            } catch {
                return null;
            }
        };

        const sv = evalSimple(parsedStudent);
        const cv = evalSimple(parsedCorrect);
        if (sv !== null && cv !== null) return Math.abs(sv - cv) < tolerance;

        return parsedStudent.replace(/\s/g, '') === parsedCorrect.replace(/\s/g, '');
    } catch {
        return false;
    }
}
