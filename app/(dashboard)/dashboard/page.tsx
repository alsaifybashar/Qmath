import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq, and, gte } from 'drizzle-orm';
import {
    userStreaks,
    userTopicMastery,
    questionAttempts,
} from '@/db/dashboard-schema';
import { courses, topics, enrollments } from '@/db/schema';
import { levelForXp, xpForAttempts } from '@/lib/gamification/xp';

import { checkAndMaintainStreak } from '@/lib/dashboard/streak-system';
import { getExamReadiness } from '@/app/actions/dashboard-insights';
import Link from 'next/link';
import {
    WeeklyActivityChart,
    StreakCard,
    CourseCard,
    MasteryTopicCard,
    DashboardHeader,
} from '@/components/dashboard/DashboardCards';
import { ExamReadinessBar } from '@/components/dashboard/ExamReadinessBar';


export const metadata = {
    title: 'Dashboard | Qmath',
    description: 'Din personliga lärplattform',
};

export default async function DashboardPage() {
    const session = await auth();
    // Auth redirect handled by layout, but we still need the session for data
    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = session.user;
    const userId = user.id!;
    const displayName = user.name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Studenten';

    // Calculate time ranges
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Verify and maintain streak
    await checkAndMaintainStreak(userId);

    // Fetch all dashboard data in parallel
    const [
        streakData,
        masteryData,
        userCourses,
        recentAttempts,
        last7dAttempts,
        topicsData,
    ] = await Promise.all([
        db.query.userStreaks.findFirst({
            where: eq(userStreaks.userId, userId),
        }),
        db
            .select({
                topicId: userTopicMastery.topicId,
                masteryLevel: userTopicMastery.masteryLevel,
                totalAttempts: userTopicMastery.totalAttempts,
                correctAttempts: userTopicMastery.correctAttempts,
            })
            .from(userTopicMastery)
            .where(eq(userTopicMastery.userId, userId)),
        db.select({
            id: courses.id,
            code: courses.code,
            name: courses.name,
            universityId: courses.universityId
        })
            .from(courses)
            .innerJoin(enrollments, eq(enrollments.courseId, courses.id))
            .where(eq(enrollments.userId, userId)),
        db
            .select({
                id: questionAttempts.id,
                isCorrect: questionAttempts.isCorrect,
                timestamp: questionAttempts.timestamp,
            })
            .from(questionAttempts)
            .where(
                and(
                    eq(questionAttempts.userId, userId),
                    gte(questionAttempts.timestamp, thirtyDaysAgo)
                )
            ),
        db
            .select({
                isCorrect: questionAttempts.isCorrect,
                timestamp: questionAttempts.timestamp,
            })
            .from(questionAttempts)
            .where(
                and(
                    eq(questionAttempts.userId, userId),
                    gte(questionAttempts.timestamp, sevenDaysAgo)
                )
            ),
        db.select().from(topics).limit(20),
    ]);

    // Onboarding redirect handled by layout

    const examReadiness = await getExamReadiness();

    // Calculate metrics
    const last7dCorrect = last7dAttempts.filter((a) => a.isCorrect).length;
    const accuracy = last7dAttempts.length > 0
        ? Math.round((last7dCorrect / last7dAttempts.length) * 100)
        : 0;

    const currentStreak = streakData?.currentStreak || 0;

    // Calculate user level based on XP (questions answered * 10)
    const totalXP = xpForAttempts(recentAttempts.length);
    const userLevel = levelForXp(totalXP);

    // Weekly activity data
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = weekDays.map((day, idx) => {
        const dayDate = new Date(sevenDaysAgo);
        dayDate.setDate(sevenDaysAgo.getDate() + idx);
        const dayAttempts = last7dAttempts.filter((a) => {
            if (!a.timestamp) return false;
            const attemptDate = new Date(a.timestamp);
            return attemptDate.toDateString() === dayDate.toDateString();
        });
        return {
            day,
            minutes: dayAttempts.length * 2, // Estimate 2 min per question
        };
    });

    // Weekly streak visualization
    const weekStreak = weekDays.map((_, idx) => {
        const dayDate = new Date(sevenDaysAgo);
        dayDate.setDate(sevenDaysAgo.getDate() + idx);
        return last7dAttempts.some((a) => {
            if (!a.timestamp) return false;
            return new Date(a.timestamp).toDateString() === dayDate.toDateString();
        });
    });

    // Process mastery topics with topic names
    const masteryTopics = masteryData
        .map((m) => {
            const topic = topicsData.find((t) => t.id === m.topicId);
            const course = userCourses.find((c) => topic?.courseId === c.id);
            return {
                id: m.topicId,
                name: topic?.title || 'Okänt område',
                course: course?.code || 'Okänd',
                mastery: (m.masteryLevel || 0) / 5,
            };
        })
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, 6);

    return (
        <div className="dashboard-command">
            <div className="dashboard-command-bg" />
            <div className="dashboard-command-sheen" />
            <div className="relative z-10 mx-auto w-full max-w-[1120px] min-w-0 px-4 py-6 sm:px-6 lg:px-8">

            {/* ── Greeting + Stats ── */}
            <DashboardHeader
                name={displayName}
                streak={currentStreak}
                accuracy={accuracy}
                totalQuestions={recentAttempts.length}
                level={userLevel}
            />


            {/* ── Active Courses ── */}
            <div className="mb-5">
                <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase dashboard-subtle">
                            Kurser
                        </p>
                        <h2 className="text-xl font-semibold text-balance" style={{ letterSpacing: 0 }}>
                        Dina kurser
                        </h2>
                    </div>
                    <Link
                        href="/courses"
                        className="min-h-10 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-[var(--foreground-muted)] transition-colors duration-150 hover:text-[var(--accent-500)]"
                    >
                        Utforska fler
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {userCourses.map((course, idx) => {
                        const courseMastery = masteryData.filter((m) => {
                            const topic = topicsData.find((t) => t.id === m.topicId);
                            return topic?.courseId === course.id;
                        });
                        const avgMastery = courseMastery.length > 0
                            ? courseMastery.reduce((sum, m) => sum + (m.masteryLevel || 0), 0) / courseMastery.length / 5
                            : 0;
                        const topicsCount = topicsData.filter((t) => t.courseId === course.id).length;
                        const masteredCount = courseMastery.filter((m) => (m.masteryLevel || 0) >= 4).length;

                        return (
                            <CourseCard
                                key={course.id}
                                code={course.code || `Kurs ${idx + 1}`}
                                name={course.name}
                                progress={Math.round(avgMastery * 100)}
                                topicsMastered={masteredCount}
                                topicsTotal={topicsCount || 1}
                                index={idx}
                            />
                        );
                    })}
                    {userCourses.length === 0 && (
                        <div className="dashboard-card col-span-full p-8 text-center">
                            <p className="dashboard-muted">Inga kurser än. Bläddra i kurskatalogen för att komma igång!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 3: Weekly Activity + Streak ── */}
            <div className="mb-5">
                <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold uppercase dashboard-subtle">
                        Veckoläge
                    </p>
                    <h2 className="text-xl font-semibold text-balance" style={{ letterSpacing: 0 }}>
                        Aktivitet och svit
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <WeeklyActivityChart
                    data={weeklyData}
                    totalQuestions={recentAttempts.length}
                    accuracy={accuracy}
                />
                <StreakCard
                    currentStreak={currentStreak}
                    weekStreak={weekStreak}
                    level={userLevel}
                />
                </div>
            </div>

            {/* ── Row 4: Exam Readiness ── */}
            {examReadiness.length > 0 && (
                <div className="mb-5">
                    <p className="mb-1 text-xs font-semibold uppercase dashboard-subtle">
                        Prognos
                    </p>
                    <h2 className="mb-3 text-xl font-semibold text-balance" style={{ letterSpacing: 0 }}>
                        Tentamensredo
                    </h2>
                    <div className="space-y-3">
                        {examReadiness.map(er => (
                            <ExamReadinessBar
                                key={er.courseId}
                                courseName={er.courseName}
                                courseCode={er.courseCode}
                                overallReadiness={er.overallReadiness}
                                estimatedGrade={er.estimatedGrade}
                                weakestTopics={er.weakestTopics}
                                strongestTopics={er.strongestTopics}
                                topicBreakdown={er.topicBreakdown}
                                studyTimeThisWeek={er.studyTimeThisWeek}
                                questionsThisWeek={er.questionsThisWeek}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Row 5: Knowledge Map ── */}
            <div className="dashboard-card dashboard-panel dashboard-panel-focus p-5 sm:p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase dashboard-subtle">
                            Fokus
                        </p>
                        <h3 className="text-base font-semibold">
                            Fokusområden
                        </h3>
                        <p className="dashboard-muted text-xs mt-0.5">
                            Klicka på ett område för att öva direkt
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                        {/* Legend — the same calm status palette used by the topic cards */}
                        <div className="hidden sm:flex gap-3 flex-wrap justify-end">
                            {[
                                { color: '#1d7375', label: 'Bemästrad' },
                                { color: '#3585a3', label: 'Lärande' },
                                { color: '#c27838', label: 'Utvecklas' },
                                { color: '#c65d4b', label: 'Behöver fokus' },
                            ].map((l, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                                    <span className="dashboard-subtle text-xs">
                                        {l.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/analytics"
                            className="min-h-10 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-[var(--foreground-muted)] transition-colors duration-150 hover:text-[var(--accent-500)]"
                        >
                            Se alla
                        </Link>
                    </div>
                </div>

                {/* Topic grid */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(155px,1fr))] gap-2.5">
                    {masteryTopics.map((topic) => (
                        <MasteryTopicCard
                            key={topic.id}
                            name={topic.name}
                            course={topic.course}
                            mastery={topic.mastery}
                            topicId={topic.id}
                            topicName={topic.name}
                        />
                    ))}
                    {masteryTopics.length === 0 && (
                        <div className="dashboard-muted col-span-full text-center py-8">
                            Börja öva för att se din kunskapskarta!
                        </div>
                    )}
                </div>
            </div>

            </div>
        </div>
    );
}
