/**
 * Study Skills Micro-Lessons
 *
 * Brief (2-3 minute) interactive lessons on effective study strategies.
 * Surfaced during onboarding and at strategic moments.
 *
 * Research basis:
 * - A 20-minute study skills discussion improved high-anxiety students
 *   by half a letter grade
 * - Retrieval practice is the most effective study strategy (d = 0.93)
 * - Students who understand *why* spaced repetition works use it more
 */

export interface StudySkillsLesson {
    id: string;
    title: string;
    titleSv: string;
    durationMinutes: number;
    triggerContext: 'onboarding' | 'first_flashcard' | 'poor_streak' | 'overconfidence' | 'anxiety_high';
    sections: LessonSection[];
}

export interface LessonSection {
    type: 'text' | 'tip' | 'myth_fact' | 'interactive';
    titleSv?: string;
    contentSv: string;
    contentEn?: string;
    emoji?: string;
}

export const STUDY_SKILLS_LESSONS: StudySkillsLesson[] = [
    {
        id: 'retrieval_practice',
        title: 'Retrieval Practice',
        titleSv: 'Aktiv återhämtning',
        durationMinutes: 2,
        triggerContext: 'onboarding',
        sections: [
            {
                type: 'text',
                titleSv: 'Vad är aktiv återhämtning?',
                contentSv: 'Att testa dig själv på material du har läst är mycket effektivare än att läsa om det. Varje gång du försöker hämta ett svar från minnet stärks den kopplingen i hjärnan.',
                emoji: '🧠',
            },
            {
                type: 'myth_fact',
                titleSv: 'Myt vs. fakta',
                contentSv: 'MYT: "Jag lär mig bäst genom att läsa anteckningarna flera gånger."\n\nFAKTA: Forskning visar att testa sig själv (även om man svarar fel) ger 50% bättre resultat på tentor än att bara läsa.',
                emoji: '❌➡️✅',
            },
            {
                type: 'tip',
                titleSv: 'Praktiskt tips',
                contentSv: 'Efter varje föreläsning: stäng boken och försök skriva ner det viktigaste du lärt dig. Kontrollera sedan mot dina anteckningar. Det tar 5 minuter men gör enorm skillnad.',
                emoji: '💡',
            },
        ],
    },
    {
        id: 'spaced_repetition_explained',
        title: 'Spaced Repetition',
        titleSv: 'Utspridd repetition',
        durationMinutes: 2,
        triggerContext: 'first_flashcard',
        sections: [
            {
                type: 'text',
                titleSv: 'Varför sprider Qmath ut dina övningar?',
                contentSv: 'Din hjärna glömmer information exponentiellt. Men varje gång du repeterar vid rätt tidpunkt (precis innan du skulle glömma) förstärks minnet och håller längre. Detta kallas utspridd repetition.',
                emoji: '📈',
            },
            {
                type: 'myth_fact',
                titleSv: 'Myt vs. fakta',
                contentSv: 'MYT: "Jag pluggar bäst inför tentan genom att sitta hela natten."\n\nFAKTA: 30 minuter per dag i 10 dagar ger dramatiskt bättre resultat än 5 timmar natten före tentan.',
                emoji: '❌➡️✅',
            },
            {
                type: 'tip',
                titleSv: 'Så fungerar det i Qmath',
                contentSv: 'Qmath väljer automatiskt vilka frågor du behöver repetera baserat på hur bra du kan dem. Ämnen du har svårt med visas oftare, medan ämnen du kan bra sprids ut längre.',
                emoji: '🤖',
            },
        ],
    },
    {
        id: 'interleaving_benefits',
        title: 'Interleaved Practice',
        titleSv: 'Blandad övning',
        durationMinutes: 2,
        triggerContext: 'onboarding',
        sections: [
            {
                type: 'text',
                titleSv: 'Varför blandar Qmath olika typer av frågor?',
                contentSv: 'Det kan kännas lättare att öva ett ämne i taget (t.ex. bara derivator). Men forskning visar att blanda olika typer av problem ger nästan DUBBELT så bra resultat. Anledningen: du tvingas identifiera vilken metod som ska användas, inte bara tillämpa den.',
                emoji: '🔀',
            },
            {
                type: 'myth_fact',
                titleSv: 'Myt vs. fakta',
                contentSv: 'MYT: "Blandade övningar förvirrar mig."\n\nFAKTA: Det kan kännas svårare, men det är precis det som gör det effektivt. Forskning visar 77% rätt för blandade övningar vs 38% för ämnesvis övning.',
                emoji: '❌➡️✅',
            },
            {
                type: 'tip',
                titleSv: 'Under tentan',
                contentSv: 'På tentan blandas frågor från hela kursen. Blandad övning förbereder dig för precis det — att välja rätt metod utan att veta ämnet i förväg.',
                emoji: '📝',
            },
        ],
    },
    {
        id: 'managing_math_anxiety',
        title: 'Managing Math Anxiety',
        titleSv: 'Hantera matteångest',
        durationMinutes: 3,
        triggerContext: 'anxiety_high',
        sections: [
            {
                type: 'text',
                titleSv: 'Matteångest är vanligare än du tror',
                contentSv: 'Mellan 30-59% av universitetsstudenter upplever matteångest. Det är INTE ett tecken på att du inte kan matte — det är en normal reaktion som kan hanteras.',
                emoji: '💚',
            },
            {
                type: 'tip',
                titleSv: 'Medveten andning',
                contentSv: 'Innan du börjar ett matteproblem: ta tre djupa andetag. Andas in i 4 sekunder, håll i 4, andas ut i 6. Detta aktiverar parasympatiska nervsystemet och minskar ångestresponsen.',
                emoji: '🫁',
            },
            {
                type: 'myth_fact',
                titleSv: 'Omformulering',
                contentSv: 'ISTÄLLET FÖR: "Jag kan inte matte."\n\nPRÖVA: "Jag håller på att lära mig matte, och det tar tid. Det är okej att göra fel — det är så man lär sig."',
                emoji: '🔄',
            },
            {
                type: 'tip',
                titleSv: 'Börja litet',
                contentSv: 'Qmath anpassar automatiskt svårighetsgraden. Om du känner dig stressad, börja med de lättare frågorna för att bygga upp självförtroendet innan du tar dig an svårare problem.',
                emoji: '🌱',
            },
        ],
    },
    {
        id: 'overconfidence_awareness',
        title: 'Calibrating Your Confidence',
        titleSv: 'Kalibrera ditt självförtroende',
        durationMinutes: 2,
        triggerContext: 'overconfidence',
        sections: [
            {
                type: 'text',
                titleSv: 'Illusionen av kunskap',
                contentSv: 'Forskning visar att studenter konsekvent överskattar sina kunskaper. Att läsa lösningar och tänka "det fattar jag" ≠ att kunna lösa problemet själv. Skillnaden kallas "illusionen av kunskap".',
                emoji: '🪞',
            },
            {
                type: 'tip',
                titleSv: 'Testa dig själv',
                contentSv: 'Det bästa sättet att veta om du verkligen kan något: försök lösa det utan att titta på lösningen. Om du fastnar har du hittat en kunskapslucka att fylla!',
                emoji: '💡',
            },
            {
                type: 'tip',
                titleSv: 'Förutsäg ditt resultat',
                contentSv: 'Innan varje övning frågar Qmath hur många du tror du klarar. Jämför sen med ditt faktiska resultat. Med tiden blir din självbedömning mer precis, och du vet bättre var du behöver öva.',
                emoji: '🎯',
            },
        ],
    },
];

/**
 * Get the lesson that should be shown given a trigger context.
 */
export function getLessonForContext(
    context: StudySkillsLesson['triggerContext']
): StudySkillsLesson | null {
    return STUDY_SKILLS_LESSONS.find(l => l.triggerContext === context) || null;
}

/**
 * Get the onboarding lessons (shown during first-time setup).
 */
export function getOnboardingLessons(): StudySkillsLesson[] {
    return STUDY_SKILLS_LESSONS.filter(l => l.triggerContext === 'onboarding');
}
