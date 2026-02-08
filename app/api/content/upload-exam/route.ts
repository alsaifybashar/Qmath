/**
 * Exam Upload API
 * 
 * POST /api/content/upload-exam - Upload exam documents for question extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { sourceExams } from '@/db/content-schema';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const user = await getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can upload exams
        if (user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only admins can upload exams' },
                { status: 403 }
            );
        }

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const courseId = formData.get('courseId') as string | null;
        const examYear = formData.get('examYear') as string | null;
        const examPeriod = formData.get('examPeriod') as string | null;

        // Validate required fields
        if (!file) {
            return NextResponse.json(
                { error: 'File is required' },
                { status: 400 }
            );
        }

        if (!courseId) {
            return NextResponse.json(
                { error: 'courseId is required' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'text/plain', 'application/x-latex'];
        const allowedExtensions = ['.pdf', '.txt', '.tex', '.latex'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: PDF, TXT, LaTeX' },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'uploads', 'exams');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${safeFileName}`;
        const filePath = join(uploadsDir, fileName);

        // Save file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Save exam record to database
        const [exam] = await db.insert(sourceExams).values({
            courseId,
            examYear: examYear ? parseInt(examYear) : new Date().getFullYear(),
            examPeriod: examPeriod || 'unknown',
            originalFile: filePath,
            fileType: fileExtension.replace('.', ''),
            extractedText: null, // Will be populated by extraction process
            processingStatus: 'pending',
            uploadedBy: user.id,
        }).returning();

        return NextResponse.json({
            success: true,
            examId: exam.id,
            message: 'Exam uploaded successfully. Processing will begin shortly.',
            file: {
                name: file.name,
                size: file.size,
                type: fileExtension,
            }
        });

    } catch (error) {
        console.error('Exam upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload exam' },
            { status: 500 }
        );
    }
}

// GET endpoint to list uploaded exams
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const user = await getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get all exams (optionally filter by courseId)
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        let exams;
        if (courseId) {
            exams = await db.query.sourceExams.findMany({
                where: (exams, { eq }) => eq(exams.courseId, courseId),
                orderBy: (exams, { desc }) => [desc(exams.createdAt)],
            });
        } else {
            exams = await db.query.sourceExams.findMany({
                orderBy: (exams, { desc }) => [desc(exams.createdAt)],
            });
        }

        return NextResponse.json({ exams });

    } catch (error) {
        console.error('Get exams error:', error);
        return NextResponse.json(
            { error: 'Failed to get exams' },
            { status: 500 }
        );
    }
}
