'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
    Home, BookOpen, Zap, Settings, User,
    FlaskConical, Archive, FileText, BarChart2, PanelLeft, Sun, Moon, Monitor,
} from 'lucide-react';
import { useSidebar } from '@/lib/hooks/use-sidebar';

const T = {
    primary: 'var(--sidebar-beta-text)',
    primaryLight: 'var(--sidebar-beta-bg)',
    gradient: 'var(--sidebar-active)',
    activeBg: 'var(--sidebar-active-bg)',
    accent: 'var(--sidebar-accent)',
    text: 'var(--sidebar-text)',
    textMuted: 'var(--sidebar-muted)',
    textSubtle: 'var(--sidebar-subtle)',
    surfaceHover: 'var(--sidebar-hover)',
    border: 'var(--sidebar-border)',
    glass: 'var(--sidebar-bg)',
    glassSoft: 'var(--sidebar-bg-soft)',
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
const POPOVER_T = { type: 'tween', ease: [0.25, 0.1, 0.25, 1], duration: 0.22 } as const;

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
    border: '1px solid transparent',
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
                background: active ? T.activeBg : 'transparent',
                color: active ? T.accent : 'inherit',
                boxShadow: active ? 'inset 0 0 0 1px var(--sidebar-border)' : 'none',
                transition: 'background 160ms ease, color 160ms ease, box-shadow 160ms ease',
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
    const { setTheme, theme } = useTheme();
    const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);
    // next-themes only knows the resolved theme on the client. Default to the
    // light branch for SSR + first client render (matching SSR output), then
    // re-render with the real theme after mount to avoid a hydration mismatch.
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const lo = isSidebarExpanded ? 1 : 0;
    // Sidebar's own glass surface — near-transparent so the page-themed
    // background behind the sidebar tints the glass directly via backdrop-filter.
    const glassSurface = T.glass;
    // Slightly more opaque surface for tiny chips (logo square, avatar, theme popover)
    // so they remain legible against the very translucent sidebar.
    const chipSurface = T.glassSoft;
    const glassHover = 'var(--sidebar-glass-hover)';
    const glassActive = 'var(--sidebar-glass-active)';
    const glassBorder = 'var(--sidebar-glass-border)';
    const glassInset = 'var(--sidebar-glass-inset)';
    const glassDrop = 'var(--sidebar-glass-drop)';

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
                background: glassSurface,
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                borderRight: `1px solid ${glassBorder}`,
                boxShadow: `${glassInset}, ${glassDrop}`,
                willChange: 'width',
                overflow: 'hidden',
                zIndex: 30,
                padding: `0 ${OUTER}px`,
            }}
        >
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: '0 0 0 auto',
                    width: 1,
                    background: `linear-gradient(180deg, transparent, ${glassBorder}, transparent)`,
                    opacity: 1,
                    pointerEvents: 'none',
                }}
            />
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: '0 auto 0 0',
                    width: isSidebarExpanded ? 72 : 34,
                    background: 'var(--sidebar-glass-highlight)',
                    opacity: 1,
                    pointerEvents: 'none',
                }}
            />
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div style={{ paddingTop: 20, paddingBottom: 8, flexShrink: 0 }}>

                {/* Logo row */}
                <Link
                    href="/dashboard"
                    title="Qmath"
                    style={{ ...rowStyle, color: T.text, marginBottom: 2 }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = glassHover;
                        (e.currentTarget as HTMLElement).style.borderColor = glassBorder;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }}
                >
                    <IconCell>
                        <div
                            style={{
                                width: ICON,
                                height: ICON,
                                borderRadius: 9,
                                background: chipSurface,
                                border: `1px solid ${glassBorder}`,
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.40)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.accent,
                                fontWeight: 800,
                                fontSize: 15,
                                letterSpacing: 0,
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
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: 6,
                                border: `1px solid ${T.border}`,
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
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = glassHover;
                        (e.currentTarget as HTMLElement).style.color = T.text;
                        (e.currentTarget as HTMLElement).style.borderColor = glassBorder;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = T.textSubtle;
                        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }}
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
            <div style={{ height: 1, background: glassBorder, margin: `0 ${IPAD}px 12px`, flexShrink: 0 }} />

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
                                            position: 'relative',
                                            color: active ? T.text : T.textMuted,
                                            background: active ? glassActive : 'transparent',
                                            borderColor: active ? glassBorder : 'transparent',
                                            fontWeight: active ? 700 : 500,
                                            fontSize: 13,
                                            boxShadow: active
                                                ? 'inset 0 1px 0 rgba(255,255,255,0.22)'
                                                : 'none',
                                            transition: 'background 160ms ease, color 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
                                        }}
                                        onMouseEnter={e => {
                                            if (!active) {
                                                (e.currentTarget as HTMLElement).style.background = glassHover;
                                                (e.currentTarget as HTMLElement).style.color = T.text;
                                                (e.currentTarget as HTMLElement).style.borderColor = glassBorder;
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!active) {
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                (e.currentTarget as HTMLElement).style.color = T.textMuted;
                                                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                                            }
                                        }}
                                    >
                                        {active && (
                                            <span
                                                aria-hidden
                                                style={{
                                                    position: 'absolute',
                                                    left: 5,
                                                    top: '50%',
                                                    width: 3,
                                                    height: 20,
                                                    borderRadius: 999,
                                                    transform: 'translateY(-50%)',
                                                    background: T.accent,
                                                    opacity: 0.55,
                                                }}
                                            />
                                        )}
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
            <div style={{ height: 1, background: glassBorder, margin: `12px ${IPAD}px 0`, flexShrink: 0 }} />

            {/* ── User card ────────────────────────────────────────────────── */}
            <div 
                style={{ paddingBottom: 20, paddingTop: 6, flexShrink: 0, position: 'relative' }}
                onMouseEnter={() => setIsThemeMenuOpen(true)}
                onMouseLeave={() => setIsThemeMenuOpen(false)}
            >
                {/* Theme Switcher Popover */}
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ 
                        opacity: isThemeMenuOpen ? 1 : 0, 
                        y: isThemeMenuOpen ? -4 : 10, 
                        scale: isThemeMenuOpen ? 1 : 0.95,
                        pointerEvents: isThemeMenuOpen ? 'auto' : 'none'
                    }}
                    transition={POPOVER_T}
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: IPAD,
                        width: isSidebarExpanded ? W_OPEN - (OUTER * 2) - (IPAD * 2) : 50,
                        background: chipSurface,
                        backdropFilter: 'blur(16px) saturate(140%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                        border: `1px solid ${glassBorder}`,
                        borderRadius: 14,
                        padding: 6,
                        boxShadow: 'var(--sidebar-popover-shadow)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        zIndex: 100,
                    }}
                >
                    {[
                        { id: 'light', label: 'Ljust', Icon: Sun },
                        { id: 'dark', label: 'Mörkt', Icon: Moon },
                        { id: 'system', label: 'System', Icon: Monitor },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 10px',
                                borderRadius: 10,
                                border: 'none',
                                background: mounted && theme === t.id ? glassActive : 'transparent',
                                color: mounted && theme === t.id ? T.text : T.textMuted,
                                cursor: 'pointer',
                                transition: 'background 160ms ease, color 160ms ease',
                                width: '100%',
                            }}
                        >
                            <t.Icon size={16} />
                            {isSidebarExpanded && (
                                <motion.span 
                                    animate={{ opacity: lo }}
                                    style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}
                                >
                                    {t.label}
                                </motion.span>
                            )}
                        </button>
                    ))}
                </motion.div>

                <Link
                    href="/profile"
                    title={!isSidebarExpanded ? userName : undefined}
                    style={{
                        ...rowStyle,
                        color: T.text,
                        background: isThemeMenuOpen ? glassHover : 'transparent',
                        borderColor: isThemeMenuOpen ? glassBorder : 'transparent',
                        transition: 'background 160ms ease, border-color 160ms ease',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = glassHover;
                        (e.currentTarget as HTMLElement).style.borderColor = glassBorder;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = isThemeMenuOpen ? glassHover : 'transparent';
                        (e.currentTarget as HTMLElement).style.borderColor = isThemeMenuOpen ? glassBorder : 'transparent';
                    }}
                >
                    <IconCell>
                        <div
                            style={{
                                width: ICON,
                                height: ICON,
                                borderRadius: 9,
                                background: chipSurface,
                                border: `1px solid ${glassBorder}`,
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.40)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.accent,
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
