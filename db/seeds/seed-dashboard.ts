/**
 * Seed Dashboard Data
 * Initialize dashboard tables with sample data for testing
 */

import { db } from '../drizzle';
import {
    studySessions,
    questionAttempts,
    userTopicMastery,
    userStreaks,
    userAchievements,
    userCity,
    userGoals,
    userPersonalRecords,
} from '../dashboard-schema';
import { users, topics, questions, courses } from '../schema';
import { eq } from 'drizzle-orm';

async function seedDashboard() {
    console.log('🌱 Seeding dashboard data...');

    try {
        // Get test user
        const testUser = await db.select().from(users).where(eq(users.email, 'test@qmath.se')).limit(1);

        if (testUser.length === 0) {
            console.log('❌ Test user not found. Run db:seed first.');
            return;
        }

        const userId = testUser[0].id;
        console.log(`✅ Found test user: ${userId}`);

        // Get a course
        const allCourses = await db.select().from(courses).limit(1);
        if (allCourses.length === 0) {
            console.log('❌ No courses found. Run db:seed first.');
            return;
        }
        const courseId = allCourses[0].id;

        // 1. Initialize user streak
        console.log('Creating user streak...');
        await db.insert(userStreaks).values({
            userId,
            currentStreak: 7,
            longestStreak: 14,
            lastStudyDate: new Date(),
            freezeDaysAvailable: 2,
            freezeDaysUsed: 0,
            freezeDaysResetAt: new Date(),
            totalStudyDays: 42,
        });

        // 2. Initialize city state
        console.log('Creating city state...');
        await db.insert(userCity).values({
            userId,
            courseId,
            cityLevel: 3,
            totalXp: 450,
            buildings: JSON.stringify({
                foundation: 5,
                library: 3,
                garden: 2,
                observatory: 1,
            }),
            weather: 'sunny',
        });

        // 3. Add some achievements
        console.log('Creating achievements...');
        await db.insert(userAchievements).values([
            {
                userId,
                achievementId: 'first_steps',
                category: 'learning',
                metadata: JSON.stringify({ topicId: 'first-topic' }),
            },
            {
                userId,
                achievementId: 'week_warrior',
                category: 'habits',
                metadata: JSON.stringify({ streakDays: 7 }),
            },
            {
                userId,
                achievementId: 'century_club',
                category: 'learning',
                metadata: JSON.stringify({ questionsCompleted: 100 }),
            },
        ]);

        // 4. Create some goals
        console.log('Creating user goals...');
        await db.insert(userGoals).values([
            {
                userId,
                type: 'grade',
                description: 'Pass the exam with at least a C grade',
                targetValue: 'C',
                targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                progress: 65,
                completed: false,
                metadata: JSON.stringify({ courseId }),
            },
            {
                userId,
                type: 'mastery',
                description: 'Master Linear Algebra fundamentals',
                progress: 40,
                completed: false,
                metadata: JSON.stringify({ topicIds: ['topic-1', 'topic-2'] }),
            },
            {
                userId,
                type: 'habit',
                description: 'Study 5 days in a row',
                targetValue: '5',
                progress: 100,
                completed: true,
                completedAt: new Date(),
            },
        ]);

        // 5. Initialize personal records
        console.log('Creating personal records...');
        await db.insert(userPersonalRecords).values({
            userId,
            longestStreak: 14,
            mostProblemsOneDay: 45,
            fastestMasteryDays: 3,
            fastestMasteryTopic: 'Matrix Multiplication',
            highestAccuracySession: 95.0,
            highestAccuracyDate: new Date(),
            totalXpEarned: 450,
        });

        // 6. Create sample study sessions
        console.log('Creating study sessions...');
        const now = new Date();
        const sessionIds: string[] = [];

        for (let i = 0; i < 5; i++) {
            const sessionDate = new Date(now);
            sessionDate.setDate(sessionDate.getDate() - i);

            const session = await db
                .insert(studySessions)
                .values({
                    userId,
                    courseId,
                    startedAt: sessionDate,
                    endedAt: new Date(sessionDate.getTime() + (25 + Math.random() * 35) * 60 * 1000),
                    sessionType: i % 3 === 0 ? 'pomodoro' : 'free',
                    focusScore: 0.7 + Math.random() * 0.3,
                    breaksTaken: Math.floor(Math.random() * 3),
                })
                .returning();

            sessionIds.push(session[0].id);
        }

        // 7. Get some topics and create mastery data
        console.log('Creating topic mastery data...');
        const allTopics = await db.select().from(topics).limit(10);

        for (const topic of allTopics) {
            const totalAttempts = Math.floor(Math.random() * 30) + 5;
            const correctAttempts = Math.floor(totalAttempts * (0.6 + Math.random() * 0.3));
            const accuracy = correctAttempts / totalAttempts;

            let masteryLevel = 2;
            if (totalAttempts >= 20 && accuracy >= 0.95) masteryLevel = 5;
            else if (totalAttempts >= 15 && accuracy >= 0.8) masteryLevel = 4;
            else if (totalAttempts >= 10 && accuracy >= 0.6) masteryLevel = 3;

            await db.insert(userTopicMastery).values({
                userId,
                topicId: topic.id,
                masteryLevel,
                totalAttempts,
                correctAttempts,
                lastPracticedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                nextReviewDate: new Date(now.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000),
                consecutiveCorrect: Math.floor(Math.random() * 5),
            });
        }

        // 8. Create sample question attempts
        console.log('Creating question attempts...');
        const allQuestions = await db.select().from(questions).limit(20);

        for (let i = 0; i < 50; i++) {
            const question = allQuestions[Math.floor(Math.random() * allQuestions.length)];
            const sessionId = sessionIds[Math.floor(Math.random() * sessionIds.length)];
            const isCorrect = Math.random() > 0.3;
            const difficultyLevel = Math.floor(Math.random() * 5) + 1;

            const errorTypes = ['conceptual', 'procedural', 'computational', 'interpretation', 'notation'];

            await db.insert(questionAttempts).values({
                userId,
                sessionId,
                questionId: question.id,
                topicId: question.topicId,
                difficultyLevel,
                startedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                completedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000 + 120000),
                isCorrect,
                attempts: isCorrect ? 1 : Math.floor(Math.random() * 3) + 1,
                hintsUsed: Math.floor(Math.random() * 2),
                errorType: !isCorrect ? errorTypes[Math.floor(Math.random() * errorTypes.length)] : null,
                confidenceBefore: Math.floor(Math.random() * 5) + 1,
                reflectionText: !isCorrect && Math.random() > 0.5 ? 'I need to review this concept more carefully' : null,
                xpEarned: isCorrect ? difficultyLevel * 10 : 0,
            });
        }

        console.log('✅ Dashboard data seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding dashboard data:', error);
        throw error;
    }
}

seedDashboard()
    .then(() => {
        console.log('✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
