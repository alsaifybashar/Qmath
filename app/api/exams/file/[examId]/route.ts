import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { courses, exams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireCourseViewer } from '@/lib/auth';
import { openExamFile } from '@/lib/exam-storage';
import { problem } from '@/lib/security/request';

/**
 * Serve exam or solution PDF files
 * GET /api/exams/file/[examId]?type=exam|solution
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const { examId } = await params;
        if (!/^[0-9a-f-]{36}$/i.test(examId)) return problem(400, 'invalid_exam_id');
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'exam';

        // Validate type
        if (type !== 'exam' && type !== 'solution') {
            return NextResponse.json(
                { error: 'Invalid file type. Use "exam" or "solution"' },
                { status: 400 }
            );
        }

        // Get exam from database
        const exam = await db.query.exams.findFirst({
            where: eq(exams.id, examId),
        });

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

        // Get the appropriate file path
        let filePath: string | null;
        let fileName: string;

        if (type === 'exam') {
            filePath = exam.filePath;
            fileName = exam.fileName;
        } else {
            // Solution requested
            if (!exam.hasSolution || !exam.solutionFilePath) {
                return NextResponse.json(
                    { error: 'Solution not available for this exam' },
                    { status: 404 }
                );
            }
            filePath = exam.solutionFilePath;
            fileName = exam.solutionFileName || 'solution.pdf';
        }

        // Check if file exists
        const opened = filePath ? await openExamFile(filePath) : null;
        if (!opened) {
            return NextResponse.json(
                { error: 'File not found on server' },
                { status: 404 }
            );
        }

        // Read the file
        const safeFileName = fileName.replace(/[\r\n"\\/]/g, '_').slice(0, 180);

        // Return the PDF with appropriate headers
        return new NextResponse(opened.body, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeFileName}"`,
                'Content-Length': opened.size.toString(),
                'Cache-Control': 'private, max-age=3600',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('Error serving exam file:', error);
        return NextResponse.json(
            { error: 'Failed to serve file' },
            { status: 500 }
        );
    }
}
