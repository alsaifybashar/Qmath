import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

/**
 * Protected API endpoint for downloading exam PDFs
 * Requires authentication
 * GET /api/exams/download/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check authentication
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                {
                    error: 'Authentication required',
                    message: 'Please log in to download exams'
                },
                { status: 401 }
            );
        }

        // Get exam metadata from database
        const [exam] = await db
            .select()
            .from(exams)
            .where(eq(exams.id, params.id))
            .limit(1);

        if (!exam) {
            return NextResponse.json(
                { error: 'Exam not found' },
                { status: 404 }
            );
        }

        // Read the PDF file from storage
        const filePath = path.join(process.cwd(), exam.filePath);

        try {
            const fileBuffer = await fs.readFile(filePath);

            // Return PDF with proper headers
            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${exam.fileName}"`,
                    'Content-Length': fileBuffer.length.toString(),
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
