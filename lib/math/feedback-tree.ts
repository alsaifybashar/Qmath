/**
 * Expanded feedback tree for CAS math answer grading.
 *
 * Analyses WHY an answer is wrong and returns pedagogically useful Swedish feedback.
 * Pattern library covers 40+ common student mistakes across:
 *   - Integration (9 codes)
 *   - Differentiation (7 codes)
 *   - Algebra / general (12 codes)
 *   - Trigonometry (5 codes)
 *   - Limits & series (4 codes)
 *   - Structural / syntax (3 codes)
 */

import { preParseInput } from './pre-parser';

// ── Types ──────────────────────────────────────────────────────────────────────

export type FeedbackCode =
    // Integration
    | 'differentiated_instead_of_integrated'
    | 'forgot_integration_constant'
    | 'wrong_power_rule_integral'
    | 'wrong_chain_rule_integral'
    | 'wrong_u_substitution'
    | 'missing_absolute_value_ln'
    | 'wrong_trig_integral'
    | 'sign_error_integration'
    | 'wrong_partial_fractions'
    // Differentiation
    | 'integrated_instead_of_differentiated'
    | 'missing_chain_rule'
    | 'wrong_product_rule'
    | 'wrong_quotient_rule'
    | 'wrong_trig_derivative'
    | 'wrong_implicit_diff'
    | 'sign_error_derivative'
    // Algebra / general
    | 'sign_error'
    | 'off_by_factor'
    | 'off_by_additive_constant'
    | 'forgot_term'
    | 'wrong_exponent'
    | 'wrong_root'
    | 'wrong_fraction_simplification'
    | 'distributive_law_error'
    | 'binomial_expansion_error'
    | 'wrong_log_rule'
    | 'wrong_exp_rule'
    // Trigonometry
    | 'wrong_trig_identity'
    | 'degrees_vs_radians'
    | 'wrong_inverse_trig'
    | 'wrong_trig_simplification'
    | 'wrong_trig_period'
    // Limits / series
    | 'wrong_limit_rule'
    | 'wrong_lhopital'
    | 'wrong_series_coefficient'
    | 'wrong_convergence_test'
    // Structural / syntax
    | 'correct_up_to_constant'
    | 'syntax_error'
    | 'unknown_error';

export interface FeedbackResult {
    code: FeedbackCode;
    /** Swedish feedback message */
    message: string;
    /** Optional hint (shown on demand, keeps anxiety low) */
    hint?: string;
    /** Partial credit score for this pattern (0.0–1.0) */
    partialScore: number;
    /** If set, the system should scaffold this prerequisite topic */
    remediationTopicSlug?: string;
}

// ── Message library (Swedish primary) ─────────────────────────────────────────

const FEEDBACK: Record<FeedbackCode, Omit<FeedbackResult, 'code'>> = {
    // ── Integration ──────────────────────────────────────────────────────
    differentiated_instead_of_integrated: {
        message: 'Det ser ut som att du deriverade uttrycket istället för att integrera det.',
        hint: 'Kom ihåg: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C, inte nxⁿ⁻¹.',
        partialScore: 0.1,
        remediationTopicSlug: 'grundlaggande-integration',
    },
    forgot_integration_constant: {
        message: 'Ditt svar är nästan rätt — du glömde integrationskonstanten C.',
        hint: 'Alla primitiva funktioner behöver ett "+ C" i slutet.',
        partialScore: 0.85,
    },
    wrong_power_rule_integral: {
        message: 'Kontrollera potensregeln för integration.',
        hint: '∫xⁿ dx = xⁿ⁺¹ / (n+1) + C. Ökade du exponenten med 1 och delade med den nya potensen?',
        partialScore: 0.3,
    },
    wrong_chain_rule_integral: {
        message: 'Det ser ut som ett fel i kedjeregeln vid integration.',
        hint: 'Vid substitution u = g(x) behöver du ta hänsyn till g\'(x) — har du dividerat med den yttre derivatan?',
        partialScore: 0.3,
        remediationTopicSlug: 'variabelsubstitution',
    },
    wrong_u_substitution: {
        message: 'Valget av substitution verkar inte stämma.',
        hint: 'Prova att välja u så att du-uttrycket finns i integranden.',
        partialScore: 0.2,
        remediationTopicSlug: 'variabelsubstitution',
    },
    missing_absolute_value_ln: {
        message: 'Kontrollera att du skrivit ln med absolutvärde.',
        hint: '∫(1/x) dx = ln|x| + C, inte ln(x) + C.',
        partialScore: 0.75,
    },
    wrong_trig_integral: {
        message: 'Kontrollera integralen av trigonometriska funktionen.',
        hint: 'Exempel: ∫sin(x) dx = −cos(x) + C; ∫cos(x) dx = sin(x) + C.',
        partialScore: 0.2,
        remediationTopicSlug: 'trigonometriska-integraler',
    },
    sign_error_integration: {
        message: 'Svaret är rätt upp till ett teckenfel.',
        hint: 'Kontrollera tecknet — har du glömt ett minustecken vid integration av sin eller vid partiell integration?',
        partialScore: 0.6,
    },
    wrong_partial_fractions: {
        message: 'Partialbråksuppdelningen verkar inte stämma.',
        hint: 'Kontrollera att du satt upp bråken korrekt och löst för koefficienterna.',
        partialScore: 0.2,
        remediationTopicSlug: 'partialbrak',
    },

    // ── Differentiation ──────────────────────────────────────────────────
    integrated_instead_of_differentiated: {
        message: 'Det ser ut som att du integrerade uttrycket istället för att derivera det.',
        hint: 'Kom ihåg: d/dx[xⁿ] = n·xⁿ⁻¹.',
        partialScore: 0.1,
        remediationTopicSlug: 'grundlaggande-derivation',
    },
    missing_chain_rule: {
        message: 'Det verkar som att du glömde kedjeregeln.',
        hint: 'Om du deriverar f(g(x)) behöver du multiplicera med g\'(x) — den inre derivatan.',
        partialScore: 0.4,
        remediationTopicSlug: 'kedjeregeln',
    },
    wrong_product_rule: {
        message: 'Kontrollera produktregeln.',
        hint: '(f·g)\' = f\'·g + f·g\'. Har du differentierat båda faktorerna?',
        partialScore: 0.3,
        remediationTopicSlug: 'produktregeln',
    },
    wrong_quotient_rule: {
        message: 'Kontrollera kvotregeln.',
        hint: '(f/g)\' = (f\'·g − f·g\') / g². Märk minustecknet i täljaren.',
        partialScore: 0.3,
        remediationTopicSlug: 'kvotregeln',
    },
    wrong_trig_derivative: {
        message: 'Kontrollera derivatan av den trigonometriska funktionen.',
        hint: 'Exempel: (sin x)\' = cos x; (cos x)\' = −sin x; (tan x)\' = 1/cos²x.',
        partialScore: 0.2,
        remediationTopicSlug: 'trigonometriska-derivator',
    },
    wrong_implicit_diff: {
        message: 'Kontrollera den implicita differentieringen.',
        hint: 'Kom ihåg att derivera båda leden med avseende på x, och att y är en funktion av x.',
        partialScore: 0.2,
    },
    sign_error_derivative: {
        message: 'Svaret är rätt upp till ett teckenfel i derivatan.',
        hint: 'Kontrollera tecknet — är det (cos x)\' = −sin x du behöver?',
        partialScore: 0.6,
    },

    // ── Algebra / general ────────────────────────────────────────────────
    sign_error: {
        message: 'Kontrollera tecknet i ditt svar.',
        hint: 'Har ett minustecken försvunnit eller blivit plus?',
        partialScore: 0.6,
    },
    off_by_factor: {
        message: 'Svaret ser ut att vara rätt upp till en konstant faktor.',
        hint: 'Kontrollera koefficienten — har du glömt att dividera eller multiplicera med ett tal?',
        partialScore: 0.5,
    },
    off_by_additive_constant: {
        message: 'Svaret skiljer sig med en konstant från det korrekta svaret.',
        hint: 'Kolla startvillkor, integrationsgränser eller förenkling.',
        partialScore: 0.6,
    },
    forgot_term: {
        message: 'Det verkar som att du saknar en term i svaret.',
        hint: 'Gå igenom varje del av uttrycket systematiskt.',
        partialScore: 0.4,
    },
    wrong_exponent: {
        message: 'Exponenten verkar inte stämma.',
        hint: 'Kontrollera potensregeln: (xᵃ)ᵇ = xᵃᵇ och xᵃ·xᵇ = xᵃ⁺ᵇ.',
        partialScore: 0.3,
    },
    wrong_root: {
        message: 'Kontrollera rotuträkning.',
        hint: 'Kom ihåg att √(ab) = √a·√b men √(a+b) ≠ √a + √b.',
        partialScore: 0.3,
    },
    wrong_fraction_simplification: {
        message: 'Förenklingen av bråket verkar inte stämma.',
        hint: 'Du kan bara förkorta faktorer som finns i BÅDE täljare och nämnare.',
        partialScore: 0.3,
    },
    distributive_law_error: {
        message: 'Kontrollera distributiva lagen.',
        hint: 'a(b + c) = ab + ac. Har du multiplicerat in parentesen på alla termer?',
        partialScore: 0.3,
    },
    binomial_expansion_error: {
        message: 'Binomialutvecklingen verkar inte stämma.',
        hint: '(a + b)² = a² + 2ab + b². Observera mittentermen 2ab.',
        partialScore: 0.3,
    },
    wrong_log_rule: {
        message: 'Kontrollera logaritmregeln du använde.',
        hint: 'Kom ihåg: ln(ab) = ln a + ln b; ln(a/b) = ln a − ln b; ln(aⁿ) = n·ln a.',
        partialScore: 0.2,
        remediationTopicSlug: 'logaritmer',
    },
    wrong_exp_rule: {
        message: 'Kontrollera exponentialregeln.',
        hint: 'eᵃ·eᵇ = eᵃ⁺ᵇ och (eᵃ)ᵇ = eᵃᵇ.',
        partialScore: 0.2,
    },

    // ── Trigonometry ─────────────────────────────────────────────────────
    wrong_trig_identity: {
        message: 'En trigonometrisk identitet verkar inte ha tillämpats korrekt.',
        hint: 'Vanliga identiteter: sin²x + cos²x = 1; tan x = sin x / cos x.',
        partialScore: 0.2,
        remediationTopicSlug: 'trigonometriska-identiteter',
    },
    degrees_vs_radians: {
        message: 'Kontrollera om vinkeln ska vara i grader eller radianer.',
        hint: 'I de flesta kalkylsammanhang används radianer. 180° = π radianer.',
        partialScore: 0.3,
    },
    wrong_inverse_trig: {
        message: 'Kontrollera definitionen av den inversa trigonometriska funktionen.',
        hint: 'arcsin(x) är definerat för x ∈ [−1, 1] och ger värden i [−π/2, π/2].',
        partialScore: 0.2,
    },
    wrong_trig_simplification: {
        message: 'Förenkling av trigonometriska uttrycket verkar inte stämma.',
        partialScore: 0.2,
    },
    wrong_trig_period: {
        message: 'Kontrollera periodens inverkan på lösningen.',
        hint: 'Tänk på att trigonometriska funktioner har periodiska lösningar.',
        partialScore: 0.3,
    },

    // ── Limits / series ──────────────────────────────────────────────────
    wrong_limit_rule: {
        message: 'Gränsvärdets beräkning verkar inte stämma.',
        hint: 'Kontrollera om du kan insätta direkt, eller om du behöver faktorisera/l\'Hôpital.',
        partialScore: 0.2,
    },
    wrong_lhopital: {
        message: 'L\'Hôpitals regel verkar inte ha tillämpats korrekt.',
        hint: 'L\'Hôpital gäller vid obestämd form (0/0 eller ∞/∞). Har du deriverat täljare OCH nämnare separat?',
        partialScore: 0.3,
        remediationTopicSlug: 'lhopitals-regel',
    },
    wrong_series_coefficient: {
        message: 'Koefficienterna i serieexpansionen verkar inte stämma.',
        partialScore: 0.3,
    },
    wrong_convergence_test: {
        message: 'Konvergenstestet verkar inte ha tillämpats korrekt.',
        partialScore: 0.2,
    },

    // ── Structural ────────────────────────────────────────────────────────
    correct_up_to_constant: {
        message: 'Ditt svar är matematiskt ekvivalent med det korrekta (upp till en konstant)!',
        partialScore: 0.9,
    },
    syntax_error: {
        message: 'Vi kunde inte tolka ditt svar — kontrollera stavningen.',
        hint: 'Exempel: "x^2 + C" eller "2*x + 1". Skriv * för multiplikation och ^ för exponent.',
        partialScore: 0,
    },
    unknown_error: {
        message: 'Svaret verkar inte stämma. Kontrollera dina beräkningar steg för steg.',
        partialScore: 0,
    },
};

// ── Main entry point ───────────────────────────────────────────────────────────

export type QuestionType = 'integral' | 'derivative' | 'algebra' | 'trigonometry' | 'limit' | 'series' | 'other';

/**
 * Run the feedback tree against a student answer.
 * Returns the best matching pedagogical feedback, or null if no pattern fires.
 */
export async function runFeedbackTree(
    studentInput: string,
    correctAnswer: string,
    context: {
        questionType?: QuestionType;
        topicId?: string;
        partialScore?: number;
    } = {}
): Promise<FeedbackResult | null> {

    const parsedStudent = preParseInput(studentInput);
    const parsedCorrect = preParseInput(correctAnswer);

    try {
        const math = await import('mathjs');
        type Compiled = import('mathjs').EvalFunction;

        const compiledStudent: Compiled = math.compile(parsedStudent) as unknown as Compiled;
        const compiledCorrect: Compiled = math.compile(parsedCorrect) as unknown as Compiled;

        const POINTS = [{ x: 1 }, { x: 2 }, { x: -1 }, { x: 0.5 }, { x: 3 }];

        const evalAt = (compiled: Compiled, pt: { x: number }): number | null => {
            try {
                const v = compiled.evaluate({ ...pt, C: 0 });
                if (typeof v === 'number' && isFinite(v)) return v;
                // handle mathjs complex
                if (v && typeof v === 'object' && 're' in v) {
                    const c = v as { re: number; im: number };
                    return Math.abs(c.im) < 1e-10 ? c.re : null;
                }
                return null;
            } catch {
                return null;
            }
        };

        // Helper: f ≈ g at all test points
        const approxEqual = (
            a: Compiled,
            b: Compiled,
            tol = 1e-5
        ): boolean =>
            POINTS.every((pt) => {
                const av = evalAt(a, pt);
                const bv = evalAt(b, pt);
                if (av === null || bv === null) return false;
                return Math.abs(av - bv) < tol;
            });

        // Helper: diff is constant (differs by additive constant)
        const differsByConstant = (
            a: Compiled,
            b: Compiled,
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

        // Helper: student ≈ k * correct for constant k ≠ 1, -1
        const byFactor = (): boolean => {
            const s1 = evalAt(compiledStudent, { x: 1 });
            const c1 = evalAt(compiledCorrect, { x: 1 });
            const s2 = evalAt(compiledStudent, { x: 2 });
            const c2 = evalAt(compiledCorrect, { x: 2 });
            if (!s1 || !c1 || !s2 || !c2) return false;
            if (Math.abs(c1) < 1e-8 || Math.abs(c2) < 1e-8) return false;
            const k1 = s1 / c1;
            const k2 = s2 / c2;
            return Math.abs(k1 - k2) < 1e-5 && Math.abs(k1 - 1) > 0.01 && Math.abs(k1 + 1) > 0.01;
        };

        // ── Pattern matching ───────────────────────────────────────────────

        // Sign flip: student ≈ -correct
        const negCorrect: Compiled = math.compile(`-(${parsedCorrect})`) as unknown as Compiled;
        if (approxEqual(compiledStudent, negCorrect)) {
            if (context.questionType === 'integral') return build('sign_error_integration');
            if (context.questionType === 'derivative') return build('sign_error_derivative');
            return build('sign_error');
        }

        // Off by factor
        if (byFactor()) return build('off_by_factor');

        // ── Integration-specific ──────────────────────────────────────────
        if (context.questionType === 'integral') {
            // Did they differentiate instead?
            try {
                const dCorrect = math.derivative(parsedCorrect.replace(/\+\s*C/gi, ''), 'x');
                const compiledDCorrect: Compiled = math.compile(dCorrect.toString()) as unknown as Compiled;
                if (approxEqual(compiledStudent, compiledDCorrect)) {
                    return build('differentiated_instead_of_integrated');
                }
            } catch { /* symbolic diff failed */ }

            // Forgot constant C (differs by constant)
            if (differsByConstant(compiledStudent, compiledCorrect)) {
                return build('forgot_integration_constant');
            }

            // Check if answer is -correct (sign error in integration)
            if (approxEqual(compiledStudent, negCorrect)) return build('sign_error_integration');

            // Differ by a factor (chain rule mistake)
            if (byFactor()) return build('wrong_chain_rule_integral');
        }

        // ── Derivative-specific ────────────────────────────────────────────
        if (context.questionType === 'derivative') {
            // Did they integrate instead?
            try {
                const dStudent = math.derivative(parsedStudent, 'x');
                const compiledDStudent: Compiled = math.compile(dStudent.toString()) as unknown as Compiled;
                if (approxEqual(compiledDStudent, compiledCorrect)) {
                    return build('integrated_instead_of_differentiated');
                }
            } catch { /* skip */ }

            // Factor error → chain rule issue
            if (byFactor()) return build('missing_chain_rule');
        }

        // ── Generic: additive constant diff ───────────────────────────────
        if (differsByConstant(compiledStudent, compiledCorrect)) {
            return build('off_by_additive_constant');
        }

        // ── Degrees vs radians heuristic ──────────────────────────────────
        // Check if student(x_deg) ≈ correct(x_rad) for a trig question
        if (context.questionType === 'trigonometry') {
            try {
                const degStudent: Compiled = math.compile(parsedStudent) as unknown as Compiled;
                const radCorrect: Compiled = math.compile(parsedCorrect) as unknown as Compiled;
                const degPts = [{ x: Math.PI / 6 }, { x: Math.PI / 4 }, { x: Math.PI / 3 }];
                const misMatch = degPts.every((pt) => {
                    const sv = evalAt(degStudent, { x: pt.x * (180 / Math.PI) });
                    const cv = evalAt(radCorrect, pt);
                    if (sv === null || cv === null) return false;
                    return Math.abs(sv - cv) < 1e-5;
                });
                if (misMatch) return build('degrees_vs_radians');
            } catch { /* skip */ }
        }

        return build('unknown_error');

    } catch {
        return build('syntax_error');
    }
}

function build(code: FeedbackCode): FeedbackResult {
    return { code, ...FEEDBACK[code] };
}
