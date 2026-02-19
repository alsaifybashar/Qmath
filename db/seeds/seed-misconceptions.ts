import { db } from '../drizzle';
import { misconceptions } from '../schema';

/**
 * Seed misconception catalog — known student error patterns
 * sourced from research on Swedish engineering students.
 * Run with: npx tsx db/seeds/seed-misconceptions.ts
 */

async function seedMisconceptions() {
    console.log('🧠 Seeding misconception catalog...\n');

    const data = [
        // ── Algebraic Misconceptions (Root cause of calculus failure) ─────
        {
            code: 'sqrt_sum_distributive',
            description: 'Assumes square root distributes over addition: √(a+b) = √a + √b',
            descriptionSv: 'Antar att roten distribuerar over addition: √(a+b) = √a + √b',
            affectedTopicIds: ['limits', 'derivatives', 'integration'],
            commonWrongPatterns: [
                { type: 'regex', pattern: 'sqrt\\(.*\\+.*\\)\\s*=\\s*sqrt\\(.*\\)\\s*\\+\\s*sqrt\\(.*\\)' },
                { type: 'description', pattern: 'Student splits root over sum' },
            ],
            feedbackEn: 'Be careful — the square root does NOT distribute over addition. √(a+b) ≠ √a + √b. Try √(9+16) = √25 = 5, but √9 + √16 = 3 + 4 = 7. They are different!',
            feedbackSv: 'Var forsiktig — roten distribuerar INTE over addition. √(a+b) ≠ √a + √b. Prova √(9+16) = √25 = 5, men √9 + √16 = 3 + 4 = 7. De ar inte lika!',
            severity: 'high',
        },
        {
            code: 'sign_error_negation',
            description: 'Persistent sign errors when distributing negation or subtracting',
            descriptionSv: 'Ihallande teckenfel vid distribution av negation eller subtraktion',
            affectedTopicIds: ['derivatives', 'integration', 'linear-equations'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Answer differs from correct only by sign' },
                { type: 'description', pattern: 'Forgot to negate when distributing minus' },
            ],
            feedbackEn: 'Check the sign of your answer — the magnitude looks right but the sign is wrong. Remember: when you distribute a minus sign, every term inside changes sign.',
            feedbackSv: 'Kontrollera tecknet pa ditt svar — beloppet ser ratt ut men tecknet ar fel. Kom ihag: nar du distribuerar ett minustecken andras tecknet pa varje term.',
            severity: 'high',
        },
        {
            code: 'fraction_addition_denominator',
            description: 'Adds fractions by adding numerators and denominators separately: a/b + c/d = (a+c)/(b+d)',
            descriptionSv: 'Adderar brak genom att addera taljare och namnare separat: a/b + c/d = (a+c)/(b+d)',
            affectedTopicIds: ['limits', 'integration-techniques', 'derivatives'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Added numerators and denominators separately' },
            ],
            feedbackEn: 'When adding fractions, you need a common denominator first. a/b + c/d = (ad + bc)/(bd), NOT (a+c)/(b+d). Try it with 1/2 + 1/3: the answer is 5/6, not 2/5.',
            feedbackSv: 'Nar du adderar brak behover du forst en gemensam namnare. a/b + c/d = (ad + bc)/(bd), INTE (a+c)/(b+d). Prova med 1/2 + 1/3: svaret ar 5/6, inte 2/5.',
            severity: 'high',
        },
        {
            code: 'exponent_sum_distributive',
            description: 'Assumes (a+b)² = a² + b², missing the cross term',
            descriptionSv: 'Antar att (a+b)² = a² + b², missar korstermen',
            affectedTopicIds: ['derivatives', 'integration', 'limits'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Squared sum without cross term 2ab' },
            ],
            feedbackEn: 'Remember: (a+b)² = a² + 2ab + b², not a² + b². The cross term 2ab is essential! This is the binomial expansion.',
            feedbackSv: 'Kom ihag: (a+b)² = a² + 2ab + b², inte a² + b². Korstermen 2ab ar viktig! Detta ar binomialutvecklingen.',
            severity: 'high',
        },
        {
            code: 'equals_sign_operational',
            description: 'Treats = as "the next step" rather than a statement of equality',
            descriptionSv: 'Behandlar = som "nasta steg" istallet for ett uttalande om likhet',
            affectedTopicIds: ['linear-equations', 'derivatives', 'limits'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Chain of equalities that are not actually equal' },
            ],
            feedbackEn: 'Each = sign means both sides must be equal at that point. Make sure each step truly equals the previous one — don\'t use = to mean "and then".',
            feedbackSv: 'Varje =-tecken betyder att bada sidor maste vara lika i det steget. Se till att varje steg verkligen ar lika med det foregaende — anvand inte = for att betyda "och sedan".',
            severity: 'medium',
        },

        // ── Calculus Misconceptions ──────────────────────────────────────
        {
            code: 'limit_substitution_always',
            description: 'Always substitutes directly in limits without checking for indeterminate forms',
            descriptionSv: 'Substituerar alltid direkt i gransvarden utan att kontrollera obestamda former',
            affectedTopicIds: ['limits'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Got 0/0 or infinity/infinity without applying L\'Hopital or algebraic simplification' },
            ],
            feedbackEn: 'Direct substitution gave an indeterminate form (like 0/0). You need to simplify first — try factoring, multiplying by the conjugate, or applying L\'Hôpital\'s rule.',
            feedbackSv: 'Direkt substitution gav en obestamd form (som 0/0). Du behover forenkla forst — prova att faktorisera, multiplicera med konjugatet, eller anvanda L\'Hôpitals regel.',
            severity: 'medium',
        },
        {
            code: 'derivative_confusion_value',
            description: 'Confuses the derivative function f\'(x) with evaluating it at a point f\'(a)',
            descriptionSv: 'Forvirrar derivatafunktionen f\'(x) med att berakna den i en punkt f\'(a)',
            affectedTopicIds: ['derivatives'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Gave the derivative expression when asked for a value' },
                { type: 'description', pattern: 'Answer contains x when a number was expected' },
            ],
            feedbackEn: 'You found the derivative f\'(x) correctly, but the question asks for f\'(a) — a specific number. Substitute the given value into your derivative.',
            feedbackSv: 'Du hittade derivatan f\'(x) korrekt, men fragan fragar efter f\'(a) — ett specifikt tal. Substituera det givna vardet i din derivata.',
            severity: 'medium',
        },
        {
            code: 'chain_rule_omission',
            description: 'Forgets the inner derivative when applying the chain rule',
            descriptionSv: 'Glommer den inre derivatan nar kedjeregeln tillampas',
            affectedTopicIds: ['derivatives'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Differentiated outer function but forgot to multiply by inner derivative' },
            ],
            feedbackEn: 'Don\'t forget the chain rule! When differentiating f(g(x)), you need f\'(g(x)) · g\'(x). The inner derivative g\'(x) is essential.',
            feedbackSv: 'Glom inte kedjeregeln! Nar du deriverar f(g(x)) behover du f\'(g(x)) · g\'(x). Den inre derivatan g\'(x) ar nodvandig.',
            severity: 'high',
        },
        {
            code: 'product_rule_omission',
            description: 'Differentiates a product by differentiating each factor separately: (fg)\' = f\'g\'',
            descriptionSv: 'Deriverar en produkt genom att derivera varje faktor separat: (fg)\' = f\'g\'',
            affectedTopicIds: ['derivatives'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Differentiated each factor separately instead of using product rule' },
            ],
            feedbackEn: 'The derivative of a product is NOT the product of the derivatives. Use the product rule: (fg)\' = f\'g + fg\'.',
            feedbackSv: 'Derivatan av en produkt ar INTE produkten av derivatorna. Anvand produktregeln: (fg)\' = f\'g + fg\'.',
            severity: 'high',
        },
        {
            code: 'integral_constant_forgotten',
            description: 'Forgets the constant of integration +C in indefinite integrals',
            descriptionSv: 'Glommer integrationskonstanten +C i obestamda integraler',
            affectedTopicIds: ['integration'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Correct antiderivative but missing +C' },
            ],
            feedbackEn: 'Don\'t forget the constant of integration! Every indefinite integral needs a +C because many functions share the same derivative.',
            feedbackSv: 'Glom inte integrationskonstanten! Varje obestamd integral behover ett +C eftersom manga funktioner har samma derivata.',
            severity: 'low',
        },

        // ── Linear Algebra Misconceptions ────────────────────────────────
        {
            code: 'matrix_multiply_elementwise',
            description: 'Multiplies matrices element-by-element instead of using row-column dot products',
            descriptionSv: 'Multiplicerar matriser elementvis istallet for att anvanda rad-kolumn-skalarprodukter',
            affectedTopicIds: ['matrix-operations'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Matrix product computed element-wise' },
            ],
            feedbackEn: 'Matrix multiplication is NOT element-by-element. Entry (i,j) of AB is the dot product of row i of A with column j of B.',
            feedbackSv: 'Matrismultiplikation ar INTE elementvis. Element (i,j) av AB ar skalarprodukten av rad i i A med kolumn j i B.',
            severity: 'high',
        },
        {
            code: 'determinant_2x2_sign',
            description: 'Gets the sign wrong in the 2x2 determinant formula: uses ad+bc instead of ad-bc',
            descriptionSv: 'Far fel tecken i 2x2-determinantformeln: anvander ad+bc istallet for ad-bc',
            affectedTopicIds: ['determinants'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Computed ad+bc instead of ad-bc for 2x2 determinant' },
            ],
            feedbackEn: 'For a 2×2 matrix [[a,b],[c,d]], the determinant is ad - bc (subtract!), not ad + bc.',
            feedbackSv: 'For en 2×2-matris [[a,b],[c,d]] ar determinanten ad - bc (subtrahera!), inte ad + bc.',
            severity: 'medium',
        },
        {
            code: 'eigenvalue_det_wrong_setup',
            description: 'Sets up det(A - λ) instead of det(A - λI) for eigenvalue computation',
            descriptionSv: 'Staller upp det(A - λ) istallet for det(A - λI) for egenvarberakning',
            affectedTopicIds: ['eigenvalues'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Subtracted lambda from every element instead of only diagonal' },
            ],
            feedbackEn: 'Remember: eigenvalues come from det(A - λI) = 0. Only subtract λ from the diagonal entries, not every element.',
            feedbackSv: 'Kom ihag: egenvarden kommer fran det(A - λI) = 0. Subtrahera bara λ fran diagonalelementen, inte varje element.',
            severity: 'medium',
        },

        // ── Trigonometry Misconceptions ───────────────────────────────────
        {
            code: 'trig_inverse_confusion',
            description: 'Confuses sin⁻¹(x) with 1/sin(x)',
            descriptionSv: 'Forvirrar sin⁻¹(x) med 1/sin(x)',
            affectedTopicIds: ['limits', 'derivatives', 'integration-techniques'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Used reciprocal instead of inverse trig function' },
            ],
            feedbackEn: 'sin⁻¹(x) means arcsin(x) (the inverse function), NOT 1/sin(x). The reciprocal 1/sin(x) is written as csc(x).',
            feedbackSv: 'sin⁻¹(x) betyder arcsin(x) (den inversa funktionen), INTE 1/sin(x). Det reciproka vardet 1/sin(x) skrivs csc(x).',
            severity: 'medium',
        },
        {
            code: 'trig_double_angle_wrong',
            description: 'Incorrectly applies double angle formula: sin(2x) = 2sin(x) or cos(2x) = 2cos(x)',
            descriptionSv: 'Tillämpar dubbelvinkelformeln felaktigt: sin(2x) = 2sin(x) eller cos(2x) = 2cos(x)',
            affectedTopicIds: ['integration-techniques', 'derivatives'],
            commonWrongPatterns: [
                { type: 'description', pattern: 'Used sin(2x) = 2sin(x) instead of 2sin(x)cos(x)' },
            ],
            feedbackEn: 'The double angle formulas are: sin(2x) = 2sin(x)cos(x) and cos(2x) = cos²(x) - sin²(x). Trig functions are NOT linear!',
            feedbackSv: 'Dubbelvinkelformlerna ar: sin(2x) = 2sin(x)cos(x) och cos(2x) = cos²(x) - sin²(x). Trigonometriska funktioner ar INTE linjara!',
            severity: 'medium',
        },
    ];

    const inserted = await db.insert(misconceptions).values(data).returning();
    console.log(`   ✓ Inserted ${inserted.length} misconceptions`);

    console.log('\n📊 Breakdown by severity:');
    const bySeverity: Record<string, number> = {};
    for (const m of inserted) {
        const sev = m.severity || 'medium';
        bySeverity[sev] = (bySeverity[sev] || 0) + 1;
    }
    for (const [severity, count] of Object.entries(bySeverity)) {
        console.log(`   • ${severity}: ${count} misconceptions`);
    }

    console.log('\n✅ Misconception catalog seeding complete!');
    process.exit(0);
}

seedMisconceptions().catch((error) => {
    console.error('❌ Misconception seeding failed:', error);
    process.exit(1);
});
