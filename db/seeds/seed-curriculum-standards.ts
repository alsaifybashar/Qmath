import { db } from '../drizzle';
import { curriculumStandards } from '../schema';

/**
 * Seed curriculum standards for Swedish gymnasium Matematik 1c–5
 * These represent the prerequisite knowledge that university courses build on.
 * Run with: npx tsx db/seeds/seed-curriculum-standards.ts
 */

async function seedCurriculumStandards() {
    console.log('📐 Seeding curriculum standards (Matematik 1c–5)...\n');

    const standards = [
        // ── Matematik 1c ──────────────────────────────────────────────────
        { code: 'gy1c_number_sense', level: 'gy_1c', title: 'Number Sense & Arithmetic', titleSv: 'Taluppfattning och aritmetik', description: 'Integers, fractions, decimals, order of operations, negative numbers', category: 'algebra' },
        { code: 'gy1c_percentages', level: 'gy_1c', title: 'Percentages & Proportions', titleSv: 'Procent och proportionalitet', description: 'Percentage calculations, ratios, proportional reasoning', category: 'algebra' },
        { code: 'gy1c_linear_expressions', level: 'gy_1c', title: 'Linear Expressions & Equations', titleSv: 'Linjara uttryck och ekvationer', description: 'Simplifying expressions, solving linear equations and inequalities', category: 'algebra' },
        { code: 'gy1c_linear_functions', level: 'gy_1c', title: 'Linear Functions & Graphs', titleSv: 'Linjara funktioner och grafer', description: 'Slope, intercept, graphing linear functions, y = kx + m', category: 'algebra' },
        { code: 'gy1c_geometry_basics', level: 'gy_1c', title: 'Geometry Fundamentals', titleSv: 'Geometriska grunder', description: 'Areas, perimeters, volumes, Pythagorean theorem', category: 'geometry' },
        { code: 'gy1c_statistics_basics', level: 'gy_1c', title: 'Descriptive Statistics', titleSv: 'Beskrivande statistik', description: 'Mean, median, mode, standard deviation, data visualization', category: 'statistics' },

        // ── Matematik 2c ──────────────────────────────────────────────────
        { code: 'gy2c_quadratic_equations', level: 'gy_2c', title: 'Quadratic Equations', titleSv: 'Andragradsekvationer', description: 'Solving quadratics by factoring, completing the square, and the quadratic formula', category: 'algebra' },
        { code: 'gy2c_quadratic_functions', level: 'gy_2c', title: 'Quadratic Functions', titleSv: 'Andragradsfunktioner', description: 'Parabolas, vertex form, graphing quadratics', category: 'algebra' },
        { code: 'gy2c_polynomial_expressions', level: 'gy_2c', title: 'Polynomial Expressions', titleSv: 'Polynomuttryck', description: 'Polynomial arithmetic, factoring, the factor theorem', category: 'algebra' },
        { code: 'gy2c_systems_of_equations', level: 'gy_2c', title: 'Systems of Equations', titleSv: 'Ekvationssystem', description: 'Solving 2x2 and 3x3 systems by substitution and elimination', category: 'algebra' },
        { code: 'gy2c_exponentials_logarithms', level: 'gy_2c', title: 'Exponential & Logarithmic Functions', titleSv: 'Exponential- och logaritmfunktioner', description: 'Exponential growth/decay, logarithm rules, solving exponential equations', category: 'algebra' },
        { code: 'gy2c_trigonometry_intro', level: 'gy_2c', title: 'Introduction to Trigonometry', titleSv: 'Introduktion till trigonometri', description: 'Sine, cosine, tangent in right triangles, unit circle basics', category: 'trigonometry' },

        // ── Matematik 3c ──────────────────────────────────────────────────
        { code: 'gy3c_polynomial_division', level: 'gy_3c', title: 'Polynomial Division', titleSv: 'Polynomdivision', description: 'Long division and synthetic division of polynomials', category: 'algebra' },
        { code: 'gy3c_rational_expressions', level: 'gy_3c', title: 'Rational Expressions', titleSv: 'Rationella uttryck', description: 'Simplifying, adding, multiplying, and dividing rational expressions', category: 'algebra' },
        { code: 'gy3c_trig_identities', level: 'gy_3c', title: 'Trigonometric Identities', titleSv: 'Trigonometriska identiteter', description: 'Pythagorean identities, addition formulas, double angle formulas', category: 'trigonometry' },
        { code: 'gy3c_trig_equations', level: 'gy_3c', title: 'Trigonometric Equations', titleSv: 'Trigonometriska ekvationer', description: 'Solving trigonometric equations, general solutions', category: 'trigonometry' },
        { code: 'gy3c_derivatives_intro', level: 'gy_3c', title: 'Introduction to Derivatives', titleSv: 'Introduktion till derivata', description: 'Derivative concept, power rule, sum rule, basic differentiation', category: 'calculus' },
        { code: 'gy3c_derivative_applications', level: 'gy_3c', title: 'Applications of Derivatives', titleSv: 'Tillämpningar av derivata', description: 'Curve sketching, optimization, tangent lines', category: 'calculus' },

        // ── Matematik 4 ──────────────────────────────────────────────────
        { code: 'gy4_complex_numbers', level: 'gy_4', title: 'Complex Numbers', titleSv: 'Komplexa tal', description: 'Complex arithmetic, polar form, de Moivre\'s theorem', category: 'algebra' },
        { code: 'gy4_integrals_intro', level: 'gy_4', title: 'Introduction to Integrals', titleSv: 'Introduktion till integraler', description: 'Antiderivatives, fundamental theorem of calculus, basic integration', category: 'calculus' },
        { code: 'gy4_differential_equations_intro', level: 'gy_4', title: 'Simple Differential Equations', titleSv: 'Enkla differentialekvationer', description: 'Separable first-order ODEs, exponential growth models', category: 'calculus' },
        { code: 'gy4_proof_techniques', level: 'gy_4', title: 'Proof Techniques', titleSv: 'Bevistekniker', description: 'Direct proof, proof by contradiction, mathematical induction', category: 'proof' },
        { code: 'gy4_combinatorics', level: 'gy_4', title: 'Combinatorics & Probability', titleSv: 'Kombinatorik och sannolikhet', description: 'Permutations, combinations, binomial theorem, probability', category: 'statistics' },

        // ── Matematik 5 ──────────────────────────────────────────────────
        { code: 'gy5_advanced_derivatives', level: 'gy_5', title: 'Advanced Differentiation', titleSv: 'Avancerad derivering', description: 'Chain rule, implicit differentiation, logarithmic differentiation', category: 'calculus' },
        { code: 'gy5_integration_techniques', level: 'gy_5', title: 'Integration Techniques', titleSv: 'Integrationstekniker', description: 'Integration by parts, partial fractions, trigonometric substitution', category: 'calculus' },
        { code: 'gy5_series_intro', level: 'gy_5', title: 'Introduction to Series', titleSv: 'Introduktion till serier', description: 'Geometric series, convergence, Taylor polynomials', category: 'calculus' },
        { code: 'gy5_vectors_3d', level: 'gy_5', title: 'Vectors in 3D', titleSv: 'Vektorer i 3D', description: 'Dot product, cross product, lines and planes in space', category: 'geometry' },

        // ── Pre-university gap topics (not in curriculum but frequently tested) ──
        { code: 'prereq_fraction_manipulation', level: 'gy_1c', title: 'Fraction Manipulation', titleSv: 'Brakrakning', description: 'Adding, subtracting, multiplying, dividing fractions fluently', category: 'algebra' },
        { code: 'prereq_negative_signs', level: 'gy_1c', title: 'Negative Sign Rules', titleSv: 'Teckenregler', description: 'Consistent handling of negative signs in expressions and equations', category: 'algebra' },
        { code: 'prereq_algebraic_manipulation', level: 'gy_2c', title: 'Algebraic Manipulation Fluency', titleSv: 'Algebraisk hantering', description: 'Expanding, factoring, simplifying algebraic expressions fluently', category: 'algebra' },
        { code: 'prereq_function_concept', level: 'gy_2c', title: 'Function Concept', titleSv: 'Funktionsbegreppet', description: 'Understanding functions as mappings, domain, range, composition', category: 'algebra' },
        { code: 'prereq_equals_sign_meaning', level: 'gy_1c', title: 'Equals Sign as Equivalence', titleSv: 'Likhetstecknet som ekvivalens', description: 'Understanding = as a statement of equality, not "the next step"', category: 'algebra' },
    ];

    const inserted = await db.insert(curriculumStandards).values(standards).returning();
    console.log(`   ✓ Inserted ${inserted.length} curriculum standards`);

    console.log('\n📊 Breakdown by level:');
    const byLevel: Record<string, number> = {};
    for (const s of inserted) {
        byLevel[s.level] = (byLevel[s.level] || 0) + 1;
    }
    for (const [level, count] of Object.entries(byLevel).sort()) {
        console.log(`   • ${level}: ${count} standards`);
    }

    console.log('\n✅ Curriculum standards seeding complete!');
    process.exit(0);
}

seedCurriculumStandards().catch((error) => {
    console.error('❌ Curriculum standards seeding failed:', error);
    process.exit(1);
});
