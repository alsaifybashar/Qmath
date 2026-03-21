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
import {
    WeeklyActivityChart,
    StreakCard,
    CourseCard,
    MasteryTopicCard,
    QuickActions,
    AIRecommendationCard,
    QuickNavigation,
} from '@/components/dashboard/DashboardCards';
import StudyIntelligencePanel from '@/components/dashboard/StudyIntelligencePanel';
import type { StudyAction } from '@/components/dashboard/StudyIntelligencePanel';
import { ExamReadinessBar } from '@/components/dashboard/ExamReadinessBar';


export const metadata = {
    title: 'Dashboard | Qmath',
    description: 'Din personliga lärplattform',
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

    // Find weakest topic for AI recommendation
    const weakestTopic = masteryData
        .map((m) => {
            const topic = topicsData.find((t) => t.id === m.topicId);
            const course = userCourses.find((c) => topic?.courseId === c.id);
            return {
                name: topic?.title || 'Okänt område',
                course: course?.name || 'din kurs',
                mastery: (m.masteryLevel || 0) / 5,
            };
        })
        .sort((a, b) => a.mastery - b.mastery)[0];

    // Build Study Intelligence actions from mastery data (sorted by urgency)
    const studyActions: StudyAction[] = masteryData
        .map((m) => {
            const topic = topicsData.find((t) => t.id === m.topicId);
            const course = userCourses.find((c) => topic?.courseId === c.id);
            const mastery = (m.masteryLevel || 0) / 5;
            const urgency = Math.max(1, Math.min(5, Math.round((1 - mastery) * 5))) as 1 | 2 | 3 | 4 | 5;
            return {
                topicId: m.topicId,
                topicName: topic?.title || 'Okänt område',
                courseCode: course?.code || '—',
                expectedImprovement: Math.round((1 - mastery) * 15),
                urgency,
                estimatedMinutes: Math.round((1 - mastery) * 30 + 10),
                reason: mastery < 0.4
                    ? 'Låg bemästringsnivå — hög prioritet'
                    : mastery < 0.7
                        ? 'Behöver mer övning'
                        : 'Nära bemästring',
            };
        })
        .filter((a) => a.expectedImprovement > 0)
        .sort((a, b) => b.urgency - a.urgency)
        .slice(0, 6);

    // Session effect estimate
    const avgMasteryGain = studyActions.length > 0
        ? Math.round(studyActions.slice(0, 2).reduce((s, a) => s + a.expectedImprovement, 0) / 2)
        : 0;

    // Time distribution across enrolled courses
    const courseColors = ['#4361EE', '#22C55E', '#EAB308', '#8B5CF6', '#F97316'];
    const timeDistribution = userCourses.slice(0, 5).map((c, i) => {
        const cMastery = masteryData.filter((m) => {
            const t = topicsData.find((tp) => tp.id === m.topicId);
            return t?.courseId === c.id;
        });
        const avgM = cMastery.length > 0
            ? cMastery.reduce((s, m) => s + (m.masteryLevel || 0), 0) / cMastery.length / 5
            : 0;
        const minutes = Math.round((1 - avgM) * 40 + 10);
        return { label: c.code || c.name, minutes, color: courseColors[i % courseColors.length] };
    });

    // Plan status (simple heuristic)
    const weeklyQuestions = last7dAttempts.length;
    const planStatus: 'on-track' | 'ahead' | 'behind' | null =
        weeklyQuestions >= 30 ? 'ahead'
            : weeklyQuestions >= 15 ? 'on-track'
                : weeklyQuestions > 0 ? 'behind'
                    : null;

    // Get greeting based on time
    const hour = now.getHours();
    const greeting = hour < 12 ? 'God morgon' : hour < 18 ? 'God eftermiddag' : 'God kväll';

    // Calculate review count (topics needing review)
    const reviewCount = masteryData.filter((m) => (m.masteryLevel || 0) < 3).length;

    return (
        <div className="p-7 max-w-[1060px] min-w-0 mx-auto">

            {/* ── Header ── */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold" style={{ color: C.text }}>
                    {greeting}, {user.name || 'Student'}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>
                    {reviewCount > 0
                        ? <><strong style={{ color: C.blue }}>{reviewCount} områden</strong> behöver din uppmärksamhet</>
                        : 'Allt är uppdaterat — bra jobbat!'}
                </p>
            </div>

            {/* ── Row 1: Today's Focus (primary CTA) + Quick Actions ── */}
            <div className="grid grid-cols-[1fr_300px] gap-4 mb-6">
                {weakestTopic ? (
                    <AIRecommendationCard
                        topicName={weakestTopic.name}
                        mastery={weakestTopic.mastery}
                        courseName={weakestTopic.course}
                        daysUntilExam={30}
                    />
                ) : (
                    <AIRecommendationCard
                        topicName="ett nytt område"
                        mastery={0}
                        courseName="dina studier"
                    />
                )}
                <QuickActions reviewCount={reviewCount} />
            </div>

            {/* ── Study Intelligence Panel ── */}
            {studyActions.length > 0 && (
                <div className="mb-6">
                    <StudyIntelligencePanel
                        actions={studyActions}
                        sessionEffect={avgMasteryGain}
                        focusRecommendation={
                            studyActions[0]
                                ? `Baserat på din nuvarande prestationsprofil rekommenderar vi att du börjar med "${studyActions[0].topicName}" i ${studyActions[0].courseCode}. Det här området har störst potential att förbättra ditt resultat på kommande tentamen. Planera ett fokusstudiepas på ${studyActions[0].estimatedMinutes} minuter.`
                                : ''
                        }
                        timeDistribution={timeDistribution}
                        planStatus={planStatus}
                    />
                </div>
            )}

            {/* ── Row 2: Active Courses ── */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-base font-semibold" style={{ color: C.text }}>
                        Dina kurser
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
                                code={course.code || `Kurs ${idx + 1}`}
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
                            <p style={{ color: C.textMuted }}>Inga kurser än. Bläddra i kurskatalogen för att komma igång!</p>
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
                    <h2 className="text-base font-semibold mb-3" style={{ color: C.text }}>
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
                        <h3 className="text-base font-semibold" style={{ color: C.text }}>
                            Kunskapskarta
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
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
    );
}
