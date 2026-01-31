import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import fs from 'fs/promises';
import path from 'path';

/**
 * Admin-only API endpoint for uploading exam PDFs
 * POST /api/admin/upload-exam
 */
export async function POST(request: NextRequest) {
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

        // Parse multipart form data
        const formData = await request.formData();

        const courseCode = formData.get('courseCode') as string;
        const courseName = formData.get('courseName') as string;
        const examDate = formData.get('examDate') as string;
        const examType = formData.get('examType') as string;
        const hasSolution = formData.get('hasSolution') === 'true';
        const file = formData.get('file') as File;

        // Validate required fields
        if (!courseCode || !courseName || !examDate || !examType || !file) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Only PDF files are allowed' },
                { status: 400 }
            );
        }

        // Create directory structure: uploads/exams/{courseCode}/
        const uploadDir = path.join(process.cwd(), 'uploads', 'exams', courseCode.toUpperCase());
        await fs.mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = new Date(examDate).toISOString().split('T')[0];
        const fileName = `${timestamp}-${examType.toLowerCase()}.pdf`;
        const filePath = path.join(uploadDir, fileName);
        const relativePath = path.join('uploads', 'exams', courseCode.toUpperCase(), fileName);

        // Convert File to Buffer and save
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(filePath, buffer);

        // Insert exam metadata into database
        const [newExam] = await db.insert(exams).values({
            courseCode: courseCode.toUpperCase(),
            courseName,
            examDate: new Date(examDate),
            examType,
            fileName,
            filePath: relativePath,
            fileSize: buffer.length,
            hasSolution,
            uploadedBy: session.user.id,
        }).returning();

        return NextResponse.json({
            success: true,
            exam: newExam,
            message: 'Exam uploaded successfully',
        });
    } catch (error) {
        console.error('Exam upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload exam' },
            { status: 500 }
        );
    }
}
