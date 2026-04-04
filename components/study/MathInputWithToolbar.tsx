'use client';

/**
 * MathInputWithToolbar — MathLive WYSIWYG input with a visual math toolbar.
 *
 * Every button shows a visual icon (SVG or Unicode), never LaTeX source code.
 * Five tabs cover the full university math curriculum.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// ── SVG icon primitives ────────────────────────────────────────────────────────

/** Dashed placeholder box — shows where the student types */
function Slot({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <rect
      x={x} y={y} width={w} height={h} rx="1.5"
      strokeWidth="1.1" strokeDasharray="2.5 2" strokeOpacity="0.4"
    />
  );
}

/** Compact SVG wrapper */
function Ic({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`} width={w} height={h}
      fill="none" stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block' }}
    >
      {children}
    </svg>
  );
}

/** Fraction-style stack: top / bar / bottom — used for d/dx, ∂/∂x, lim */
function FracStack({
  top, bottom, gap = 1,
}: {
  top: React.ReactNode;
  bottom: React.ReactNode;
  gap?: number;
}) {
  return (
    <span
      className="inline-flex flex-col items-center"
      style={{ lineHeight: 1, gap }}
    >
      {top}
      <span style={{ width: '100%', height: 1.5, background: 'currentColor', display: 'block' }} />
      {bottom}
    </span>
  );
}

// ── Icon components ────────────────────────────────────────────────────────────

const I = {
  // ── Core algebra ─────────────────────────────────────────────────────────────

  Fraction: () => (
    <Ic w={34} h={24}>
      <Slot x={2} y={1} w={30} h={8} />
      <line x1="0" y1="12.5" x2="34" y2="12.5" strokeWidth="1.8" />
      <Slot x={2} y={15} w={30} h={8} />
    </Ic>
  ),

  Sqrt: () => (
    <Ic w={36} h={24}>
      <polyline points="0,16 4,16 7,22 11,3 36,3" strokeWidth="1.5" />
      <Slot x={12} y={5} w={22} h={15} />
    </Ic>
  ),

  CubeRoot: () => (
    <Ic w={38} h={24}>
      <text x="1" y="11" fontSize="9" fill="currentColor" stroke="none" fontFamily="serif">3</text>
      <polyline points="8,16 12,16 15,22 19,3 38,3" strokeWidth="1.5" />
      <Slot x={20} y={5} w={16} h={15} />
    </Ic>
  ),

  NthRoot: () => (
    <Ic w={38} h={24}>
      <text x="0" y="11" fontSize="9" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">n</text>
      <polyline points="8,16 12,16 15,22 19,3 38,3" strokeWidth="1.5" />
      <Slot x={20} y={5} w={16} h={15} />
    </Ic>
  ),

  Power: () => (
    <span className="inline-flex items-start leading-none text-[13px]">
      <span className="font-serif italic">x</span>
      <span className="font-serif italic" style={{ fontSize: 9, marginTop: 1 }}>n</span>
    </span>
  ),

  Subscript: () => (
    <span className="inline-flex items-end leading-none text-[13px]">
      <span className="font-serif italic">x</span>
      <span className="font-serif italic" style={{ fontSize: 9, marginBottom: 1 }}>n</span>
    </span>
  ),

  SubSuper: () => (
    <span className="inline-flex items-center leading-none text-[13px]">
      <span className="font-serif italic">x</span>
      <span className="inline-flex flex-col" style={{ fontSize: 9, gap: 0, lineHeight: 1 }}>
        <span className="font-serif italic">n</span>
        <span className="font-serif italic">i</span>
      </span>
    </span>
  ),

  // Grouping — show the brackets with a centred dot as placeholder
  Paren:  () => <span className="font-mono text-base tracking-widest leading-none">( )</span>,
  Brack:  () => <span className="font-mono text-base tracking-widest leading-none">[ ]</span>,
  Brace:  () => <span className="font-mono text-base tracking-widest leading-none">{'{ }'}</span>,
  Angle:  () => <span className="font-mono text-base tracking-widest leading-none">⟨ ⟩</span>,
  Abs:    () => <span className="font-mono text-base tracking-wider leading-none">|x|</span>,
  Norm:   () => <span className="font-mono text-base leading-none">‖x‖</span>,

  // Logarithms
  Ln:     () => <span className="font-mono text-[11px] leading-none">ln(·)</span>,
  Log:    () => <span className="font-mono text-[11px] leading-none">log(·)</span>,
  LogB:   () => (
    <span className="inline-flex items-end leading-none text-[11px] font-mono">
      log<span style={{ fontSize: 8, marginBottom: 1 }}>b</span>(·)
    </span>
  ),

  // ── Calculus ─────────────────────────────────────────────────────────────────

  Prime:  () => <span className="font-serif italic text-[13px] leading-none">f ′</span>,
  Prime2: () => <span className="font-serif italic text-[13px] leading-none">f ′′</span>,

  Leibniz: () => (
    <FracStack
      top={<span className="font-serif italic text-[10px]">d</span>}
      bottom={<span className="font-serif italic text-[10px]">dx</span>}
    />
  ),

  Leibniz2: () => (
    <FracStack
      top={<span className="text-[10px]">d<sup style={{ fontSize: 7 }}>2</sup></span>}
      bottom={<span className="text-[10px]">dx<sup style={{ fontSize: 7 }}>2</sup></span>}
    />
  ),

  Partial: () => (
    <FracStack
      top={<span className="text-[11px]">∂</span>}
      bottom={<span className="text-[10px]">∂x</span>}
    />
  ),

  Nabla:  () => <span className="text-[16px] leading-none">∇</span>,
  Lapl:   () => <span className="text-[13px] leading-none">∇²</span>,

  // Integrals
  Int: () => <span className="text-[18px] leading-none font-light">∫</span>,

  DefInt: () => (
    <span className="inline-flex items-center leading-none">
      <span className="inline-flex flex-col items-center" style={{ lineHeight: 1.1 }}>
        <span className="font-serif italic" style={{ fontSize: 9 }}>b</span>
        <span style={{ fontSize: 18, fontWeight: 300 }}>∫</span>
        <span className="font-serif italic" style={{ fontSize: 9 }}>a</span>
      </span>
    </span>
  ),

  DblInt:    () => <span className="text-[16px] leading-none font-light">∬</span>,
  TriInt:    () => <span className="text-[16px] leading-none font-light">∭</span>,
  ContInt:   () => <span className="text-[16px] leading-none font-light">∮</span>,

  EvalBar: () => (
    <Ic w={22} h={26}>
      <line x1="13" y1="2" x2="13" y2="24" strokeWidth="2" />
      <text x="15" y="9"  fontSize="8" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">b</text>
      <text x="15" y="24" fontSize="8" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">a</text>
    </Ic>
  ),

  // Limits
  Lim: () => (
    <span className="inline-flex flex-col items-center leading-none" style={{ gap: 1 }}>
      <span className="font-semibold text-[12px]">lim</span>
      <span style={{ fontSize: 9 }}>x→a</span>
    </span>
  ),
  LimPlus: () => (
    <span className="inline-flex flex-col items-center leading-none" style={{ gap: 1 }}>
      <span className="font-semibold text-[12px]">lim</span>
      <span style={{ fontSize: 9 }}>x→a⁺</span>
    </span>
  ),
  LimMinus: () => (
    <span className="inline-flex flex-col items-center leading-none" style={{ gap: 1 }}>
      <span className="font-semibold text-[12px]">lim</span>
      <span style={{ fontSize: 9 }}>x→a⁻</span>
    </span>
  ),

  Arrow: () => <span className="text-[14px] leading-none">→</span>,
  Inf:   () => <span className="text-[14px] leading-none">∞</span>,
  PInf:  () => <span className="text-[12px] leading-none">+∞</span>,
  MInf:  () => <span className="text-[12px] leading-none">−∞</span>,

  // Trig — just the standard function name (this IS the accepted notation)
  Sin:    () => <span className="font-mono text-[11px] leading-none">sin</span>,
  Cos:    () => <span className="font-mono text-[11px] leading-none">cos</span>,
  Tan:    () => <span className="font-mono text-[11px] leading-none">tan</span>,
  Sec:    () => <span className="font-mono text-[11px] leading-none">sec</span>,
  Csc:    () => <span className="font-mono text-[11px] leading-none">csc</span>,
  Cot:    () => <span className="font-mono text-[11px] leading-none">cot</span>,
  Arcsin: () => <span className="font-mono text-[9px] leading-none">arcsin</span>,
  Arccos: () => <span className="font-mono text-[9px] leading-none">arccos</span>,
  Arctan: () => <span className="font-mono text-[9px] leading-none">arctan</span>,
  Sinh:   () => <span className="font-mono text-[11px] leading-none">sinh</span>,
  Cosh:   () => <span className="font-mono text-[11px] leading-none">cosh</span>,
  Tanh:   () => <span className="font-mono text-[11px] leading-none">tanh</span>,

  // ── Discrete / Statistics ─────────────────────────────────────────────────────

  Sum: () => (
    <span className="inline-flex flex-col items-center leading-none" style={{ gap: 0 }}>
      <span className="font-serif" style={{ fontSize: 9 }}>n</span>
      <span className="font-serif" style={{ fontSize: 18, lineHeight: 1 }}>Σ</span>
      <span className="font-serif" style={{ fontSize: 9 }}>i=0</span>
    </span>
  ),

  Prod: () => (
    <span className="inline-flex flex-col items-center leading-none" style={{ gap: 0 }}>
      <span className="font-serif" style={{ fontSize: 9 }}>n</span>
      <span className="font-serif" style={{ fontSize: 18, lineHeight: 1 }}>Π</span>
      <span className="font-serif" style={{ fontSize: 9 }}>i=0</span>
    </span>
  ),

  Fact: () => <span className="text-[13px] leading-none font-mono">n!</span>,

  Binom: () => (
    <span className="inline-flex items-center leading-none" style={{ fontSize: 12 }}>
      <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>(</span>
      <span className="inline-flex flex-col items-center" style={{ gap: 1 }}>
        <span className="font-serif italic" style={{ fontSize: 10 }}>n</span>
        <span className="font-serif italic" style={{ fontSize: 10 }}>k</span>
      </span>
      <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>)</span>
    </span>
  ),

  Mean:    () => <span className="font-serif italic text-[13px] leading-none">x̄</span>,
  StdDev:  () => <span className="font-serif text-[14px] leading-none">σ</span>,
  ExpVal:  () => <span className="font-mono text-[11px] leading-none">E[·]</span>,
  Prob:    () => <span className="font-mono text-[11px] leading-none">P(·)</span>,
  CondP:   () => <span className="font-mono text-[10px] leading-none">P(·|·)</span>,
  Var:     () => <span className="font-mono text-[10px] leading-none">Var(·)</span>,
  Floor:   () => <span className="font-mono text-[13px] leading-none">⌊·⌋</span>,
  Ceil:    () => <span className="font-mono text-[13px] leading-none">⌈·⌉</span>,

  Piecewise: () => (
    <span className="inline-flex items-center leading-none" style={{ fontSize: 11 }}>
      <span style={{ fontSize: 24, lineHeight: 1, fontWeight: 200 }}>{'{'}</span>
      <span className="inline-flex flex-col" style={{ gap: 3, lineHeight: 1.2 }}>
        <span>a &nbsp;<span style={{ opacity: 0.5 }}>if p</span></span>
        <span>b &nbsp;<span style={{ opacity: 0.5 }}>if q</span></span>
      </span>
    </span>
  ),

  // ── Linear Algebra ────────────────────────────────────────────────────────────

  // 2×2 matrix with square brackets
  Mat2Brack: () => (
    <Ic w={40} h={30}>
      <path d="M9,2 L5,2 L5,28 L9,28" strokeWidth="1.5" />
      <path d="M31,2 L35,2 L35,28 L31,28" strokeWidth="1.5" />
      <Slot x={10} y={5}  w={9} h={9} />
      <Slot x={21} y={5}  w={9} h={9} />
      <Slot x={10} y={17} w={9} h={9} />
      <Slot x={21} y={17} w={9} h={9} />
    </Ic>
  ),

  // 3×3 matrix with square brackets
  Mat3Brack: () => (
    <Ic w={50} h={36}>
      <path d="M9,2 L5,2 L5,34 L9,34" strokeWidth="1.5" />
      <path d="M41,2 L45,2 L45,34 L41,34" strokeWidth="1.5" />
      <Slot x={10} y={4}  w={8} h={8} /><Slot x={21} y={4}  w={8} h={8} /><Slot x={32} y={4}  w={8} h={8} />
      <Slot x={10} y={15} w={8} h={8} /><Slot x={21} y={15} w={8} h={8} /><Slot x={32} y={15} w={8} h={8} />
      <Slot x={10} y={25} w={8} h={8} /><Slot x={21} y={25} w={8} h={8} /><Slot x={32} y={25} w={8} h={8} />
    </Ic>
  ),

  // 2×2 matrix with round parentheses
  Mat2Paren: () => (
    <Ic w={40} h={30}>
      <path d="M9,2 Q3,15 9,28" strokeWidth="1.5" fill="none" />
      <path d="M31,2 Q37,15 31,28" strokeWidth="1.5" fill="none" />
      <Slot x={10} y={5}  w={9} h={9} />
      <Slot x={21} y={5}  w={9} h={9} />
      <Slot x={10} y={17} w={9} h={9} />
      <Slot x={21} y={17} w={9} h={9} />
    </Ic>
  ),

  // 3×3 matrix with round parentheses
  Mat3Paren: () => (
    <Ic w={50} h={36}>
      <path d="M9,2 Q3,18 9,34" strokeWidth="1.5" fill="none" />
      <path d="M41,2 Q47,18 41,34" strokeWidth="1.5" fill="none" />
      <Slot x={10} y={4}  w={8} h={8} /><Slot x={21} y={4}  w={8} h={8} /><Slot x={32} y={4}  w={8} h={8} />
      <Slot x={10} y={15} w={8} h={8} /><Slot x={21} y={15} w={8} h={8} /><Slot x={32} y={15} w={8} h={8} />
      <Slot x={10} y={25} w={8} h={8} /><Slot x={21} y={25} w={8} h={8} /><Slot x={32} y={25} w={8} h={8} />
    </Ic>
  ),

  // 2×2 determinant (vertical bars)
  Det2: () => (
    <Ic w={38} h={30}>
      <line x1="5"  y1="2" x2="5"  y2="28" strokeWidth="1.5" />
      <line x1="33" y1="2" x2="33" y2="28" strokeWidth="1.5" />
      <Slot x={8}  y={5}  w={9} h={9} />
      <Slot x={21} y={5}  w={9} h={9} />
      <Slot x={8}  y={17} w={9} h={9} />
      <Slot x={21} y={17} w={9} h={9} />
    </Ic>
  ),

  // Vector with arrow above
  VecArrow: () => (
    <Ic w={22} h={22}>
      <text x="2" y="18" fontSize="13" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">v</text>
      <line x1="2" y1="5" x2="17" y2="5" strokeWidth="1.3" />
      <polyline points="13,2 17,5 13,8" strokeWidth="1.3" />
    </Ic>
  ),

  VecBold:    () => <span className="font-bold text-[13px] leading-none">v</span>,
  Transpose:  () => (
    <span className="text-[13px] leading-none">
      A<sup style={{ fontSize: 9 }}>T</sup>
    </span>
  ),
  Inverse:    () => (
    <span className="text-[13px] leading-none">
      A<sup style={{ fontSize: 9 }}>−1</sup>
    </span>
  ),
  VNorm:      () => <span className="font-mono text-[13px] leading-none">‖v‖</span>,
  DotProd:    () => <span className="text-[12px] leading-none">u · v</span>,
  CrossProd:  () => <span className="text-[12px] leading-none">u × v</span>,
  Det:        () => <span className="font-mono text-[10px] leading-none">det(·)</span>,
  Rank:       () => <span className="font-mono text-[10px] leading-none">rank(·)</span>,
  Span:       () => <span className="font-mono text-[10px] leading-none">span{'{'}</span>,
  Ker:        () => <span className="font-mono text-[10px] leading-none">ker(·)</span>,
  Dim:        () => <span className="font-mono text-[10px] leading-none">dim(·)</span>,
  ATA:        () => (
    <span className="text-[12px] leading-none">
      A<sup style={{ fontSize: 9 }}>T</sup>A
    </span>
  ),
};

// ── MathLive types ─────────────────────────────────────────────────────────────

interface MathfieldElement extends HTMLElement {
  value: string;
  insert(text: string, options?: { insertionMode?: string; selectionMode?: string }): boolean;
  focus(): void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.Ref<MathfieldElement>;
        class?: string;
        style?: React.CSSProperties;
        'smart-fence'?: string;
        'virtual-keyboard-mode'?: string;
      };
    }
  }
}

// ── Tool definitions ───────────────────────────────────────────────────────────

interface MathTool {
  icon: React.ReactNode;
  latex: string;
  title: string;
}

interface ToolGroup {
  label: string;
  tools: MathTool[];
}

const TOOL_GROUPS: ToolGroup[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  {
    label: 'Grundläggande',
    tools: [
      { icon: <span className="text-base font-mono">+</span>,  latex: '+',                                   title: 'Addition' },
      { icon: <span className="text-base font-mono">−</span>,  latex: '-',                                   title: 'Subtraktion' },
      { icon: <span className="text-base">×</span>,            latex: '\\times',                             title: 'Multiplikation ×' },
      { icon: <span className="text-base">÷</span>,            latex: '\\div',                               title: 'Division ÷' },
      { icon: <span className="text-base">±</span>,            latex: '\\pm',                                title: 'Plus-minus ±' },
      { icon: <span className="text-base font-mono">=</span>,  latex: '=',                                   title: 'Lika med' },

      { icon: <I.Fraction />,   latex: '\\frac{#@}{#?}',          title: 'Bråk a/b' },
      { icon: <I.Power />,      latex: '{#@}^{#?}',                title: 'Exponent xⁿ' },
      { icon: <I.Subscript />,  latex: '{#@}_{#?}',                title: 'Index xₙ' },
      { icon: <I.SubSuper />,   latex: '{#@}_{#?}^{#?}',           title: 'Index + exponent xₙᵐ' },

      { icon: <I.Sqrt />,       latex: '\\sqrt{#@}',               title: 'Kvadratrot √x' },
      { icon: <I.CubeRoot />,   latex: '\\sqrt[3]{#@}',            title: 'Kubikrot ∛x' },
      { icon: <I.NthRoot />,    latex: '\\sqrt[#?]{#@}',           title: 'n:te rot ⁿ√x' },

      { icon: <I.Paren />,      latex: '\\left(#@\\right)',         title: 'Parenteser ( ) — auto-skalade' },
      { icon: <I.Brack />,      latex: '\\left[#@\\right]',         title: 'Hakparenteser [ ]' },
      { icon: <I.Brace />,      latex: '\\left\\{#@\\right\\}',     title: 'Klammerparenteser { }' },
      { icon: <I.Angle />,      latex: '\\langle#@\\rangle',        title: 'Vinkelparenteser ⟨ ⟩' },
      { icon: <I.Abs />,        latex: '\\left|#@\\right|',         title: 'Absolutbelopp |x|' },
      { icon: <I.Norm />,       latex: '\\left\\|#@\\right\\|',     title: 'Norm ‖v‖' },

      { icon: <I.Ln />,         latex: '\\ln\\left(#@\\right)',     title: 'Naturlig logaritm ln(x)' },
      { icon: <I.Log />,        latex: '\\log\\left(#@\\right)',    title: 'Logaritm (bas 10)' },
      { icon: <I.LogB />,       latex: '\\log_{#?}\\left(#@\\right)', title: 'Logaritm med godtycklig bas' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    label: 'Analys',
    tools: [
      { icon: <I.Prime />,    latex: "{#@}'",                                   title: "Derivata — primnotation f'(x)" },
      { icon: <I.Prime2 />,   latex: "{#@}''",                                  title: "Andraderivata f''(x)" },
      { icon: <I.Leibniz />,  latex: '\\frac{d}{dx}\\left(#@\\right)',          title: 'Derivata — Leibniz d/dx' },
      { icon: <I.Leibniz2 />, latex: '\\frac{d^2}{dx^2}\\left(#@\\right)',      title: 'Andraderivata — Leibniz d²/dx²' },
      { icon: <I.Partial />,  latex: '\\frac{\\partial #@}{\\partial #?}',      title: 'Partiell derivata ∂/∂x' },
      { icon: <I.Nabla />,    latex: '\\nabla',                                 title: 'Nabla / gradient ∇' },
      { icon: <I.Lapl />,     latex: '\\nabla^{2}',                             title: 'Laplacian ∇²' },

      { icon: <I.Int />,      latex: '\\int #? \\, d#?',                        title: 'Obestämd integral' },
      { icon: <I.DefInt />,   latex: '\\int_{#?}^{#?} #? \\, d#?',             title: 'Bestämd integral ∫_a^b' },
      { icon: <I.DblInt />,   latex: '\\iint_{#?} #? \\, dA',                  title: 'Dubbelintegral ∬' },
      { icon: <I.TriInt />,   latex: '\\iiint_{#?} #? \\, dV',                 title: 'Trippelintegral ∭' },
      { icon: <I.ContInt />,  latex: '\\oint_{#?} #? \\, d#?',                 title: 'Kurvintegral ∮' },
      { icon: <I.EvalBar />,  latex: '\\Bigg|_{#?}^{#?}',                       title: 'Utvärderingsbeteckning |_a^b' },

      { icon: <I.Lim />,      latex: '\\lim_{#? \\to #?}',                     title: 'Gränsvärde' },
      { icon: <I.LimPlus />,  latex: '\\lim_{#? \\to {#?}^+}',                 title: 'Höger gränsvärde (x→a⁺)' },
      { icon: <I.LimMinus />, latex: '\\lim_{#? \\to {#?}^-}',                 title: 'Vänster gränsvärde (x→a⁻)' },
      { icon: <I.Arrow />,    latex: '\\to',                                    title: 'Tenderar mot →' },
      { icon: <I.Inf />,      latex: '\\infty',                                 title: 'Oändlighet ∞' },
      { icon: <I.PInf />,     latex: '+\\infty',                                title: 'Positiv oändlighet +∞' },
      { icon: <I.MInf />,     latex: '-\\infty',                                title: 'Negativ oändlighet −∞' },

      { icon: <I.Sin />,      latex: '\\sin\\left(#@\\right)',   title: 'Sinus' },
      { icon: <I.Cos />,      latex: '\\cos\\left(#@\\right)',   title: 'Cosinus' },
      { icon: <I.Tan />,      latex: '\\tan\\left(#@\\right)',   title: 'Tangens' },
      { icon: <I.Sec />,      latex: '\\sec\\left(#@\\right)',   title: 'Sekant' },
      { icon: <I.Csc />,      latex: '\\csc\\left(#@\\right)',   title: 'Cosekant' },
      { icon: <I.Cot />,      latex: '\\cot\\left(#@\\right)',   title: 'Cotangens' },
      { icon: <I.Arcsin />,   latex: '\\arcsin\\left(#@\\right)', title: 'Arcussinus (sin⁻¹)' },
      { icon: <I.Arccos />,   latex: '\\arccos\\left(#@\\right)', title: 'Arcuscosinus (cos⁻¹)' },
      { icon: <I.Arctan />,   latex: '\\arctan\\left(#@\\right)', title: 'Arcustangens (tan⁻¹)' },
      { icon: <I.Sinh />,     latex: '\\sinh\\left(#@\\right)',  title: 'Sinus hyperbolicus' },
      { icon: <I.Cosh />,     latex: '\\cosh\\left(#@\\right)',  title: 'Cosinus hyperbolicus' },
      { icon: <I.Tanh />,     latex: '\\tanh\\left(#@\\right)',  title: 'Tangens hyperbolicus' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    label: 'Diskret/Stat',
    tools: [
      { icon: <I.Sum />,        latex: '\\sum_{#?}^{#?} #?',                   title: 'Summa Σ' },
      { icon: <I.Prod />,       latex: '\\prod_{#?}^{#?} #?',                  title: 'Produkt Π' },
      { icon: <I.Fact />,       latex: '{#@}!',                                 title: 'Fakultet n!' },
      { icon: <I.Binom />,      latex: '\\binom{#?}{#?}',                       title: 'Binomialkoefficient — n välj k' },

      { icon: <I.Mean />,       latex: '\\bar{#@}',                             title: 'Medelvärde x̄' },
      { icon: <I.StdDev />,     latex: '\\sigma',                               title: 'Standardavvikelse σ' },
      { icon: <I.ExpVal />,     latex: 'E\\left[#@\\right]',                    title: 'Väntevärde E[X]' },
      { icon: <I.Prob />,       latex: 'P\\left(#@\\right)',                    title: 'Sannolikhet P(A)' },
      { icon: <I.CondP />,      latex: 'P\\left(#@\\mid #?\\right)',            title: 'Betingad sannolikhet P(A|B)' },
      { icon: <I.Var />,        latex: '\\text{Var}\\left(#@\\right)',          title: 'Varians Var(X)' },

      { icon: <I.Floor />,      latex: '\\lfloor #@ \\rfloor',                  title: 'Golvfunktion ⌊x⌋' },
      { icon: <I.Ceil />,       latex: '\\lceil #@ \\rceil',                    title: 'Takfunktion ⌈x⌉' },
      { icon: <I.Piecewise />,  latex: '\\begin{cases} #? & \\text{if } #? \\\\ #? & \\text{if } #? \\end{cases}', title: 'Styckvis definierad funktion' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    label: 'Linjär algebra',
    tools: [
      { icon: <I.Mat2Brack />,  latex: '\\begin{bmatrix} #? & #? \\\\ #? & #? \\end{bmatrix}',                                           title: 'Matris 2×2 med hakparenteser' },
      { icon: <I.Mat3Brack />,  latex: '\\begin{bmatrix} #? & #? & #? \\\\ #? & #? & #? \\\\ #? & #? & #? \\end{bmatrix}',               title: 'Matris 3×3 med hakparenteser' },
      { icon: <I.Mat2Paren />,  latex: '\\begin{pmatrix} #? & #? \\\\ #? & #? \\end{pmatrix}',                                           title: 'Matris 2×2 med parenteser' },
      { icon: <I.Mat3Paren />,  latex: '\\begin{pmatrix} #? & #? & #? \\\\ #? & #? & #? \\\\ #? & #? & #? \\end{pmatrix}',               title: 'Matris 3×3 med parenteser' },
      { icon: <I.Det2 />,       latex: '\\begin{vmatrix} #? & #? \\\\ #? & #? \\end{vmatrix}',                                           title: 'Determinant 2×2' },

      { icon: <I.VecArrow />,   latex: '\\vec{#@}',                             title: 'Vektor med pil v⃗' },
      { icon: <I.VecBold />,    latex: '\\mathbf{#@}',                          title: 'Vektor fetstil v' },
      { icon: <I.Transpose />,  latex: '{#@}^{T}',                              title: 'Transponerad matris Aᵀ' },
      { icon: <I.Inverse />,    latex: '{#@}^{-1}',                             title: 'Invers matris A⁻¹' },
      { icon: <I.VNorm />,      latex: '\\left\\|#@\\right\\|',                 title: 'Norm / längd ‖v‖' },
      { icon: <I.DotProd />,    latex: '#@ \\cdot #?',                          title: 'Skalärprodukt u·v' },
      { icon: <I.CrossProd />,  latex: '#@ \\times #?',                         title: 'Vektorprodukt u×v' },
      { icon: <I.Det />,        latex: '\\det\\left(#@\\right)',                 title: 'Determinant det(A)' },
      { icon: <I.Rank />,       latex: '\\text{rank}\\left(#@\\right)',          title: 'Rang rank(A)' },
      { icon: <I.Span />,       latex: '\\text{span}\\left\\{#@\\right\\}',     title: 'Linjärt hölje span{…}' },
      { icon: <I.Ker />,        latex: '\\ker\\left(#@\\right)',                 title: 'Kärna ker(A)' },
      { icon: <I.Dim />,        latex: '\\dim\\left(#@\\right)',                 title: 'Dimension dim(V)' },
      { icon: <I.ATA />,        latex: '{#@}^{T}#?',                            title: 'Normalekvationsform AᵀA' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    label: 'Symboler',
    tools: [
      // Greek lowercase
      ...[
        ['α','\\alpha','Alpha α'], ['β','\\beta','Beta β'], ['γ','\\gamma','Gamma γ'],
        ['δ','\\delta','Delta δ'], ['ε','\\epsilon','Epsilon ε'], ['ζ','\\zeta','Zeta ζ'],
        ['η','\\eta','Eta η'],     ['θ','\\theta','Theta θ'],    ['κ','\\kappa','Kappa κ'],
        ['λ','\\lambda','Lambda λ'],['μ','\\mu','Mu μ'],         ['ν','\\nu','Nu ν'],
        ['ξ','\\xi','Xi ξ'],       ['π','\\pi','Pi π'],          ['ρ','\\rho','Rho ρ'],
        ['σ','\\sigma','Sigma σ'], ['τ','\\tau','Tau τ'],        ['φ','\\phi','Phi φ'],
        ['χ','\\chi','Chi χ'],     ['ψ','\\psi','Psi ψ'],        ['ω','\\omega','Omega ω'],
      ].map(([ch, latex, title]) => ({
        icon: <span className="font-serif text-[14px] leading-none">{ch}</span>,
        latex: latex as string,
        title: title as string,
      })),

      // Greek uppercase
      ...[
        ['Γ','\\Gamma','Gamma Γ'], ['Δ','\\Delta','Delta Δ'], ['Θ','\\Theta','Theta Θ'],
        ['Λ','\\Lambda','Lambda Λ'],['Ξ','\\Xi','Xi Ξ'],     ['Π','\\Pi','Pi Π'],
        ['Σ','\\Sigma','Sigma Σ'], ['Φ','\\Phi','Phi Φ'],    ['Ψ','\\Psi','Psi Ψ'],
        ['Ω','\\Omega','Omega Ω'],
      ].map(([ch, latex, title]) => ({
        icon: <span className="font-serif text-[14px] leading-none">{ch}</span>,
        latex: latex as string,
        title: title as string,
      })),

      // Number sets (blackboard bold)
      ...[
        ['ℝ','\\mathbb{R}','Reella tal ℝ'], ['ℤ','\\mathbb{Z}','Heltal ℤ'],
        ['ℕ','\\mathbb{N}','Naturliga tal ℕ'], ['ℚ','\\mathbb{Q}','Rationella tal ℚ'],
        ['ℂ','\\mathbb{C}','Komplexa tal ℂ'],
      ].map(([ch, latex, title]) => ({
        icon: <span className="text-[14px] leading-none font-bold">{ch}</span>,
        latex: latex as string,
        title: title as string,
      })),

      // Set theory
      ...[
        ['∈','\\in','Tillhör ∈'], ['∉','\\notin','Tillhör ej ∉'],
        ['⊂','\\subset','Äkta delmängd ⊂'], ['⊆','\\subseteq','Delmängd ⊆'],
        ['∪','\\cup','Union ∪'], ['∩','\\cap','Snitt ∩'],
        ['∅','\\emptyset','Tom mängd ∅'], ['∖','\\setminus','Mängddifferens ∖'],
      ].map(([ch, latex, title]) => ({
        icon: <span className="text-[14px] leading-none">{ch}</span>,
        latex: latex as string,
        title: title as string,
      })),

      // Logic & quantifiers
      ...[
        ['∧','\\land','Och ∧'], ['∨','\\lor','Eller ∨'], ['¬','\\neg','Negation ¬'],
        ['⟹','\\implies','Implication ⟹'], ['⟺','\\iff','Ekvivalens ⟺'],
        ['∀','\\forall','För alla ∀'], ['∃','\\exists','Det finns ∃'],
        ['∴','\\therefore','Alltså ∴'], ['■','\\blacksquare','Q.E.D. ■'],
      ].map(([ch, latex, title]) => ({
        icon: <span className="text-[14px] leading-none">{ch}</span>,
        latex: latex as string,
        title: title as string,
      })),

      // Relations
      ...[
        ['≤','\\leq','Mindre än eller lika med ≤'], ['≥','\\geq','Större än eller lika med ≥'],
        ['≠','\\neq','Inte lika med ≠'], ['≈','\\approx','Ungefär lika med ≈'],
        ['≡','\\equiv','Ekvivalent / kongruent ≡'], ['∼','\\sim','Proportionell ∼'],
        ['≪','\\ll','Mycket mindre än ≪'], ['≫','\\gg','Mycket större än ≫'],
      ].map(([ch, latex, title]) => ({
        icon: <span className="text-[14px] leading-none">{ch}</span>,
        latex: latex as string,
        title: title as string,
      })),
    ],
  },
];

// ── Props ──────────────────────────────────────────────────────────────────────

export interface MathInputWithToolbarProps {
  value: string;
  onChange: (latex: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MathInputWithToolbar({
  value,
  onChange,
  disabled = false,
  placeholder = 'Bygg ditt matematiska uttryck…',
}: MathInputWithToolbarProps) {
  const mathfieldRef = useRef<MathfieldElement | null>(null);
  const [activeGroup, setActiveGroup] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);

  useEffect(() => {
    import('mathlive').then(() => setMounted(true));
  }, []);

  useEffect(() => {
    const mf = mathfieldRef.current;
    if (!mf || !mounted) return;
    if (mf.value !== value) mf.value = value;
  }, [value, mounted]);

  useEffect(() => {
    const mf = mathfieldRef.current;
    if (!mf || !mounted) return;
    const handle = () => onChange(mf.value);
    mf.addEventListener('input', handle);
    return () => mf.removeEventListener('input', handle);
  }, [mounted, onChange]);

  const insertTool = useCallback(
    (latex: string) => {
      const mf = mathfieldRef.current;
      if (!mf || disabled) return;
      mf.focus();
      mf.insert(latex, { insertionMode: 'replaceSelection', selectionMode: 'placeholder' });
      onChange(mf.value);
    },
    [disabled, onChange]
  );

  if (!mounted) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-14 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40" />
        <div className="h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* ── MathLive WYSIWYG field ── */}
      <div className="relative">
        {!value && (
          <span className="absolute top-3 left-4 text-sm text-zinc-400 dark:text-zinc-500 italic pointer-events-none select-none">
            {placeholder}
          </span>
        )}
        <div
          className={`rounded-xl border-2 transition-colors overflow-hidden ${
            disabled
              ? 'border-zinc-200 dark:border-zinc-700 opacity-60 pointer-events-none'
              : 'border-zinc-200 dark:border-zinc-700 focus-within:border-blue-400 dark:focus-within:border-blue-500/70'
          }`}
        >
          <math-field
            ref={mathfieldRef}
            class="block w-full min-h-[52px] px-4 py-3 text-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
            virtual-keyboard-mode="off"
            smart-fence="on"
            style={{
              fontFamily: 'inherit',
              '--caret-color': 'rgb(59,130,246)',
              '--selection-background-color': 'rgba(59,130,246,0.15)',
              '--selection-color': 'inherit',
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">

        {/* Header toggle */}
        <button
          type="button"
          onClick={() => setToolbarOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm leading-none">∑</span>
            Matematiska verktyg
          </span>
          <motion.span animate={{ rotate: toolbarOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {toolbarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-zinc-100 dark:border-zinc-700/60 px-3 pt-2.5 pb-3 space-y-2.5">

                {/* Tab strip */}
                <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', paddingBottom: 2 }}>
                  {TOOL_GROUPS.map((group, idx) => (
                    <button
                      key={group.label}
                      type="button"
                      onClick={() => setActiveGroup(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                        activeGroup === idx
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>

                {/* Tool buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {TOOL_GROUPS[activeGroup].tools.map((tool, i) => (
                    <ToolButton
                      key={i}
                      tool={tool}
                      onClick={() => insertTool(tool.latex)}
                      disabled={disabled}
                    />
                  ))}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── ToolButton ─────────────────────────────────────────────────────────────────

function ToolButton({
  tool,
  onClick,
  disabled,
}: {
  tool: MathTool;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tool.title}
      className="
        inline-flex items-center justify-center
        h-10 min-w-[2.5rem] px-2 rounded-lg
        border select-none
        transition-all duration-100 active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed
        bg-white dark:bg-zinc-900
        border-zinc-200 dark:border-zinc-700
        text-zinc-700 dark:text-zinc-200
        hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10
        hover:text-blue-700 dark:hover:text-blue-300
        shadow-sm hover:shadow-none
      "
    >
      {tool.icon}
    </button>
  );
}
