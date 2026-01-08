'use client';

import 'katex/dist/katex.min.css';
import dynamic from 'next/dynamic';
import { memo } from 'react';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });
const InlineMath = dynamic(() => import('react-katex').then((mod) => mod.InlineMath), { ssr: false });

interface MathRendererProps {
    text: string;
    block?: boolean;
    className?: string;
}

export const MathRenderer = memo(({ text, block = false, className = '' }: MathRendererProps) => {
    // Check if text contains LaTeX delimiters
    // If block=true, we treat the whole string as latex
    // If block=false, we might auto-detect

    if (block) {
        return <div className={`katex-block ${className}`}><BlockMath math={text} /></div>;
    }

    // For inline, we just basic wrap. 
    // Ideally we parse mixed text/latex, but for this specific "Math" input, we usually pass pure latex or rely on the parent to split it.
    // As per previous existing code style, we'll assume the parent might pass mixed content if they handle it, or we handle pure latex here.
    return <span className={`katex-inline ${className}`}><InlineMath math={text} /></span>;
});

MathRenderer.displayName = 'MathRenderer';
