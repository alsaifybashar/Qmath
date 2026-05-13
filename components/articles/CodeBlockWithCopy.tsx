'use client';

import { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

interface CodeBlockWithCopyProps {
    language: string;
    code: string;
}

export default function CodeBlockWithCopy({ language, code }: CodeBlockWithCopyProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div
            className="my-7 rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--art-border)' }}
        >
            <div
                className="relative flex items-center gap-2 px-4 py-2.5"
                style={{
                    background: 'var(--art-code-header)',
                    borderBottom: '1px solid var(--art-border)',
                }}
            >
                <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--art-text-muted)' }} />
                <span
                    className="font-mono font-medium uppercase tracking-wider"
                    style={{ color: 'var(--art-text-muted)', fontSize: '11px' }}
                >
                    {language}
                </span>
                <button
                    onClick={handleCopy}
                    className="absolute right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-[11px] font-medium"
                    style={{
                        color: copied ? '#16A34A' : 'var(--art-text-muted)',
                        background: 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--art-border)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    aria-label="Copy code"
                >
                    {copied
                        ? <><Check className="w-3.5 h-3.5" /> Kopierad</>
                        : <><Copy className="w-3.5 h-3.5" /> Kopiera</>
                    }
                </button>
            </div>
            <pre
                className="p-5 overflow-x-auto"
                style={{ background: 'var(--art-code-bg)', fontSize: '14px' }}
            >
                <code
                    className="font-mono"
                    style={{ color: 'var(--art-code-text)', lineHeight: '1.7' }}
                >
                    {code}
                </code>
            </pre>
        </div>
    );
}
