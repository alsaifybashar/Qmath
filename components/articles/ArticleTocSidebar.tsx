'use client';

import { useState, useEffect, useRef } from 'react';
import { List } from 'lucide-react';

export interface TocHeading {
    index: number;
    level: 2 | 3 | 4;
    text: string;
}

interface ArticleTocSidebarProps {
    headings: TocHeading[];
}

export default function ArticleTocSidebar({ headings }: ArticleTocSidebarProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (headings.length < 3) return;

        observerRef.current = new IntersectionObserver(
            entries => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) {
                    const id = visible[0].target.id;
                    const match = id.match(/^heading-(\d+)$/);
                    if (match) setActiveIndex(parseInt(match[1], 10));
                }
            },
            { rootMargin: '-80px 0px -75% 0px' }
        );

        headings.forEach(h => {
            const el = document.getElementById(`heading-${h.index}`);
            if (el) observerRef.current!.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, [headings]);

    if (headings.length < 3) return null;

    const indent: Record<2 | 3 | 4, string> = { 2: '0px', 3: '14px', 4: '28px' };

    return (
        <nav
            className="sticky top-8 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 64px)' }}
            aria-label="Artikelinnehåll"
        >
            <div
                className="flex items-center gap-2 mb-3 pb-3"
                style={{ borderBottom: '1px solid var(--art-border)' }}
            >
                <List className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--art-text-muted)' }} />
                <span
                    className="uppercase tracking-widest font-semibold"
                    style={{ fontSize: '10px', color: 'var(--art-text-muted)' }}
                >
                    Innehåll
                </span>
            </div>

            <ul className="space-y-0.5">
                {headings.map(h => {
                    const isActive = activeIndex === h.index;
                    return (
                        <li key={h.index} style={{ paddingLeft: indent[h.level] }}>
                            <a
                                href={`#heading-${h.index}`}
                                className="block py-1 pl-3 border-l-2 transition-colors duration-200 leading-snug"
                                style={{
                                    borderLeftColor: isActive ? 'var(--art-blue)' : 'var(--art-border)',
                                    color: isActive
                                        ? 'var(--art-blue)'
                                        : h.level === 2 ? 'var(--art-text)' : 'var(--art-text-sec)',
                                    fontSize: h.level === 2 ? '13px' : '12px',
                                    fontWeight: isActive || h.level === 2 ? 500 : 400,
                                }}
                            >
                                {h.text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
