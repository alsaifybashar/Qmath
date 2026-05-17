/**
 * Evidence-based study techniques.
 *
 * Each technique has a short rationale ("why it works") drawn from the
 * cognitive-psychology literature so the recommendation feels grounded
 * rather than handwaved.
 *
 * References (high-level):
 *  - Roediger & Karpicke (2006) — retrieval practice
 *  - Cepeda et al. (2008) — spacing effect
 *  - Rohrer & Taylor (2007) — interleaving
 *  - Chi et al. (1989) — self-explanation
 *  - Cirillo (1980s) — Pomodoro
 *  - Nelson & Narens (1990) — metacognition / predict-then-check
 */

import type { BehavioralSignal, SignalId } from './signals';

export type TechniqueId =
    | 'pomodoro'
    | 'micropaus'
    | 'aktiv_aterhamtning'
    | 'predict_then_check'
    | 'sjalvforklaring'
    | 'mjukstart'
    | 'interleaving'
    | 'lock_in';

export interface StudyTechnique {
    id: TechniqueId;
    name: string;
    /** One-line elevator pitch (Swedish). */
    oneliner: string;
    /** Concrete 2–4 step instructions (Swedish). */
    steps: string[];
    /** Plain-language explanation of *why* it works (Swedish, ≤2 sentences). */
    whyItWorks: string;
    /** Typical duration in minutes for one application. */
    durationMin: number;
    /** lucide-react icon name to render. */
    icon: 'timer' | 'pause' | 'brain' | 'lightbulb' | 'message-circle-question' | 'flame' | 'shuffle' | 'lock';
}

export const TECHNIQUES: Record<TechniqueId, StudyTechnique> = {
    pomodoro: {
        id: 'pomodoro',
        name: 'Pomodoro',
        oneliner: 'Strukturera tiden i fokus-block med inbyggda pauser.',
        steps: [
            'Ställ in en timer på 25 minuter.',
            'Plugga utan att byta uppgift förrän timern går.',
            'Ta 5 minuters paus — res dig, drick vatten.',
            'Efter 4 block: ta en längre paus (15–20 min).',
        ],
        whyItWorks:
            'Korta block håller den kognitiva belastningen under taket. Pauserna ger arbetsminnet utrymme att konsolidera.',
        durationMin: 25,
        icon: 'timer',
    },
    micropaus: {
        id: 'micropaus',
        name: 'Mikropaus',
        oneliner: 'Två minuters reset när hjärnan börjar slira.',
        steps: [
            'Stäng ögonen i 30 sekunder.',
            'Andas djupt — 4 sekunder in, 6 sekunder ut, tre gånger.',
            'Sträck på halsen och axlarna.',
            'Ta en klunk vatten och återgå.',
        ],
        whyItWorks:
            'Snabb återhämtning för uppmärksamhetsnätverket. Räcker ofta för att återställa precisionen i nästa uppgift.',
        durationMin: 2,
        icon: 'pause',
    },
    aktiv_aterhamtning: {
        id: 'aktiv_aterhamtning',
        name: 'Aktiv återkallning',
        oneliner: 'Återskapa kunskapen ur minnet i stället för att läsa om.',
        steps: [
            'Stäng anteckningarna.',
            'Skriv ner allt du minns om begreppet på två minuter.',
            'Öppna boken och färgmarkera det du missade.',
            'Gör en kort uppgift på just det du missade.',
        ],
        whyItWorks:
            'Att hämta kunskap aktivt stärker minnesspåret kraftigt mer än passiv repetition (testningseffekten).',
        durationMin: 10,
        icon: 'brain',
    },
    predict_then_check: {
        id: 'predict_then_check',
        name: 'Förutsäg-och-kontrollera',
        oneliner: 'Gissa svaret innan du räknar — sedan jämför du.',
        steps: [
            'Läs uppgiften och stanna upp.',
            'Säg högt eller skriv din gissning + varför.',
            'Lös sedan uppgiften steg för steg.',
            'Jämför resultatet med gissningen — vad lärde du dig?',
        ],
        whyItWorks:
            'Tränar metakognitiv kalibrering. Du blir snabbare på att veta när du *vet* och när du gissar.',
        durationMin: 6,
        icon: 'message-circle-question',
    },
    sjalvforklaring: {
        id: 'sjalvforklaring',
        name: 'Självförklaring',
        oneliner: 'Förklara varje steg som om du lärde någon annan.',
        steps: [
            'Välj en uppgift du har löst.',
            'Förklara varje rad högt: vad gör jag, och varför fungerar det?',
            'Markera de rader där förklaringen fastnar — där är luckan.',
            'Titta upp den luckan i teorin.',
        ],
        whyItWorks:
            'Att verbalisera tvingar fram en djupare struktur än att bara följa receptet. Luckorna syns omedelbart.',
        durationMin: 8,
        icon: 'lightbulb',
    },
    mjukstart: {
        id: 'mjukstart',
        name: 'Mjukstart (5-min)',
        oneliner: 'Värm upp med något lätt i ett område du undviker.',
        steps: [
            'Välj det ämne som känns tyngst.',
            'Sätt en timer på 5 minuter.',
            'Lös enbart introduktionsuppgifter — ingen press att klara svåra.',
            'Stäng av när timern går — du behåller känslan av kontroll.',
        ],
        whyItWorks:
            'Premacks princip: kort kontakt sänker tröskeln för nästa gång. Undvikande bryts av små vinster.',
        durationMin: 5,
        icon: 'flame',
    },
    interleaving: {
        id: 'interleaving',
        name: 'Interleaving',
        oneliner: 'Blanda flera ämnen i samma pass i stället för att blocka.',
        steps: [
            'Välj 3 ämnen du jobbar med.',
            'Lös 2–3 uppgifter från ämne 1, byt till ämne 2, sedan ämne 3.',
            'Repetera rotationen i 25–40 minuter.',
        ],
        whyItWorks:
            'Att tvingas växla mellan typer av problem tränar diskrimineringen — du blir bättre på att välja rätt metod.',
        durationMin: 30,
        icon: 'shuffle',
    },
    lock_in: {
        id: 'lock_in',
        name: 'Lås in flow',
        oneliner: 'Återskapa villkoren som gav dig flow förra gången.',
        steps: [
            'Notera vad du gjorde precis innan flow tände: tid på dygnet, miljö, första uppgiften.',
            'Schemalägg samma upplägg imorgon.',
            'Stäng av notifikationer och avbrott i 45 minuter.',
        ],
        whyItWorks:
            'Flow är delvis ett vanemönster. Genom att kopiera kontexten ökar sannolikheten att tillståndet återkommer.',
        durationMin: 45,
        icon: 'lock',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Signal → technique mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each signal maps to a small ordered list of techniques. The first is the
 * primary recommendation; the rest are alternatives the panel can reveal.
 */
const SIGNAL_TECHNIQUES: Record<SignalId, TechniqueId[]> = {
    cognitive_load: ['pomodoro', 'micropaus'],
    flow_state: ['lock_in', 'pomodoro'],
    avoidance: ['mjukstart', 'predict_then_check'],
    effort_outcome: ['aktiv_aterhamtning', 'sjalvforklaring', 'interleaving'],
};

export function techniquesForSignal(signal: BehavioralSignal): StudyTechnique[] {
    return SIGNAL_TECHNIQUES[signal.id].map(id => TECHNIQUES[id]);
}

export function primaryTechniqueForSignal(signal: BehavioralSignal): StudyTechnique {
    return TECHNIQUES[SIGNAL_TECHNIQUES[signal.id][0]];
}
