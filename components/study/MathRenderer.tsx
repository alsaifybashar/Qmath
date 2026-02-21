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
    if (!text) return null;

    if (block) {
        return <div className={`katex-block ${className}`}><BlockMath math={text} /></div>;
    }

    const parts = text.split(/(\$\$[\s\S]*?\$\$)|(\$[\s\S]*?\$)|(\\\([\s\S]*?\\\))/g).filter(p => p !== undefined && p !== '');

    return (
        <span className={`katex-inline whitespace-pre-wrap ${className}`}>
            {parts.map((part, i) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    return <div key={i} className="my-2"><BlockMath math={part.slice(2, -2)} /></div>;
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    return <InlineMath key={i} math={part.slice(1, -1)} />;
                } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
                    return <InlineMath key={i} math={part.slice(2, -2)} />;
                } else {
                    return <span key={i}>{part}</span>;
                }
            })}
        </span>
    );
});

MathRenderer.displayName = 'MathRenderer';
