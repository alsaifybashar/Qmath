import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq, and, gte } from 'drizzle-orm';
import {
    userStreaks,
    userTopicMastery,
    questionAttempts,
    userAchievements,
    studySessions,
} from '@/db/dashboard-schema';
import { courses, topics, enrollments } from '@/db/schema';

import { checkAndMaintainStreak } from '@/lib/dashboard/streak-system';
import { getExamReadiness, getDashboardInsights, getStudyPatterns } from '@/app/actions/dashboard-insights';
import {
    StatCard,
    WeeklyActivityChart,
    StreakCard,
    CourseCard,
    MasteryTopicCard,
    QuickActions,
    AIRecommendationCard,
} from '@/components/dashboard/DashboardCards';
import { ExamReadinessBar } from '@/components/dashboard/ExamReadinessBar';
import { InsightCards, StudyPatternCard } from '@/components/dashboard/InsightCards';
import { ReviewWidget } from '@/components/dashboard/ReviewNotifications';

export const metadata = {
    title: 'Dashboard | Qmath',
    description: 'Your personalized learning dashboard',
};

const C = {
    bg: '#F0F2F8',
    text: '#1A1D2E',
    textMuted: '#A0A5C0',
    blue: '#4361EE',
    green: '#22C55E',
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
        achievements,
        studySessionsData,
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
        db.select().from(userAchievements).where(eq(userAchievements.userId, userId)),
        db
            .select({
                startedAt: studySessions.startedAt,
                endedAt: studySessions.endedAt,
            })
            .from(studySessions)
            .where(eq(studySessions.userId, userId)),
        db.select().from(topics).limit(20),
    ]);

    // Onboarding redirect handled by layout

    // Fetch Phase 3 data in parallel (zero AI cost — pure DB queries)
    const [examReadiness, dashboardInsights, studyPatterns] = await Promise.all([
        getExamReadiness(),
        getDashboardInsights(),
        getStudyPatterns(),
    ]);

    // Fetch Phase 5 review notifications
    const { getReviewNotifications } = await import('@/app/actions/notification-engine');
    const reviewSummary = await getReviewNotifications();

    // Calculate metrics
    const totalStudyMinutes = studySessionsData.reduce((acc, session) => {
        if (session.startedAt && session.endedAt) {
            const duration = (session.endedAt.getTime() - session.startedAt.getTime()) / 60000;
            return acc + Math.min(duration, 180);
        }
        return acc;
    }, 0);

    const last7dCorrect = last7dAttempts.filter((a) => a.isCorrect).length;
    const accuracy = last7dAttempts.length > 0
        ? Math.round((last7dCorrect / last7dAttempts.length) * 100)
        : 0;

    const currentStreak = streakData?.currentStreak || 0;
    const longestStreak = streakData?.longestStreak || 0;

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
                name: topic?.title || 'Unknown Topic',
                course: course?.code || 'Unknown',
                mastery: (m.masteryLevel || 0) / 5,
            };
        })
        .sort((a, b) => b.mastery - a.mastery)
        .slice(0, 12);

    // Find weakest topic for AI recommendation
    const weakestTopic = masteryData
        .map((m) => {
            const topic = topicsData.find((t) => t.id === m.topicId);
            const course = userCourses.find((c) => topic?.courseId === c.id);
            return {
                name: topic?.title || 'Unknown Topic',
                course: course?.name || 'your course',
                mastery: (m.masteryLevel || 0) / 5,
            };
        })
        .sort((a, b) => a.mastery - b.mastery)[0];

    // Get greeting based on time
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    // Calculate review count (topics needing review)
    const reviewCount = masteryData.filter((m) => (m.masteryLevel || 0) < 3).length;

    return (
        <div className="p-7 max-w-[1060px] min-w-0 mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-7">
                <div>
                    <h1 className="text-3xl font-normal" style={{ color: C.text }}>
                        {greeting}, {user.name || 'Student'}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                        You have <strong style={{ color: C.blue }}>{reviewCount} topics</strong> that need your attention
                    </p>
                </div>
            </div>

            {/* XP Progress Bar */}
            <div
                className="flex items-center gap-3.5 rounded-xl px-5 py-3 mb-7"
                style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #EFF1F8',
                }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-normal text-base"
                    style={{
                        background: `linear-gradient(135deg, #4361EE, #7C5CFC)`,
                        boxShadow: '0 3px 10px rgba(67,97,238,0.3)',
                    }}
                >
                    {userLevel}
                </div>
                <div className="flex-1">
                    <div className="h-2 rounded-full bg-[#EFF1F8] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                                width: `${(totalXP % 500) / 5}%`,
                                background: 'linear-gradient(90deg, #4361EE, #7C5CFC)',
                            }}
                        />
                    </div>
                </div>
                <span className="text-xs font-semibold text-[#6B7194]">
                    {totalXP % 500} / 500 XP
                </span>
                <span className="text-base">⚡</span>
            </div>

            {/* Row 1: Weekly Activity + Streak */}
            <div className="grid grid-cols-[1fr_320px] gap-4 mb-6">
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

            {/* Row 2: Smart Insights + Study Patterns (Phase 3) */}
            {(dashboardInsights.length > 0 || studyPatterns) && (
                <div className="grid grid-cols-[1fr_320px] gap-4 mb-6">
                    <InsightCards insights={dashboardInsights} />
                    <StudyPatternCard pattern={studyPatterns} />
                </div>
            )}

            {/* Row 3: Exam Readiness (Phase 3) */}
            {examReadiness.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-normal mb-4" style={{ color: C.text }}>
                        Exam Readiness
                    </h2>
                    <div className="space-y-4">
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

            {/* Row 4: Courses */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-normal" style={{ color: C.text }}>
                        Active Courses
                    </h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                                code={course.code || `Course ${idx + 1}`}
                                name={course.name}
                                progress={Math.round(avgMastery * 100)}
                                topicsMastered={masteredCount}
                                topicsTotal={topicsCount || 1}
                                gradient={courseGradients[idx % courseGradients.length]}
                                reviewCount={courseMastery.filter((m) => (m.masteryLevel || 0) < 3).length}
                            />
                        );
                    })}
                    {userCourses.length === 0 && (
                        <div
                            className="col-span-3 rounded-2xl p-8 text-center"
                            style={{ background: 'white', border: '1px solid #EFF1F8' }}
                        >
                            <p style={{ color: C.textMuted }}>No courses yet. Browse the course catalog to get started!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Row 5: Quick Actions + AI Recommendation + Reviews */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <QuickActions reviewCount={reviewCount} />
                {weakestTopic ? (
                    <AIRecommendationCard
                        topicName={weakestTopic.name}
                        mastery={weakestTopic.mastery}
                        courseName={weakestTopic.course}
                        daysUntilExam={30}
                    />
                ) : (
                    <AIRecommendationCard
                        topicName="a new topic"
                        mastery={0}
                        courseName="your studies"
                    />
                )}
                <ReviewWidget
                    notifications={reviewSummary.notifications}
                    overdue={reviewSummary.overdue}
                    dueToday={reviewSummary.dueToday}
                />
            </div>

            {/* Row 4: Mastery Map */}
            <div
                className="rounded-2xl p-6"
                style={{
                    background: 'white',
                    border: '1px solid #EFF1F8',
                    boxShadow: '0 2px 12px rgba(26,29,46,0.06)',
                }}
            >
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h3 className="text-xl font-bold" style={{ color: C.text }}>
                            Knowledge Map
                        </h3>
                        <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                            Your mastery level across all topics
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4">
                        {[
                            { color: '#10B981', label: 'Mastered ≥90%' },
                            { color: '#3B82F6', label: 'Learning 60–89%' },
                            { color: '#F59E0B', label: 'Developing 30–59%' },
                            { color: '#EF4444', label: 'Needs focus <30%' },
                        ].map((l, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                                <span className="text-xs" style={{ color: C.textMuted }}>
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
                        <div className="col-span-full text-center py-8" style={{ color: C.textMuted }}>
                            Start practicing to see your knowledge map!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
