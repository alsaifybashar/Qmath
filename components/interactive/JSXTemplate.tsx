'use client';

import { useCallback, useMemo } from 'react';
import JSXGraphBoard from './JSXGraphBoard';
import { getTemplate } from '@/lib/visualizations/templates';

interface JSXTemplateProps {
    /** Template ID from the registry, e.g. "function-plotter", "taylor-series-sine". */
    templateId: string;
    /** Config values merged on top of the template's defaultConfig. */
    config?: Record<string, any>;
    /** Optional state-change callback (not all templates emit state). */
    onStateChange?: (state: Record<string, any>) => void;
    className?: string;
}

/**
 * Generic renderer: looks up `templateId` in the registry and renders
 * the corresponding JSXGraph board with the merged config.
 */
export function JSXTemplate({
    templateId,
    config = {},
    onStateChange,
    className,
}: JSXTemplateProps) {
    const template = getTemplate(templateId);

    const mergedConfig = useMemo(() => ({
        ...(template?.defaultConfig ?? {}),
        ...config,
        ...(onStateChange ? { onStateChange } : {}),
    }), [template, config, onStateChange]);

    const initBoard = useCallback((JXG: any, boardId: string) => {
        if (!template) return null;
        try {
            return template.init(JXG, boardId, mergedConfig);
        } catch (err) {
            console.error(`[JSXTemplate] Error initialising "${templateId}":`, err);
            return null;
        }
    }, [template, mergedConfig, templateId]);

    if (!template) {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px] text-slate-400 text-sm bg-slate-900/50 rounded-xl border border-slate-700">
                Unknown visualization: <span className="ml-1 font-mono text-violet-400">{templateId}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 w-full h-full">
            <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {template.category}
                </span>
                <span className="text-xs text-slate-500">{template.name}</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} className={className} />
        </div>
    );
}
