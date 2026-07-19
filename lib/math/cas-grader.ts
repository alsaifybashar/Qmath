/**
 * CAS-based answer grader — Two-Tier Architecture.
 *
 * Tier 1 (fast, < 50 ms): mathjs numeric probe — evaluates student − correct
 *   at multiple random points. If diff ≈ 0 → correct.
 *
 * Tier 2 (symbolic, ~200 ms): SymPy FastAPI sidecar — simplify(student − correct).
 *   Only triggered when Tier 1 fails but might be a symbolic equivalence.
 *
 * Handles: x²+C, C+x², sin²x+cos²x vs 1, (x+1)²-1+x, etc.
 */

import { preParseInput } from './pre-parser';
import { compileSafeExpression } from './safe-expression';

// ── Types ──────────────────────────────────────────────────────────────────────

export type GradeOptions = {
    /** Treat answers as equal if they differ only by an additive constant (indefinite integrals) */
    ignoreConstant?: boolean;
    /** The variable names to probe (default: ["x"]) */
    variables?: string[];
    /** Numeric tolerance for comparison (default 1e-6) */
    tolerance?: number;
    /** Domain restriction hint — passed to SymPy sidecar (default: "real") */
    domain?: 'real' | 'positive' | 'complex';
    /** Skip SymPy sidecar (e.g. for quick client-side-like grading) */
    fastOnly?: boolean;
};

export type GradeResult = {
    isCorrect: boolean;
    /** Partial score 0.0–1.0 (1.0 = fully correct, 0.5 = nearly correct, 0.0 = wrong) */
    partialScore: number;
    /** Raw numeric max error at test points */
    maxError: number;
    /** Parsed student expression (after pre-parsing) */
    parsedStudent: string;
    /** Whether the SymPy sidecar was consulted */
    symbolicallyChecked: boolean;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_TOLERANCE = 1e-6;
const SYMPY_SIDECAR_URL = process.env.SYMPY_SIDECAR_URL
    ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8001');
const SYMPY_TIMEOUT_MS = 4000; // SymPy call budget

/** Default multi-point probe for single-variable (x) questions */
function buildTestPoints(variables: string[]): Record<string, number>[] {
    if (variables.length === 1 && variables[0] === 'x') {
        return [
            { x: 1 }, { x: 2 }, { x: -1 }, { x: 0.5 },
            { x: Math.PI / 4 }, { x: 3 }, { x: -0.7 },
        ];
    }
    // Multi-variable: build a small grid
    const vals = [0.5, 1.5, 2.7];
    const points: Record<string, number>[] = [];
    for (const a of vals) {
        const pt: Record<string, number> = {};
        variables.forEach((v, i) => { pt[v] = vals[(i + (vals.indexOf(a))) % vals.length]; });
        points.push(pt);
    }
    return points;
}

// ── Main grader ────────────────────────────────────────────────────────────────

/**
 * Grade a student's math answer against the correct answer.
 */
export async function gradeAnswer(
    studentInput: string,
    correctAnswer: string,
    options: GradeOptions = {}
): Promise<GradeResult> {
    const {
        ignoreConstant = false,
        variables = ['x'],
        tolerance = DEFAULT_TOLERANCE,
        domain = 'real',
        fastOnly = false,
    } = options;

    const parsedStudent = preParseInput(studentInput);
    const parsedCorrect = preParseInput(correctAnswer);
    const testPoints = buildTestPoints(variables);

    // ── Tier 1: mathjs numeric probe ──────────────────────────────────
    const tier1 = await numericProbe(parsedStudent, parsedCorrect, testPoints, tolerance, ignoreConstant);

    if (tier1.isCorrect) {
        return { ...tier1, parsedStudent, symbolicallyChecked: false };
    }

    // Tier 1 says wrong — but check if SymPy might disagree (symbolic equivalence)
    // Only call SymPy if the error is finite (not a parse failure)
    const mightBeSymbolicallyEqual = tier1.maxError !== Infinity && !fastOnly;

    if (mightBeSymbolicallyEqual) {
        const tier2 = await sympyCheck(parsedStudent, parsedCorrect, { domain, ignoreConstant });
        if (tier2 !== null) {
            return {
                isCorrect: tier2.isCorrect,
                partialScore: tier2.isCorrect ? 1.0 : tier1.partialScore,
                maxError: tier1.maxError,
                parsedStudent,
                symbolicallyChecked: true,
            };
        }
    }

    return { ...tier1, parsedStudent, symbolicallyChecked: mightBeSymbolicallyEqual };
}

// ── Tier 1: mathjs numeric probe ──────────────────────────────────────────────

async function numericProbe(
    parsedStudent: string,
    parsedCorrect: string,
    testPoints: Record<string, number>[],
    tolerance: number,
    ignoreConstant: boolean,
): Promise<Omit<GradeResult, 'parsedStudent' | 'symbolicallyChecked'>> {
    try {
        const math = await import('mathjs');

        const symbols = Object.keys(testPoints[0] ?? {});
        const studentExpr = compileSafeExpression(parsedStudent, { symbols });
        const correctExpr = compileSafeExpression(parsedCorrect, { symbols });

        let maxError = 0;
        const diffs: number[] = [];
        let allValid = true;

        for (const scope of testPoints) {
            try {
                const sv = studentExpr.evaluate({ ...scope, C: 0, i: math.complex(0, 1) });
                const cv = correctExpr.evaluate({ ...scope, C: 0, i: math.complex(0, 1) });

                const svNum = extractNumber(sv);
                const cvNum = extractNumber(cv);

                if (svNum === null || cvNum === null) { allValid = false; break; }
                if (!isFinite(svNum) || !isFinite(cvNum)) continue; // skip poles

                const diff = Math.abs(svNum - cvNum);
                maxError = Math.max(maxError, diff);
                diffs.push(svNum - cvNum);
            } catch {
                allValid = false;
                break;
            }
        }

        if (!allValid) {
            return { isCorrect: false, partialScore: 0, maxError: Infinity };
        }

        if (maxError < tolerance) {
            return { isCorrect: true, partialScore: 1.0, maxError };
        }

        // ignoreConstant: check if difference is constant across all points
        if (ignoreConstant && diffs.length >= 3) {
            const spread = Math.max(...diffs) - Math.min(...diffs);
            if (spread < tolerance) {
                return { isCorrect: true, partialScore: 1.0, maxError };
            }
        }

        // Estimate partial score based on how close the answer is
        const partialScore = computePartialScore(maxError);

        return { isCorrect: false, partialScore, maxError };
    } catch {
        // Compilation failure — fall back to string comparison
        const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
        const isCorrect = norm(parsedStudent) === norm(parsedCorrect);
        return { isCorrect, partialScore: isCorrect ? 1.0 : 0, maxError: isCorrect ? 0 : Infinity };
    }
}

function extractNumber(v: unknown): number | null {
    if (typeof v === 'number') return v;
    // mathjs Complex type
    if (v && typeof v === 'object' && 'im' in v && 're' in v) {
        const c = v as { re: number; im: number };
        if (Math.abs(c.im) < 1e-10) return c.re;
        return null; // genuinely complex result
    }
    return null;
}

function computePartialScore(maxError: number): number {
    if (maxError === Infinity) return 0;
    if (maxError < 0.01) return 0.8;  // very close — sign/constant error
    if (maxError < 1) return 0.5;     // factor error
    if (maxError < 10) return 0.2;    // direction error
    return 0;
}

// ── Tier 2: SymPy sidecar ──────────────────────────────────────────────────────

interface SympyResponse {
    isEquivalent: boolean;
    simplifiedDiff?: string; // simplified form of (student - correct)
    error?: string;
}

async function sympyCheck(
    parsedStudent: string,
    parsedCorrect: string,
    options: { domain: string; ignoreConstant: boolean }
): Promise<{ isCorrect: boolean } | null> {
    if (!SYMPY_SIDECAR_URL) return null;
    try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), SYMPY_TIMEOUT_MS);

        const res = await fetch(`${SYMPY_SIDECAR_URL}/sympy/check-equivalence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student: parsedStudent,
                correct: parsedCorrect,
                ignore_constant: options.ignoreConstant,
                domain: options.domain,
            }),
            signal: controller.signal,
        });

        clearTimeout(tid);
        if (!res.ok) return null;

        const data: SympyResponse = await res.json();
        return { isCorrect: data.isEquivalent };
    } catch {
        // Sidecar unavailable — degrade gracefully to Tier 1 result
        return null;
    }
}

// ── Lightweight sync check ─────────────────────────────────────────────────────

/**
 * Lightweight synchronous check using pre-parsing + basic numeric eval.
 * Use for immediate client-side feedback before the full async CAS result.
 */
export function quickGrade(
    studentInput: string,
    correctAnswer: string,
    tolerance = 1e-6
): boolean {
    try {
        const parsedStudent = preParseInput(studentInput);
        const parsedCorrect = preParseInput(correctAnswer);

        const evalSimple = (expr: string): number | null => {
            try {
                if (/[a-zA-Z]/.test(expr)) return null;
                const result = compileSafeExpression(expr).evaluate({});
                return typeof result === 'number' && Number.isFinite(result) ? result : null;
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
