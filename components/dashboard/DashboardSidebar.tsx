'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, BookOpen, Brain, Zap, GraduationCap, Settings,
    User, FlaskConical, MessageSquare, Archive, FileText, BarChart
} from 'lucide-react';

const C = {
    blue: '#4361EE',
    purple: '#7C5CFC',
    text: '#1A1D2E',
    textSec: '#6B7194',
    textMuted: '#A0A5C0',
    blueLight: '#EEF1FF',
    surfaceAlt: '#F7F8FC',
    borderLight: '#EFF1F8',
};

interface SidebarProps {
    userName: string;
    userLevel: number;
}

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
    {
        title: 'Studier',
        items: [
            { icon: <Home size={18} />, label: 'Översikt', href: '/dashboard' },
            { icon: <BarChart size={18} />, label: 'Analys', href: '/analytics' },
            { icon: <BookOpen size={18} />, label: 'Kurser', href: '/courses' },
            { icon: <FileText size={18} />, label: 'Artiklar', href: '/articles' },
            { icon: <Brain size={18} />, label: 'Öva', href: '/practice' },
            { icon: <Zap size={18} />, label: 'Flashcards', href: '/flashcards' },
        ],
    },
    {
        title: 'Tentaplugg',
        items: [
            { icon: <Archive size={18} />, label: 'Gamla tentor', href: '/archive' },
            { icon: <FlaskConical size={18} />, label: 'Tentamen', href: '/exam-sim' },
            { icon: <MessageSquare size={18} />, label: 'AI-handledare', href: '/ai' },
        ],
    },
    {
        title: 'Konto',
        items: [
            { icon: <User size={18} />, label: 'Profil', href: '/profile' },
            { icon: <Settings size={18} />, label: 'Inställningar', href: '/settings' },
        ],
    },
];

function isActive(pathname: string, href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
}

export default function DashboardSidebar({ userName, userLevel }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className="overflow-y-auto"
            style={{
                width: 240,
                flexShrink: 0,
                height: '100vh',
                position: 'sticky',
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(20px)',
                borderRight: `1px solid ${C.borderLight}`,
                padding: '20px 14px',
                zIndex: 10,
            }}
        >
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-6 no-underline">
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                        background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                        boxShadow: `0 4px 14px ${C.blue}30`,
                    }}
                >
                    <span className="text-white font-extrabold text-base">Q</span>
                </div>
                <span className="font-bold text-xl" style={{ color: C.text, letterSpacing: '-0.03em' }}>
                    Qmath
                </span>
                <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md ml-0.5"
                    style={{ background: C.blueLight, color: C.blue }}
                >
                    Beta
                </span>
            </Link>

            {/* Navigation Sections */}
            <div className="flex-1 space-y-5 overflow-y-auto">
                {navSections.map((section) => (
                    <div key={section.title}>
                        <h4
                            className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2"
                            style={{ color: C.textMuted }}
                        >
                            {section.title}
                        </h4>
                        <nav className="flex flex-col gap-0.5">
                            {section.items.map((item) => {
                                const active = isActive(pathname, item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-[#F7F8FC]"
                                        style={{
                                            color: active ? '#fff' : C.textSec,
                                            background: active ? C.blue : 'transparent',
                                            fontWeight: active ? 600 : 500,
                                            fontSize: 13,
                                        }}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                ))}
            </div>

            {/* User card at bottom */}
            <Link
                href="/profile"
                className="mt-4 p-3 rounded-xl flex items-center gap-2.5 no-underline hover:ring-2 hover:ring-blue-200 transition-all"
                style={{ background: C.surfaceAlt }}
            >
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})` }}
                >
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px]" style={{ color: C.text }}>
                        {userName}
                    </div>
                    <div className="text-[11px]" style={{ color: C.textMuted }}>
                        Nivå {userLevel}
                    </div>
                </div>
            </Link>
        </aside>
    );
}
