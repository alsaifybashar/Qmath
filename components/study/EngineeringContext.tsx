'use client';

import { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface EngineeringContextProps {
    topicTitle: string;
    engineeringContext?: string | null;
    /** If true, auto-expand on first render (for first encounter with topic) */
    autoExpand?: boolean;
}

/**
 * "Why does this matter?" Engineering Context Panel
 *
 * Collapsible panel showing where a math concept is used in engineering.
 * Shown automatically on first encounter with a topic, then toggleable.
 *
 * Research: students who see themselves as engineers but not "math people"
 * need to understand why each topic matters for their discipline.
 */
export function EngineeringContext({
    topicTitle,
    engineeringContext,
    autoExpand = false,
}: EngineeringContextProps) {
    const [expanded, setExpanded] = useState(autoExpand);

    if (!engineeringContext) return null;

    return (
        <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/15 rounded-2xl overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-emerald-100/50 dark:hover:bg-emerald-500/10 transition-colors"
            >
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/15 rounded-xl shrink-0">
                    <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        Varför behöver ingenjörer detta?
                    </p>
                    {!expanded && (
                        <div className="text-xs text-emerald-600/70 dark:text-emerald-400/60 truncate mt-0.5">
                            <MathRenderer text={engineeringContext} />
                        </div>
                    )}
                </div>
                <div className="text-emerald-500 shrink-0">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>

            {expanded && (
                    <div className="overflow-hidden">
                        <div className="px-4 pb-4">
                            <div className="p-4 bg-white/50 dark:bg-zinc-800/30 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <div className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                        <MathRenderer text={engineeringContext} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            )}
        </div>
    );
}
