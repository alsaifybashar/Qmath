'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

// ── Theme context (consumed by ArticleBlock for callout variant selection) ────
export interface ThemeContextValue { dark: boolean }
export const ThemeContext = createContext<ThemeContextValue>({ dark: false });
export const useTheme = () => useContext(ThemeContext);

// ── CSS custom properties for each theme ─────────────────────────────────────
const VARS: Record<'light' | 'dark', Record<string, string>> = {
    light: {
        '--art-bg':                 '#FAFBFE',
        '--art-text':               '#1A1D2E',
        '--art-body':               '#374151',
        '--art-text-sec':           '#6B7194',
        '--art-text-muted':         '#9CA3AF',
        '--art-blue':               '#4361EE',
        '--art-purple':             '#7C5CFC',
        '--art-blue-light':         '#EEF1FF',
        '--art-blue-border':        '#D6DAFB',
        '--art-border':             '#E5E7EB',
        '--art-surface':            '#FFFFFF',
        '--art-surface-alt':        '#F9FAFB',
        '--art-latex-bg':           '#FAFBFF',
        '--art-latex-border':       '#E8ECFC',
        '--art-code-bg':            '#FAFAFA',
        '--art-code-header':        '#F9FAFB',
        '--art-code-text':          '#1F2937',
        '--art-inline-code-bg':     '#F3F4F6',
        '--art-inline-code-text':   '#4B5563',
        '--art-inline-code-border': '#E5E7EB',
    },
    dark: {
        '--art-bg':                 '#0F1117',
        '--art-text':               '#E2E8F0',
        '--art-body':               '#CBD5E1',
        '--art-text-sec':           '#94A3B8',
        '--art-text-muted':         '#5E7490',
        '--art-blue':               '#7B96FF',
        '--art-purple':             '#A78BFA',
        '--art-blue-light':         '#1A2045',
        '--art-blue-border':        '#2D3A6B',
        '--art-border':             '#2A2F45',
        '--art-surface':            '#181D2E',
        '--art-surface-alt':        '#131726',
        '--art-latex-bg':           '#181D2E',
        '--art-latex-border':       '#2A2F45',
        '--art-code-bg':            '#141720',
        '--art-code-header':        '#1A1F30',
        '--art-code-text':          '#E2E8F0',
        '--art-inline-code-bg':     '#1E2335',
        '--art-inline-code-text':   '#94A3B8',
        '--art-inline-code-border': '#2A2F45',
    },
};

export default function ArticleThemeWrapper({ children }: { children: React.ReactNode }) {
    const [dark, setDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('qmath-article-theme') === 'dark') setDark(true);
        setMounted(true);
    }, []);

    const toggle = () => {
        setDark(d => {
            const next = !d;
            localStorage.setItem('qmath-article-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    const cssVars = VARS[dark ? 'dark' : 'light'];

    return (
        <ThemeContext.Provider value={{ dark }}>
            <div
                className={dark ? 'dark' : ''}
                style={{
                    ...(cssVars as React.CSSProperties),
                    background: 'var(--art-bg)',
                    transition: 'background 0.25s, color 0.25s',
                    minHeight: '100vh',
                }}
            >
                {children}

                {/* ── Theme toggle — fixed pill bottom-right ─────────────── */}
                {mounted && (
                    <button
                        onClick={toggle}
                        aria-label={dark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
                        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95"
                        style={{
                            background: dark ? '#1A2045' : '#FFFFFF',
                            color: dark ? '#E2E8F0' : '#1A1D2E',
                            border: `1px solid ${dark ? '#2D3A6B' : '#E5E7EB'}`,
                            boxShadow: dark
                                ? '0 4px 24px rgba(0,0,0,0.5)'
                                : '0 4px 20px rgba(67,97,238,0.12)',
                        }}
                    >
                        {dark
                            ? <><Sun  className="w-4 h-4" style={{ color: '#FBBF24' }} /> Ljust</>
                            : <><Moon className="w-4 h-4" style={{ color: '#4361EE' }} /> Mörkt</>
                        }
                    </button>
                )}
            </div>
        </ThemeContext.Provider>
    );
}
