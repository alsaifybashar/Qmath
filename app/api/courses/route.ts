import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Public API endpoint — no authentication required.
 * GET /api/courses
 * Returns all courses that have at least one exam.
 * Students use this to browse the available course archive.
 */
export async function GET() {
    try {
        const results = await db
            .select({
                courseCode: exams.courseCode,
                courseName: exams.courseName,
                examCount: sql<number>`count(*)`,
                withSolutions: sql<number>`coalesce(sum(case when ${exams.hasSolution} then 1 else 0 end), 0)`,
                latestExamDate: sql<number>`max(${exams.examDate})`,
            })
            .from(exams)
            .groupBy(exams.courseCode, exams.courseName)
            .orderBy(exams.courseCode);

        return NextResponse.json({
            courses: results.map(r => ({
                courseCode: r.courseCode,
                courseName: r.courseName,
                examCount: Number(r.examCount),
                withSolutions: Number(r.withSolutions),
                latestExamDate: r.latestExamDate,
            })),
        });
    } catch (error) {
        console.error('Failed to list courses:', error);
        return NextResponse.json({ error: 'Failed to list courses' }, { status: 500 });
    }
}
