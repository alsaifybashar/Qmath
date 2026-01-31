import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { like, desc } from 'drizzle-orm';

/**
 * Public API endpoint for searching exams by course code
 * GET /api/exams/search?q=SF1672
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.trim().length === 0) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        // Search for exams by course code (case-insensitive partial match)
        const results = await db
            .select({
                id: exams.id,
                courseCode: exams.courseCode,
                courseName: exams.courseName,
                examDate: exams.examDate,
                examType: exams.examType,
                fileName: exams.fileName,
                fileSize: exams.fileSize,
                hasSolution: exams.hasSolution,
                createdAt: exams.createdAt,
            })
            .from(exams)
            .where(like(exams.courseCode, `%${query.toUpperCase()}%`))
            .orderBy(desc(exams.examDate));

        return NextResponse.json({
            results,
            count: results.length,
            query: query.toUpperCase(),
        });
    } catch (error) {
        console.error('Exam search error:', error);
        return NextResponse.json(
            { error: 'Failed to search exams' },
            { status: 500 }
        );
    }
}
