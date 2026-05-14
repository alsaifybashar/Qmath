import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

type ExtractedQuestion = {
    examDate: string;
    number: string;
    topic: string;
    question: string;
    solution: string;
    answer: string;
    difficulty: number;
    strategyTag: string;
};

const dbPath = (process.env.DATABASE_URL ?? 'file:./qmath.db').replace(/^file:/, '');
const sqlite = new Database(path.resolve(process.cwd(), dbPath));

const course = sqlite.prepare(`
    select c.id, c.code, count(t.id) as topic_count
    from courses c
    left join topics t on t.course_id = c.id
    where c.code = 'TATA41'
    group by c.id
    order by topic_count desc
    limit 1
`).get() as { id: string; code: string } | undefined;

if (!course) {
    throw new Error('Could not find course TATA41 in courses table.');
}

const topicDescriptions: Record<string, string> = {
    'Gränsvärden (Limits)': 'Gränsvärden, standardgränsvärden och asymptotiska jämförelser.',
    'Kurvskissning och Asymptoter (Curve Sketching & Asymptotes)': 'Derivata, teckentabeller, extrempunkter och asymptoter.',
    'Primitiva funktioner och Integraler (Antiderivatives & Integrals)': 'Primitiva funktioner, substitutionsmetod, partialintegration och partialbråk.',
    'Generaliserade integraler (Generalized Integrals)': 'Konvergens och beräkning av generaliserade integraler.',
    'Kontinuitet och Derivata (Continuity & Derivatives)': 'Kontinuitet, derivatans definition och derivata av invers funktion.',
    'Optimering (Optimization)': 'Optimeringsproblem med derivata och randbeteende.',
    'Riemannsummor och Trappfunktioner (Riemann Sums & Step Functions)': 'Undertrappor, Riemannsummor och integraluppskattningar.',
    'Teori och Bevis (Theory & Proofs)': 'Teoretiska satser och bevisuppgifter i envariabelanalys.',
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

const now = Math.floor(Date.now() / 1000);

function getTopicId(topic: string): string {
    const existing = sqlite.prepare(`
        select id from topics
        where course_id = ? and lower(title) = lower(?)
        limit 1
    `).get(course!.id, topic) as { id: string } | undefined;

    if (existing) return existing.id;

    const id = crypto.randomUUID();
    sqlite.prepare(`
        insert into topics (
            id, course_id, slug, title, description, source, sort_order,
            base_difficulty, created_at
        ) values (?, ?, ?, ?, ?, 'manual', ?, ?, ?)
    `).run(
        id,
        course!.id,
        `${slugify(topic)}-${id.slice(0, 8)}`,
        topic,
        topicDescriptions[topic] ?? null,
        Object.keys(topicDescriptions).indexOf(topic) + 1,
        2,
        now,
    );
    return id;
}

const questions: ExtractedQuestion[] = [
    {
        examDate: '2026-01-14',
        number: '1a',
        topic: 'Gränsvärden (Limits)',
        difficulty: 1,
        strategyTag: 'limits_rationalization',
        question: 'Undersök gränsvärdet $$\\lim_{x\\to0}\\frac{\\sqrt{1+3x}-\\sqrt{1+2x}}{x}.$$',
        solution: 'Rationalisering ger $$\\frac{\\sqrt{1+3x}-\\sqrt{1+2x}}{x}=\\frac{1}{\\sqrt{1+3x}+\\sqrt{1+2x}}\\to\\frac{1}{2}.$$',
        answer: '$\\frac{1}{2}$',
    },
    {
        examDate: '2026-01-14',
        number: '1b',
        topic: 'Gränsvärden (Limits)',
        difficulty: 1,
        strategyTag: 'limits_squeeze',
        question: 'Undersök gränsvärdet $$\\lim_{x\\to\\infty}\\frac{\\sin(x^2)}{x-\\ln x}.$$',
        solution: 'Skriv uttrycket som $$\\left(\\frac{1}{x}\\sin(x^2)\\right)\\frac{1}{1-\\frac{\\ln x}{x}}.$$ Första faktorn går mot $0$ och andra mot $1$, alltså är gränsvärdet $0$.',
        answer: '$0$',
    },
    {
        examDate: '2026-01-14',
        number: '1c',
        topic: 'Gränsvärden (Limits)',
        difficulty: 2,
        strategyTag: 'limits_standard',
        question: 'Undersök gränsvärdet $$\\lim_{x\\to1}\\frac{e^x-e}{x^3-x}.$$',
        solution: 'Sätt $t=x-1$. Då är $$\\frac{e^x-e}{x^3-x}=\\frac{e}{(t+1)(t+2)}\\frac{e^t-1}{t}\\to\\frac{e}{2}.$$',
        answer: '$\\frac{e}{2}$',
    },
    {
        examDate: '2026-01-14',
        number: '2',
        topic: 'Kurvskissning och Asymptoter (Curve Sketching & Asymptotes)',
        difficulty: 3,
        strategyTag: 'curve_sketching',
        question: 'Skissa kurvan $y=f(x)$, där $$f(x)=\\ln x-2x-3\\ln(4-x).$$ Ange lodräta och vågräta asymptoter samt eventuella extrempunkter.',
        solution: 'Definitionsmängden är $0<x<4$ och $$f\'(x)=\\frac{2(x-1)(x-2)}{x(4-x)}.$$ Teckenstudium ger lokal maxpunkt vid $x=1$ och lokal minpunkt vid $x=2$. Dessutom är $x=0$ och $x=4$ lodräta asymptoter, och vågräta asymptoter saknas.',
        answer: 'Lokal maxpunkt vid $x=1$, $f(1)=-2-3\\ln3$. Lokal minpunkt vid $x=2$, $f(2)=-4-2\\ln2$. Lodräta asymptoter: $x=0$, $x=4$.',
    },
    {
        examDate: '2026-01-14',
        number: '3a',
        topic: 'Primitiva funktioner och Integraler (Antiderivatives & Integrals)',
        difficulty: 2,
        strategyTag: 'partial_fractions',
        question: 'Beräkna $$\\int\\frac{1+x-x^2}{x(x+1)^2}\\,dx.$$',
        solution: 'Partialbråk ger $$\\frac{1+x-x^2}{x(x+1)^2}=\\frac{1}{x}-\\frac{2}{x+1}+\\frac{1}{(x+1)^2}.$$ Integrering ger svaret.',
        answer: '$\\ln|x|-2\\ln|x+1|-\\frac{1}{x+1}+C$',
    },
    {
        examDate: '2026-01-14',
        number: '3b',
        topic: 'Primitiva funktioner och Integraler (Antiderivatives & Integrals)',
        difficulty: 1,
        strategyTag: 'substitution',
        question: 'Beräkna $$\\int_1^e\\frac{\\sqrt{1+\\ln x}}{x}\\,dx.$$',
        solution: 'Med $t=\\ln x$ fås $$\\int_0^1\\sqrt{1+t}\\,dt=\\left[\\frac{2}{3}(1+t)^{3/2}\\right]_0^1=\\frac{4\\sqrt2-2}{3}.$$',
        answer: '$\\frac{4\\sqrt2-2}{3}$',
    },
    {
        examDate: '2026-01-14',
        number: '3c',
        topic: 'Primitiva funktioner och Integraler (Antiderivatives & Integrals)',
        difficulty: 2,
        strategyTag: 'integration_by_parts',
        question: 'Beräkna $$\\int\\arctan(2x)\\,dx.$$',
        solution: 'Partialintegration ger $$\\int\\arctan(2x)\\,dx=x\\arctan(2x)-\\int\\frac{2x}{1+4x^2}\\,dx.$$',
        answer: '$x\\arctan(2x)-\\frac{1}{4}\\ln(1+4x^2)+C$',
    },
    {
        examDate: '2026-01-14',
        number: '4a',
        topic: 'Generaliserade integraler (Generalized Integrals)',
        difficulty: 3,
        strategyTag: 'improper_integrals',
        question: 'Bestäm den generaliserade integralen $$\\int_0^\\infty\\frac{1}{\\sqrt{x(x+3)}}\\,dx.$$',
        solution: 'Integralen är generaliserad både vid $0$ och $\\infty$. Med $t=\\sqrt{x}$ fås $$\\int\\frac{dx}{\\sqrt{x(x+3)}}=\\int\\frac{2\\,dt}{t^2+3}=\\frac{2}{\\sqrt3}\\arctan\\frac{t}{\\sqrt3}.$$ Gränserna ger värdet.',
        answer: '$\\frac{\\pi}{\\sqrt3}$',
    },
    {
        examDate: '2026-01-14',
        number: '4b',
        topic: 'Generaliserade integraler (Generalized Integrals)',
        difficulty: 2,
        strategyTag: 'improper_integrals_divergence',
        question: 'Bestäm den generaliserade integralen $$\\int_{-1}^1\\frac{1}{x^3}\\,dx.$$',
        solution: 'Integranden har en singularitet vid $x=0$. Eftersom $$\\int_\\varepsilon^1\\frac{dx}{x^3}=\\frac{1}{2\\varepsilon^2}-\\frac{1}{2}\\to\\infty$$ divergerar integralen.',
        answer: 'Divergent.',
    },
    {
        examDate: '2026-01-14',
        number: '5a',
        topic: 'Kontinuitet och Derivata (Continuity & Derivatives)',
        difficulty: 2,
        strategyTag: 'continuity_piecewise',
        question: 'Bestäm $a$ och $b$ så att $$f(x)=\\begin{cases}b\\arctan\\frac{1}{x},&x<0,\\\\a,&x=0,\\\\\\frac{\\arcsin x}{x},&x>0\\end{cases}$$ blir kontinuerlig.',
        solution: 'Högergränsvärdet är $$\\lim_{x\\to0^+}\\frac{\\arcsin x}{x}=1,$$ så $a=1$. Vänstergränsvärdet är $-\\pi b/2$, och kontinuitet kräver $-\\pi b/2=1$.',
        answer: '$a=1$, $b=-\\frac{2}{\\pi}$',
    },
    {
        examDate: '2026-01-14',
        number: '5b',
        topic: 'Kontinuitet och Derivata (Continuity & Derivatives)',
        difficulty: 2,
        strategyTag: 'inverse_derivative',
        question: 'Låt $g(x)=xe^x$ för $x>0$. Beräkna $$(g^{-1})\'(e).$$',
        solution: 'Eftersom $g(1)=e$ och $g\'(x)=(x+1)e^x$ fås $$(g^{-1})\'(e)=\\frac{1}{g\'(1)}=\\frac{1}{2e}.$$',
        answer: '$\\frac{1}{2e}$',
    },
    {
        examDate: '2026-01-14',
        number: '6',
        topic: 'Optimering (Optimization)',
        difficulty: 4,
        strategyTag: 'optimization_geometry',
        question: 'Visa att bland alla likbenta trianglar med given omkrets $2L>0$ har den liksidiga triangeln störst area.',
        solution: 'Låt halva basen vara $x$ och de lika sidorna $L-x$. Då är höjden $h=\\sqrt{L^2-2Lx}$ och arean $$A(x)=x\\sqrt{L^2-2Lx},\\quad0<x<\\frac{L}{2}.$$ Derivatan är $$A\'(x)=\\frac{L^2-3Lx}{\\sqrt{L^2-2Lx}},$$ så maximum fås vid $x=L/3$, vilket ger en liksidig triangel.',
        answer: 'Den liksidiga triangeln ger störst area, $\\frac{L^2}{3\\sqrt3}$.',
    },
    {
        examDate: '2026-01-14',
        number: '7a',
        topic: 'Riemannsummor och Trappfunktioner (Riemann Sums & Step Functions)',
        difficulty: 2,
        strategyTag: 'lower_step_functions',
        question: 'Låt $f(x)=e^x$ på $[0,1]$. Bestäm en undertrappa $\\varphi$ till $f$ sådan att $$\\int_0^1\\varphi(x)\\,dx>\\frac{5}{4}.$$',
        solution: 'Eftersom $e^x$ är växande kan man ta $$\\varphi(x)=1$$ på $[0,1/2]$ och $$\\varphi(x)=e^{1/2}$$ på $(1/2,1]$. Då är integralen $$(1+e^{1/2})/2>5/4.$$',
        answer: '$\\varphi(x)=1$ för $0\\le x\\le\\frac{1}{2}$ och $\\varphi(x)=e^{1/2}$ för $\\frac{1}{2}<x\\le1$.',
    },
    {
        examDate: '2026-01-14',
        number: '7b',
        topic: 'Riemannsummor och Trappfunktioner (Riemann Sums & Step Functions)',
        difficulty: 3,
        strategyTag: 'riemann_sums',
        question: 'Låt $f(x)=e^x$ på $[0,1]$. Bestäm en följd $(\\varphi_n)$ av undertrappor till $f$ sådan att $$\\lim_{n\\to\\infty}\\int_0^1\\varphi_n(x)\\,dx=\\int_0^1f(x)\\,dx.$$',
        solution: 'Dela $[0,1]$ i $n$ lika intervall och sätt $\\varphi_n(0)=1$ samt $$\\varphi_n(x)=e^{(k-1)/n}$$ för $(k-1)/n<x\\le k/n$. Då är $\\varphi_n$ en undertrappa och vänstersummorna går mot $\\int_0^1e^x\\,dx=e-1$.',
        answer: '$\\varphi_n(0)=1$ och $\\varphi_n(x)=e^{(k-1)/n}$ för $\\frac{k-1}{n}<x\\le\\frac{k}{n}$.',
    },
    {
        examDate: '2024-08-27',
        number: '1a',
        topic: 'Gränsvärden (Limits)',
        difficulty: 1,
        strategyTag: 'limits_factorization',
        question: 'Undersök gränsvärdet $$\\lim_{x\\to2}\\frac{x^2+x-6}{x^2-5x+6}.$$',
        solution: 'Faktorisera: $$\\frac{x^2+x-6}{x^2-5x+6}=\\frac{(x+3)(x-2)}{(x-2)(x-3)}.$$ Efter förkortning fås värdet $\\frac{5}{-1}=-5$.',
        answer: '$-5$',
    },
    {
        examDate: '2024-08-27',
        number: '1b',
        topic: 'Gränsvärden (Limits)',
        difficulty: 2,
        strategyTag: 'limits_standard',
        question: 'Undersök gränsvärdet $$\\lim_{x\\to0}\\frac{(e^{3x}-1)^2}{x\\ln(1+x)}.$$',
        solution: 'Med standardgränsvärden fås $$\\left(\\frac{e^{3x}-1}{3x}\\right)^2\\frac{9}{\\frac{\\ln(1+x)}{x}}\\to9.$$',
        answer: '$9$',
    },
    {
        examDate: '2024-08-27',
        number: '1c',
        topic: 'Gränsvärden (Limits)',
        difficulty: 2,
        strategyTag: 'limits_logarithms',
        question: 'Undersök gränsvärdet $$\\lim_{x\\to\\infty}\\frac{\\ln(1+2^x)}{\\ln(1+3^x)}.$$',
        solution: 'Skriv $$\\ln(1+2^x)=x\\ln2+\\ln(1+2^{-x})$$ och motsvarande för nämnaren. Termerna med $2^{-x}$ och $3^{-x}$ försvinner efter division med $x$.',
        answer: '$\\frac{\\ln2}{\\ln3}$',
    },
    {
        examDate: '2024-08-27',
        number: '2',
        topic: 'Kurvskissning och Asymptoter (Curve Sketching & Asymptotes)',
        difficulty: 3,
        strategyTag: 'curve_sketching',
        question: 'Skissa grafen till $$f(x)=\\frac{3-x}{3+x}+3\\arctan x.$$ Ange alla vågräta asymptoter samt lokala extrempunkter.',
        solution: 'Funktionen är definierad för $x\\ne-3$ och $$f\'(x)=\\frac{3(x+1)(7-x)}{(x+3)^2(x^2+1)}.$$ Därför finns lokal minpunkt vid $x=-1$ och lokal maxpunkt vid $x=7$. Gränsvärdena vid $\\pm\\infty$ ger de vågräta asymptoterna.',
        answer: 'Lokal minpunkt: $x=-1$, $f(-1)=2-\\frac{3\\pi}{4}$. Lokal maxpunkt: $x=7$, $f(7)=3\\arctan7-\\frac{2}{5}$. Asymptoter: $y=\\frac{3\\pi}{2}-1$ och $y=-\\frac{3\\pi}{2}-1$.',
    },
    {
        examDate: '2024-08-27',
        number: '3a',
        topic: 'Primitiva funktioner och Integraler (Antiderivatives & Integrals)',
        difficulty: 2,
        strategyTag: 'integration_log_arctan',
        question: 'Beräkna $$\\int\\frac{2x+1}{x^2+4x+5}\\,dx.$$',
        solution: 'Skriv täljaren som $(2x+4)-3$ och nämnaren som $(x+2)^2+1$. Då fås en logaritmterm och en arctan-term.',
        answer: '$\\ln(x^2+4x+5)-3\\arctan(x+2)+C$',
    },
    {
        examDate: '2024-08-27',
        number: '3b',
        topic: 'Primitiva funktioner och Integraler (Antiderivatives & Integrals)',
        difficulty: 2,
        strategyTag: 'integration_by_parts',
        question: 'Beräkna $$\\int\\frac{x}{e^{2x}}\\,dx.$$',
        solution: 'Skriv integranden som $xe^{-2x}$. Partialintegration ger $$\\int xe^{-2x}\\,dx=-\\frac{x}{2}e^{-2x}+\\frac{1}{2}\\int e^{-2x}\\,dx.$$',
        answer: '$-\\frac{2x+1}{4}e^{-2x}+C$',
    },
    {
        examDate: '2024-08-27',
        number: '3c',
        topic: 'Primitiva funktioner och Integraler (Antiderivatives & Integrals)',
        difficulty: 1,
        strategyTag: 'trig_integrals',
        question: 'Beräkna $$\\int\\sin^3x\\,dx.$$',
        solution: 'Skriv $\\sin^3x=\\sin x(1-\cos^2x)$ och sätt $t=\\cos x$. Då blir integralen $$-\\int(1-t^2)\\,dt=\\frac{t^3}{3}-t+C.$$',
        answer: '$\\frac{1}{3}\\cos^3x-\\cos x+C$',
    },
    {
        examDate: '2024-08-27',
        number: '4',
        topic: 'Generaliserade integraler (Generalized Integrals)',
        difficulty: 3,
        strategyTag: 'improper_integrals_partial_fractions',
        question: 'Beräkna $$\\int_2^\\infty\\frac{dx}{x^4-1}.$$',
        solution: 'Partialbråksuppdelning ger $$\\frac{1}{x^4-1}=\\frac{1}{4}\\left(\\frac{1}{x-1}-\\frac{1}{x+1}-\\frac{2}{x^2+1}\\right).$$ Integrera från $2$ till $a$ och låt $a\\to\\infty$.',
        answer: '$\\frac{1}{4}(\\ln3+2\\arctan2-\\pi)$',
    },
    {
        examDate: '2024-08-27',
        number: '5',
        topic: 'Riemannsummor och Trappfunktioner (Riemann Sums & Step Functions)',
        difficulty: 3,
        strategyTag: 'integral_estimates',
        question: 'Visa att $$\\sum_{k=1}^nk^2\\le\\frac{n^3}{3}+n^2+n$$ för $n=1,2,3,\\ldots$.',
        solution: 'För $f(x)=x^2$ är funktionen växande på $[1,\\infty)$. Summan $$\\sum_{k=1}^nk^2$$ är en undersumma till $$\\int_1^{n+1}x^2\\,dx=\\frac{(n+1)^3-1}{3}=\\frac{n^3}{3}+n^2+n.$$',
        answer: '$\\sum_{k=1}^nk^2\\le\\frac{n^3}{3}+n^2+n$',
    },
    {
        examDate: '2024-08-27',
        number: '6',
        topic: 'Optimering (Optimization)',
        difficulty: 4,
        strategyTag: 'range_optimization',
        question: 'Bestäm värdemängden till $$f(x)=x^\\alpha\\ln x$$ för varje $\\alpha\\in\\mathbb{R}$.',
        solution: 'Om $\\alpha=0$ är värdemängden $\\mathbb{R}$. För $\\alpha\\ne0$ är $$f\'(x)=x^{\\alpha-1}(\\alpha\\ln x+1),$$ med kritisk punkt $x=e^{-1/\\alpha}$ och värde $-1/(\\alpha e)$. Gränsvärden vid $0^+$ och $\\infty$ avgör intervallen.',
        answer: '$V_f=\\left[-\\frac{1}{\\alpha e},\\infty\\right)$ om $\\alpha>0$, $V_f=\\mathbb{R}$ om $\\alpha=0$, och $V_f=\\left(-\\infty,-\\frac{1}{\\alpha e}\\right]$ om $\\alpha<0$.',
    },
    {
        examDate: '2024-08-27',
        number: '7a',
        topic: 'Teori och Bevis (Theory & Proofs)',
        difficulty: 4,
        strategyTag: 'proof_derivative_sign',
        question: 'Antag att $f$ är kontinuerlig på $[0,\\infty)$, två gånger deriverbar för $x>0$, $f(0)=0$, $\\lim_{x\\to0^+}f\'(x)<0$ och $f\'\'(x)\\ge c>0$. Visa att $f(x)<0$ för $x>0$ tillräckligt nära $0$.',
        solution: 'Välj $\\varepsilon=\\frac12|\\lim_{x\\to0^+}f\'(x)|$. Då finns $\\delta>0$ så att $f\'(x)<0$ för $0<x<\\delta$. Därför är $f$ avtagande nära $0$, och $f(x)<f(0)=0$ för $0<x\\le\\delta$.',
        answer: '$f(x)<0$ för $0<x\\le\\delta$ för något $\\delta>0$.',
    },
    {
        examDate: '2024-08-27',
        number: '7b',
        topic: 'Teori och Bevis (Theory & Proofs)',
        difficulty: 4,
        strategyTag: 'proof_mean_value_theorem',
        question: 'Under samma antaganden som i 7a, visa att $$f\'(x)\\to\\infty\\quad\\text{då}\\quad x\\to\\infty.$$',
        solution: 'Låt $a>0$. För $x>a$ ger medelvärdessatsen ett $\\xi\\in(a,x)$ så att $$f\'(x)-f\'(a)=f\'\'(\\xi)(x-a)\\ge c(x-a).$$ Högerledet går mot $\\infty$, alltså gör $f\'(x)$ det också.',
        answer: '$f\'(x)\\to\\infty$ då $x\\to\\infty$.',
    },
    {
        examDate: '2024-08-27',
        number: '7c',
        topic: 'Teori och Bevis (Theory & Proofs)',
        difficulty: 4,
        strategyTag: 'proof_intermediate_value',
        question: 'Under samma antaganden som i 7a, visa att $f$ har ett nollställe $x_0>0$.',
        solution: 'Från 7b finns $M$ så att $f\'(x)>1$ för $x\\ge M$. Då gäller $$f(x)=f(M)+\\int_M^xf\'(t)\\,dt\\ge f(M)+x-M\\to\\infty.$$ Från 7a är $f(\\delta)<0$, så satsen om mellanliggande värden ger ett nollställe $x_0>0$.',
        answer: 'Det finns $x_0>0$ sådant att $f(x_0)=0$.',
    },
];

const insertQuestion = sqlite.prepare(`
    insert into questions (
        id, topic_id, content_markdown, question_type, correct_answer, options,
        explanation_markdown, difficulty_tier, strategy_tag, is_published,
        status, ai_difficulty_tier, ai_analysis, ai_analyzed_at, guidance_steps,
        sub_questions, created_at
    ) values (
        ?, ?, ?, ?, ?, null, ?, ?, ?, 1,
        'published', ?, ?, ?, ?, null, ?
    )
`);

const existingQuestion = sqlite.prepare(`
    select id from questions
    where content_markdown like ?
    limit 1
`);

const tx = sqlite.transaction(() => {
    let inserted = 0;
    let skipped = 0;

    for (const item of questions) {
        const marker = `[TATA41 ${item.examDate} ${item.number}]`;
        if (existingQuestion.get(`%${marker}%`)) {
            skipped++;
            continue;
        }

        const topicId = getTopicId(item.topic);
        const content = `${marker}\n\n${item.question}`;
        const aiAnalysis = JSON.stringify({
            source: 'exam_import',
            examDate: item.examDate,
            questionNumber: item.number,
            conceptsTested: [item.topic],
            prerequisiteTopics: [],
            suggestedHints: [
                'Identifiera först vilken standardmetod som passar uppgiften.',
                'Skriv upp definitioner, standardgränsvärden eller derivator innan du förenklar.',
            ],
        });
        const guidanceSteps = JSON.stringify([
            {
                id: crypto.randomUUID(),
                order: 1,
                content: 'Identifiera uppgiftstypen och skriv upp relevant standardmetod.',
            },
            {
                id: crypto.randomUUID(),
                order: 2,
                content: 'Förenkla algebraiskt innan du sätter in gränser eller slutvärden.',
            },
        ]);

        insertQuestion.run(
            crypto.randomUUID(),
            topicId,
            content,
            'free_response',
            item.answer,
            `### Lösning\nANSWER: ${item.answer}\n${item.solution}`,
            item.difficulty,
            item.strategyTag,
            item.difficulty,
            aiAnalysis,
            now,
            guidanceSteps,
            now,
        );
        inserted++;
    }

    return { inserted, skipped };
});

const result = tx();
console.log(`Imported TATA41 extracted questions into course ${course.id}`);
console.log(`Inserted: ${result.inserted}`);
console.log(`Skipped: ${result.skipped}`);
