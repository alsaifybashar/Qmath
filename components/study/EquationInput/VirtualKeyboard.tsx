'use client';

/**
 * VirtualKeyboard — Grouped symbol palette for math input.
 *
 * Tab groups:
 *   Grundläggande: numbers, basic operators, parentheses
 *   Algebra:       x, y, z, exponents, roots, abs
 *   Kalkyl:        sum, integral, derivative, limit symbols
 *   Trig:          sin, cos, tan + θ, π
 *   Övrigt:        Greek letters, floor/ceil, infinity
 */

import { useState } from 'react';

export interface KeyGroup {
    label: string;
    keys: Key[];
}

export interface Key {
    /** Display label (may be LaTeX rendered via dangerouslySetInnerHTML in a separate step) */
    display: string;
    /** Value to insert at cursor position */
    value: string;
    /** Whether to wrap the cursor in: e.g. "sqrt(" wraps */
    wrap?: boolean;
    /** Tooltip for screen readers */
    title?: string;
}

export const KEY_GROUPS: KeyGroup[] = [
    {
        label: 'Grundläggande',
        keys: [
            { display: '+', value: '+' },
            { display: '−', value: '-', title: 'Minus' },
            { display: '×', value: '*', title: 'Multiplikation' },
            { display: '÷', value: '/', title: 'Division' },
            { display: '(', value: '(' },
            { display: ')', value: ')' },
            { display: '^', value: '^', title: 'Exponent' },
            { display: '.', value: '.' },
        ],
    },
    {
        label: 'Algebra',
        keys: [
            { display: 'x', value: 'x' },
            { display: 'y', value: 'y' },
            { display: 'n', value: 'n' },
            { display: 'x²', value: 'x^2', title: 'x kvadrat' },
            { display: 'x³', value: 'x^3', title: 'x kubik' },
            { display: '√', value: 'sqrt(', title: 'Kvadratrot' },
            { display: '|x|', value: 'abs(', title: 'Absolutvärde' },
            { display: 'C', value: 'C', title: 'Integrationskonstant' },
        ],
    },
    {
        label: 'Kalkyl',
        keys: [
            { display: 'ln', value: 'ln(' },
            { display: 'log', value: 'log(' },
            { display: 'e^x', value: 'e^' },
            { display: '∫', value: 'integral', title: 'Integral (skriv som prefix)' },
            { display: "f'(x)", value: "f'(x)", title: 'Derivata' },
            { display: '∞', value: 'Infinity', title: 'Oändlighet' },
            { display: '≈', value: '≈', title: 'Ungefär lika med' },
            { display: 'n!', value: 'factorial(' },
        ],
    },
    {
        label: 'Trig',
        keys: [
            { display: 'sin', value: 'sin(' },
            { display: 'cos', value: 'cos(' },
            { display: 'tan', value: 'tan(' },
            { display: 'arcsin', value: 'arcsin(' },
            { display: 'arccos', value: 'arccos(' },
            { display: 'arctan', value: 'arctan(' },
            { display: 'π', value: 'pi', title: 'Pi' },
            { display: 'θ', value: 'theta', title: 'Theta' },
        ],
    },
    {
        label: 'Övrigt',
        keys: [
            { display: 'α', value: 'alpha', title: 'Alpha' },
            { display: 'β', value: 'beta', title: 'Beta' },
            { display: 'λ', value: 'lambda', title: 'Lambda' },
            { display: '⌈x⌉', value: 'ceil(', title: 'Tak (ceiling)' },
            { display: '⌊x⌋', value: 'floor(', title: 'Golv (floor)' },
            { display: 'i', value: 'i', title: 'Imaginär enhet' },
            { display: '°', value: '°', title: 'Grader' },
        ],
    },
];

interface VirtualKeyboardProps {
    onInsert: (value: string) => void;
    disabled?: boolean;
}

export function VirtualKeyboard({ onInsert, disabled = false }: VirtualKeyboardProps) {
    const [activeGroup, setActiveGroup] = useState(0);

    return (
        <div className="select-none">
            {/* Tab strip */}
            <div className="flex gap-1 mb-2 overflow-x-auto pb-1 scrollbar-none">
                {KEY_GROUPS.map((group, idx) => (
                    <button
                        key={group.label}
                        onClick={() => setActiveGroup(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            activeGroup === idx
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                        {group.label}
                    </button>
                ))}
            </div>

            {/* Key grid */}
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                {KEY_GROUPS[activeGroup].keys.map((key) => (
                    <button
                        key={key.value + key.display}
                        onClick={() => onInsert(key.value)}
                        disabled={disabled}
                        title={key.title ?? key.value}
                        className={`
                            flex items-center justify-center px-2 py-2.5 rounded-lg
                            text-sm font-mono font-medium border
                            transition-all active:scale-95
                            disabled:opacity-40 disabled:cursor-not-allowed
                            bg-white dark:bg-zinc-900
                            border-zinc-200 dark:border-zinc-700
                            text-zinc-800 dark:text-zinc-200
                            hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10
                            hover:text-blue-700 dark:hover:text-blue-300
                            shadow-sm
                        `}
                    >
                        {key.display}
                    </button>
                ))}
            </div>
        </div>
    );
}
