
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

// Helper to safely delete file if exists
const deleteFile = async (filePath: string) => {
    try {
        const fullPath = path.join(process.cwd(), filePath);
        await fs.access(fullPath);
        await fs.unlink(fullPath);
        return true;
    } catch (error) {
        // File doesn't exist or other error, ignore
        return false;
    }
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { examId } = await params;
        const exam = await db.query.exams.findFirst({
            where: eq(exams.id, examId),
        });

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        return NextResponse.json({ exam });
    } catch (error) {
        console.error('Fetch exam error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { examId } = await params;

        // 1. Get exam info to know file paths
        const exam = await db.query.exams.findFirst({
            where: eq(exams.id, examId),
        });

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        // 2. Delete files from disk
        if (exam.filePath) {
            await deleteFile(exam.filePath);
        }
        if (exam.solutionFilePath) {
            await deleteFile(exam.solutionFilePath);
        }

        // 3. Delete from DB
        await db.delete(exams).where(eq(exams.id, examId));

        return NextResponse.json({ success: true, message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Delete exam error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { examId } = await params;
        const formData = await request.formData();

        // Retrieve existing exam to handle file replacements
        const existingExam = await db.query.exams.findFirst({
            where: eq(exams.id, examId),
        });

        if (!existingExam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        // Get basic fields
        const courseCode = (formData.get('courseCode') as string)?.toUpperCase() || existingExam.courseCode;
        const courseName = (formData.get('courseName') as string) || existingExam.courseName;
        const examDateStr = formData.get('examDate') as string;
        const examDate = examDateStr ? new Date(examDateStr) : existingExam.examDate;
        const examType = (formData.get('examType') as string) || existingExam.examType;

        const updateData: any = {
            courseCode,
            courseName,
            examDate,
            examType,
            updatedAt: new Date(),
        };

        // Date string for filenames
        const dateStr = examDate.toISOString().split('T')[0];
        const uploadBaseDir = path.join(process.cwd(), 'uploads', 'exams', courseCode);
        await fs.mkdir(uploadBaseDir, { recursive: true });

        // Handle Exam File Replacement
        const examFile = formData.get('examFile') as File | null;
        if (examFile && examFile.size > 0) {
            // Delete old file if path exists
            if (existingExam.filePath) await deleteFile(existingExam.filePath);

            const examFileName = `${examType}_${dateStr}.pdf`;
            const examFilePath = path.join(uploadBaseDir, examFileName);

            const buffer = Buffer.from(await examFile.arrayBuffer());
            await fs.writeFile(examFilePath, buffer);

            updateData.fileName = examFileName;
            updateData.filePath = path.join('uploads', 'exams', courseCode, examFileName);
            updateData.fileSize = buffer.length;
        }

        // Handle Solution File Replacement
        const solutionFile = formData.get('solutionFile') as File | null;
        const removeSolution = formData.get('removeSolution') === 'true';

        if (removeSolution) {
            if (existingExam.solutionFilePath) await deleteFile(existingExam.solutionFilePath);
            updateData.hasSolution = false;
            updateData.solutionFileName = null;
            updateData.solutionFilePath = null;
            updateData.solutionFileSize = null;
        } else if (solutionFile && solutionFile.size > 0) {
            // Delete old solution if exists
            if (existingExam.solutionFilePath) await deleteFile(existingExam.solutionFilePath);

            const solutionFileName = `${examType}_${dateStr}_solution.pdf`;
            const solutionFilePath = path.join(uploadBaseDir, solutionFileName);

            const buffer = Buffer.from(await solutionFile.arrayBuffer());
            await fs.writeFile(solutionFilePath, buffer);

            updateData.hasSolution = true;
            updateData.solutionFileName = solutionFileName;
            updateData.solutionFilePath = path.join('uploads', 'exams', courseCode, solutionFileName);
            updateData.solutionFileSize = buffer.length;
        }

        const [updatedExam] = await db
            .update(exams)
            .set(updateData)
            .where(eq(exams.id, examId))
            .returning();

        return NextResponse.json({ success: true, exam: updatedExam });
    } catch (error) {
        console.error('Update exam error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
