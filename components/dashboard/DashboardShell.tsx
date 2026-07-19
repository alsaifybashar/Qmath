'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardSearch from '@/components/dashboard/DashboardSearch';

interface DashboardShellProps {
    children: ReactNode;
    userName: string;
    userLevel: number;
}

function shellThemeClass(pathname: string) {
    if (pathname.startsWith('/analytics')) return 'shell-theme-analytics';
    if (pathname.startsWith('/courses')) return 'shell-theme-courses';
    if (pathname.startsWith('/articles')) return 'shell-theme-articles';
    if (pathname.startsWith('/flashcards')) return 'shell-theme-flashcards';
    if (pathname.startsWith('/archive') || pathname.startsWith('/exam')) return 'shell-theme-exams';
    if (pathname.startsWith('/profile') || pathname.startsWith('/settings')) return 'shell-theme-account';
    return 'shell-theme-dashboard';
}

export function DashboardShell({ children, userName, userLevel }: DashboardShellProps) {
    const pathname = usePathname();
    const theme = shellThemeClass(pathname);
    const showDashboardSearch = pathname !== '/courses';

    return (
        <div className={`page-shell ${theme}`}>
            <div className="page-shell-bg" aria-hidden />
            <div className="page-shell-content">
                <DashboardSidebar userName={userName} userLevel={userLevel} />
                {/* No z-index on main — sidebar owns the stacking context */}
                <main style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                    {showDashboardSearch && <DashboardSearch />}
                    {children}
                </main>
            </div>
        </div>
    );
}
