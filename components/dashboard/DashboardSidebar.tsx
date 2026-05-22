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

type SidebarTheme = {
    light: React.CSSProperties;
    dark: React.CSSProperties;
};

const SIDEBAR_THEMES: Record<string, SidebarTheme> = {
    dashboard: {
        light: {
            '--sidebar-bg': 'rgba(255, 255, 255, 0.68)',
            '--sidebar-bg-soft': 'rgba(255, 255, 255, 0.48)',
            '--sidebar-border': 'rgba(15, 118, 110, 0.14)',
            '--sidebar-text': '#11202a',
            '--sidebar-muted': 'rgba(17, 32, 42, 0.62)',
            '--sidebar-subtle': 'rgba(17, 32, 42, 0.42)',
            '--sidebar-hover': 'rgba(20, 184, 166, 0.10)',
            '--sidebar-beta-text': '#0f766e',
            '--sidebar-beta-bg': 'rgba(20, 184, 166, 0.12)',
            '--sidebar-active': 'linear-gradient(135deg, #14b8a6 0%, #ff684a 100%)',
            '--sidebar-active-bg': 'rgba(20, 184, 166, 0.14)',
            '--sidebar-accent': '#14b8a6',
            '--sidebar-active-shadow': '0 10px 28px rgba(20, 184, 166, 0.14)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(20, 184, 166, 0.18)',
            '--sidebar-rail-shadow': '12px 0 34px rgba(15, 118, 110, 0.06)',
        } as React.CSSProperties,
        dark: {
            '--sidebar-bg': 'rgba(4, 23, 20, 0.72)',
            '--sidebar-bg-soft': 'rgba(4, 23, 20, 0.58)',
            '--sidebar-border': 'rgba(94, 234, 212, 0.16)',
            '--sidebar-text': '#f7fff8',
            '--sidebar-muted': 'rgba(247, 255, 248, 0.62)',
            '--sidebar-subtle': 'rgba(247, 255, 248, 0.42)',
            '--sidebar-hover': 'rgba(255, 255, 255, 0.07)',
            '--sidebar-beta-text': '#99f6e4',
            '--sidebar-beta-bg': 'rgba(94, 234, 212, 0.14)',
            '--sidebar-active': 'linear-gradient(135deg, #14b8a6 0%, #ff684a 100%)',
            '--sidebar-active-bg': 'rgba(94, 234, 212, 0.13)',
            '--sidebar-accent': '#5eead4',
            '--sidebar-active-shadow': '0 14px 34px rgba(0, 0, 0, 0.28)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(20, 184, 166, 0.30)',
            '--sidebar-rail-shadow': '12px 0 36px rgba(0, 0, 0, 0.20)',
        } as React.CSSProperties,
    },
    analytics: {
        light: {
            '--sidebar-bg': 'rgba(255, 255, 255, 0.70)',
            '--sidebar-bg-soft': 'rgba(238, 244, 255, 0.54)',
            '--sidebar-border': 'rgba(59, 130, 246, 0.15)',
            '--sidebar-text': '#172033',
            '--sidebar-muted': 'rgba(23, 32, 51, 0.62)',
            '--sidebar-subtle': 'rgba(23, 32, 51, 0.43)',
            '--sidebar-hover': 'rgba(59, 130, 246, 0.10)',
            '--sidebar-beta-text': '#2563eb',
            '--sidebar-beta-bg': 'rgba(59, 130, 246, 0.12)',
            '--sidebar-active': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            '--sidebar-active-bg': 'rgba(59, 130, 246, 0.14)',
            '--sidebar-accent': '#3b82f6',
            '--sidebar-active-shadow': '0 10px 28px rgba(59, 130, 246, 0.14)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(59, 130, 246, 0.18)',
            '--sidebar-rail-shadow': '12px 0 34px rgba(59, 130, 246, 0.06)',
        } as React.CSSProperties,
        dark: {
            '--sidebar-bg': 'rgba(5, 8, 22, 0.74)',
            '--sidebar-bg-soft': 'rgba(17, 22, 78, 0.58)',
            '--sidebar-border': 'rgba(147, 197, 253, 0.16)',
            '--sidebar-text': '#f8fbff',
            '--sidebar-muted': 'rgba(248, 251, 255, 0.62)',
            '--sidebar-subtle': 'rgba(248, 251, 255, 0.42)',
            '--sidebar-hover': 'rgba(255, 255, 255, 0.07)',
            '--sidebar-beta-text': '#bfdbfe',
            '--sidebar-beta-bg': 'rgba(96, 165, 250, 0.14)',
            '--sidebar-active': 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
            '--sidebar-active-bg': 'rgba(96, 165, 250, 0.13)',
            '--sidebar-accent': '#93c5fd',
            '--sidebar-active-shadow': '0 14px 34px rgba(0, 0, 0, 0.28)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(96, 165, 250, 0.24)',
            '--sidebar-rail-shadow': '12px 0 36px rgba(0, 0, 0, 0.22)',
        } as React.CSSProperties,
    },
    courses: {
        light: {
            '--sidebar-bg': 'rgba(255, 255, 255, 0.70)',
            '--sidebar-bg-soft': 'rgba(240, 255, 248, 0.54)',
            '--sidebar-border': 'rgba(67, 97, 238, 0.14)',
            '--sidebar-text': '#172033',
            '--sidebar-muted': 'rgba(23, 32, 51, 0.62)',
            '--sidebar-subtle': 'rgba(23, 32, 51, 0.43)',
            '--sidebar-hover': 'rgba(67, 97, 238, 0.09)',
            '--sidebar-beta-text': '#1d4ed8',
            '--sidebar-beta-bg': 'rgba(67, 97, 238, 0.12)',
            '--sidebar-active': 'linear-gradient(135deg, #4361ee 0%, #22c55e 100%)',
            '--sidebar-active-bg': 'rgba(67, 97, 238, 0.13)',
            '--sidebar-accent': '#4361ee',
            '--sidebar-active-shadow': '0 10px 28px rgba(67, 97, 238, 0.13)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(67, 97, 238, 0.18)',
            '--sidebar-rail-shadow': '12px 0 34px rgba(67, 97, 238, 0.06)',
        } as React.CSSProperties,
        dark: {
            '--sidebar-bg': 'rgba(5, 8, 22, 0.74)',
            '--sidebar-bg-soft': 'rgba(5, 44, 36, 0.58)',
            '--sidebar-border': 'rgba(134, 239, 172, 0.16)',
            '--sidebar-text': '#f8fbff',
            '--sidebar-muted': 'rgba(248, 251, 255, 0.62)',
            '--sidebar-subtle': 'rgba(248, 251, 255, 0.42)',
            '--sidebar-hover': 'rgba(255, 255, 255, 0.07)',
            '--sidebar-beta-text': '#bfdbfe',
            '--sidebar-beta-bg': 'rgba(96, 165, 250, 0.14)',
            '--sidebar-active': 'linear-gradient(135deg, #60a5fa 0%, #4ade80 100%)',
            '--sidebar-active-bg': 'rgba(96, 165, 250, 0.13)',
            '--sidebar-accent': '#60a5fa',
            '--sidebar-active-shadow': '0 14px 34px rgba(0, 0, 0, 0.28)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(96, 165, 250, 0.24)',
            '--sidebar-rail-shadow': '12px 0 36px rgba(0, 0, 0, 0.22)',
        } as React.CSSProperties,
    },
    articles: {
        light: {
            '--sidebar-bg': 'rgba(255, 255, 255, 0.70)',
            '--sidebar-bg-soft': 'rgba(247, 243, 255, 0.54)',
            '--sidebar-border': 'rgba(99, 102, 241, 0.14)',
            '--sidebar-text': '#172033',
            '--sidebar-muted': 'rgba(23, 32, 51, 0.62)',
            '--sidebar-subtle': 'rgba(23, 32, 51, 0.43)',
            '--sidebar-hover': 'rgba(99, 102, 241, 0.09)',
            '--sidebar-beta-text': '#4f46e5',
            '--sidebar-beta-bg': 'rgba(99, 102, 241, 0.12)',
            '--sidebar-active': 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            '--sidebar-active-bg': 'rgba(99, 102, 241, 0.13)',
            '--sidebar-accent': '#6366f1',
            '--sidebar-active-shadow': '0 10px 28px rgba(99, 102, 241, 0.13)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(99, 102, 241, 0.18)',
            '--sidebar-rail-shadow': '12px 0 34px rgba(99, 102, 241, 0.06)',
        } as React.CSSProperties,
        dark: {
            '--sidebar-bg': 'rgba(5, 8, 22, 0.74)',
            '--sidebar-bg-soft': 'rgba(36, 16, 79, 0.58)',
            '--sidebar-border': 'rgba(165, 180, 252, 0.16)',
            '--sidebar-text': '#f8fbff',
            '--sidebar-muted': 'rgba(248, 251, 255, 0.62)',
            '--sidebar-subtle': 'rgba(248, 251, 255, 0.42)',
            '--sidebar-hover': 'rgba(255, 255, 255, 0.07)',
            '--sidebar-beta-text': '#c4b5fd',
            '--sidebar-beta-bg': 'rgba(167, 139, 250, 0.14)',
            '--sidebar-active': 'linear-gradient(135deg, #818cf8 0%, #22d3ee 100%)',
            '--sidebar-active-bg': 'rgba(129, 140, 248, 0.13)',
            '--sidebar-accent': '#a5b4fc',
            '--sidebar-active-shadow': '0 14px 34px rgba(0, 0, 0, 0.28)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(129, 140, 248, 0.24)',
            '--sidebar-rail-shadow': '12px 0 36px rgba(0, 0, 0, 0.22)',
        } as React.CSSProperties,
    },
    flashcards: {
        light: {
            '--sidebar-bg': 'rgba(255, 255, 255, 0.68)',
            '--sidebar-bg-soft': 'rgba(255, 255, 255, 0.48)',
            '--sidebar-border': 'rgba(15, 118, 110, 0.14)',
            '--sidebar-text': '#11202a',
            '--sidebar-muted': 'rgba(17, 32, 42, 0.62)',
            '--sidebar-subtle': 'rgba(17, 32, 42, 0.42)',
            '--sidebar-hover': 'rgba(16, 185, 129, 0.10)',
            '--sidebar-beta-text': '#047857',
            '--sidebar-beta-bg': 'rgba(16, 185, 129, 0.12)',
            '--sidebar-active': 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
            '--sidebar-active-bg': 'rgba(16, 185, 129, 0.14)',
            '--sidebar-accent': '#10b981',
            '--sidebar-active-shadow': '0 10px 28px rgba(16, 185, 129, 0.14)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(16, 185, 129, 0.18)',
            '--sidebar-rail-shadow': '12px 0 34px rgba(16, 185, 129, 0.06)',
        } as React.CSSProperties,
        dark: {
            '--sidebar-bg': 'rgba(4, 23, 20, 0.72)',
            '--sidebar-bg-soft': 'rgba(4, 23, 20, 0.58)',
            '--sidebar-border': 'rgba(110, 231, 183, 0.16)',
            '--sidebar-text': '#f7fff8',
            '--sidebar-muted': 'rgba(247, 255, 248, 0.62)',
            '--sidebar-subtle': 'rgba(247, 255, 248, 0.42)',
            '--sidebar-hover': 'rgba(255, 255, 255, 0.07)',
            '--sidebar-beta-text': '#a7f3d0',
            '--sidebar-beta-bg': 'rgba(110, 231, 183, 0.14)',
            '--sidebar-active': 'linear-gradient(135deg, #34d399 0%, #a78bfa 100%)',
            '--sidebar-active-bg': 'rgba(52, 211, 153, 0.13)',
            '--sidebar-accent': '#6ee7b7',
            '--sidebar-active-shadow': '0 14px 34px rgba(0, 0, 0, 0.28)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(52, 211, 153, 0.24)',
            '--sidebar-rail-shadow': '12px 0 36px rgba(0, 0, 0, 0.22)',
        } as React.CSSProperties,
    },
    exams: {
        light: {
            '--sidebar-bg': 'rgba(255, 255, 255, 0.70)',
            '--sidebar-bg-soft': 'rgba(255, 248, 241, 0.56)',
            '--sidebar-border': 'rgba(249, 115, 22, 0.15)',
            '--sidebar-text': '#261b15',
            '--sidebar-muted': 'rgba(38, 27, 21, 0.62)',
            '--sidebar-subtle': 'rgba(38, 27, 21, 0.42)',
            '--sidebar-hover': 'rgba(249, 115, 22, 0.10)',
            '--sidebar-beta-text': '#c2410c',
            '--sidebar-beta-bg': 'rgba(249, 115, 22, 0.13)',
            '--sidebar-active': 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
            '--sidebar-active-bg': 'rgba(249, 115, 22, 0.14)',
            '--sidebar-accent': '#f97316',
            '--sidebar-active-shadow': '0 10px 28px rgba(249, 115, 22, 0.14)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(249, 115, 22, 0.18)',
            '--sidebar-rail-shadow': '12px 0 34px rgba(249, 115, 22, 0.06)',
        } as React.CSSProperties,
        dark: {
            '--sidebar-bg': 'rgba(18, 8, 6, 0.74)',
            '--sidebar-bg-soft': 'rgba(50, 17, 13, 0.58)',
            '--sidebar-border': 'rgba(251, 146, 60, 0.17)',
            '--sidebar-text': '#fff8f1',
            '--sidebar-muted': 'rgba(255, 248, 241, 0.62)',
            '--sidebar-subtle': 'rgba(255, 248, 241, 0.42)',
            '--sidebar-hover': 'rgba(255, 255, 255, 0.07)',
            '--sidebar-beta-text': '#fed7aa',
            '--sidebar-beta-bg': 'rgba(251, 146, 60, 0.14)',
            '--sidebar-active': 'linear-gradient(135deg, #fb923c 0%, #f87171 100%)',
            '--sidebar-active-bg': 'rgba(251, 146, 60, 0.13)',
            '--sidebar-accent': '#fdba74',
            '--sidebar-active-shadow': '0 14px 34px rgba(0, 0, 0, 0.28)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(251, 146, 60, 0.24)',
            '--sidebar-rail-shadow': '12px 0 36px rgba(0, 0, 0, 0.22)',
        } as React.CSSProperties,
    },
    account: {
        light: {
            '--sidebar-bg': 'rgba(255, 255, 255, 0.76)',
            '--sidebar-bg-soft': 'rgba(248, 250, 252, 0.62)',
            '--sidebar-border': 'rgba(100, 116, 139, 0.16)',
            '--sidebar-text': '#172033',
            '--sidebar-muted': 'rgba(23, 32, 51, 0.62)',
            '--sidebar-subtle': 'rgba(23, 32, 51, 0.42)',
            '--sidebar-hover': 'rgba(100, 116, 139, 0.10)',
            '--sidebar-beta-text': '#475569',
            '--sidebar-beta-bg': 'rgba(100, 116, 139, 0.12)',
            '--sidebar-active': 'linear-gradient(135deg, #64748b 0%, #0ea5e9 100%)',
            '--sidebar-active-bg': 'rgba(100, 116, 139, 0.13)',
            '--sidebar-accent': '#64748b',
            '--sidebar-active-shadow': '0 10px 28px rgba(100, 116, 139, 0.12)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(100, 116, 139, 0.16)',
            '--sidebar-rail-shadow': '12px 0 34px rgba(100, 116, 139, 0.05)',
        } as React.CSSProperties,
        dark: {
            '--sidebar-bg': 'rgba(24, 24, 27, 0.76)',
            '--sidebar-bg-soft': 'rgba(39, 39, 42, 0.60)',
            '--sidebar-border': 'rgba(148, 163, 184, 0.16)',
            '--sidebar-text': '#fafafa',
            '--sidebar-muted': 'rgba(250, 250, 250, 0.62)',
            '--sidebar-subtle': 'rgba(250, 250, 250, 0.42)',
            '--sidebar-hover': 'rgba(255, 255, 255, 0.07)',
            '--sidebar-beta-text': '#cbd5e1',
            '--sidebar-beta-bg': 'rgba(148, 163, 184, 0.14)',
            '--sidebar-active': 'linear-gradient(135deg, #94a3b8 0%, #38bdf8 100%)',
            '--sidebar-active-bg': 'rgba(148, 163, 184, 0.13)',
            '--sidebar-accent': '#cbd5e1',
            '--sidebar-active-shadow': '0 14px 34px rgba(0, 0, 0, 0.28)',
            '--sidebar-logo-shadow': '0 8px 24px rgba(148, 163, 184, 0.22)',
            '--sidebar-rail-shadow': '12px 0 36px rgba(0, 0, 0, 0.22)',
        } as React.CSSProperties,
    },
};

function isActive(pathname: string, href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
}

function themeForPath(pathname: string) {
    if (pathname === '/dashboard') return SIDEBAR_THEMES.dashboard;
    if (pathname.startsWith('/analytics')) return SIDEBAR_THEMES.analytics;
    if (pathname.startsWith('/courses') || pathname.startsWith('/study')) return SIDEBAR_THEMES.courses;
    if (pathname.startsWith('/articles')) return SIDEBAR_THEMES.articles;
    if (pathname.startsWith('/flashcards')) return SIDEBAR_THEMES.flashcards;
    if (pathname.startsWith('/archive') || pathname.startsWith('/exam') || pathname.startsWith('/exams')) return SIDEBAR_THEMES.exams;
    if (pathname.startsWith('/profile') || pathname.startsWith('/settings')) return SIDEBAR_THEMES.account;
    return SIDEBAR_THEMES.dashboard;
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
    const { setTheme, theme, resolvedTheme } = useTheme();
    const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);
    // next-themes only knows the resolved theme on the client. Default to the
    // light branch for SSR + first client render (matching SSR output), then
    // re-render with the real theme after mount to avoid a hydration mismatch.
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const lo = isSidebarExpanded ? 1 : 0;
    const sidebarThemeSet = themeForPath(pathname);
    const isDark = mounted && resolvedTheme === 'dark';
    const sidebarTheme = isDark ? sidebarThemeSet.dark : sidebarThemeSet.light;
    // Sidebar's own glass surface — near-transparent so the page-themed
    // background behind the sidebar tints the glass directly via backdrop-filter.
    const glassSurface = isDark
        ? 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.008) 55%, rgba(255,255,255,0.018) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.018) 55%, rgba(255,255,255,0.05) 100%)';
    // Slightly more opaque surface for tiny chips (logo square, avatar, theme popover)
    // so they remain legible against the very translucent sidebar.
    const chipSurface = isDark
        ? 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.30) 100%)';
    const glassHover = isDark ? 'rgba(255,255,255,0.065)' : 'rgba(255,255,255,0.22)';
    const glassActive = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.34)';
    const glassBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.32)';
    const glassInset = isDark
        ? 'inset 1px 0 0 rgba(255,255,255,0.07), inset -1px 0 0 rgba(255,255,255,0.025), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.10)'
        : 'inset 1px 0 0 rgba(255,255,255,0.55), inset -1px 0 0 rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.50), inset 0 -1px 0 rgba(15,23,42,0.025)';
    const glassDrop = isDark
        ? '6px 0 28px rgba(0, 0, 0, 0.24)'
        : '6px 0 28px rgba(15, 23, 42, 0.05)';

    return (
        <motion.aside
            initial={false}
            animate={{ width: isSidebarExpanded ? W_OPEN : W_CLOSED }}
            transition={WT}
            style={{
                ...sidebarTheme,
                flexShrink: 0,
                height: '100vh',
                position: 'sticky',
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                background: glassSurface,
                backdropFilter: 'blur(44px) saturate(180%)',
                WebkitBackdropFilter: 'blur(44px) saturate(180%)',
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
                    background: isDark
                        ? 'linear-gradient(90deg, rgba(255,255,255,0.025), transparent)'
                        : 'linear-gradient(90deg, rgba(255,255,255,0.18), transparent)',
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
                                background: `linear-gradient(135deg, ${T.primaryLight}, rgba(255,255,255,0.22))`,
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
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: IPAD,
                        width: isSidebarExpanded ? W_OPEN - (OUTER * 2) - (IPAD * 2) : 50,
                        background: chipSurface,
                        backdropFilter: 'blur(44px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(44px) saturate(180%)',
                        border: `1px solid ${glassBorder}`,
                        borderRadius: 14,
                        padding: 6,
                        boxShadow: `${isDark ? '0 18px 46px rgba(0,0,0,0.32)' : '0 18px 46px rgba(15,23,42,0.10)'}, inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)'}`,
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
                                background: theme === t.id ? glassActive : 'transparent',
                                color: theme === t.id ? T.text : T.textMuted,
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
