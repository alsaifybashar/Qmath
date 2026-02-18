import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq } from 'drizzle-orm';
import { userStreaks, questionAttempts } from '@/db/dashboard-schema';
import { courses, enrollments } from '@/db/schema';

import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import ConstellationBG from '@/components/dashboard/ConstellationBG';

export default async function DashboardLayout({
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

    // Check if user has courses (lightweight query for onboarding redirect)
    const userCourses = await db
        .select({ id: courses.id })
        .from(courses)
        .innerJoin(enrollments, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.userId, userId))
        .limit(1);

    if (userCourses.length === 0) {
        redirect('/onboarding/courses');
    }

    // Calculate user level (lightweight — just count recent attempts)
    const recentAttempts = await db
        .select({ id: questionAttempts.id })
        .from(questionAttempts)
        .where(eq(questionAttempts.userId, userId));

    const totalXP = recentAttempts.length * 10;
    const userLevel = Math.floor(totalXP / 500) + 1;

    return (
        <div className="min-h-screen relative" style={{ background: '#F0F2F8' }}>
            <ConstellationBG />
            <div className="flex justify-center">
                <DashboardSidebar
                    userName={user.name || 'Student'}
                    userLevel={userLevel}
                />
                <main className="flex-1 relative z-10 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
