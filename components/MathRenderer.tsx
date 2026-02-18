'use client';

import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });
const InlineMath = dynamic(() => import('react-katex').then((mod) => mod.InlineMath), { ssr: false });

export function MathRenderer({ content }: { content: string }) {
    const parts = useMemo(() => {
        if (!content) return [];
        // Regex to match $$...$$ (Block) or $...$ (Inline)
        // Note: This regex is simple and might fail on complex nested structures or escaped $'s
        return content.split(/(\$\$[\s\S]*?\$\$)|(\$[\s\S]*?\$)/g).filter(p => p !== undefined && p !== '');
    }, [content]);

    return (
        <div className="whitespace-pre-wrap">
            {parts.map((part, i) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    return <BlockMath key={i} math={part.slice(2, -2)} />;
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    return <InlineMath key={i} math={part.slice(1, -1)} />;
                } else {
                    return <span key={i}>{part}</span>;
                }
            })}
        </div>
    );
}
