'use client';

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MathInputWithToolbar } from '@/components/study/MathInputWithToolbar';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Eye,
  Flame,
  GraduationCap,
  Grid2X2,
  Lightbulb,
  ListChecks,
  Moon,
  PenTool,
  RotateCcw,
  Sigma,
  Sparkles,
  Sun,
  Target,
  ToggleLeft,
  XCircle,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { AIPanel } from '@/components/ai/AIPanel';

const InlineMath = dynamic(
  () => import('react-katex').then((m) => m.InlineMath),
  { ssr: false }
);
const BlockMath = dynamic(
  () => import('react-katex').then((m) => m.BlockMath),
  { ssr: false }
);

// ── Types ─────────────────────────────────────────────────────────────────────

type AnswerMode = 'multiple_choice' | 'free_text' | 'toggle' | 'guided_steps';
type FeedbackState = 'idle' | 'correct' | 'wrong';

type HintItem = {
  label: string;
  text: string;
  tone: 'amber' | 'blue' | 'violet';
  icon: ElementType;
  math?: string;
};

type SolutionStep = {
  title: string;
  explanation: string;
  math?: string;
};

type GuidedCheckpoint = {
  id: string;
  prompt: string;
  expected: string;
  hint: string;
};

type FigureSpec =
  | { kind: 'curve'; title: string; note: string }
  | { kind: 'matrix'; title: string; note: string };

type DemoQuestion = {
  id: string;
  course: string;
  area: string;
  shortLabel: string;
  title: string;
  intro: string;
  prompt: string[];
  mathBlocks: string[];
  answerModes: AnswerMode[];
  multipleChoice?: Array<{ id: string; label: string; isCorrect: boolean }>;
  toggleStatement?: string;
  toggleCorrect?: boolean;
  acceptedAnswers?: string[];
  guidedSteps?: GuidedCheckpoint[];
  hints: HintItem[];
  misconceptionLabel: string;
  misconceptionText: string;
  conceptChecklist: string[];
  solution: SolutionStep[];
  figure?: FigureSpec;
  points: number;
  difficulty: number;
  estimatedMinutes: number;
  topicTag: string;
};

// ── Demo data ─────────────────────────────────────────────────────────────────

const QUESTIONS: DemoQuestion[] = [
  {
    id: 'demo-sketch',
    course: 'Matematik I',
    area: 'Envariabelanalys',
    shortLabel: 'Grafskiss',
    title: 'Skissa grafen och identifiera viktiga egenskaper',
    intro:
      'Skissa grafen till funktionen nedan. Ange alla lodräta och vågräta asymptoter samt bestäm eventuella lokala extrempunkter till $f$. Motivera med derivata, teckenstudium och domänanalys.',
    prompt: [
      'Skissa grafen till funktionen nedan.',
      'Ange alla lodräta och vågräta asymptoter samt bestäm eventuella lokala extrempunkter till $f$. Motivera med derivata, teckenstudium och domänanalys.',
    ],
    mathBlocks: ['f(x)=3\\sqrt{x}+\\frac{\\sqrt{x}}{x-1}'],
    answerModes: ['free_text', 'multiple_choice', 'guided_steps'],
    multipleChoice: [
      { id: 'A', label: 'Funktionen har en lodrät asymptot vid $x=1$', isCorrect: true },
      { id: 'B', label: 'Funktionen har en vågrät asymptot vid $y=0$', isCorrect: false },
      { id: 'C', label: 'Funktionen är definierad för alla $x \\in \\mathbb{R}$', isCorrect: false },
      { id: 'D', label: 'Funktionen saknar singulariteter', isCorrect: false },
    ],
    acceptedAnswers: ['x=1', 'lodrät asymptot x=1', 'asymptot x=1'],
    guidedSteps: [
      {
        id: 'domain',
        prompt: 'Vilka villkor måste gälla för att $\\sqrt{x}$ och nämnaren ska vara definierade?',
        expected: 'x>=0, x!=1',
        hint: 'Tänk separat på roten och på bråket.',
      },
      {
        id: 'asymptote',
        prompt: 'Vilket värde på $x$ gör att bråktermen kan bli obegränsad?',
        expected: 'x=1',
        hint: 'Leta där nämnaren blir noll medan täljaren inte blir noll.',
      },
    ],
    hints: [
      {
        label: 'Domän',
        text: 'Börja med att fråga dig var uttrycket över huvud taget är definierat. Roten och nämnaren ger två olika villkor.',
        tone: 'amber',
        icon: Lightbulb,
      },
      {
        label: 'Asymptot',
        text: 'En lodrät asymptot uppstår när en term går mot $\\pm\\infty$ nära ett förbjudet $x$-värde.',
        tone: 'blue',
        icon: BookOpen,
        math: '\\lim_{x\\to a} f(x)=\\pm\\infty \\Rightarrow x=a \\text{ är lodrät asymptot}',
      },
      {
        label: 'Extrema',
        text: 'När domänen är klar kan du derivera och undersöka tecknet på $f\'(x)$ på varje delintervall.',
        tone: 'violet',
        icon: Sparkles,
      },
    ],
    misconceptionLabel: 'Domänfel',
    misconceptionText:
      'Det vanligaste felet här är att behandla uttrycket som om det vore definierat för alla reella tal. Då missar man både roten och singulariteten vid $x=1$.',
    conceptChecklist: [
      'Läsa av domän direkt från uttrycket',
      'Koppla nämnare $=0$ till lodrät asymptot',
      'Använda derivata först efter att domänen är klar',
    ],
    solution: [
      {
        title: 'Bestäm domänen',
        explanation: 'Eftersom $\\sqrt{x}$ kräver $x\\ge 0$ och nämnaren kräver $x\\ne 1$ får vi två relevanta intervall.',
        math: 'D_f=[0,1)\\cup(1,\\infty)',
      },
      {
        title: 'Identifiera asymptoten',
        explanation: 'Bråktermen blir obegränsad nära $x=1$, så där får funktionen en lodrät asymptot.',
        math: 'x=1',
      },
      {
        title: 'Studera derivatan',
        explanation: 'Derivera varje term och använd tecknet på derivatan för att hitta extrempunkter.',
      },
    ],
    figure: { kind: 'curve', title: 'Grafyta', note: 'Orientering — inte facit.' },
    points: 6,
    difficulty: 4,
    estimatedMinutes: 9,
    topicTag: 'Grafanalys',
  },
  {
    id: 'demo-limit',
    course: 'Matematik I',
    area: 'Envariabelanalys',
    shortLabel: 'Gränsvärde',
    title: 'Undersök gränsvärdet och välj metod',
    intro:
      'Undersök gränsvärdet nedan. Ange det exakta värdet och motivera kort varför metoden fungerar.',
    prompt: [
      'Undersök gränsvärdet nedan.',
      'Ange det exakta värdet och motivera kort varför metoden fungerar.',
    ],
    mathBlocks: ['\\lim_{x \\to 1} \\frac{x^3+x^2+x-3}{x^2-1}'],
    answerModes: ['multiple_choice', 'free_text', 'toggle'],
    multipleChoice: [
      { id: 'A', label: '3', isCorrect: true },
      { id: 'B', label: '\\frac{3}{2}', isCorrect: false },
      { id: 'C', label: '1', isCorrect: false },
      { id: 'D', label: '\\infty', isCorrect: false },
    ],
    toggleStatement: 'Uttrycket ger formen $\\frac{0}{0}$ när $x=1$.',
    toggleCorrect: true,
    acceptedAnswers: ['3'],
    hints: [
      {
        label: 'Första test',
        text: 'Sätt in $x=1$ direkt innan du väljer metod. Det säger om du har ett vanligt gränsvärde eller en obestämd form.',
        tone: 'amber',
        icon: Lightbulb,
      },
      {
        label: 'Metodval',
        text: 'Om du får $\\frac{0}{0}$ kan du antingen faktorisera eller använda L\'Hôpital.',
        tone: 'blue',
        icon: BookOpen,
        math: '\\lim_{x\\to a}\\frac{f(x)}{g(x)}=\\lim_{x\\to a}\\frac{f\'(x)}{g\'(x)}',
      },
      {
        label: 'Kontroll',
        text: 'Efter derivering ska du fortfarande kontrollera att du räknar täljaren korrekt. Ett vanligt fel är att tappa en term.',
        tone: 'violet',
        icon: Sparkles,
      },
    ],
    misconceptionLabel: 'Beräkningsfel',
    misconceptionText:
      'Rätt metod men fel i täljaren efter derivering. Kontrollera varje term separat.',
    conceptChecklist: [
      'Testa insättning innan du väljer regel',
      'Känna igen obestämd form $\\frac{0}{0}$',
      'Kontrollera varje term vid derivering',
    ],
    solution: [
      {
        title: 'Kontrollera formen',
        explanation: 'Direkt insättning ger $\\frac{0}{0}$, alltså en obestämd form.',
        math: '\\frac{1^3+1^2+1-3}{1^2-1}=\\frac{0}{0}',
      },
      {
        title: 'Använd L\'Hôpital',
        explanation: 'Derivera täljare och nämnare separat och beräkna sedan gränsvärdet.',
        math: '\\lim_{x\\to 1}\\frac{3x^2+2x+1}{2x}',
      },
      {
        title: 'Sätt in igen',
        explanation: 'Nu finns ingen obestämd form kvar och värdet kan läsas av direkt.',
        math: '\\frac{3+2+1}{2}=3',
      },
    ],
    points: 5,
    difficulty: 3,
    estimatedMinutes: 4,
    topicTag: 'Gränsvärden',
  },
  {
    id: 'demo-ls',
    course: 'Linjär algebra',
    area: 'Linjär algebra',
    shortLabel: 'Minstakvadrat',
    title: 'Bestäm alla minstakvadratlösningar',
    intro:
      'Ange alla minstakvadratlösningar till ekvationssystemet nedan. Förklara vilken geometrisk idé som används när systemet är överbestämt.',
    prompt: [
      'Ange alla minstakvadratlösningar till ekvationssystemet nedan.',
      'Förklara gärna vilken geometrisk idé som används när systemet är överbestämt.',
    ],
    mathBlocks: [
      '\\begin{cases}2x-3y=8\\\\2x-y=6\\\\-x+y=-8\\end{cases}',
      'A\\mathbf{u}\\approx \\mathbf{b}',
    ],
    answerModes: ['guided_steps', 'free_text', 'toggle'],
    toggleStatement: 'Minstakvadratlösningar fås genom normalekvationerna $A^TA\\mathbf{u}=A^T\\mathbf{b}$.',
    toggleCorrect: true,
    acceptedAnswers: ['normalekvationer', 'atau=atb', 'a^ta u = a^tb'],
    guidedSteps: [
      {
        id: 'matrix',
        prompt: 'Vilken matris består av koefficienterna framför $x$ och $y$?',
        expected: '[[2,-3],[2,-1],[-1,1]]',
        hint: 'Skriv en rad per ekvation och en kolumn per variabel.',
      },
      {
        id: 'method',
        prompt: 'Vilken standardmetod använder du för ett överbestämt system?',
        expected: 'normalekvationer',
        hint: 'Tänk projektion på kolonnrummet.',
      },
    ],
    hints: [
      {
        label: 'Skriv matrisform',
        text: 'Omskriv först systemet till $A\\mathbf{u}=\\mathbf{b}$. Då blir metoden tydligare.',
        tone: 'amber',
        icon: Lightbulb,
      },
      {
        label: 'Normalekvationer',
        text: 'Minstakvadratlösningen uppfyller att residualen är ortogonal mot kolonnrummet.',
        tone: 'blue',
        icon: BookOpen,
        math: 'A^TA\\mathbf{u}=A^T\\mathbf{b}',
      },
      {
        label: 'Tolkning',
        text: 'Geometriskt projicerar du $\\mathbf{b}$ på kolonnrummet till $A$ innan du läser av lösningen.',
        tone: 'violet',
        icon: Sparkles,
      },
    ],
    misconceptionLabel: 'Metodfel',
    misconceptionText:
      'Försök inte lösa systemet exakt — det är överbestämt. Normalekvationerna är rätt väg.',
    conceptChecklist: [
      'Bygga koefficientmatris korrekt',
      'Skilja exakt lösning från minstakvadratlösning',
      'Koppla normalekvationer till projektion',
    ],
    solution: [
      {
        title: 'Skriv systemet i matrisform',
        explanation: 'Samla koefficienterna i en matris $A$ och högerledet i en vektor $\\mathbf{b}$.',
      },
      {
        title: 'Ställ upp normalekvationerna',
        explanation: 'För ett överbestämt system söker vi den vektor som minimerar residualens norm.',
        math: 'A^TA\\mathbf{u}=A^T\\mathbf{b}',
      },
      {
        title: 'Lös och tolka',
        explanation: 'Resultatet är projektionen av $\\mathbf{b}$ på kolonnrummet till $A$.',
      },
    ],
    figure: { kind: 'matrix', title: 'Matrisöversikt', note: 'Rader, kolumner och högerled.' },
    points: 7,
    difficulty: 4,
    estimatedMinutes: 10,
    topicTag: 'Minstakvadrat',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQuestionContent(q: DemoQuestion): string {
  const lines = [q.title, '', ...q.prompt, '', ...q.mathBlocks.map((m) => `$$${m}$$`)];
  if (q.multipleChoice?.length) {
    lines.push('', 'Svarsalternativ:');
    for (const o of q.multipleChoice) lines.push(`${o.id}: $${o.label}$`);
  }
  return lines.join('\n');
}

function RichText({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/(\$[^$]+\$)/g).filter(Boolean);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith('$') && part.endsWith('$') ? (
          <InlineMath key={i} math={part.slice(1, -1)} />
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function difficultyLabel(n: number) {
  if (n <= 2) return 'Grund';
  if (n === 3) return 'Medel';
  if (n === 4) return 'Avancerad';
  return 'Hög';
}

// ── Figure ────────────────────────────────────────────────────────────────────

function QuestionFigure({ figure }: { figure: FigureSpec }) {
  if (figure.kind === 'curve') {
    return (
      <div className="rounded-2xl border border-primary-100 bg-white/90 p-4 shadow-sm dark:border-primary-500/15 dark:bg-zinc-900/60">
        <p className="mb-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{figure.title}</p>
        <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">{figure.note}</p>
        <svg viewBox="0 0 360 200" className="h-44 w-full overflow-visible rounded-xl">
          <defs>
            <linearGradient id="figBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.06)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0.04)" />
            </linearGradient>
          </defs>
          <rect width="360" height="200" rx="12" fill="url(#figBg)" />
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`v${i}`} x1={40 + i * 35} y1="10" x2={40 + i * 35} y2="190"
              stroke="rgba(148,163,184,0.15)" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1="20" y1={25 + i * 37} x2="340" y2={25 + i * 37}
              stroke="rgba(148,163,184,0.15)" />
          ))}
          <line x1="20" y1="168" x2="340" y2="168" stroke="rgba(51,65,85,0.4)" strokeWidth="1.5" />
          <line x1="106" y1="10" x2="106" y2="190" stroke="rgba(239,68,68,0.55)"
            strokeDasharray="5 5" strokeWidth="1.5" />
          <path
            d="M28 164 C52 158, 64 122, 80 78 C92 48, 98 35, 102 27 M110 190 C130 148, 143 108, 170 86 C200 60, 240 67, 332 88"
            fill="none" stroke="rgb(59,130,246)" strokeWidth="3" strokeLinecap="round"
          />
          <circle cx="84" cy="72" r="5" fill="rgb(59,130,246)" />
          <circle cx="202" cy="64" r="5" fill="rgb(139,92,246)" />
          <text x="114" y="24" fontSize="11" fill="rgb(239,68,68)">x = 1</text>
          <text x="208" y="54" fontSize="11" fill="rgb(139,92,246)">min</text>
        </svg>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary-100 bg-white/90 p-4 shadow-sm dark:border-primary-500/15 dark:bg-zinc-900/60">
      <p className="mb-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{figure.title}</p>
      <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">{figure.note}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/50">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Koefficientmatris</p>
          <div className="space-y-1.5 font-mono text-sm text-zinc-700 dark:text-zinc-200">
            {['[  2  -3 ]', '[  2  -1 ]', '[ -1   1 ]'].map((row) => (
              <div key={row} className="rounded-lg bg-white px-3 py-1.5 dark:bg-zinc-900">{row}</div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/50">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Geometrisk idé</p>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <p><RichText text="1. Bygg kolonnrummet från $A$." /></p>
            <p><RichText text="2. Projicera $\\mathbf{b}$ på det rummet." /></p>
            <p><RichText text="3. Läs av $\\mathbf{u}$ ur normalekvationerna." /></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Answer panels ─────────────────────────────────────────────────────────────

function MultipleChoicePanel({ question, feedback, onAnswer }: {
  question: DemoQuestion; feedback: FeedbackState; onAnswer: (c: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = question.multipleChoice ?? [];

  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        const isSubmitted = feedback !== 'idle';

        const base = 'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200';
        const stateClass = isSubmitted
          ? isSelected
            ? opt.isCorrect
              ? 'border-emerald-400 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-500/10'
              : 'border-rose-400 bg-rose-50/80 dark:border-rose-500/40 dark:bg-rose-500/10'
            : opt.isCorrect
            ? 'border-emerald-300/60 bg-emerald-50/40 dark:border-emerald-500/25 dark:bg-emerald-500/5'
            : 'border-zinc-200 bg-white/60 opacity-40 dark:border-zinc-700 dark:bg-zinc-900/40'
          : isSelected
          ? 'border-primary-400 bg-primary-50 dark:border-primary-500/60 dark:bg-primary-500/10'
          : 'border-zinc-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-primary-500/40';

        return (
          <motion.button
            key={opt.id}
            disabled={isSubmitted}
            onClick={() => { setSelected(opt.id); onAnswer(opt.isCorrect); }}
            className={`${base} ${stateClass}`}
            whileHover={!isSubmitted ? { scale: 1.005 } : {}}
            whileTap={!isSubmitted ? { scale: 0.995 } : {}}
            animate={isSelected && !opt.isCorrect && feedback === 'wrong'
              ? { x: [-5, 5, -4, 4, 0] } : {}}
          >
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              isSelected && !isSubmitted
                ? 'bg-primary-500 text-white'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
            }`}>
              {opt.id}
            </div>
            <div className="flex-1 text-sm text-zinc-800 dark:text-zinc-100">
              <RichText text={opt.label} />
            </div>
            {isSubmitted && isSelected && (
              opt.isCorrect
                ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                : <XCircle className="h-5 w-5 flex-shrink-0 text-rose-500" />
            )}
            {isSubmitted && !isSelected && opt.isCorrect && (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400/60" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function FreeTextPanel({ question, feedback, onAnswer }: {
  question: DemoQuestion; feedback: FeedbackState; onAnswer: (c: boolean) => void;
}) {
  const [textValue, setTextValue] = useState('');
  const [mathValue, setMathValue] = useState('');
  const submitted = feedback !== 'idle';

  // Combined answer: text + any math expression built via toolbar
  const combinedAnswer = [textValue, mathValue].filter(Boolean).join(' ').trim();

  return (
    <div className="space-y-4">
      {/* ── Prose / text answer ── */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Förklaring / svar
        </label>
        <div className={`rounded-xl border transition-colors ${
          submitted
            ? feedback === 'correct'
              ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10'
              : 'border-rose-400 bg-rose-50/60 dark:border-rose-500/40 dark:bg-rose-500/10'
            : 'border-zinc-200 bg-white focus-within:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900/50 dark:focus-within:border-primary-500/60'
        }`}>
          <textarea
            rows={3}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            disabled={submitted}
            placeholder="Skriv din lösningsidé, metod eller slutsvar här…"
            className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-7 text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* ── MathLive expression builder ── */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Matematiskt uttryck
        </label>
        <MathInputWithToolbar
          value={submitted ? mathValue : mathValue}
          onChange={setMathValue}
          disabled={submitted}
          placeholder="Klicka på ett verktyg nedan för att bygga ditt uttryck…"
        />
      </div>

      {/* ── Submit row ── */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <button
          disabled={!combinedAnswer || submitted}
          onClick={() => {
            const ans = combinedAnswer.toLowerCase().replace(/\s+/g, '');
            const correct = (question.acceptedAnswers ?? []).some((c) =>
              ans.includes(c.toLowerCase().replace(/\s+/g, ''))
            );
            onAnswer(correct);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Kontrollera
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TogglePanel({ question, feedback, onAnswer }: {
  question: DemoQuestion; feedback: FeedbackState; onAnswer: (c: boolean) => void;
}) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const submitted = feedback !== 'idle';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Påstående</p>
        <RichText text={question.toggleStatement ?? ''} className="text-sm text-zinc-800 dark:text-zinc-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[{ val: true, label: 'Sant', symbol: '✓' }, { val: false, label: 'Falskt', symbol: '✗' }].map((item) => {
          const isSelected = selected === item.val;
          const isCorrect = question.toggleCorrect === item.val;

          const cls = submitted
            ? isSelected
              ? isCorrect
                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                : 'border-rose-400 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10'
              : 'border-zinc-200 bg-white/50 opacity-40 dark:border-zinc-700 dark:bg-zinc-900/30'
            : isSelected
            ? 'border-primary-400 bg-primary-50 dark:border-primary-500/50 dark:bg-primary-500/10'
            : 'border-zinc-200 bg-white hover:border-primary-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-primary-500/40';

          return (
            <motion.button
              key={String(item.val)}
              disabled={submitted}
              onClick={() => { setSelected(item.val); onAnswer(isCorrect); }}
              className={`flex flex-col items-center gap-2 rounded-xl border p-5 transition-all ${cls}`}
              whileHover={!submitted ? { scale: 1.02 } : {}}
              whileTap={!submitted ? { scale: 0.97 } : {}}
            >
              <span className={`text-2xl font-light ${isSelected && !submitted ? 'text-primary-500' : 'text-zinc-400'}`}>
                {item.symbol}
              </span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{item.label}</span>
              {submitted && isSelected && (
                isCorrect
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : <XCircle className="h-4 w-4 text-rose-500" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function GuidedStepsPanel({ question, feedback, onAnswer }: {
  question: DemoQuestion; feedback: FeedbackState; onAnswer: (c: boolean) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const checkpoints = question.guidedSteps ?? [];

  return (
    <div className="space-y-3">
      {checkpoints.map((cp, i) => (
        <div key={cp.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
              {i + 1}
            </div>
            <RichText text={cp.prompt} className="text-sm font-medium text-zinc-800 dark:text-zinc-100" />
          </div>
          <input
            value={values[cp.id] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [cp.id]: e.target.value }))}
            disabled={feedback !== 'idle'}
            placeholder={cp.hint}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100 dark:focus:border-primary-500/60"
          />
        </div>
      ))}
      <button
        disabled={feedback !== 'idle' || checkpoints.length === 0}
        onClick={() => {
          const ok = checkpoints.every((cp) => {
            const a = (values[cp.id] ?? '').toLowerCase().replace(/\s+/g, '');
            return a.includes(cp.expected.toLowerCase().replace(/\s+/g, ''));
          });
          onAnswer(ok);
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Validera delsteg
        <CheckCircle2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Feedback ──────────────────────────────────────────────────────────────────

function FeedbackCard({ feedback, question, onRetry, onShowSolution }: {
  feedback: FeedbackState; question: DemoQuestion; onRetry: () => void; onShowSolution: () => void;
}) {
  if (feedback === 'idle') return null;

  const isCorrect = feedback === 'correct';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
        className={`rounded-xl border p-4 ${
          isCorrect
            ? 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-500/30 dark:bg-emerald-500/10'
            : 'border-rose-200 bg-rose-50/90 dark:border-rose-500/30 dark:bg-rose-500/10'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
            isCorrect
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300'
          }`}>
            {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>

          <div className="flex-1 min-w-0">
            {isCorrect ? (
              <>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Rätt svar!</p>
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                  Välj steg-för-steg nedan om du vill jämföra med en modellösning.
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">Inte helt rätt.</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white/70 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                    <Brain className="h-3 w-3" />
                    {question.misconceptionLabel}
                  </span>
                </div>
                <RichText
                  text={question.misconceptionText}
                  className="mt-1.5 block text-xs leading-5 text-rose-800 dark:text-rose-200"
                />
              </>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {!isCorrect && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Försök igen
                </button>
              )}
              <button
                onClick={onShowSolution}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isCorrect
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Visa steg-för-steg
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Hints ─────────────────────────────────────────────────────────────────────

const HINT_TONE: Record<HintItem['tone'], {
  wrap: string; icon: string; dot: string;
}> = {
  amber: {
    wrap: 'border-amber-200 bg-amber-50/80 dark:border-amber-500/25 dark:bg-amber-500/8',
    icon: 'text-amber-500',
    dot: 'bg-amber-400',
  },
  blue: {
    wrap: 'border-primary-200 bg-primary-50/80 dark:border-primary-500/25 dark:bg-primary-500/8',
    icon: 'text-primary-500',
    dot: 'bg-primary-400',
  },
  violet: {
    wrap: 'border-accent-200 bg-accent-50/80 dark:border-accent-500/25 dark:bg-accent-500/8',
    icon: 'text-accent-500',
    dot: 'bg-accent-400',
  },
};

function HintCard({ hint, index }: { hint: HintItem; index: number }) {
  const t = HINT_TONE[hint.tone];
  const Icon = hint.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', damping: 28 }}
      className={`rounded-xl border p-4 ${t.wrap}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 flex-shrink-0 ${t.icon}`} />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{hint.label}</span>
      </div>
      <RichText text={hint.text} className="block text-sm leading-6 text-zinc-700 dark:text-zinc-200" />
      {hint.math && (
        <div className="mt-3 overflow-x-auto rounded-lg bg-white/70 px-3 py-2 dark:bg-zinc-950/50">
          <BlockMath math={hint.math} />
        </div>
      )}
    </motion.div>
  );
}

// ── Solution accordion ────────────────────────────────────────────────────────

function SolutionPanel({ question, open, onToggle }: {
  question: DemoQuestion; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/60">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white">
            <Sigma className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Steg-för-steg lösning</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{question.solution.length} steg</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-zinc-200 p-5 dark:border-zinc-700">
              {question.solution.map((step, i) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex w-7 flex-shrink-0 flex-col items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                      {i + 1}
                    </div>
                    {i < question.solution.length - 1 && (
                      <div className="mt-2 h-full w-px bg-zinc-200 dark:bg-zinc-700" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{step.title}</p>
                    <RichText
                      text={step.explanation}
                      className="mt-1 block text-sm leading-6 text-zinc-600 dark:text-zinc-300"
                    />
                    {step.math && (
                      <div className="mt-2.5 overflow-x-auto rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950/50">
                        <BlockMath math={step.math} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Answer mode tabs ──────────────────────────────────────────────────────────

const MODE_META: Record<AnswerMode, { label: string; icon: ElementType }> = {
  multiple_choice: { label: 'Flerval', icon: ListChecks },
  free_text: { label: 'Fritext', icon: PenTool },
  toggle: { label: 'Sant / Falskt', icon: ToggleLeft },
  guided_steps: { label: 'Delsteg', icon: Grid2X2 },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QuestionViewPage() {
  const { theme, setTheme } = useTheme();
  const [activeId, setActiveId] = useState(QUESTIONS[0].id);
  const [answerMode, setAnswerMode] = useState<AnswerMode>(QUESTIONS[0].answerModes[0]);
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [hintsExpanded, setHintsExpanded] = useState(false);

  const question = useMemo(
    () => QUESTIONS.find((q) => q.id === activeId) ?? QUESTIONS[0],
    [activeId]
  );

  const questionIndex = QUESTIONS.findIndex((q) => q.id === question.id);
  const progress = ((questionIndex + 1) / QUESTIONS.length) * 100;

  // Unlock more hints on wrong answer
  const visibleHints = feedback === 'wrong' || hintsExpanded
    ? question.hints
    : question.hints.slice(0, 1);

  function switchQuestion(id: string) {
    setActiveId(id);
    setAnswerMode(QUESTIONS.find((q) => q.id === id)!.answerModes[0]);
    setFeedback('idle');
    setSolutionOpen(false);
    setHintsExpanded(false);
  }

  function renderAnswer() {
    const props = {
      question,
      feedback,
      onAnswer: (c: boolean) => setFeedback(c ? 'correct' : 'wrong'),
    };
    switch (answerMode) {
      case 'multiple_choice': return <MultipleChoicePanel {...props} />;
      case 'free_text': return <FreeTextPanel {...props} />;
      case 'toggle': return <TogglePanel {...props} />;
      case 'guided_steps': return <GuidedStepsPanel {...props} />;
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      {/* Subtle ambient gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(59,130,246,0.07),transparent),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(139,92,246,0.06),transparent)]" />

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-light)] bg-[var(--glass-bg-elevated)] backdrop-blur-md">
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-zinc-100 dark:bg-zinc-800">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
          />
        </div>

        <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-3 px-4 lg:px-6">
          <Link
            href="/study"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:block">Tillbaka</span>
          </Link>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              {question.course} · {question.area}
            </p>
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {question.title}
            </p>
          </div>

          {/* Stats */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              7
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              <Zap className="h-3.5 w-3.5 text-primary-500" />
              45 XP
            </div>
          </div>

          {/* AI button */}
          <motion.button
            onClick={() => setAiOpen((v) => !v)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
              aiOpen
                ? 'border-primary-500 bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md shadow-primary-500/20'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-primary-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-primary-500/50'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span className="hidden sm:block">AI-hjälp</span>
          </motion.button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className={`mx-auto max-w-screen-xl px-4 py-6 transition-all duration-300 lg:px-6 ${aiOpen ? 'lg:pr-[400px]' : ''}`}>

        {/* Question switcher */}
        <div className="mb-5 flex flex-wrap gap-2">
          {QUESTIONS.map((q) => (
            <button
              key={q.id}
              onClick={() => switchQuestion(q.id)}
              className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                q.id === question.id
                  ? 'border-primary-500 bg-gradient-to-br from-primary-500 to-accent-500 font-semibold text-white shadow-md shadow-primary-500/20'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-primary-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-primary-500/50 dark:hover:text-white'
              }`}
            >
              <span className="block text-[10px] font-medium uppercase tracking-widest opacity-70">{q.area}</span>
              <span className="mt-0.5 block font-semibold">{q.shortLabel}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">

          {/* ── Left: Question + Answer ──────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Question card */}
            <div className="rounded-2xl border border-[var(--border-light)] bg-white/90 p-5 shadow-sm dark:bg-zinc-900/70 sm:p-6">
              {/* Meta row */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-200/60 dark:border-primary-500/25 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {question.topicTag}
                </span>
                <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {question.points} poäng
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  <Clock className="h-3 w-3" />
                  ~{question.estimatedMinutes} min
                </span>
                <span className="ml-auto text-xs text-zinc-400">
                  Fråga {questionIndex + 1} / {QUESTIONS.length}
                </span>
              </div>

              {/* Title */}
              <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                {question.title}
              </h1>
              <p className="mb-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {question.intro}
              </p>

              {/* Prompt + math */}
              <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/30">
                {question.prompt.map((p) => (
                  <RichText key={p} text={p} className="block text-sm leading-7 text-zinc-800 dark:text-zinc-100" />
                ))}
                {question.mathBlocks.map((m) => (
                  <div key={m} className="overflow-x-auto rounded-lg border border-zinc-200/70 bg-white px-4 py-3 dark:border-zinc-700/60 dark:bg-zinc-900/60">
                    <BlockMath math={m} />
                  </div>
                ))}
              </div>

              {/* Figure */}
              {question.figure && (
                <div className="mt-4">
                  <QuestionFigure figure={question.figure} />
                </div>
              )}
            </div>

            {/* Answer card */}
            <div className="rounded-2xl border border-[var(--border-light)] bg-white/90 p-5 shadow-sm dark:bg-zinc-900/70 sm:p-6">
              {/* Mode tabs */}
              <div className="mb-5 flex flex-wrap gap-2">
                {question.answerModes.map((mode) => {
                  const { label, icon: Icon } = MODE_META[mode];
                  const active = answerMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => { setAnswerMode(mode); setFeedback('idle'); }}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                        active
                          ? 'border-primary-500 bg-primary-500 text-white shadow-sm shadow-primary-500/25'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-primary-300 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-primary-500/40'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Answer input */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${question.id}-${answerMode}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {renderAnswer()}
                </motion.div>
              </AnimatePresence>

              {/* Feedback */}
              {feedback !== 'idle' && (
                <div className="mt-4">
                  <FeedbackCard
                    feedback={feedback}
                    question={question}
                    onRetry={() => { setFeedback('idle'); setHintsExpanded(false); }}
                    onShowSolution={() => setSolutionOpen(true)}
                  />
                </div>
              )}
            </div>

            {/* Hints card */}
            <div className="rounded-2xl border border-[var(--border-light)] bg-white/90 p-5 shadow-sm dark:bg-zinc-900/70 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ledtrådar</h3>
                  <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    {visibleHints.length} / {question.hints.length}
                  </span>
                </div>
                {feedback !== 'wrong' && question.hints.length > 1 && (
                  <button
                    onClick={() => setHintsExpanded((v) => !v)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {hintsExpanded ? 'Dölj' : 'Visa alla'}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {visibleHints.map((hint, i) => (
                  <HintCard key={`${question.id}-${hint.label}`} hint={hint} index={i} />
                ))}
              </div>
            </div>

            {/* Solution */}
            <SolutionPanel
              question={question}
              open={solutionOpen}
              onToggle={() => setSolutionOpen((v) => !v)}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between rounded-2xl border border-[var(--border-light)] bg-white/90 px-5 py-4 shadow-sm dark:bg-zinc-900/70">
              <button
                onClick={() => questionIndex > 0 && switchQuestion(QUESTIONS[questionIndex - 1].id)}
                disabled={questionIndex === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
              >
                <ChevronLeft className="h-4 w-4" />
                Föregående
              </button>

              {/* Dot nav */}
              <div className="flex items-center gap-1.5">
                {QUESTIONS.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => switchQuestion(q.id)}
                    className={`rounded-full transition-all ${
                      q.id === question.id
                        ? 'h-2 w-6 bg-gradient-to-r from-primary-500 to-accent-500'
                        : i < questionIndex
                        ? 'h-2 w-2 bg-emerald-400'
                        : 'h-2 w-2 bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => questionIndex < QUESTIONS.length - 1 && switchQuestion(QUESTIONS[questionIndex + 1].id)}
                disabled={questionIndex === QUESTIONS.length - 1}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Nästa
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Right: Metadata + Checklist ──────────────────────────────────── */}
          <aside className="space-y-5">

            {/* Question metadata */}
            <div className="rounded-2xl border border-[var(--border-light)] bg-white/90 p-5 shadow-sm dark:bg-zinc-900/70">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Frågeinfo</h2>
              <div className="space-y-3">
                {[
                  { label: 'Kurs', value: question.course },
                  { label: 'Område', value: question.area },
                  { label: 'Ämne', value: question.topicTag },
                  { label: 'Svårighet', value: difficultyLabel(question.difficulty) },
                  { label: 'Poäng', value: `${question.points} p` },
                  { label: 'Tid', value: `~${question.estimatedMinutes} min` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-100">{value}</span>
                  </div>
                ))}

                {/* Difficulty bar */}
                <div className="pt-1">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < question.difficulty
                            ? 'bg-gradient-to-r from-primary-500 to-accent-500'
                            : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Concept checklist */}
            <div className="rounded-2xl border border-[var(--border-light)] bg-white/90 p-5 shadow-sm dark:bg-zinc-900/70">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vad testas</h2>
              </div>
              <div className="space-y-2.5">
                {question.conceptChecklist.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
                    <div className="mt-1 h-4 w-4 flex-shrink-0 rounded-full border-2 border-primary-300 dark:border-primary-500/50" />
                    <RichText text={item} />
                  </div>
                ))}
              </div>
            </div>

            {/* AI CTA (visible when AI panel is closed) */}
            {!aiOpen && (
              <motion.button
                onClick={() => setAiOpen(true)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50 to-accent-50/60 p-5 text-left transition hover:shadow-md dark:border-primary-500/20 dark:from-primary-500/8 dark:to-accent-500/5"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-sm">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI-Tutor</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Redo att hjälpa</p>
                  </div>
                </div>
                <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                  Ställ en fråga om den här uppgiften och få Sokratisk vägledning utan att AI:n avslöjar svaret.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400">
                  Öppna AI-hjälp
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </motion.button>
            )}
          </aside>
        </div>
      </div>

      {/* ── AIPanel ───────────────────────────────────────────────────────────── */}
      <AIPanel
        isOpen={aiOpen}
        onToggle={() => setAiOpen((v) => !v)}
        position="sidebar"
        context={{
          currentPage: 'study',
          mode: 'guided',
          question: {
            id: question.id,
            content: buildQuestionContent(question),
            topic: question.area,
            difficulty: question.difficulty,
          },
          student: {
            masteryLevel: 0.58,
            recentPerformance: feedback === 'wrong' ? 'struggling' : 'learning',
          },
        }}
      />
    </div>
  );
}
