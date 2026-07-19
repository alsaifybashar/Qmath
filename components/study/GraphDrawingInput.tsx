'use client';

import {
  useRef, useState, useCallback, useEffect, useId, type PointerEvent,
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, ChevronDown, ChevronUp, Diamond, Eraser,
  Minus, Pen, Redo2, Trash2, Undo2,
} from 'lucide-react';
import { evaluate } from 'mathjs';
import type { GraphAnalysisCorrect, CriticalPointType } from './GraphSketchPanel';
import { motionDuration } from '@/lib/motion';

// ── Canvas dimensions (logical, before DPR scaling) ───────────────────────────
const CW = 560;
const CH = 360;

// ── Types ─────────────────────────────────────────────────────────────────────

type Tool = 'pen' | 'eraser' | 'max' | 'min' | 'inflection' | 'va' | 'ha';

interface Pt { x: number; y: number }

interface Stroke {
  id: string;
  pts: Pt[];
  eraser: boolean;
  color: string;
  width: number;
}

interface CriticalMark {
  id: string;
  cx: number; cy: number;   // canvas px (logical)
  mx: number; my: number;   // math coords
  type: CriticalPointType;
}

interface AsymptoteMark {
  id: string;
  pos: number;              // math coord
  kind: 'v' | 'h';
}

// ── End-behavior ──────────────────────────────────────────────────────────────

const END_OPTIONS = [
  { value: '+inf', label: '+∞' },
  { value: '-inf', label: '−∞' },
  { value: '0',   label: '0' },
  { value: 'L',   label: 'L (ändligt)' },
];

// ── Coordinate helpers ────────────────────────────────────────────────────────

function makeCoordFns(xMin: number, xMax: number, yMin: number, yMax: number) {
  const toCanvasX = (mx: number) => ((mx - xMin) / (xMax - xMin)) * CW;
  const toCanvasY = (my: number) => CH - ((my - yMin) / (yMax - yMin)) * CH;
  const toMathX   = (cx: number) => xMin + (cx / CW) * (xMax - xMin);
  const toMathY   = (cy: number) => yMax - (cy / CH) * (yMax - yMin);
  return { toCanvasX, toCanvasY, toMathX, toMathY };
}

// ── Canvas drawing primitives ─────────────────────────────────────────────────

function niceTick(range: number, maxTicks: number): number {
  const raw = range / maxTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 2.5, 5, 10]) if (mag * m >= raw) return mag * m;
  return mag * 10;
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  xMin: number, xMax: number,
  yMin: number, yMax: number,
  dark: boolean,
) {
  const { toCanvasX, toCanvasY } = makeCoordFns(xMin, xMax, yMin, yMax);
  const gridCol = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const axisCol = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const labelCol = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  // Background
  ctx.fillStyle = dark ? '#18181b' : '#f9fafb';
  ctx.fillRect(0, 0, CW, CH);

  // Grid
  const xStep = niceTick(xMax - xMin, 8);
  const yStep = niceTick(yMax - yMin, 6);

  ctx.strokeStyle = gridCol;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax + 1e-9; v += xStep) {
    const cx = toCanvasX(v);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, CH); ctx.stroke();
  }
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax + 1e-9; v += yStep) {
    const cy = toCanvasY(v);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(CW, cy); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = axisCol;
  ctx.lineWidth = 1.5;
  const ax = Math.max(0, Math.min(CW, toCanvasX(0)));
  const ay = Math.max(0, Math.min(CH, toCanvasY(0)));
  ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(CW, ay); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, CH); ctx.stroke();

  // Tick labels
  ctx.fillStyle = labelCol;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax + 1e-9; v += xStep) {
    const rv = Math.round(v * 100) / 100;
    if (Math.abs(rv) < 1e-9) continue;
    ctx.fillText(String(rv), toCanvasX(rv), Math.min(CH - 4, ay + 13));
  }
  ctx.textAlign = 'right';
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax + 1e-9; v += yStep) {
    const rv = Math.round(v * 100) / 100;
    if (Math.abs(rv) < 1e-9) continue;
    ctx.fillText(String(rv), Math.max(28, ax - 4), toCanvasY(rv) + 3.5);
  }
}

function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.pts.length < 2) return;
  ctx.save();
  if (stroke.eraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = 24;
  } else {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(stroke.pts[0].x, stroke.pts[0].y);
  for (let i = 1; i < stroke.pts.length - 1; i++) {
    const mx = (stroke.pts[i].x + stroke.pts[i + 1].x) / 2;
    const my = (stroke.pts[i].y + stroke.pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(stroke.pts[i].x, stroke.pts[i].y, mx, my);
  }
  ctx.lineTo(stroke.pts[stroke.pts.length - 1].x, stroke.pts[stroke.pts.length - 1].y);
  ctx.stroke();
  ctx.restore();
}

function renderAsymptote(
  ctx: CanvasRenderingContext2D,
  mark: AsymptoteMark,
  toCanvasX: (x: number) => number,
  toCanvasY: (y: number) => number,
) {
  ctx.save();
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 1.8;
  if (mark.kind === 'v') {
    const cx = toCanvasX(mark.pos);
    ctx.strokeStyle = 'rgba(249,115,22,0.8)';
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, CH); ctx.stroke();
  } else {
    const cy = toCanvasY(mark.pos);
    ctx.strokeStyle = 'rgba(25, 100, 126,0.8)';
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(CW, cy); ctx.stroke();
  }
  ctx.restore();
}

function renderFunctionCurve(
  ctx: CanvasRenderingContext2D,
  expr: string,
  xMin: number, xMax: number,
  yMin: number, yMax: number,
) {
  const { toCanvasX, toCanvasY } = makeCoordFns(xMin, xMax, yMin, yMax);
  const maxJump = (yMax - yMin) * 0.7;
  let started = false;
  let prevY: number | null = null;

  ctx.save();
  ctx.strokeStyle = 'rgba(34,197,94,0.85)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();

  const samples = 600;
  for (let i = 0; i <= samples; i++) {
    const x = xMin + (i / samples) * (xMax - xMin);
    let y: number;
    try { y = evaluate(expr, { x }) as number; } catch { y = NaN; }

    const bad = !isFinite(y) || y < yMin - maxJump || y > yMax + maxJump;
    const jump = prevY !== null && Math.abs(y - prevY) > maxJump;

    if (bad || jump) { started = false; prevY = null; continue; }

    const cx = toCanvasX(x);
    const cy = toCanvasY(y);
    if (!started) { ctx.moveTo(cx, cy); started = true; }
    else ctx.lineTo(cx, cy);
    prevY = y;
  }
  ctx.stroke();
  ctx.restore();
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(
  criticalMarks: CriticalMark[],
  asymptoteMarks: AsymptoteMark[],
  endPos: string,
  endNeg: string,
  correct: GraphAnalysisCorrect,
): boolean {
  const tol = 0.25;
  const correctCPs = correct.criticalPoints ?? [];
  const cpOk = correctCPs.length === 0 || correctCPs.every(ccp =>
    criticalMarks.some(m =>
      Math.abs(m.mx - ccp.x) <= (ccp.tol ?? tol) &&
      Math.abs(m.my - ccp.y) <= (ccp.tol ?? tol) &&
      m.type === ccp.type
    )
  );

  const vas = asymptoteMarks.filter(a => a.kind === 'v').map(a => a.pos);
  const has = asymptoteMarks.filter(a => a.kind === 'h').map(a => a.pos);
  const correctVAs = correct.verticalAsymptotes ?? [];
  const vaOk = correctVAs.length === 0
    ? vas.length === 0
    : correctVAs.every(cv => vas.some(sv => Math.abs(sv - cv) <= tol));
  const correctHAs = correct.horizontalAsymptotes ?? [];
  const haOk = correctHAs.length === 0
    ? has.length === 0
    : correctHAs.every(ch => has.some(sh => Math.abs(sh - ch) <= tol));

  const endPosOk = !correct.endBehaviorPosInf || endPos === correct.endBehaviorPosInf;
  const endNegOk = !correct.endBehaviorNegInf || endNeg === correct.endBehaviorNegInf;
  return cpOk && vaOk && haOk && endPosOk && endNegOk;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

const POINT_COLORS: Record<CriticalPointType, string> = {
  max: '#22c55e',
  min: '#ef4444',
  inflection: '#e87c2b',
};

// ── Tool config ───────────────────────────────────────────────────────────────

const TOOLS: Array<{
  id: Tool;
  label: string;
  icon: React.ReactNode;
  group: number;
  tip: string;
}> = [
  { id: 'pen',        label: 'Rita',         icon: <Pen className="h-4 w-4" />,        group: 0, tip: 'Ritpenna' },
  { id: 'eraser',     label: 'Sudda',        icon: <Eraser className="h-4 w-4" />,     group: 0, tip: 'Sudda' },
  { id: 'max',        label: 'Max',          icon: <ChevronUp className="h-4 w-4" />,  group: 1, tip: 'Markera lokalt maximum' },
  { id: 'min',        label: 'Min',          icon: <ChevronDown className="h-4 w-4" />,group: 1, tip: 'Markera lokalt minimum' },
  { id: 'inflection', label: 'Inflexion',    icon: <Diamond className="h-4 w-4" />,    group: 1, tip: 'Markera inflexionspunkt' },
  { id: 'va',         label: 'Lod. asym.',   icon: <Minus className="h-4 w-4 rotate-90" />, group: 2, tip: 'Lodrät asymptot (klicka på x-värde)' },
  { id: 'ha',         label: 'Vågr. asym.',  icon: <Minus className="h-4 w-4" />,      group: 2, tip: 'Vågrät asymptot (klicka på y-värde)' },
];

const PEN_COLORS = ['#3585a3', '#ef4444', '#22c55e', '#e87c2b', '#19647e', '#0f172a'];

// ── Main component ─────────────────────────────────────────────────────────────

export interface GraphDrawingInputProps {
  functionExpr?: string;
  xMin?: number; xMax?: number;
  yMin?: number; yMax?: number;
  correctData: GraphAnalysisCorrect;
  feedback: 'idle' | 'correct' | 'wrong';
  onAnswer: (correct: boolean) => void;
}

export function GraphDrawingInput({
  functionExpr,
  xMin = -2, xMax = 5,
  yMin = -3.5, yMax = 3.5,
  correctData,
  feedback,
  onAnswer,
}: GraphDrawingInputProps) {
  const reduceMotion = useReducedMotion();
  const submitted = feedback !== 'idle';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const dprRef = useRef(1);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [criticalMarks, setCriticalMarks] = useState<CriticalMark[]>([]);
  const [asymptoteMarks, setAsymptoteMarks] = useState<AsymptoteMark[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [penColor, setPenColor] = useState('#3585a3');
  const [penWidth, setPenWidth] = useState(2.5);
  const [endPos, setEndPos] = useState('');
  const [endNeg, setEndNeg] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [hoverMath, setHoverMath] = useState<Pt | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [history, setHistory] = useState<Array<{ strokes: Stroke[]; criticalMarks: CriticalMark[]; asymptoteMarks: AsymptoteMark[] }>>([]);

  // Detect dark mode
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // DPR scaling on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
  }, []);

  // Coordinate helpers (memoised on axis bounds)
  const { toCanvasX, toCanvasY, toMathX, toMathY } = makeCoordFns(xMin, xMax, yMin, yMax);

  // ── Full canvas redraw ────────────────────────────────────────────────────────

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Save/restore because DPR scale is persistent on the context
    ctx.save();
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);

    drawGrid(ctx, xMin, xMax, yMin, yMax, isDark);

    // Strokes (committed)
    for (const s of strokes) renderStroke(ctx, s);

    // In-progress stroke
    if (currentStrokeRef.current) renderStroke(ctx, currentStrokeRef.current);

    // Asymptote marks
    for (const m of asymptoteMarks) renderAsymptote(ctx, m, toCanvasX, toCanvasY);

    // Solution curve
    if (showSolution && functionExpr) {
      renderFunctionCurve(ctx, functionExpr, xMin, xMax, yMin, yMax);
    }

    ctx.restore();
  }, [strokes, asymptoteMarks, showSolution, functionExpr, xMin, xMax, yMin, yMax, isDark, toCanvasX, toCanvasY]);

  useEffect(() => { redrawAll(); }, [redrawAll]);

  // ── Pointer event helpers ─────────────────────────────────────────────────────

  function canvasPt(e: PointerEvent<HTMLCanvasElement>): Pt {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = CH / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function saveHistory() {
    setHistory(h => [...h.slice(-19), {
      strokes: [...strokes],
      criticalMarks: [...criticalMarks],
      asymptoteMarks: [...asymptoteMarks],
    }]);
  }

  // ── Pointer handlers ──────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (submitted) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = canvasPt(e);
    const mx = toMathX(pt.x);
    const my = toMathY(pt.y);

    if (tool === 'pen' || tool === 'eraser') {
      saveHistory();
      const stroke: Stroke = {
        id: uid(),
        pts: [pt],
        eraser: tool === 'eraser',
        color: penColor,
        width: penWidth,
      };
      currentStrokeRef.current = stroke;
      return;
    }

    if (tool === 'max' || tool === 'min' || tool === 'inflection') {
      saveHistory();
      setCriticalMarks(ms => [...ms, {
        id: uid(), cx: pt.x, cy: pt.y, mx, my, type: tool as CriticalPointType,
      }]);
      return;
    }

    if (tool === 'va' || tool === 'ha') {
      saveHistory();
      setAsymptoteMarks(ms => [...ms, {
        id: uid(), pos: tool === 'va' ? mx : my, kind: tool === 'va' ? 'v' : 'h',
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, tool, penColor, penWidth, strokes, criticalMarks, asymptoteMarks, toMathX, toMathY]);

  const onPointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const pt = canvasPt(e);
    setHoverMath({ x: toMathX(pt.x), y: toMathY(pt.y) });

    if (!currentStrokeRef.current || submitted) return;
    currentStrokeRef.current.pts.push(pt);
    // Incremental draw (fast path — no React re-render)
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    renderStroke(ctx, currentStrokeRef.current);
    ctx.restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, toMathX, toMathY]);

  const onPointerUp = useCallback(() => {
    if (!currentStrokeRef.current) return;
    const finished = { ...currentStrokeRef.current, pts: [...currentStrokeRef.current.pts] };
    currentStrokeRef.current = null;
    setStrokes(ss => [...ss, finished]);
  }, []);

  const onPointerLeave = useCallback(() => {
    setHoverMath(null);
    onPointerUp();
  }, [onPointerUp]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setStrokes(prev.strokes);
    setCriticalMarks(prev.criticalMarks);
    setAsymptoteMarks(prev.asymptoteMarks);
    setHistory(h => h.slice(0, -1));
  };

  const clearAll = () => {
    saveHistory();
    setStrokes([]);
    setCriticalMarks([]);
    setAsymptoteMarks([]);
  };

  const handleSubmit = () => {
    const correct = validate(criticalMarks, asymptoteMarks, endPos, endNeg, correctData);
    onAnswer(correct);
  };

  const canSubmit = !submitted && (endPos !== '' && endNeg !== '');

  // ── Preview cursor position display ───────────────────────────────────────────

  const showCoords = hoverMath && (tool === 'va' || tool === 'ha' || tool === 'max' || tool === 'min' || tool === 'inflection');

  return (
    <div className="space-y-4">
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {[0, 1, 2].map(group => (
          <div key={group} className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white/80 p-1 dark:border-zinc-700 dark:bg-zinc-900/60">
            {TOOLS.filter(t => t.group === group).map(t => {
              const active = tool === t.id;
              const accent =
                t.id === 'max' ? 'data-[active=true]:bg-emerald-500 data-[active=true]:text-white' :
                t.id === 'min' ? 'data-[active=true]:bg-red-500 data-[active=true]:text-white' :
                t.id === 'inflection' ? 'data-[active=true]:bg-orange-500 data-[active=true]:text-white' :
                t.id === 'va' ? 'data-[active=true]:bg-orange-400 data-[active=true]:text-white' :
                t.id === 'ha' ? 'data-[active=true]:bg-purple-500 data-[active=true]:text-white' :
                'data-[active=true]:bg-primary-500 data-[active=true]:text-white';
              return (
                <button
                  key={t.id}
                  title={t.tip}
                  data-active={active}
                  onClick={() => setTool(t.id)}
                  disabled={submitted}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all
                    ${active ? '' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}
                    disabled:opacity-40 ${accent}`}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
        ))}

        {/* Actions */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white/80 p-1 dark:border-zinc-700 dark:bg-zinc-900/60">
          <button
            title="Ångra"
            onClick={undo}
            disabled={submitted || history.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            title="Rensa allt"
            onClick={clearAll}
            disabled={submitted}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Pen color (only when pen tool active) */}
        <AnimatePresence>
          {tool === 'pen' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : motionDuration.correct }}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900/60"
            >
              {PEN_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  className={`h-5 w-5 rounded-full ${penColor === c ? 'ring-2 ring-white ring-offset-1' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
              {[1.5, 2.5, 4].map(w => (
                <button
                  key={w}
                  onClick={() => setPenWidth(w)}
                  className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${penWidth === w ? 'bg-primary-500' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  <div
                    className="rounded-full bg-zinc-700 dark:bg-zinc-200"
                    style={{ width: w * 3, height: w * 3 }}
                  />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      <div ref={containerRef} className="relative select-none overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
        {/* Coordinate readout */}
        {showCoords && hoverMath && (
          <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg border border-zinc-200 bg-white/90 px-2 py-1 text-[11px] font-mono text-zinc-600 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300">
            {tool === 'va' && `x = ${hoverMath.x.toFixed(2)}`}
            {tool === 'ha' && `y = ${hoverMath.y.toFixed(2)}`}
            {(tool === 'max' || tool === 'min' || tool === 'inflection') &&
              `(${hoverMath.x.toFixed(2)}, ${hoverMath.y.toFixed(2)})`}
          </div>
        )}

        {/* Solution legend */}
        {showSolution && (
          <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-emerald-400">
            <div className="h-0.5 w-6 rounded-full bg-emerald-500" />
            Faktisk kurva
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            aspectRatio: `${CW}/${CH}`,
            cursor: submitted ? 'default'
              : tool === 'eraser' ? 'cell'
              : (tool === 'va' || tool === 'ha') ? 'crosshair'
              : 'crosshair',
            touchAction: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
        />

        {/* SVG overlay for critical point markers */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${CW} ${CH}`}
          preserveAspectRatio="none"
        >
          {criticalMarks.map(m => {
            const color = POINT_COLORS[m.type];
            const label = m.type === 'max' ? '▲' : m.type === 'min' ? '▼' : '◆';
            return (
              <g key={m.id}>
                <circle cx={m.cx} cy={m.cy} r="7" fill={color} stroke="white" strokeWidth="2" />
                <text
                  x={m.cx + 10} y={m.cy + 4}
                  fontSize="11" fontWeight="700" fill={color}
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {label} {m.type}
                </text>
                {/* Coord tooltip */}
                <text
                  x={m.cx + 10} y={m.cy + 16}
                  fontSize="9" fill={color} opacity="0.8"
                  style={{ fontFamily: 'monospace' }}
                >
                  ({m.mx.toFixed(2)}, {m.my.toFixed(2)})
                </text>
              </g>
            );
          })}

          {/* VA preview while hovering */}
          {tool === 'va' && hoverMath && !submitted && (
            <line
              x1={toCanvasX(hoverMath.x)} y1={0}
              x2={toCanvasX(hoverMath.x)} y2={CH}
              stroke="rgba(249,115,22,0.4)" strokeWidth="1.5"
              strokeDasharray="6,4"
            />
          )}

          {/* HA preview while hovering */}
          {tool === 'ha' && hoverMath && !submitted && (
            <line
              x1={0} y1={toCanvasY(hoverMath.y)}
              x2={CW} y2={toCanvasY(hoverMath.y)}
              stroke="rgba(25, 100, 126,0.4)" strokeWidth="1.5"
              strokeDasharray="6,4"
            />
          )}

          {/* Asymptote labels */}
          {asymptoteMarks.map(m => {
            if (m.kind === 'v') {
              const cx = toCanvasX(m.pos);
              return (
                <text key={m.id} x={cx + 4} y={18}
                  fontSize="10" fill="rgb(249,115,22)" fontWeight="600"
                  style={{ fontFamily: 'system-ui, sans-serif' }}>
                  x={m.pos.toFixed(1)}
                </text>
              );
            }
            const cy = toCanvasY(m.pos);
            return (
              <text key={m.id} x={CW - 44} y={cy - 4}
                fontSize="10" fill="rgb(25, 100, 126)" fontWeight="600"
                style={{ fontFamily: 'system-ui, sans-serif' }}>
                y={m.pos.toFixed(1)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* ── Marker summary badges ─────────────────────────────────────────────── */}
      {(criticalMarks.length > 0 || asymptoteMarks.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {criticalMarks.map(m => (
            <div key={m.id} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{
                borderColor: `${POINT_COLORS[m.type]}60`,
                color: POINT_COLORS[m.type],
                background: `${POINT_COLORS[m.type]}12`,
              }}>
              {m.type} ({m.mx.toFixed(2)}, {m.my.toFixed(2)})
              {!submitted && (
                <button
                  onClick={() => setCriticalMarks(ms => ms.filter(x => x.id !== m.id))}
                  className="ml-1 opacity-60 hover:opacity-100"
                >×</button>
              )}
            </div>
          ))}
          {asymptoteMarks.map(m => (
            <div key={m.id}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{
                borderColor: m.kind === 'v' ? 'rgba(249,115,22,0.4)' : 'rgba(25, 100, 126,0.4)',
                color: m.kind === 'v' ? 'rgb(249,115,22)' : 'rgb(25, 100, 126)',
                background: m.kind === 'v' ? 'rgba(249,115,22,0.08)' : 'rgba(25, 100, 126,0.08)',
              }}>
              {m.kind === 'v' ? `x = ${m.pos.toFixed(2)}` : `y = ${m.pos.toFixed(2)}`}
              {!submitted && (
                <button
                  onClick={() => setAsymptoteMarks(ms => ms.filter(x => x.id !== m.id))}
                  className="ml-1 opacity-60 hover:opacity-100"
                >×</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── End behavior + submit ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        {/* x → +∞ */}
        <div className="rounded-xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            x → +∞: f(x) →
          </p>
          <div className="flex flex-wrap gap-1.5">
            {END_OPTIONS.map(o => (
              <button
                key={o.value}
                disabled={submitted}
                onClick={() => setEndPos(o.value)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition
                  ${endPos === o.value
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-primary-300 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300'}
                  disabled:cursor-not-allowed`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* x → -∞ */}
        <div className="rounded-xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            x → −∞: f(x) →
          </p>
          <div className="flex flex-wrap gap-1.5">
            {END_OPTIONS.map(o => (
              <button
                key={o.value}
                disabled={submitted}
                onClick={() => setEndNeg(o.value)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition
                  ${endNeg === o.value
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-primary-300 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300'}
                  disabled:cursor-not-allowed`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit + solution toggle */}
        <div className="flex flex-col gap-2">
          {!submitted && (
            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Skicka in
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {submitted && functionExpr && (
            <button
              onClick={() => setShowSolution(v => !v)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300"
            >
              {showSolution ? 'Dölj kurva' : 'Visa kurva'}
            </button>
          )}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Max</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Min</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />Inflexion</span>
        <span className="flex items-center gap-1.5 text-orange-400">— — Lod. asymptot</span>
        <span className="flex items-center gap-1.5 text-purple-400">— — Vågr. asymptot</span>
        {showSolution && <span className="flex items-center gap-1.5 text-emerald-500">—— Faktisk kurva</span>}
      </div>
    </div>
  );
}
