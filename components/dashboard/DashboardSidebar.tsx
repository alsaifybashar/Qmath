'use client';

import Link from 'next/link';
import {
    Home, BookOpen, LineChart, Library, Settings,
    Brain, Zap, School, Layers, FileText, User, BarChart3,
    CreditCard, Info, GraduationCap, HelpCircle, MessageSquare
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

// Navigation sections with all subpages
const navSections = [
    {
        title: 'Main',
        items: [
            { icon: <Home size={18} />, label: 'Dashboard', href: '/dashboard', active: true },
            { icon: <BookOpen size={18} />, label: 'Courses', href: '/courses' },
            { icon: <Brain size={18} />, label: 'Practice', href: '/practice' },
            { icon: <Zap size={18} />, label: 'Flashcards', href: '/flashcards' },
            { icon: <Library size={18} />, label: 'Exam Archive', href: '/exams' },
        ],
    },
    {
        title: 'Resources',
        items: [
            { icon: <School size={18} />, label: 'Universities', href: '/universities' },
            { icon: <Layers size={18} />, label: 'Study Tools', href: '/study' },
            { icon: <FileText size={18} />, label: 'Demo', href: '/demo' },
        ],
    },
    {
        title: 'Account',
        items: [
            { icon: <User size={18} />, label: 'Profile', href: '/profile' },
            { icon: <Settings size={18} />, label: 'Settings', href: '/settings' },
            { icon: <CreditCard size={18} />, label: 'Pricing', href: '/pricing' },
        ],
    },
    {
        title: 'Information',
        items: [
            { icon: <Info size={18} />, label: 'About', href: '/about' },
            { icon: <GraduationCap size={18} />, label: 'Features', href: '/features' },
            { icon: <HelpCircle size={18} />, label: 'Help', href: '/help' },
            { icon: <MessageSquare size={18} />, label: 'Contact', href: '/contact' },
        ],
    },
];

export default function DashboardSidebar({ userName, userLevel }: SidebarProps) {
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
            <div className="flex items-center gap-2.5 px-2 mb-6">
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
            </div>

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
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-[#F7F8FC]"
                                    style={{
                                        color: item.active ? '#fff' : C.textSec,
                                        background: item.active ? C.blue : 'transparent',
                                        fontWeight: item.active ? 600 : 500,
                                        fontSize: 13,
                                    }}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                ))}
            </div>

            {/* User card at bottom */}
            <div
                className="mt-4 p-3 rounded-xl flex items-center gap-2.5"
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
                        Level {userLevel}
                    </div>
                </div>
            </div>
        </aside>
    );
}
