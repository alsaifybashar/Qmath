'use client';

import Link from 'next/link';
import { Home, BookOpen, LineChart, Library, Settings } from 'lucide-react';

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

export default function DashboardSidebar({ userName, userLevel }: SidebarProps) {
    const items = [
        { icon: <Home size={20} />, label: 'Dashboard', id: 'home', href: '/dashboard' },
        { icon: <BookOpen size={20} />, label: 'Courses', id: 'courses', href: '/courses' },
        { icon: <LineChart size={20} />, label: 'Statistics', id: 'stats', href: '/stats' },
        { icon: <Library size={20} />, label: 'Exam Archive', id: 'archive', href: '/exams' },
    ];

    return (
        <aside
            style={{
                width: 220,
                flexShrink: 0,
                height: '100vh',
                position: 'sticky',
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(20px)',
                borderRight: `1px solid ${C.borderLight}`,
                padding: '24px 16px',
                zIndex: 10,
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-2 mb-9">
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

            {/* Nav Items */}
            <nav className="flex flex-col gap-1">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 hover:bg-[#F7F8FC]"
                        style={{
                            color: item.id === 'home' ? '#fff' : C.textSec,
                            background: item.id === 'home' ? C.blue : 'transparent',
                            fontWeight: item.id === 'home' ? 600 : 500,
                            fontSize: 14,
                        }}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Bottom section */}
            <div className="mt-auto">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors"
                    style={{ color: C.textMuted, fontSize: 14, fontWeight: 500 }}
                >
                    <Settings size={18} /> Settings
                </Link>

                {/* User card */}
                <div
                    className="mt-3 p-3.5 rounded-xl flex items-center gap-2.5"
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
            </div>
        </aside>
    );
}
