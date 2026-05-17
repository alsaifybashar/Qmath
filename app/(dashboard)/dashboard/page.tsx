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

import { checkAndMaintainStreak } from '@/lib/dashboard/streak-system';
import { getExamReadiness } from '@/app/actions/dashboard-insights';
import { Command, Sparkles } from 'lucide-react';
import {
    WeeklyActivityChart,
    StreakCard,
    CourseCard,
    MasteryTopicCard,
    QuickNavigation,
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
    const totalXP = recentAttempts.length * 10;
    const userLevel = Math.floor(totalXP / 500) + 1;

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

    // Course gradients
    const courseGradients = [
        'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)',
        'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
        'linear-gradient(135deg, #4361EE 0%, #7C5CFC 100%)',
        'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
        'linear-gradient(135deg, #00C6FB 0%, #005BEA 100%)',
    ];

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
        .sort((a, b) => b.mastery - a.mastery)
        .slice(0, 12);


    // Get greeting based on time
    const hour = now.getHours();
    const greeting = hour < 12 ? 'God morgon' : hour < 18 ? 'God eftermiddag' : 'God kväll';

    return (
        <div className="dashboard-command">
            <div className="dashboard-command-bg" />
            <div className="dashboard-command-sheen" />
            <div className="relative z-10 p-7 max-w-[1060px] min-w-0 mx-auto">

            {/* ── Header ── */}
            <div className="dashboard-card mb-6 p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-teal-300/25 bg-teal-400/10 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-100">
                            <Command className="h-3.5 w-3.5" />
                            Kontrollcenter
                        </div>
                        <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
                            {greeting}, {user.name || 'Student'}
                        </h1>
                        <p className="dashboard-muted mt-2 max-w-2xl text-sm leading-6">
                            Dagens läge, dina kurser och snabbaste vägen tillbaka till momentum.
                        </p>
                    </div>
                    <div className="rounded-lg border border-orange-300/25 bg-orange-400/10 p-4 shadow-xl shadow-orange-500/10">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-300/15 text-orange-700 dark:text-orange-100">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-orange-700 dark:text-orange-200">Dagens signal</p>
                                <p className="text-sm font-bold">{accuracy}% träffsäkerhet · nivå {userLevel}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ── Row 2: Active Courses ── */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-base font-semibold">
                        Dina kurser
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {userCourses.slice(0, 3).map((course, idx) => {
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
                                gradient={courseGradients[idx % courseGradients.length]}
                            />
                        );
                    })}
                    {userCourses.length === 0 && (
                        <div
                            className="dashboard-card col-span-3 p-8 text-center"
                        >
                            <p className="dashboard-muted">Inga kurser än. Bläddra i kurskatalogen för att komma igång!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 3: Weekly Activity + Streak ── */}
            <div className="grid grid-cols-[1fr_300px] gap-4 mb-6">
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

            {/* ── Row 4: Exam Readiness ── */}
            {examReadiness.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-base font-semibold mb-3">
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
            <div className="dashboard-card p-6">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h3 className="text-base font-semibold">
                            Kunskapskarta
                        </h3>
                        <p className="dashboard-muted text-xs mt-0.5">
                            Din mästerskapsnivå över alla områden
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-3 flex-wrap justify-end">
                        {[
                            { color: '#10B981', label: 'Bemästrad' },
                            { color: '#3B82F6', label: 'Lärande' },
                            { color: '#F59E0B', label: 'Utvecklas' },
                            { color: '#EF4444', label: 'Behöver fokus' },
                        ].map((l, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                                <span className="dashboard-subtle text-xs">
                                    {l.label}
                                </span>
                            </div>
                        ))}
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
                        />
                    ))}
                    {masteryTopics.length === 0 && (
                        <div className="dashboard-muted col-span-full text-center py-8">
                            Börja öva för att se din kunskapskarta!
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 6: All Tools & Navigation ── */}
            <div className="mt-8">
                <QuickNavigation />
            </div>
            </div>
        </div>
    );
}
