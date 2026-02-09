import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

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
        if (!filePath || !existsSync(filePath)) {
            return NextResponse.json(
                { error: 'File not found on server' },
                { status: 404 }
            );
        }

        // Read the file
        const fileBuffer = await readFile(filePath);

        // Return the PDF with appropriate headers
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${fileName}"`,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
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
