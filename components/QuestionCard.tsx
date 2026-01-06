'use client';

// Dynamic import for client-side rendering of Math
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

// Dynamically import KaTeX components with no SSR
const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const InlineMath = dynamic(() => import('react-katex').then((mod) => mod.InlineMath), { ssr: false });

interface QuestionCardProps {
    content: string; // Markdown with optional latex
    type: 'multiple_choice' | 'numeric';
    options?: string[];
    onAnswer: (answer: string) => void;
}

export function QuestionCard({ content, type, options, onAnswer }: QuestionCardProps) {

    const renderContent = (text: string) => {
        return (
            <div className="text-lg leading-relaxed text-zinc-200">
                {text}
                <div className="my-4 p-4 bg-zinc-900 rounded-md border border-zinc-800">
                    Rendered Math Example: <br />
                    <span className="text-blue-400">
                        <BlockMath math="\int_{a}^{b} f(x) dx" />
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl p-8 shadow-2xl">
            <div className="mb-8 border-b border-zinc-800 pb-4">
                <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Question</h3>
            </div>

            <div className="mb-8">
                {renderContent(content)}
            </div>

            <div className="space-y-4">
                {type === 'multiple_choice' && options?.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onAnswer(opt)}
                        className="w-full p-4 text-left rounded-lg border border-zinc-800 hover:border-blue-500 hover:bg-zinc-900 transition-all flex items-center group"
                    >
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-500 border border-zinc-700 mr-4 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:border-blue-500/50">
                            {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-zinc-300 group-hover:text-white">{opt}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
