'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Home, BookOpen, Zap, Settings, User,
    FlaskConical, Archive, FileText, BarChart2, PanelLeft,
} from 'lucide-react';
import { useSidebar } from '@/lib/hooks/use-sidebar';

// ─── Design tokens (globals.css) ─────────────────────────────────────────────
const T = {
    primary:     '#3b82f6',
    accent:      '#8b5cf6',
    primaryLight:'#eff6ff',
    gradient:    'linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)',
    text:        '#1a1a1a',
    textMuted:   '#525252',
    textSubtle:  '#737373',
    surfaceHover:'rgba(0,0,0,0.04)',
    border:      'rgba(0,0,0,0.06)',
    glass:       'rgba(255,255,255,0.90)',
} as const;

// ─── Grid constants ───────────────────────────────────────────────────────────
//
//  Every row shares the same grid:
//
//  ┌──────────────────────────────────────────────────────────┐
//  │ OUTER(8) │ ITEM_L(14) │ ICON(36) │ GAP(10) │ label... │
//  └──────────────────────────────────────────────────────────┘
//
//  Icon centre = OUTER(8) + ITEM_L(14) + ICON/2(18) = 40px
//  Sidebar closed width = 80px  →  centre = 40px  ✓  perfectly centred
//
const OUTER = 8;    // sidebar left/right padding
const IPAD  = 14;   // row left/right padding
const ICON  = 36;   // icon cell size
const GAP   = 10;   // icon → label gap

const W_OPEN   = 260;
const W_CLOSED = 80;

// ─── Transitions ─────────────────────────────────────────────────────────────
const WT = { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.28 } as const;
const LT = { type: 'tween', ease: 'easeInOut', duration: 0.15 } as const;

// ─── Nav data ─────────────────────────────────────────────────────────────────
const NAV = [
    {
        title: 'Studier',
        items: [
            { Icon: Home,         label: 'Översikt',    href: '/dashboard'  },
            { Icon: BarChart2,    label: 'Analys',      href: '/analytics'  },
            { Icon: BookOpen,     label: 'Kurser',      href: '/courses'    },
            { Icon: FileText,     label: 'Artiklar',    href: '/articles'   },
            { Icon: Zap,          label: 'Flashcards',  href: '/flashcards' },
        ],
    },
    {
        title: 'Tentaplugg',
        items: [
            { Icon: Archive,      label: 'Gamla tentor', href: '/archive'   },
            { Icon: FlaskConical, label: 'Tentamen',     href: '/exam-sim'  },
        ],
    },
    {
        title: 'Konto',
        items: [
            { Icon: User,     label: 'Profil',        href: '/profile'   },
            { Icon: Settings, label: 'Inställningar', href: '/settings'  },
        ],
    },
] as const;

function isActive(pathname: string, href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
}

// ─── Shared row styles ────────────────────────────────────────────────────────
const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: GAP,
    padding: `7px ${IPAD}px`,
    borderRadius: 10,
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: '100%',
    boxSizing: 'border-box',
};

// Fixed icon cell — ensures icon is always on the grid
function IconCell({ children, active }: { children: React.ReactNode; active?: boolean }) {
    return (
        <span
            style={{
                width: ICON,
                height: ICON,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
            }}
        >
            {children}
        </span>
    );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function DashboardSidebar({
    userName,
    userLevel,
}: {
    userName: string;
    userLevel: number;
}) {
    const pathname = usePathname();
    const { isSidebarExpanded, toggleSidebar } = useSidebar();
    const lo = isSidebarExpanded ? 1 : 0;

    return (
        <motion.aside
            initial={false}
            animate={{ width: isSidebarExpanded ? W_OPEN : W_CLOSED }}
            transition={WT}
            style={{
                flexShrink: 0,
                height: '100vh',
                position: 'sticky',
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                background: T.glass,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRight: `1px solid ${T.border}`,
                willChange: 'width',
                overflow: 'hidden',
                zIndex: 30,
                padding: `0 ${OUTER}px`,
            }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div style={{ paddingTop: 20, paddingBottom: 8, flexShrink: 0 }}>

                {/* Logo row */}
                <Link
                    href="/dashboard"
                    title="Qmath"
                    style={{ ...rowStyle, color: T.text, marginBottom: 2 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surfaceHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                    <IconCell>
                        <div
                            style={{
                                width: ICON,
                                height: ICON,
                                borderRadius: 9,
                                background: T.gradient,
                                boxShadow: '0 4px 14px rgba(59,130,246,0.30)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: 15,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Q
                        </div>
                    </IconCell>

                    <motion.div
                        animate={{ opacity: lo }}
                        transition={LT}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            whiteSpace: 'nowrap',
                            pointerEvents: isSidebarExpanded ? 'auto' : 'none',
                        }}
                    >
                        <span
                            style={{
                                fontWeight: 700,
                                fontSize: 17,
                                color: T.text,
                                letterSpacing: '-0.03em',
                            }}
                        >
                            Qmath
                        </span>
                        <span
                            style={{
                                background: T.primaryLight,
                                color: T.primary,
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: 6,
                            }}
                        >
                            Beta
                        </span>
                    </motion.div>
                </Link>

                {/* Toggle row — on the same grid as all other rows */}
                <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label={isSidebarExpanded ? 'Stäng sidopanel' : 'Öppna sidopanel'}
                    style={{ ...rowStyle, color: T.textSubtle }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surfaceHover; (e.currentTarget as HTMLElement).style.color = T.text; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = T.textSubtle; }}
                >
                    <IconCell>
                        <motion.span
                            animate={{ rotate: isSidebarExpanded ? 0 : 180 }}
                            transition={WT}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <PanelLeft size={18} />
                        </motion.span>
                    </IconCell>

                    <motion.span
                        animate={{ opacity: lo }}
                        transition={LT}
                        style={{
                            fontSize: 13,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            pointerEvents: isSidebarExpanded ? 'auto' : 'none',
                        }}
                    >
                        Minimera
                    </motion.span>
                </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: T.border, margin: `0 ${IPAD}px 12px`, flexShrink: 0 }} />

            {/* ── Navigation ──────────────────────────────────────────────── */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                }}
            >
                {NAV.map((section) => (
                    <div key={section.title}>
                        {/* Section title — always in DOM, only opacity changes, keeps height */}
                        <motion.p
                            animate={{ opacity: isSidebarExpanded ? 0.5 : 0 }}
                            transition={LT}
                            style={{
                                margin: '0 0 3px',
                                padding: `2px ${IPAD}px`,
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                color: T.textMuted,
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                lineHeight: '1.6',
                            }}
                        >
                            {section.title}
                        </motion.p>

                        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {section.items.map(({ Icon, label, href }) => {
                                const active = isActive(pathname, href);
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        title={!isSidebarExpanded ? label : undefined}
                                        style={{
                                            ...rowStyle,
                                            color: active ? '#fff' : T.textMuted,
                                            background: active ? T.gradient : 'transparent',
                                            fontWeight: active ? 600 : 500,
                                            fontSize: 13,
                                            boxShadow: active
                                                ? '0 4px 12px rgba(59,130,246,0.25)'
                                                : 'none',
                                        }}
                                        onMouseEnter={e => {
                                            if (!active) {
                                                (e.currentTarget as HTMLElement).style.background = T.surfaceHover;
                                                (e.currentTarget as HTMLElement).style.color = T.text;
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!active) {
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                (e.currentTarget as HTMLElement).style.color = T.textMuted;
                                            }
                                        }}
                                    >
                                        <IconCell active={active}>
                                            <Icon size={18} />
                                        </IconCell>

                                        <motion.span
                                            animate={{ opacity: lo }}
                                            transition={LT}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                pointerEvents: isSidebarExpanded ? 'auto' : 'none',
                                            }}
                                        >
                                            {label}
                                        </motion.span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: T.border, margin: `12px ${IPAD}px 0`, flexShrink: 0 }} />

            {/* ── User card ────────────────────────────────────────────────── */}
            <div style={{ paddingBottom: 20, paddingTop: 6, flexShrink: 0 }}>
                <Link
                    href="/profile"
                    title={!isSidebarExpanded ? userName : undefined}
                    style={{ ...rowStyle, color: T.text }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.primaryLight; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                    <IconCell>
                        <div
                            style={{
                                width: ICON,
                                height: ICON,
                                borderRadius: 9,
                                background: T.gradient,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: 14,
                            }}
                        >
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    </IconCell>

                    <motion.div
                        animate={{ opacity: lo }}
                        transition={LT}
                        style={{
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            pointerEvents: isSidebarExpanded ? 'auto' : 'none',
                        }}
                    >
                        <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>
                            {userName}
                        </div>
                        <div style={{ fontSize: 11, color: T.textSubtle }}>
                            Nivå {userLevel}
                        </div>
                    </motion.div>
                </Link>
            </div>
        </motion.aside>
    );
}
