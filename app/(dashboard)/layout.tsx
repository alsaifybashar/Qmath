import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq } from 'drizzle-orm';
import { questionAttempts } from '@/db/dashboard-schema';
import { courses, enrollments } from '@/db/schema';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { PageTransition } from '@/components/PageTransition';

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
        <DashboardShell
            userName={user.name || 'Student'}
            userLevel={userLevel}
        >
            <PageTransition>
                {children}
            </PageTransition>
        </DashboardShell>
    );
}
