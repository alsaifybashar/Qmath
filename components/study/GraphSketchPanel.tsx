'use client';

import { useState, useMemo, useId } from 'react';
import { Plus, Trash2, ArrowRight, TrendingUp, Minus } from 'lucide-react';
import { evaluate } from 'mathjs';

// ── Math evaluation ───────────────────────────────────────────────────────────

function evalAt(expr: string, x: number): number {
  try {
    const result = evaluate(expr, { x });
    return typeof result === 'number' ? result : NaN;
  } catch {
    return NaN;
  }
}

// ── SVG path builder ──────────────────────────────────────────────────────────

function buildSvgPaths(
  expr: string,
  xMin: number, xMax: number,
  yMin: number, yMax: number,
  W: number, H: number,
  samples = 600,
): string[] {
  const toSx = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
  const toSy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;
  const maxJump = (yMax - yMin) * 0.7;

  const paths: string[] = [];
  let seg = '';
  let prevY: number | null = null;

  for (let i = 0; i <= samples; i++) {
    const x = xMin + (i / samples) * (xMax - xMin);
    const y = evalAt(expr, x);

    const outOfRange = !isFinite(y) || y < yMin - maxJump || y > yMax + maxJump;
    const bigJump = prevY !== null && Math.abs(y - prevY) > maxJump;

    if (outOfRange || bigJump) {
      if (seg) { paths.push(seg); seg = ''; }
      prevY = null;
      continue;
    }

    const sx = toSx(x).toFixed(1);
    const sy = toSy(y).toFixed(1);
    seg += seg ? ` L${sx},${sy}` : `M${sx},${sy}`;
    prevY = y;
  }
  if (seg) paths.push(seg);
  return paths;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CriticalPointType = 'max' | 'min' | 'inflection';

export interface CriticalPointRow {
  id: string;
  x: string;
  y: string;
  type: CriticalPointType;
}

export interface GraphAnalysisCorrect {
  criticalPoints?: Array<{ x: number; y: number; type: CriticalPointType; tol?: number }>;
  verticalAsymptotes?: number[];
  horizontalAsymptotes?: number[];
  endBehaviorPosInf?: string;
  endBehaviorNegInf?: string;
}

interface Props {
  functionExpr: string;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  correctData: GraphAnalysisCorrect;
  feedback: 'idle' | 'correct' | 'wrong';
  onAnswer: (correct: boolean) => void;
}

// ── End-behavior options ──────────────────────────────────────────────────────

const END_OPTIONS = [
  { value: '+inf', label: '+∞' },
  { value: '-inf', label: '−∞' },
  { value: '0',   label: '0' },
  { value: 'L',   label: 'L (ändligt)' },
];

// ── Small UI atoms ─────────────────────────────────────────────────────────────

function FieldInput({ value, onChange, placeholder, disabled, small }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean; small?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className={`rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 outline-none transition
        focus:border-primary-400 focus:bg-white
        disabled:cursor-not-allowed disabled:opacity-60
        dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-primary-500/60
        ${small ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
    />
  );
}

function TypeSelect({ value, onChange, disabled }: {
  value: CriticalPointType; onChange: (v: CriticalPointType) => void; disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as CriticalPointType)}
      disabled={disabled}
      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-800 outline-none
        focus:border-primary-400 focus:bg-white
        disabled:cursor-not-allowed disabled:opacity-60
        dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100"
    >
      <option value="max">Max</option>
      <option value="min">Min</option>
      <option value="inflection">Inflection</option>
    </select>
  );
}

// ── Function plotter (SVG) ─────────────────────────────────────────────────────

interface PlotterProps {
  expr: string;
  xMin: number; xMax: number;
  yMin: number; yMax: number;
  criticalPoints: CriticalPointRow[];
  verticalAsymptotes: string[];
  horizontalAsymptotes: string[];
  showSolution: boolean;
  correctData: GraphAnalysisCorrect;
}

function FunctionPlotter({
  expr, xMin, xMax, yMin, yMax,
  criticalPoints, verticalAsymptotes, horizontalAsymptotes,
  showSolution, correctData,
}: PlotterProps) {
  const W = 420;
  const H = 280;
  const PAD = { top: 18, right: 18, bottom: 28, left: 36 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const toSx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * iW;
  const toSy = (y: number) => PAD.top + iH - ((y - yMin) / (yMax - yMin)) * iH;

  const paths = useMemo(
    () => buildSvgPaths(expr, xMin, xMax, yMin, yMax, iW, iH),
    [expr, xMin, xMax, yMin, yMax, iW, iH],
  );

  // Grid ticks
  const xTicks = useMemo(() => {
    const step = niceTick(xMax - xMin, 6);
    const start = Math.ceil(xMin / step) * step;
    const ticks: number[] = [];
    for (let v = start; v <= xMax + 1e-9; v += step) ticks.push(+v.toFixed(10));
    return ticks;
  }, [xMin, xMax]);

  const yTicks = useMemo(() => {
    const step = niceTick(yMax - yMin, 5);
    const start = Math.ceil(yMin / step) * step;
    const ticks: number[] = [];
    for (let v = start; v <= yMax + 1e-9; v += step) ticks.push(+v.toFixed(10));
    return ticks;
  }, [yMin, yMax]);

  const axisX = Math.max(PAD.left, Math.min(W - PAD.right, toSx(0)));
  const axisY = Math.max(PAD.top, Math.min(H - PAD.bottom, toSy(0)));

  // Student annotation points
  const parsedCPs = criticalPoints
    .map(cp => ({ x: parseFloat(cp.x), y: parseFloat(cp.y), type: cp.type }))
    .filter(cp => isFinite(cp.x) && isFinite(cp.y));

  const parsedVA = verticalAsymptotes
    .map(v => parseFloat(v)).filter(isFinite);

  const parsedHA = horizontalAsymptotes
    .map(v => parseFloat(v)).filter(isFinite);

  const correctCPs = showSolution ? (correctData.criticalPoints ?? []) : [];
  const correctVA  = showSolution ? (correctData.verticalAsymptotes ?? []) : [];
  const correctHA  = showSolution ? (correctData.horizontalAsymptotes ?? []) : [];

  return (
    <div className="relative rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950/60 overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Background */}
        <rect width={W} height={H} fill="transparent" />

        {/* Grid lines */}
        {xTicks.map(v => (
          <line key={`vg${v}`}
            x1={toSx(v)} y1={PAD.top} x2={toSx(v)} y2={H - PAD.bottom}
            stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
        ))}
        {yTicks.map(v => (
          <line key={`hg${v}`}
            x1={PAD.left} y1={toSy(v)} x2={W - PAD.right} y2={toSy(v)}
            stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={axisY} x2={W - PAD.right} y2={axisY}
          stroke="rgba(51,65,85,0.5)" strokeWidth="1.5" />
        <line x1={axisX} y1={PAD.top} x2={axisX} y2={H - PAD.bottom}
          stroke="rgba(51,65,85,0.5)" strokeWidth="1.5" />

        {/* Tick labels */}
        {xTicks.filter(v => Math.abs(v) > 0.01).map(v => (
          <text key={`xl${v}`} x={toSx(v)} y={H - PAD.bottom + 13}
            textAnchor="middle" fontSize="9" fill="rgba(100,116,139,0.9)">
            {fmt(v)}
          </text>
        ))}
        {yTicks.filter(v => Math.abs(v) > 0.01).map(v => (
          <text key={`yl${v}`} x={PAD.left - 5} y={toSy(v) + 3.5}
            textAnchor="end" fontSize="9" fill="rgba(100,116,139,0.9)">
            {fmt(v)}
          </text>
        ))}

        {/* Clip region */}
        <clipPath id="plotArea">
          <rect x={PAD.left} y={PAD.top} width={iW} height={iH} />
        </clipPath>

        {/* Student vertical asymptotes */}
        {parsedVA.map(v => (
          <line key={`sva${v}`}
            x1={toSx(v)} y1={PAD.top} x2={toSx(v)} y2={H - PAD.bottom}
            stroke="rgba(249,115,22,0.65)" strokeWidth="1.5" strokeDasharray="5,4"
            clipPath="url(#plotArea)" />
        ))}

        {/* Correct vertical asymptotes (shown in solution) */}
        {correctVA.map(v => (
          <line key={`cva${v}`}
            x1={toSx(v)} y1={PAD.top} x2={toSx(v)} y2={H - PAD.bottom}
            stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeDasharray="6,4"
            clipPath="url(#plotArea)" />
        ))}

        {/* Student horizontal asymptotes */}
        {parsedHA.map(v => (
          <line key={`sha${v}`}
            x1={PAD.left} y1={toSy(v)} x2={W - PAD.right} y2={toSy(v)}
            stroke="rgba(25, 100, 126,0.65)" strokeWidth="1.5" strokeDasharray="5,4"
            clipPath="url(#plotArea)" />
        ))}

        {/* Correct horizontal asymptotes */}
        {correctHA.map(v => (
          <line key={`cha${v}`}
            x1={PAD.left} y1={toSy(v)} x2={W - PAD.right} y2={toSy(v)}
            stroke="rgba(25, 100, 126,0.9)" strokeWidth="2" strokeDasharray="6,4"
            clipPath="url(#plotArea)" />
        ))}

        {/* Function curve */}
        <g clipPath="url(#plotArea)" transform={`translate(${PAD.left},${PAD.top})`}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none"
              stroke="rgb(53, 133, 163)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>

        {/* Student critical points */}
        {parsedCPs.map((cp, i) => {
          const sx = toSx(cp.x);
          const sy = toSy(cp.y);
          if (sx < PAD.left || sx > W - PAD.right || sy < PAD.top || sy > H - PAD.bottom) return null;
          const color = cp.type === 'max'
            ? 'rgb(34,197,94)' : cp.type === 'min'
            ? 'rgb(239,68,68)' : 'rgb(249,115,22)';
          return (
            <g key={i}>
              <circle cx={sx} cy={sy} r="5" fill={color} stroke="white" strokeWidth="1.5" />
              <text x={sx + 7} y={sy - 5} fontSize="8.5" fill={color} fontWeight="600">
                {cp.type === 'max' ? '▲' : cp.type === 'min' ? '▼' : '◆'}
              </text>
            </g>
          );
        })}

        {/* Correct critical points */}
        {correctCPs.map((cp, i) => {
          const sx = toSx(cp.x);
          const sy = toSy(cp.y);
          return (
            <g key={`c${i}`}>
              <circle cx={sx} cy={sy} r="6" fill="none"
                stroke="rgb(53, 133, 163)" strokeWidth="2" strokeDasharray="3,2" />
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${PAD.left + 4}, ${PAD.top + 4})`}>
          <circle cx="5" cy="5" r="4" fill="rgb(34,197,94)" />
          <text x="12" y="8.5" fontSize="8" fill="rgba(100,116,139,0.9)">max</text>
          <circle cx="33" cy="5" r="4" fill="rgb(239,68,68)" />
          <text x="40" y="8.5" fontSize="8" fill="rgba(100,116,139,0.9)">min</text>
          <circle cx="61" cy="5" r="4" fill="rgb(249,115,22)" />
          <text x="68" y="8.5" fontSize="8" fill="rgba(100,116,139,0.9)">inflection</text>
        </g>
      </svg>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function niceTick(range: number, maxTicks: number): number {
  const rawStep = range / maxTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (magnitude * m >= rawStep) return magnitude * m;
  }
  return magnitude * 10;
}

function fmt(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(
  cps: CriticalPointRow[],
  vas: string[],
  has: string[],
  endPos: string,
  endNeg: string,
  correct: GraphAnalysisCorrect,
): boolean {
  const tol = 0.15;

  // Critical points: every required point must appear in student's list
  const correctCPs = correct.criticalPoints ?? [];
  const cpOk = correctCPs.length === 0 || correctCPs.every(ccp =>
    cps.some(s => {
      const sx = parseFloat(s.x), sy = parseFloat(s.y);
      return isFinite(sx) && isFinite(sy) &&
        Math.abs(sx - ccp.x) <= (ccp.tol ?? tol) &&
        Math.abs(sy - ccp.y) <= (ccp.tol ?? tol) &&
        s.type === ccp.type;
    })
  );

  // Parse student's numeric entries (ignore empty strings)
  const studentVAs = vas.map(v => parseFloat(v)).filter(isFinite);
  const studentHAs = has.map(v => parseFloat(v)).filter(isFinite);

  const correctVAs = correct.verticalAsymptotes ?? [];
  // If correctVAs is explicitly empty, penalise wrong entries
  const vaOk = correctVAs.length === 0
    ? studentVAs.length === 0
    : correctVAs.every(cv => studentVAs.some(sv => Math.abs(sv - cv) <= tol));

  const correctHAs = correct.horizontalAsymptotes ?? [];
  const haOk = correctHAs.length === 0
    ? studentHAs.length === 0
    : correctHAs.every(ch => studentHAs.some(sh => Math.abs(sh - ch) <= tol));

  const endPosOk = !correct.endBehaviorPosInf || endPos === correct.endBehaviorPosInf;
  const endNegOk = !correct.endBehaviorNegInf || endNeg === correct.endBehaviorNegInf;

  return cpOk && vaOk && haOk && endPosOk && endNegOk;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function GraphSketchPanel({
  functionExpr,
  xMin = -4, xMax = 4,
  yMin = -1.2, yMax = 1.2,
  correctData,
  feedback,
  onAnswer,
}: Props) {
  const submitted = feedback !== 'idle';
  const baseId = useId();

  const [criticalPoints, setCriticalPoints] = useState<CriticalPointRow[]>([
    { id: uid(), x: '', y: '', type: 'max' },
  ]);
  const [verticalAsymptotes, setVerticalAsymptotes] = useState<string[]>(['']);
  const [horizontalAsymptotes, setHorizontalAsymptotes] = useState<string[]>(['']);
  const [endBehaviorPosInf, setEndBehaviorPosInf] = useState('');
  const [endBehaviorNegInf, setEndBehaviorNegInf] = useState('');
  const [showSolution, setShowSolution] = useState(false);

  // ── Critical points helpers ──────────────────────────────────────────────────
  const addCP = () => setCriticalPoints(ps => [...ps, { id: uid(), x: '', y: '', type: 'max' }]);
  const removeCP = (id: string) => setCriticalPoints(ps => ps.filter(p => p.id !== id));
  const updateCP = (id: string, field: keyof CriticalPointRow, value: string) =>
    setCriticalPoints(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p));

  const addVA = () => setVerticalAsymptotes(vs => [...vs, '']);
  const removeVA = (i: number) => setVerticalAsymptotes(vs => vs.filter((_, j) => j !== i));
  const updateVA = (i: number, v: string) => setVerticalAsymptotes(vs => vs.map((x, j) => j === i ? v : x));

  const addHA = () => setHorizontalAsymptotes(hs => [...hs, '']);
  const removeHA = (i: number) => setHorizontalAsymptotes(hs => hs.filter((_, j) => j !== i));
  const updateHA = (i: number, v: string) => setHorizontalAsymptotes(hs => hs.map((x, j) => j === i ? v : x));

  // ── Submit ────────────────────────────────────────────────────────────────────
  const canSubmit = !submitted && (
    endBehaviorPosInf !== '' && endBehaviorNegInf !== ''
  );

  function handleSubmit() {
    const correct = validate(
      criticalPoints, verticalAsymptotes, horizontalAsymptotes,
      endBehaviorPosInf, endBehaviorNegInf, correctData,
    );
    onAnswer(correct);
  }

  // ── Section label ─────────────────────────────────────────────────────────────
  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {children}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Graph */}
      <FunctionPlotter
        expr={functionExpr}
        xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax}
        criticalPoints={criticalPoints}
        verticalAsymptotes={verticalAsymptotes}
        horizontalAsymptotes={horizontalAsymptotes}
        showSolution={showSolution}
        correctData={correctData}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {/* ── Left column: Critical points + Asymptotes ── */}
        <div className="space-y-5">
          {/* Critical points */}
          <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <SectionLabel>Stationära punkter (f′(x) = 0)</SectionLabel>
            <div className="space-y-2">
              {criticalPoints.map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center gap-2"
                >
                  <span className="w-5 text-[10px] text-zinc-400">x=</span>
                  <FieldInput
                    value={cp.x} onChange={v => updateCP(cp.id, 'x', v)}
                    placeholder="0" disabled={submitted} small
                  />
                  <span className="text-[10px] text-zinc-400">y=</span>
                  <FieldInput
                    value={cp.y} onChange={v => updateCP(cp.id, 'y', v)}
                    placeholder="0" disabled={submitted} small
                  />
                  <TypeSelect
                    value={cp.type}
                    onChange={v => updateCP(cp.id, 'type', v)}
                    disabled={submitted}
                  />
                  {criticalPoints.length > 1 && !submitted && (
                    <button
                      onClick={() => removeCP(cp.id)}
                      className="text-zinc-400 transition hover:text-accent-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!submitted && (
              <button
                onClick={addCP}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Lägg till punkt
              </button>
            )}
          </div>

          {/* Asymptotes */}
          <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <SectionLabel>Vertikala asymptoter</SectionLabel>
            <p className="mb-2 text-[10px] text-zinc-400 dark:text-zinc-500">Lämna tomt om inga finns</p>
            <div className="space-y-2">
              {verticalAsymptotes.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="shrink-0 text-[10px] font-medium text-zinc-500">x =</span>
                  <FieldInput
                    value={v} onChange={val => updateVA(i, val)}
                    placeholder="a" disabled={submitted} small
                  />
                  {verticalAsymptotes.length > 1 && !submitted && (
                    <button onClick={() => removeVA(i)} className="text-zinc-400 hover:text-accent-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!submitted && (
              <button
                onClick={addVA}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Lägg till
              </button>
            )}

            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <SectionLabel>Horisontella asymptoter</SectionLabel>
              <p className="mb-2 text-[10px] text-zinc-400 dark:text-zinc-500">Lämna tomt om inga finns</p>
              <div className="space-y-2">
                {horizontalAsymptotes.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="shrink-0 text-[10px] font-medium text-zinc-500">y =</span>
                    <FieldInput
                      value={h} onChange={val => updateHA(i, val)}
                      placeholder="b" disabled={submitted} small
                    />
                    {horizontalAsymptotes.length > 1 && !submitted && (
                      <button onClick={() => removeHA(i)} className="text-zinc-400 hover:text-accent-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!submitted && (
                <button
                  onClick={addHA}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Lägg till
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: End behavior ── */}
        <div className="space-y-5">
          <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <SectionLabel>Ändpunktsbeteende</SectionLabel>

            {/* x → +∞ */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                När <span className="font-mono">x → +∞</span>, f(x) →
              </p>
              <div className="flex flex-wrap gap-2">
                {END_OPTIONS.map(opt => {
                  const active = endBehaviorPosInf === opt.value;
                  return (
                    <button
                      key={opt.value}
                      disabled={submitted}
                      onClick={() => setEndBehaviorPosInf(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all
                        ${active
                          ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-primary-300 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300'
                        }
                        disabled:cursor-not-allowed`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* x → -∞ */}
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                När <span className="font-mono">x → −∞</span>, f(x) →
              </p>
              <div className="flex flex-wrap gap-2">
                {END_OPTIONS.map(opt => {
                  const active = endBehaviorNegInf === opt.value;
                  return (
                    <button
                      key={opt.value}
                      disabled={submitted}
                      onClick={() => setEndBehaviorNegInf(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all
                        ${active
                          ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-primary-300 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300'
                        }
                        disabled:cursor-not-allowed`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Annotations hint */}
          <div className="rounded-xl border border-zinc-200/60 bg-zinc-50/70 p-4 text-xs text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-900/30 dark:text-zinc-400">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary-500" />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Grafen uppdateras live</span>
            </div>
            <p>Dina kritiska punkter och asymptoter ritas direkt i koordinatsystemet ovan.</p>
          </div>

          {/* Submit */}
          {!submitted && (
            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Kontrollera analys
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {/* Solution toggle */}
          {submitted && (
            <button
              onClick={() => setShowSolution(v => !v)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300"
            >
              {showSolution ? 'Dölj facit' : 'Visa facit i grafen'}
            </button>
          )}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Minus className="h-3 w-3 text-orange-400" style={{ strokeDasharray: '3,2' }} />
          Vertikal asymptot (student)
        </span>
        <span className="flex items-center gap-1.5">
          <Minus className="h-3 w-3 text-purple-400" style={{ strokeDasharray: '3,2' }} />
          Horisontell asymptot (student)
        </span>
      </div>
    </div>
  );
}
