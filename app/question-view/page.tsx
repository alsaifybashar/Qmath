'use client';

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import { MathInputWithToolbar } from '@/components/study/MathInputWithToolbar';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
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
  Star,
  Sun,
  Target,
  ToggleLeft,
  XCircle,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { AIPanel } from '@/components/ai/AIPanel';
import { FlashcardContextBridge } from '@/components/flashcards/FlashcardContextBridge';

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
type AssistanceLevel = 0 | 1 | 2 | 3 | 4 | 5;

type HintItem = {
  label: string;
  text: string;
  tone: 'blue' | 'violet';
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
        tone: 'blue',
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
        tone: 'blue',
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
        tone: 'blue',
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

const MATH_TOKEN_RE = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\))/g;

function looksLikeStandaloneLatex(text: string) {
  const trimmed = text.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  return /\\[a-zA-Z]+|[_^{}]|\\[,;:!]/.test(trimmed);
}

function RichText({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(MATH_TOKEN_RE).filter(Boolean);

  if (parts.length === 1 && looksLikeStandaloneLatex(parts[0])) {
    return (
      <span className={className}>
        <InlineMath math={parts[0].trim()} />
      </span>
    );
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return (
            <span key={i} className="my-2 block overflow-x-auto">
              <BlockMath math={part.slice(2, -2).trim()} />
            </span>
          );
        }

        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          return (
            <span key={i} className="my-2 block overflow-x-auto">
              <BlockMath math={part.slice(2, -2).trim()} />
            </span>
          );
        }

        if (part.startsWith('$') && part.endsWith('$')) {
          return <InlineMath key={i} math={part.slice(1, -1).trim()} />;
        }

        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          return <InlineMath key={i} math={part.slice(2, -2).trim()} />;
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function assistanceLabel(level: AssistanceLevel) {
  if (level === 0) return 'Observerar';
  if (level === 1) return 'Nudge';
  if (level === 2) return 'Formel';
  if (level === 3) return 'Delsteg';
  if (level === 4) return 'Sokratisk tutor';
  return 'Genomgång';
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
              ? 'border-primary-400 bg-primary-50/80 dark:border-primary-500/40 dark:bg-primary-500/10'
              : 'border-accent-400 bg-accent-50/80 dark:border-accent-500/40 dark:bg-accent-500/10'
            : opt.isCorrect
            ? 'border-primary-300/60 bg-primary-50/40 dark:border-primary-500/25 dark:bg-primary-500/5'
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
                ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary-500" />
                : <XCircle className="h-5 w-5 flex-shrink-0 text-accent-500" />
            )}
            {isSubmitted && !isSelected && opt.isCorrect && (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary-400/60" />
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
              ? 'border-primary-400 bg-primary-50/60 dark:border-primary-500/40 dark:bg-primary-500/10'
              : 'border-accent-400 bg-accent-50/60 dark:border-accent-500/40 dark:bg-accent-500/10'
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
                ? 'border-primary-400 bg-primary-50 dark:border-primary-500/40 dark:bg-primary-500/10'
                : 'border-accent-400 bg-accent-50 dark:border-accent-500/40 dark:bg-accent-500/10'
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
                  ? <CheckCircle2 className="h-4 w-4 text-primary-500" />
                  : <XCircle className="h-4 w-4 text-accent-500" />
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
            ? 'border-primary-200 bg-primary-50/90 dark:border-primary-500/30 dark:bg-primary-500/10'
            : 'border-accent-200 bg-accent-50/90 dark:border-accent-500/30 dark:bg-accent-500/10'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
            isCorrect
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300'
              : 'bg-accent-500/10 text-accent-600 dark:bg-accent-500/20 dark:text-accent-400'
          }`}>
            {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>

          <div className="flex-1 min-w-0">
            {isCorrect ? (
              <>
                <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">Rätt svar!</p>
                <p className="mt-0.5 text-xs text-primary-700 dark:text-primary-300">
                  Välj steg-för-steg nedan om du vill jämföra med en modellösning.
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-accent-600 dark:text-accent-400">Inte helt rätt.</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent-200 bg-white/70 px-2 py-0.5 text-xs font-semibold text-accent-600 dark:border-accent-500/30 dark:bg-accent-500/10 dark:text-accent-400">
                    <Brain className="h-3 w-3" />
                    {question.misconceptionLabel}
                  </span>
                </div>
                <RichText
                  text={question.misconceptionText}
                  className="mt-1.5 block text-xs leading-5 text-zinc-700 dark:text-zinc-200"
                />
              </>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {!isCorrect && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-accent-200 px-3 py-1.5 text-xs font-semibold text-accent-600 transition hover:bg-accent-50 dark:border-accent-500/30 dark:text-accent-400 dark:hover:bg-accent-500/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Försök igen
                </button>
              )}
              <button
                onClick={onShowSolution}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isCorrect
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90'
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
  blue: {
    wrap: 'border-primary-200 bg-primary-50/80 dark:border-primary-500/25 dark:bg-primary-500/8',
    icon: 'text-primary-500',
    dot: 'bg-primary-400',
  },
  violet: {
    wrap: 'border-accent-200 bg-accent-500/10 dark:border-accent-500/25 dark:bg-accent-500/10',
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

const WORK_COMMANDS = [
  { label: '/matrix', text: 'Matris' },
  { label: '/integral', text: 'Integral' },
  { label: '/cases', text: 'Fall' },
  { label: '/proof', text: 'Bevis' },
  { label: '/vector', text: 'Vektor' },
];

function LearningRail({ question, questionIndex, progress, feedback, assistanceLevel }: {
  question: DemoQuestion;
  questionIndex: number;
  progress: number;
  feedback: FeedbackState;
  assistanceLevel: AssistanceLevel;
}) {
  const mastery = feedback === 'correct' ? 72 : feedback === 'wrong' ? 53 : 58;
  const status = feedback === 'correct' ? 'Klar' : feedback === 'wrong' ? 'Reparera' : 'Aktiv';

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-20 space-y-3">
        <div className="rounded-2xl border border-[var(--border-light)] bg-white/90 p-4 shadow-sm dark:bg-zinc-900/70">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Lärläge</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">{questionIndex + 1}</span>
            <span className="pb-1 text-sm text-zinc-400">/ {QUESTIONS.length}</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
            />
          </div>
        </div>

        {[
          { label: 'Status', value: status, icon: Target },
          { label: 'Mastery', value: `${mastery}%`, icon: Brain },
          { label: 'Hjälpnivå', value: assistanceLabel(assistanceLevel), icon: Lightbulb },
          { label: 'Tid', value: `~${question.estimatedMinutes} min`, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[var(--border-light)] bg-white/80 p-4 shadow-sm dark:bg-zinc-900/60">
            <div className="mb-2 flex items-center gap-2 text-zinc-400">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Scratchpad({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 p-4 dark:border-zinc-700 dark:bg-zinc-950/30">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Scratchpad</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Rough work is separate from the official answer until you promote it.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {WORK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => onChange(`${value}${value ? '\n' : ''}${cmd.label} `)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-500 transition hover:border-primary-300 hover:text-primary-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {cmd.text}
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Testa idéer, mellanled, bevisstruktur eller en snabb LaTeX-skiss här..."
        className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100"
      />
    </div>
  );
}

function ProgressiveTutorPanel({ question, feedback, visibleHints, assistanceLevel, aiOpen, onSetAssistanceLevel, onOpenAI, onUseGuidedSteps, onShowSolution }: {
  question: DemoQuestion;
  feedback: FeedbackState;
  visibleHints: HintItem[];
  assistanceLevel: AssistanceLevel;
  aiOpen: boolean;
  onSetAssistanceLevel: (level: AssistanceLevel) => void;
  onOpenAI: () => void;
  onUseGuidedSteps: () => void;
  onShowSolution: () => void;
}) {
  const stages: Array<{ level: AssistanceLevel; title: string; copy: string; action: string }> = [
    { level: 1, title: 'Context-aware nudge', copy: 'Small cue tied to the current bottleneck.', action: 'Reveal nudge' },
    { level: 2, title: 'Formula / concept', copy: 'Show the useful theorem without solving the task.', action: 'Show formula' },
    { level: 3, title: 'Step unlocking', copy: 'Switch to checkpoints and require student input.', action: 'Use guided steps' },
    { level: 4, title: 'Socratic tutor', copy: 'Discuss the current work without giving the final answer.', action: 'Open tutor' },
    { level: 5, title: 'Solution walkthrough', copy: 'Only after attempts, review, or explicit escalation.', action: 'Show walkthrough' },
  ];

  return (
    <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
      <div className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-white/95 shadow-sm dark:bg-zinc-900/80">
        <div className="border-b border-zinc-200/70 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Embedded tutor</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Current mode: {assistanceLabel(assistanceLevel)}
              </p>
            </div>
          </div>
        </div>

        {aiOpen ? (
          <div className="h-[640px]">
            <AIPanel
              isOpen={aiOpen}
              onToggle={onOpenAI}
              position="panel"
              context={{
                currentPage: 'study',
                mode: 'guided',
                question: {
                  id: question.id,
                  content: buildQuestionContent(question),
                  topic: question.area,
                  difficulty: question.difficulty,
                },
                attempts: {
                  count: feedback === 'idle' ? 0 : 1,
                  timeSpent: question.estimatedMinutes * 60,
                },
                student: {
                  masteryLevel: feedback === 'wrong' ? 0.42 : 0.58,
                  recentPerformance: feedback === 'wrong' ? 'struggling' : 'learning',
                },
              }}
            />
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-accent-500/10 p-3 dark:border-primary-500/20 dark:from-primary-500/10 dark:to-accent-500/10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-700 dark:text-primary-300">Scaffold policy</p>
              <p className="mt-1 text-xs leading-5 text-zinc-700 dark:text-zinc-200">
                The tutor escalates from hint to formula to guided steps before revealing a full solution.
              </p>
            </div>

            <div className="space-y-2">
              {stages.map((stage) => {
                const active = assistanceLevel >= stage.level;
                return (
                  <button
                    key={stage.level}
                    onClick={() => {
                      onSetAssistanceLevel(stage.level);
                      if (stage.level === 3) onUseGuidedSteps();
                      if (stage.level === 4) onOpenAI();
                      if (stage.level === 5) onShowSolution();
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? 'border-primary-300 bg-primary-50 dark:border-primary-500/30 dark:bg-primary-500/10'
                        : 'border-zinc-200 bg-white hover:border-primary-300 dark:border-zinc-700 dark:bg-zinc-900/60'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{stage.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active
                          ? 'bg-primary-500 text-white'
                          : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
                      }`}>
                        L{stage.level}
                      </span>
                    </div>
                    <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{stage.copy}</p>
                    <p className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400">{stage.action}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!aiOpen && (
        <div className="rounded-2xl border border-[var(--border-light)] bg-white/95 p-4 shadow-sm dark:bg-zinc-900/80">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Active support</h3>
            </div>
            <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-700">
              {visibleHints.length} / {question.hints.length}
            </span>
          </div>
          <div className="space-y-3">
            {visibleHints.map((hint, i) => (
              <HintCard key={`${question.id}-${hint.label}`} hint={hint} index={i} />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function BottomCommandBar({ feedback, onCheckStep, onStuck, onOpenTutor, onShowSolution }: {
  feedback: FeedbackState;
  onCheckStep: () => void;
  onStuck: () => void;
  onOpenTutor: () => void;
  onShowSolution: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white/90 p-2 shadow-xl shadow-zinc-900/10 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/90">
        <button
          onClick={onCheckStep}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-zinc-700 dark:text-zinc-200"
        >
          <CheckCircle2 className="h-4 w-4" />
          Check step
        </button>
        <button
          onClick={onStuck}
          className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300"
        >
          <Lightbulb className="h-4 w-4" />
          I’m stuck
        </button>
        <button
          onClick={onOpenTutor}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-primary-500/20"
        >
          <Brain className="h-4 w-4" />
          Socratic tutor
        </button>
        <button
          onClick={onShowSolution}
          disabled={feedback === 'idle'}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
        >
          <Eye className="h-4 w-4" />
          Walkthrough
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QuestionViewPage() {
  const { theme, setTheme } = useTheme();
  const [activeId, setActiveId] = useState(QUESTIONS[0].id);
  const [answerMode, setAnswerMode] = useState<AnswerMode>(QUESTIONS[0].answerModes[0]);
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [assistanceLevel, setAssistanceLevel] = useState<AssistanceLevel>(0);
  const [scratchpad, setScratchpad] = useState('');

  const question = useMemo(
    () => QUESTIONS.find((q) => q.id === activeId) ?? QUESTIONS[0],
    [activeId]
  );

  const questionIndex = QUESTIONS.findIndex((q) => q.id === question.id);
  const progress = ((questionIndex + 1) / QUESTIONS.length) * 100;

  const effectiveAssistanceLevel = feedback === 'wrong'
    ? Math.max(assistanceLevel, 2) as AssistanceLevel
    : assistanceLevel;

  const visibleHintCount = Math.min(
    question.hints.length,
    Math.max(1, effectiveAssistanceLevel)
  );
  const visibleHints = effectiveAssistanceLevel >= 2 || feedback === 'wrong'
    ? question.hints.slice(0, visibleHintCount)
    : question.hints.slice(0, 1);

  function switchQuestion(id: string) {
    setActiveId(id);
    setAnswerMode(QUESTIONS.find((q) => q.id === id)!.answerModes[0]);
    setFeedback('idle');
    setSolutionOpen(false);
    setAiOpen(false);
    setAssistanceLevel(0);
    setScratchpad('');
  }

  function handleAnswer(isCorrect: boolean) {
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setAssistanceLevel((level) => Math.max(level, 1) as AssistanceLevel);
      return;
    }
    setAssistanceLevel((level) => Math.max(level, 2) as AssistanceLevel);
  }

  function handleGuidedSteps() {
    if (question.answerModes.includes('guided_steps')) {
      setAnswerMode('guided_steps');
    }
  }

  function showSolution() {
    setAssistanceLevel(5);
    setSolutionOpen(true);
  }

  function renderAnswer() {
    const props = {
      question,
      feedback,
      onAnswer: handleAnswer,
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
      <FlashcardContextBridge
        sourceContextType="question"
        sourceContextId={question.id}
        topicName={question.topicTag}
        snippet={[question.title, question.intro, ...question.mathBlocks].join('\n')}
      />
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
              <Flame className="h-3.5 w-3.5 text-accent-500" />
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
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            className={`group relative overflow-hidden inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-700 ease-in-out ${
              aiOpen
                ? 'border-primary-500/50 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                : 'border-zinc-200/50 bg-white/40 backdrop-blur-md text-zinc-700 hover:border-primary-400 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:text-white dark:hover:border-primary-500/50 shadow-glass'
            }`}
          >
            {/* Neural flow background effect */}
            <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[length:200%_200%] animate-gradient bg-gradient-to-br from-primary-500/20 via-accent-500/20 to-primary-500/20" />
            
            <div className="relative">
              <Star className="h-4 w-4 transition-all duration-700 group-hover:scale-110 group-hover:rotate-[15deg] group-hover:fill-primary-400 group-hover:text-primary-400" />
              <Star className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 transition-all duration-1000 delay-100 opacity-0 group-hover:opacity-100 group-hover:rotate-[-15deg] group-hover:fill-accent-400 group-hover:text-accent-400" />
            </div>
            <span className="hidden sm:block">Chit-Chat</span>
            
            {/* Shimmer "Spark" */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
      <div className="mx-auto max-w-[1500px] px-4 pb-28 pt-6 lg:px-6">

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

        <div className="grid gap-5 xl:grid-cols-[156px_minmax(0,1fr)_380px]">
          <LearningRail
            question={question}
            questionIndex={questionIndex}
            progress={progress}
            feedback={feedback}
            assistanceLevel={effectiveAssistanceLevel}
          />

          {/* ── Center: Problem + Work Canvas ───────────────────────────────── */}
          <div className="space-y-5">

            {/* Question card */}
            <div className="sticky top-[68px] z-20 rounded-2xl border border-[var(--border-light)] bg-white/95 p-5 shadow-sm backdrop-blur-md dark:bg-zinc-900/90 sm:p-6">
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
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Work canvas</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Type naturally first. Use structured modes only when they reduce notation friction.
                  </p>
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                  {MODE_META[answerMode].label}
                </span>
              </div>

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
                    onRetry={() => { setFeedback('idle'); setAssistanceLevel(1); }}
                    onShowSolution={showSolution}
                  />
                </div>
              )}
            </div>

            <Scratchpad value={scratchpad} onChange={setScratchpad} />

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
                        ? 'h-2 w-2 bg-primary-400'
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

          {/* ── Right: Intervention Space ───────────────────────────────────── */}
          <ProgressiveTutorPanel
            question={question}
            feedback={feedback}
            visibleHints={visibleHints}
            assistanceLevel={effectiveAssistanceLevel}
            aiOpen={aiOpen}
            onSetAssistanceLevel={(level) => setAssistanceLevel(level)}
            onOpenAI={() => {
              setAssistanceLevel(4);
              setAiOpen((v) => !v);
            }}
            onUseGuidedSteps={handleGuidedSteps}
            onShowSolution={showSolution}
          />
        </div>
      </div>

      <BottomCommandBar
        feedback={feedback}
        onCheckStep={() => {
          setAssistanceLevel(3);
          handleGuidedSteps();
        }}
        onStuck={() => setAssistanceLevel((level) => Math.max(level, 2) as AssistanceLevel)}
        onOpenTutor={() => {
          setAssistanceLevel(4);
          setAiOpen(true);
        }}
        onShowSolution={showSolution}
      />
    </div>
  );
}
