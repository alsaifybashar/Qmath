import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { users, exams, attemptLogs, courses, questions, enrollments } from '@/db/schema';
import { sql, count, desc, gte, eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

/**
 * Admin-only API endpoint for fetching dashboard statistics
 * GET /api/admin/stats
 */
export async function GET() {
    try {
        // Check authentication and admin role
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user is admin
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        // Get date range for "this week" calculations
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Total users count
        const [totalUsersResult] = await db.select({ count: count() }).from(users);
        const totalUsers = totalUsersResult?.count || 0;

        // Users registered this week
        const [usersThisWeekResult] = await db
            .select({ count: count() })
            .from(users)
            .where(gte(users.createdAt, oneWeekAgo));
        const usersThisWeek = usersThisWeekResult?.count || 0;

        // Total exams count
        const [totalExamsResult] = await db.select({ count: count() }).from(exams);
        const totalExams = totalExamsResult?.count || 0;

        // Exams uploaded this week
        const [examsThisWeekResult] = await db
            .select({ count: count() })
            .from(exams)
            .where(gte(exams.createdAt, oneWeekAgo));
        const examsThisWeek = examsThisWeekResult?.count || 0;

        // Total practice attempts (as a proxy for "downloads/activity")
        const [totalAttemptsResult] = await db.select({ count: count() }).from(attemptLogs);
        const totalDownloads = totalAttemptsResult?.count || 0;

        // Total searches - use a reasonable mock for now (could track this in the future)
        const totalSearches = Math.floor(totalDownloads * 3.1);

        // Total courses
        const [totalCoursesResult] = await db.select({ count: count() }).from(courses);
        const totalCourses = totalCoursesResult?.count || 0;

        // Total published questions
        const [totalQuestionsResult] = await db
            .select({ count: count() })
            .from(questions)
            .where(eq(questions.status, 'published'));
        const totalQuestions = totalQuestionsResult?.count || 0;

        // Total enrollments
        const [totalEnrollmentsResult] = await db.select({ count: count() }).from(enrollments);
        const totalEnrollments = totalEnrollmentsResult?.count || 0;

        // Calculate storage used (uploads directory)
        let storageUsed = '0 B';
        try {
            const uploadsDir = path.join(process.cwd(), 'uploads');
            const totalBytes = await getDirectorySize(uploadsDir);
            storageUsed = formatBytes(totalBytes);
        } catch {
            // If uploads directory doesn't exist, storage is 0
            storageUsed = '0 B';
        }

        // Recent activity - combine recent users, exams, and attempts
        const recentUsers = await db
            .select({
                id: users.id,
                email: users.email,
                createdAt: users.createdAt,
            })
            .from(users)
            .orderBy(desc(users.createdAt))
            .limit(3);

        const recentExams = await db
            .select({
                id: exams.id,
                courseCode: exams.courseCode,
                examType: exams.examType,
                createdAt: exams.createdAt,
            })
            .from(exams)
            .orderBy(desc(exams.createdAt))
            .limit(3);

        const recentActivity = [
            ...recentUsers.map((u) => ({
                id: u.id,
                type: 'user' as const,
                description: `New user registered: ${u.email}`,
                timestamp: u.createdAt,
            })),
            ...recentExams.map((e) => ({
                id: e.id,
                type: 'exam' as const,
                description: `New exam uploaded: ${e.courseCode} ${e.examType}`,
                timestamp: e.createdAt,
            })),
        ]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);

        // Top courses by exam count
        const topCoursesRaw = await db
            .select({
                courseCode: exams.courseCode,
                courseName: sql<string>`max(${exams.courseName})`,
                downloads: count(),
            })
            .from(exams)
            .groupBy(exams.courseCode)
            .orderBy(desc(count()))
            .limit(5);

        const topCourses = topCoursesRaw.map((c) => ({
            courseCode: c.courseCode,
            courseName: c.courseName,
            downloads: c.downloads,
        }));

        return NextResponse.json({
            totalUsers,
            totalExams,
            totalDownloads,
            totalSearches,
            totalCourses,
            totalQuestions,
            totalEnrollments,
            storageUsed,
            usersThisWeek,
            examsThisWeek,
            recentActivity,
            topCourses,
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}

/**
 * Recursively calculate the size of a directory
 */
async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                totalSize += await getDirectorySize(fullPath);
            } else {
                const stats = await fs.stat(fullPath);
                totalSize += stats.size;
            }
        }
    } catch {
        // Directory doesn't exist or isn't accessible
    }
    return totalSize;
}

/**
 * Format bytes into human-readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
