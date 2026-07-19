import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { like, desc } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/rate-limit';
import { getTrustedClientAddress, problem } from '@/lib/security/request';

/**
 * Public API endpoint for searching exams by course code
 * GET /api/exams/search?q=SF1672
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q')?.trim();

        if (!query || !/^[A-Za-z0-9 -]{1,20}$/.test(query)) return problem(400, 'invalid_search_query');
        const rateLimit = await checkRateLimit(getTrustedClientAddress(request), 'public-search');
        if (!rateLimit.allowed) return problem(429, 'rate_limit_exceeded');

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
            .orderBy(desc(exams.examDate))
            .limit(100);

        return NextResponse.json({
            results,
            count: results.length,
            query: query.toUpperCase(),
        }, { headers: { 'Cache-Control': 'public, max-age=60' } });
    } catch (error) {
        console.error('Exam search error:', error);
        return NextResponse.json(
            { error: 'Failed to search exams' },
            { status: 500 }
        );
    }
}
