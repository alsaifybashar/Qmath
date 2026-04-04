'use client';

import { type ReactNode } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

interface DashboardShellProps {
    children: ReactNode;
    userName: string;
    userLevel: number;
}

export function DashboardShell({ children, userName, userLevel }: DashboardShellProps) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <DashboardSidebar userName={userName} userLevel={userLevel} />
            {/* No z-index on main — sidebar owns the stacking context */}
            <main style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                {children}
            </main>
        </div>
    );
}
