'use client';

import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });
const InlineMath = dynamic(() => import('react-katex').then((mod) => mod.InlineMath), { ssr: false });

export function MathRenderer({ content }: { content: string }) {
    const parts = useMemo(() => {
        if (!content) return [];
        // Regex to match $$...$$ (Block), $...$ (Inline), or \(...\) (Inline)
        return content.split(/(\$\$[\s\S]*?\$\$)|(\$[\s\S]*?\$)|(\\\([\s\S]*?\\\))/g).filter(p => p !== undefined && p !== '');
    }, [content]);

    return (
        <div className="whitespace-pre-wrap">
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
        </div>
    );
}
