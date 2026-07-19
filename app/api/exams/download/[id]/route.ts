import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { courses, exams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { openExamFile } from '@/lib/exam-storage';
import { requireCourseViewer } from '@/lib/auth';
import { problem } from '@/lib/security/request';

/**
 * Protected API endpoint for downloading exam PDFs
 * Requires authentication
 * GET /api/exams/download/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        // Get exam metadata from database
        const [exam] = await db
            .select()
            .from(exams)
            .where(eq(exams.id, resolvedParams.id))
            .limit(1);

        if (!exam) {
            return NextResponse.json(
                { error: 'Exam not found' },
                { status: 404 }
            );
        }

        const course = await db.query.courses.findFirst({
            columns: { id: true },
            where: eq(courses.code, exam.courseCode),
        });
        if (!course) return problem(404, 'course_not_found');
        try {
            await requireCourseViewer(course.id);
        } catch (error) {
            const status = error instanceof Error && 'status' in error ? Number(error.status) : 403;
            return problem(status === 401 ? 401 : 403, status === 401 ? 'authentication_required' : 'course_access_required');
        }

        // Read the PDF file from storage
        try {
            const opened = await openExamFile(exam.filePath);
            if (!opened) throw new Error('Exam file not found');
            const safeFileName = exam.fileName.replace(/[\r\n"\\/]/g, '_').slice(0, 180);

            // Return PDF with proper headers
            return new NextResponse(opened.body, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${safeFileName}"`,
                    'Content-Length': opened.size.toString(),
                    'Cache-Control': 'private, max-age=3600',
                    'X-Content-Type-Options': 'nosniff',
                },
            });
        } catch (fileError) {
            console.error('File read error:', fileError);
            return NextResponse.json(
                { error: 'File not found on server' },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Exam download error:', error);
        return NextResponse.json(
            { error: 'Failed to download exam' },
            { status: 500 }
        );
    }
}
