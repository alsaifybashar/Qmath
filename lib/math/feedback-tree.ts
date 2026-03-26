/**
 * Feedback tree for math answer grading.
 *
 * Instead of just "correct/incorrect", we analyze the student's answer
 * to find *why* it's wrong and give pedagogically useful feedback.
 *
 * Pattern library covers the most common student mistakes in:
 * - Integration (forgot constant, differentiated instead, wrong sign)
 * - Differentiation (integrated instead, chain rule missing, wrong sign)
 * - Algebra (sign error, missing term, off by factor)
 */

import { preParseInput } from './pre-parser';

export type FeedbackCode =
    | 'differentiated_instead_of_integrated'
    | 'integrated_instead_of_differentiated'
    | 'forgot_integration_constant'
    | 'sign_error'
    | 'off_by_factor'
    | 'off_by_additive_constant'
    | 'correct_up_to_constant'
    | 'syntax_error'
    | 'unknown_error';

export interface FeedbackResult {
    code: FeedbackCode;
    message: string;
    hint?: string;
}

const FEEDBACK_MESSAGES: Record<FeedbackCode, { message: string; hint?: string }> = {
    differentiated_instead_of_integrated: {
        message: 'Det ser ut som att du har deriverat istället för integrerat.',
        hint: 'Kom ihåg: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C, inte nxⁿ⁻¹.',
    },
    integrated_instead_of_differentiated: {
        message: 'Det ser ut som att du har integrerat istället för deriverat.',
        hint: 'Kom ihåg: d/dx[xⁿ] = nxⁿ⁻¹.',
    },
    forgot_integration_constant: {
        message: 'Ditt svar är nästan rätt — du glömde integrationskonstanten C.',
        hint: 'Alla obestämda integraler behöver + C i svaret.',
    },
    sign_error: {
        message: 'Kontrollera tecknet i ditt svar.',
        hint: 'Är det ett minus som har tappats eller blivit plus?',
    },
    off_by_factor: {
        message: 'Svaret verkar vara korrekt upp till en konstant faktor.',
        hint: 'Kontrollera koefficienten — har du glömt att dividera eller multiplicera?',
    },
    off_by_additive_constant: {
        message: 'Svaret skiljer sig med en konstant — kontrollera om det är korrekt.',
        hint: 'Kanske ett fel i startvillkor, integrationsgränser eller förenkling?',
    },
    correct_up_to_constant: {
        message: 'Ditt svar är ekvivalent med det korrekta svaret (upp till en konstant)!',
    },
    syntax_error: {
        message: 'Vi kunde inte tolka ditt svar — kontrollera stavningen.',
        hint: 'Exempel: "x^2 + C" eller "2*x + 1". Skriv * för multiplikation.',
    },
    unknown_error: {
        message: 'Svaret verkar inte stämma. Kontrollera dina beräkningar.',
    },
};

/**
 * Run the feedback tree against a student answer.
 * Returns the best matching error pattern, or null if no pattern matches.
 *
 * This is intentionally server-side only (uses mathjs).
 */
export async function runFeedbackTree(
    studentInput: string,
    correctAnswer: string,
    context: { questionType?: 'integral' | 'derivative' | 'algebra' | 'other' } = {}
): Promise<FeedbackResult | null> {
    const parsedStudent = preParseInput(studentInput);
    const parsedCorrect = preParseInput(correctAnswer);

    try {
        const math = await import('mathjs');

        const compiledStudent = math.compile(parsedStudent);
        const compiledCorrect = math.compile(parsedCorrect);

        const POINTS = [
            { x: 1 }, { x: 2 }, { x: -1 }, { x: 0.5 }, { x: 3 },
        ];

        const evalAt = (compiled: ReturnType<typeof math.compile>, pt: { x: number }): number | null => {
            try {
                const v = compiled.evaluate({ ...pt, C: 0 });
                return typeof v === 'number' && isFinite(v) ? v : null;
            } catch {
                return null;
            }
        };

        // Helper: check if f(x) ≈ g(x) at all test points
        const approxEqual = (
            a: ReturnType<typeof math.compile>,
            b: ReturnType<typeof math.compile>,
            tol = 1e-5
        ): boolean =>
            POINTS.every((pt) => {
                const av = evalAt(a, pt);
                const bv = evalAt(b, pt);
                if (av === null || bv === null) return false;
                return Math.abs(av - bv) < tol;
            });

        // Helper: check if diff is a constant across all test points
        const differsByConstant = (
            a: ReturnType<typeof math.compile>,
            b: ReturnType<typeof math.compile>,
            tol = 1e-5
        ): boolean => {
            const diffs = POINTS.map((pt) => {
                const av = evalAt(a, pt);
                const bv = evalAt(b, pt);
                if (av === null || bv === null) return null;
                return av - bv;
            }).filter((d): d is number => d !== null);
            if (diffs.length < 3) return false;
            const spread = Math.max(...diffs) - Math.min(...diffs);
            return spread < tol;
        };

        // ── Pattern checks ─────────────────────────────────────────────────────

        // Check sign flip: student ≈ -correct
        const negCorrect = math.compile(`-(${parsedCorrect})`);
        if (approxEqual(compiledStudent, negCorrect)) {
            return buildFeedback('sign_error');
        }

        // Check factor: student ≈ k * correct for some constant k ≠ 1, -1
        // (test at two points — ratio should be same non-unity constant)
        const pts2 = [{ x: 1 }, { x: 2 }];
        const s1 = evalAt(compiledStudent, pts2[0]);
        const c1 = evalAt(compiledCorrect, pts2[0]);
        const s2 = evalAt(compiledStudent, pts2[1]);
        const c2 = evalAt(compiledCorrect, pts2[1]);
        if (s1 && c1 && s2 && c2 && Math.abs(c1) > 1e-8 && Math.abs(c2) > 1e-8) {
            const k1 = s1 / c1;
            const k2 = s2 / c2;
            if (Math.abs(k1 - k2) < 1e-5 && Math.abs(k1 - 1) > 0.01 && Math.abs(k1 + 1) > 0.01) {
                return buildFeedback('off_by_factor');
            }
        }

        // Integral context: check if student = derivative of correct (i.e. they differentiated)
        if (context.questionType === 'integral') {
            try {
                const dCorrect = math.derivative(parsedCorrect.replace(/\+\s*C/gi, ''), 'x');
                const compiledDCorrect = math.compile(dCorrect.toString());
                if (approxEqual(compiledStudent, compiledDCorrect)) {
                    return buildFeedback('differentiated_instead_of_integrated');
                }
            } catch { /* symbolic differentiation failed — skip */ }

            // Check forgot constant: answers differ by constant
            if (differsByConstant(compiledStudent, compiledCorrect)) {
                return buildFeedback('forgot_integration_constant');
            }
        }

        // Derivative context: check if student = antiderivative of correct (i.e. they integrated)
        if (context.questionType === 'derivative') {
            try {
                const dStudent = math.derivative(parsedStudent, 'x');
                const compiledDStudent = math.compile(dStudent.toString());
                if (approxEqual(compiledDStudent, compiledCorrect)) {
                    return buildFeedback('integrated_instead_of_differentiated');
                }
            } catch { /* skip */ }
        }

        // Differs by additive constant (generic)
        if (differsByConstant(compiledStudent, compiledCorrect)) {
            return buildFeedback('off_by_additive_constant');
        }

        return buildFeedback('unknown_error');
    } catch {
        return buildFeedback('syntax_error');
    }
}

function buildFeedback(code: FeedbackCode): FeedbackResult {
    return { code, ...FEEDBACK_MESSAGES[code] };
}
