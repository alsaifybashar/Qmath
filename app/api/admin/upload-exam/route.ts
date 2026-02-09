import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import fs from 'fs/promises';
import path from 'path';

/**
 * Admin-only API endpoint for uploading exam PDFs with optional solutions
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

        const courseCode = (formData.get('courseCode') as string)?.toUpperCase();
        const courseName = formData.get('courseName') as string;
        const examDate = formData.get('examDate') as string;
        const examType = formData.get('examType') as string;
        const examFile = formData.get('examFile') as File;
        const solutionFile = formData.get('solutionFile') as File | null;

        // Validate required fields
        if (!courseCode || !courseName || !examDate || !examType || !examFile) {
            return NextResponse.json(
                { error: 'Missing required fields (courseCode, courseName, examDate, examType, examFile)' },
                { status: 400 }
            );
        }

        // Validate exam file type
        if (examFile.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Exam file must be a PDF' },
                { status: 400 }
            );
        }

        // Validate solution file type if provided
        if (solutionFile && solutionFile.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Solution file must be a PDF' },
                { status: 400 }
            );
        }

        // Create directory structure: uploads/exams/{courseCode}/
        const uploadDir = path.join(process.cwd(), 'uploads', 'exams', courseCode);
        await fs.mkdir(uploadDir, { recursive: true });

        // Generate filenames
        const dateStr = new Date(examDate).toISOString().split('T')[0];
        const examFileName = `${examType}_${dateStr}.pdf`;
        const examFilePath = path.join(uploadDir, examFileName);
        const examRelativePath = path.join('uploads', 'exams', courseCode, examFileName);

        // Save exam file
        const examBuffer = Buffer.from(await examFile.arrayBuffer());
        await fs.writeFile(examFilePath, examBuffer);

        // Prepare solution data if provided
        let solutionData: {
            solutionFileName: string | null;
            solutionFilePath: string | null;
            solutionFileSize: number | null;
            hasSolution: boolean;
        } = {
            solutionFileName: null,
            solutionFilePath: null,
            solutionFileSize: null,
            hasSolution: false,
        };

        if (solutionFile && solutionFile.size > 0) {
            const solutionFileName = `${examType}_${dateStr}_solution.pdf`;
            const solutionFilePath = path.join(uploadDir, solutionFileName);
            const solutionRelativePath = path.join('uploads', 'exams', courseCode, solutionFileName);

            // Save solution file
            const solutionBuffer = Buffer.from(await solutionFile.arrayBuffer());
            await fs.writeFile(solutionFilePath, solutionBuffer);

            solutionData = {
                solutionFileName,
                solutionFilePath: solutionRelativePath,
                solutionFileSize: solutionBuffer.length,
                hasSolution: true,
            };
        }

        // Insert exam metadata into database
        const [newExam] = await db.insert(exams).values({
            courseCode,
            courseName,
            examDate: new Date(examDate),
            examType,
            fileName: examFileName,
            filePath: examRelativePath,
            fileSize: examBuffer.length,
            ...solutionData,
            uploadedBy: session.user.id,
        }).returning();

        return NextResponse.json({
            success: true,
            exam: {
                id: newExam.id,
                courseCode: newExam.courseCode,
                courseName: newExam.courseName,
                examDate: newExam.examDate,
                examType: newExam.examType,
                hasSolution: newExam.hasSolution,
            },
            message: `Exam uploaded successfully${solutionData.hasSolution ? ' with solution' : ''}`,
        });
    } catch (error) {
        console.error('Exam upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload exam. Please try again.' },
            { status: 500 }
        );
    }
}
