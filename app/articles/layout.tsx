import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq } from 'drizzle-orm';
import { questionAttempts } from '@/db/dashboard-schema';

import ConstellationBG from '@/components/dashboard/ConstellationBG';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function ArticlesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = session.user;
    const userId = user.id!;

    // Compute user level (same logic as dashboard layout)
    const recentAttempts = await db
        .select({ id: questionAttempts.id })
        .from(questionAttempts)
        .where(eq(questionAttempts.userId, userId));

    const totalXP = recentAttempts.length * 10;
    const userLevel = Math.floor(totalXP / 500) + 1;

    return (
        <div className="min-h-screen relative" style={{ background: '#F0F2F8' }}>
            <ConstellationBG />
            <DashboardShell
                userName={user.name || 'Student'}
                userLevel={userLevel}
            >
                {children}
            </DashboardShell>
        </div>
    );
}
