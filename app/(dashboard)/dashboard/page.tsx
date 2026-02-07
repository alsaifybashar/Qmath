import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq, and, sql, gte } from 'drizzle-orm';
import {
    userCity,
    userStreaks,
    userTopicMastery,
    questionAttempts,
    userAchievements,
    studySessions,
} from '@/db/dashboard-schema';
import { courses } from '@/db/schema';
import VirtualCity, { type CityState } from '@/components/dashboard/VirtualCity';
import DailyFocus, { type DailyRecommendation } from '@/components/dashboard/DailyFocus';
import StreakTracker, { type StreakData } from '@/components/dashboard/StreakTracker';
import KnowledgeMap, { type TopicNode } from '@/components/dashboard/KnowledgeMap';
import PomodoroTimer from '@/components/dashboard/PomodoroTimer';
import StudyStats from '@/components/dashboard/StudyStats';
import ErrorAnalysis from '@/components/dashboard/ErrorAnalysis';
import QuickNav from '@/components/dashboard/QuickNav';
import { generateDailyFocus, getPersonalizedTip, type UserPerformanceData, type TopicData } from '@/lib/dashboard/recommendation-engine';
import { calculateCityProgress, type UserCityData } from '@/lib/dashboard/city-system';

import { checkAndMaintainStreak } from '@/lib/dashboard/streak-system';

export const metadata = {
    title: 'Dashboard | Qmath',
    description: 'Your personalized learning dashboard',
};

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = session.user;
    const userId = user.id!;

    // Calculate time ranges
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Verify and maintain streak (handle freeze days or resets)
    await checkAndMaintainStreak(userId);

    // Fetch dashboard data
    const userStreaksData = await db.query.userStreaks.findFirst({
        where: eq(userStreaks.userId, userId),
    });

    // Fetch all dashboard data in parallel
    const [
        cityData,
        masteryData,
        userCourses,
        recentAttempts,
        last24hAttempts,
        last7dAttempts,
        achievements,
        studySessionsData,
    ] = await Promise.all([
        // Get city state
        db.select().from(userCity).where(eq(userCity.userId, userId)).limit(1),

        // Get mastery for recommendations
        db
            .select({
                topicId: userTopicMastery.topicId,
                masteryLevel: userTopicMastery.masteryLevel,
                totalAttempts: userTopicMastery.totalAttempts,
                correctAttempts: userTopicMastery.correctAttempts,
                lastPracticedAt: userTopicMastery.lastPracticedAt,
                nextReviewDate: userTopicMastery.nextReviewDate,
            })
            .from(userTopicMastery)
            .where(eq(userTopicMastery.userId, userId)),

        // Get user's courses
        db.select().from(courses).limit(1),

        // Get all question attempts for stats
        db
            .select({
                id: questionAttempts.id,
                isCorrect: questionAttempts.isCorrect,
                difficultyLevel: questionAttempts.difficultyLevel,
                timestamp: questionAttempts.timestamp,
                startedAt: questionAttempts.startedAt,
                errorType: questionAttempts.errorType,
            })
            .from(questionAttempts)
            .where(eq(questionAttempts.userId, userId)),

        // Get last 24h attempts
        db
            .select({ isCorrect: questionAttempts.isCorrect })
            .from(questionAttempts)
            .where(
                and(
                    eq(questionAttempts.userId, userId),
                    gte(questionAttempts.timestamp, oneDayAgo)
                )
            ),

        // Get last 7d attempts
        db
            .select({
                isCorrect: questionAttempts.isCorrect,
                difficultyLevel: questionAttempts.difficultyLevel,
            })
            .from(questionAttempts)
            .where(
                and(
                    eq(questionAttempts.userId, userId),
                    gte(questionAttempts.timestamp, sevenDaysAgo)
                )
            ),

        // Get achievements
        db.select().from(userAchievements).where(eq(userAchievements.userId, userId)),

        // Get study sessions for time calculation
        db
            .select({
                startedAt: studySessions.startedAt,
                endedAt: studySessions.endedAt,
            })
            .from(studySessions)
            .where(eq(studySessions.userId, userId)),
    ]);

    // Calculate study time in minutes
    const totalStudyMinutes = studySessionsData.reduce((acc, session) => {
        if (session.startedAt && session.endedAt) {
            const duration = (session.endedAt.getTime() - session.startedAt.getTime()) / 60000;
            return acc + Math.min(duration, 180); // Cap at 3 hours per session
        }
        return acc;
    }, 0);

    // Calculate hard question accuracy
    const hardQuestions = last7dAttempts.filter((a) => (a.difficultyLevel || 0) >= 4);
    const hardCorrect = hardQuestions.filter((a) => a.isCorrect).length;
    const hardQuestionAccuracy = hardQuestions.length > 0 ? (hardCorrect / hardQuestions.length) * 100 : 0;

    // Calculate 7-day accuracy
    const last7dCorrect = last7dAttempts.filter((a) => a.isCorrect).length;
    const last7dAccuracy = last7dAttempts.length > 0 ? (last7dCorrect / last7dAttempts.length) * 100 : 0;

    // Count mastered topics
    const topicsMastered = masteryData.filter((m) => (m.masteryLevel || 0) >= 4).length;

    // Get recent achievements (last 7 days)
    const recentAchievementIds = achievements
        .filter((a) => a.earnedAt && a.earnedAt.getTime() > sevenDaysAgo.getTime())
        .map((a) => a.achievementId);

    // Build city data for progression calculation
    const userCityData: UserCityData = {
        totalXp: cityData[0]?.totalXp || 0,
        questionsCompleted: recentAttempts.length,
        questionsLast24h: last24hAttempts.length,
        questionsLast7d: last7dAttempts.length,
        currentStreak: userStreaksData?.currentStreak || 0,
        longestStreak: userStreaksData?.longestStreak || 0,
        accuracyLast7d: last7dAccuracy,
        hardQuestionAccuracy,
        studyMinutes: totalStudyMinutes,
        topicsMastered,
        achievementsUnlocked: achievements.length,
        recentAchievements: recentAchievementIds,
    };

    // Calculate city progress with all building states
    const cityProgress = calculateCityProgress(userCityData);

    // Default city state for component
    const cityState: CityState = cityData[0]
        ? {
            userId: cityData[0].userId,
            courseId: cityData[0].courseId,
            cityLevel: cityProgress.level,
            totalXp: cityData[0].totalXp ?? 0,
            buildings:
                typeof cityData[0].buildings === 'string'
                    ? JSON.parse(cityData[0].buildings)
                    : cityData[0].buildings || {},
            weather: (cityData[0].weather as 'sunny' | 'cloudy' | 'rainy') || 'sunny',
            lastUpdated: cityData[0].lastUpdated || new Date(),
        }
        : {
            userId: userId,
            courseId: userCourses[0]?.id || '',
            cityLevel: 1,
            totalXp: 0,
            buildings: {},
            weather: 'sunny',
            lastUpdated: new Date(),
        };

    // Default streak data
    const streakData: StreakData = userStreaksData
        ? {
            current: userStreaksData.currentStreak ?? 0,
            longest: userStreaksData.longestStreak ?? 0,
            freezeDaysAvailable: userStreaksData.freezeDaysAvailable ?? 2,
            freezeDaysUsed: userStreaksData.freezeDaysUsed ?? 0,
            totalStudyDays: userStreaksData.totalStudyDays ?? 0,
        }
        : {
            current: 0,
            longest: 0,
            freezeDaysAvailable: 2,
            freezeDaysUsed: 0,
            totalStudyDays: 0,
        };
    // Determine time of day
    const hour = now.getHours();
    const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' =
        hour < 5 ? 'night' :
            hour < 12 ? 'morning' :
                hour < 17 ? 'afternoon' :
                    hour < 21 ? 'evening' : 'night';

    // Generate daily recommendations
    let recommendations: DailyRecommendation[] = [];
    let studyTip: { tip: string; icon: string; category: string } | undefined;

    // Build performance data for recommendations
    const recentCorrect = last7dAttempts.filter((a) => a.isCorrect).length;
    const recentAccuracy = last7dAttempts.length > 0 ? recentCorrect / last7dAttempts.length : 0;

    const performanceData: UserPerformanceData = {
        topics: masteryData.map((m): TopicData => ({
            id: m.topicId,
            title: `Topic ${m.topicId}`, // TODO: Join with topic names
            masteryLevel: (m.masteryLevel ?? 0) as 0 | 1 | 2 | 3 | 4 | 5,
            lastPracticedAt: m.lastPracticedAt,
            nextReviewDate: m.nextReviewDate,
            totalAttempts: m.totalAttempts ?? 0,
            correctAttempts: m.correctAttempts ?? 0,
            errorRate:
                (m.totalAttempts ?? 0) > 0
                    ? 1 - (m.correctAttempts ?? 0) / (m.totalAttempts ?? 0)
                    : 0,
            avgDifficulty: 3,
            avgTimePerQuestion: 60, // 60 seconds default
            prerequisites: [],
            isPrerequisiteFor: [],
            conceptTags: [],
            recentMistakes: [],
        })),
        recentAccuracy,
        totalQuestionsLast7Days: last7dAttempts.length,
        totalQuestionsLast24h: last24hAttempts.length,
        averageSessionLength: 20, // 20 minutes default
        preferredDifficulty: 3,
        learningVelocity: topicsMastered / 7, // Topics mastered per week
        currentStreak: userStreaksData?.currentStreak || 0,
        timeOfDay,
        energyLevel: recentAccuracy > 0.8 ? 'high' : recentAccuracy > 0.6 ? 'medium' : 'low',
    };

    if (masteryData.length > 0) {
        recommendations = await generateDailyFocus(userId, performanceData, {
            maxRecommendations: 4,
            sessionGoal: 'standard',
            focusMode: 'balanced',
        });
    }

    // Get personalized study tip
    studyTip = getPersonalizedTip(performanceData, recommendations[0]?.type);

    // Generate knowledge map topics with sample prerequisite structure
    // TODO: Load actual prerequisite data from curriculum
    const knowledgeMapTopics: TopicNode[] = masteryData.map((m, index) => {
        const baseTitles = [
            'Linear Equations', 'Quadratic Formulas', 'Derivatives', 'Integrals',
            'Vectors', 'Matrices', 'Probability', 'Statistics', 'Trigonometry',
            'Logarithms', 'Sequences', 'Series', 'Limits', 'Continuity',
        ];
        const titleIndex = index % baseTitles.length;

        // Create logical prerequisites based on position
        const prereqs: string[] = [];
        if (index > 0 && index < masteryData.length) {
            // Each topic after the first has at least one prerequisite
            prereqs.push(masteryData[Math.floor(index / 2)]?.topicId || '');
        }

        return {
            id: m.topicId,
            title: baseTitles[titleIndex] || `Topic ${m.topicId}`,
            shortTitle: baseTitles[titleIndex]?.substring(0, 10) || `T${index + 1}`,
            masteryLevel: (m.masteryLevel ?? 0) as 0 | 1 | 2 | 3 | 4 | 5,
            isLocked: prereqs.length > 0 && ((masteryData.find(p => p.topicId === prereqs[0])?.masteryLevel ?? 0) < 3),
            prerequisites: prereqs.filter(p => p !== ''),
            totalAttempts: m.totalAttempts ?? 0,
            correctAttempts: m.correctAttempts ?? 0,
            lastPracticed: m.lastPracticedAt,
            nextReview: m.nextReviewDate,
            category: index % 3 === 0 ? 'Algebra' : index % 3 === 1 ? 'Calculus' : 'Statistics',
            difficulty: Math.min(5, Math.floor(index / 3) + 1),
            estimatedMinutes: 15 + (m.masteryLevel ?? 0) * 5,
        };
    });

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <QuickNav />
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black mb-2">
                        Welcome back, {user.name || 'Student'}! 👋
                    </h1>
                    <p className="text-zinc-500">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>

                {/* Top Row: City and Daily Focus */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Virtual City - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <VirtualCity
                            cityState={cityState}
                            courseName={userCourses[0]?.name || 'Your Course'}
                            cityProgress={cityProgress}
                        />
                    </div>

                    {/* Daily Focus - Takes 1 column */}
                    <div className="lg:col-span-1">
                        <DailyFocus
                            recommendations={recommendations}
                            userName={user.name || 'there'}
                            studyTip={studyTip}
                        />
                    </div>
                </div>

                {/* Second Row: Streak Tracker & Pomodoro */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <StreakTracker streakData={streakData} />
                    </div>
                    <div className="lg:col-span-1">
                        <PomodoroTimer />
                    </div>
                </div>

                {/* Third Row: Knowledge Map */}
                <div className="grid grid-cols-1">
                    <KnowledgeMap
                        topics={knowledgeMapTopics}
                    />
                </div>

                {/* Stats Row */}
                <div className="grid lg:grid-cols-4 gap-4">
                    <StatCard
                        icon="📊"
                        label="Questions Solved"
                        value={recentAttempts.length.toString()}
                        subtext="Total"
                    />
                    <StatCard
                        icon="🎯"
                        label="7-Day Accuracy"
                        value={`${last7dAccuracy.toFixed(0)}%`}
                        subtext={`${last7dAttempts.length} questions`}
                    />
                    <StatCard
                        icon="⏱️"
                        label="Study Time"
                        value={`${Math.round(totalStudyMinutes / 60)}h`}
                        subtext={`${Math.round(totalStudyMinutes)} minutes`}
                    />
                    <StatCard
                        icon="🏆"
                        label="Achievements"
                        value={achievements.length.toString()}
                        subtext="Unlocked"
                    />
                </div>

                {/* Bottom Row: Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <StudyStats
                        attempts={recentAttempts}
                        totalMinutes={totalStudyMinutes}
                    />
                    <ErrorAnalysis attempts={recentAttempts} />
                </div>

            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    icon,
    label,
    value,
    subtext,
}: {
    icon: string;
    label: string;
    value: string;
    subtext: string;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
                <div className="text-2xl">{icon}</div>
                <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-xs text-zinc-400">{subtext}</div>
                </div>
            </div>
        </div>
    );
}

// Loading state
function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                    <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
