/**
 * Dev seed: author fading steps (question_steps) + worked examples for the
 * two limit questions so the tonande-lösningssteg flow can be exercised.
 * Idempotent — skips questions that already have steps.
 *
 * Run: npx tsx scripts/seed-question-steps.ts
 */
import { db } from '@/db/drizzle';
import { questions, questionSteps } from '@/db/schema';
import { eq, like } from 'drizzle-orm';

type StepSeed = {
    stepNumber: number;
    instruction: string;
    displayLatex?: string;
    correctAnswer: string;
    hintNudge: string;
    hintGuided?: string;
    explanation: string;
};

const SEEDS: Array<{ contentLike: string; workedExample: string; steps: StepSeed[] }> = [
    {
        contentLike: '%3x + 1%',
        workedExample: [
            'För polynomfunktioner är gränsvärdet lika med funktionsvärdet — de är kontinuerliga överallt.',
            '',
            '$$\\lim_{x \\to 2} (3x + 1) = 3 \\cdot 2 + 1 = 7$$',
        ].join('\n'),
        steps: [
            {
                stepNumber: 1,
                instruction: 'Avgör om funktionen är kontinuerlig i punkten x = 2. Svara "ja" eller "nej".',
                correctAnswer: 'ja',
                hintNudge: 'Är 3x + 1 ett polynom?',
                explanation: 'Polynom är kontinuerliga överallt, så gränsvärdet är funktionsvärdet.',
            },
            {
                stepNumber: 2,
                instruction: 'Sätt in x = 2 i uttrycket 3x. Vad blir det?',
                displayLatex: '3 \\cdot 2',
                correctAnswer: '6',
                hintNudge: 'Multiplicera 3 med 2.',
                explanation: 'Insättning ersätter variabeln med punktens värde.',
            },
            {
                stepNumber: 3,
                instruction: 'Addera konstanten. Vad är gränsvärdet?',
                displayLatex: '6 + 1',
                correctAnswer: '7',
                hintNudge: 'Lägg ihop de två termerna.',
                explanation: 'Gränsvärdet för en kontinuerlig funktion är funktionsvärdet i punkten.',
            },
        ],
    },
    {
        contentLike: '%\\sin x%',
        workedExample: [
            'Det här är standardgränsvärdet — det dyker upp överallt i analysen.',
            '',
            '$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$',
            '',
            'Det kan motiveras med instängningssatsen: $\\cos x \\le \\frac{\\sin x}{x} \\le 1$ nära 0.',
        ].join('\n'),
        steps: [
            {
                stepNumber: 1,
                instruction: 'Kan du sätta in x = 0 direkt? Vilken obestämd form får du? Svara på formen "0/0".',
                correctAnswer: '0/0',
                hintNudge: 'Vad blir täljaren och nämnaren var för sig när x → 0?',
                explanation: 'Direkt insättning ger 0/0 — en obestämd form som kräver mer analys.',
            },
            {
                stepNumber: 2,
                instruction: 'Vilken olikhet stänger in sin(x)/x nära 0? Ange vänsterledet (funktionen av x).',
                displayLatex: '? \\le \\frac{\\sin x}{x} \\le 1',
                correctAnswer: 'cos x',
                hintNudge: 'Tänk på instängningssatsen och enhetscirkeln.',
                hintGuided: 'Arean av cirkelsektorn kläms mellan två trianglar — det ger cos x ≤ sin(x)/x ≤ 1.',
                explanation: 'Instängningssatsen: om cos x ≤ sin(x)/x ≤ 1 och båda gränserna är 1, är gränsvärdet 1.',
            },
            {
                stepNumber: 3,
                instruction: 'Vad är gränsvärdet av cos x när x → 0?',
                correctAnswer: '1',
                hintNudge: 'cos är kontinuerlig — sätt in direkt.',
                explanation: 'cos(0) = 1, så båda sidor av olikheten går mot 1.',
            },
            {
                stepNumber: 4,
                instruction: 'Vad är då gränsvärdet av sin(x)/x när x → 0?',
                correctAnswer: '1',
                hintNudge: 'Båda sidorna i instängningen går mot samma värde.',
                explanation: 'Instängningssatsen ger att gränsvärdet är 1.',
            },
        ],
    },
];

async function main() {
    for (const seed of SEEDS) {
        const question = await db.select()
            .from(questions)
            .where(like(questions.contentMarkdown, seed.contentLike))
            .get();

        if (!question) {
            console.log(`skip: no question matching ${seed.contentLike}`);
            continue;
        }

        const existing = await db.select({ id: questionSteps.id })
            .from(questionSteps)
            .where(eq(questionSteps.questionId, question.id));

        if (existing.length > 0) {
            console.log(`skip: ${question.id.slice(0, 8)} already has ${existing.length} steps`);
            continue;
        }

        await db.insert(questionSteps).values(
            seed.steps.map((s) => ({
                questionId: question.id,
                stepNumber: s.stepNumber,
                instruction: s.instruction,
                displayLatex: s.displayLatex ?? null,
                correctAnswer: s.correctAnswer,
                questionType: 'algebra',
                hintNudge: s.hintNudge,
                hintGuided: s.hintGuided ?? null,
                explanation: s.explanation,
            }))
        );
        await db.update(questions)
            .set({ workedExampleMarkdown: seed.workedExample })
            .where(eq(questions.id, question.id));

        console.log(`seeded ${seed.steps.length} steps + worked example for ${question.id.slice(0, 8)}`);
    }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
