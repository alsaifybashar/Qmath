import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { exams, courses } from '@/db/schema';
import { sql, inArray } from 'drizzle-orm';

/**
 * GET /api/admin/courses
 * Returns all courses that have at least one exam uploaded.
 * Each item includes the exam count and solution count.
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Aggregate exam counts per course code
        const examStats = await db
            .select({
                courseCode: exams.courseCode,
                courseName: sql<string>`max(${exams.courseName})`,
                examCount: sql<number>`count(*)`,
                withSolutions: sql<number>`coalesce(sum(case when ${exams.hasSolution} then 1 else 0 end), 0)`,
                latestExam: sql<number>`max(${exams.examDate})`,
            })
            .from(exams)
            .groupBy(exams.courseCode);

        if (examStats.length === 0) {
            return NextResponse.json({ courses: [] });
        }

        const codes = examStats.map(s => s.courseCode);

        // Fetch matching course records (may include universityId etc.)
        const courseRecords = await db.query.courses.findMany({
            where: inArray(courses.code, codes),
        });

        const courseMap = new Map(courseRecords.map(c => [c.code, c]));

        const result = examStats.map(stat => ({
            ...courseMap.get(stat.courseCode),
            courseCode: stat.courseCode,
            courseName: stat.courseName,
            examCount: Number(stat.examCount),
            withSolutions: Number(stat.withSolutions),
            latestExamDate: stat.latestExam,
        }));

        // Sort by course code ascending
        result.sort((a, b) => a.courseCode.localeCompare(b.courseCode));

        return NextResponse.json({ courses: result });
    } catch (error) {
        console.error('Failed to fetch admin courses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
