import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ExamViewer from '@/components/archive/ExamViewer';

interface PageProps {
    params: Promise<{ courseCode: string; examId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { courseCode, examId } = await params;
    const code = courseCode.toUpperCase();

    const exam = await db.query.exams.findFirst({
        where: and(
            eq(exams.id, examId),
            eq(exams.courseCode, code)
        ),
    });

    if (!exam) {
        return { title: 'Tenta hittades inte | Qmath' };
    }

    const dateStr = new Date(exam.examDate).toLocaleDateString('sv-SE');

    return {
        title: `${exam.examType} ${dateStr} - ${code} | Qmath Arkiv`,
        description: `Se ${exam.examType} för ${exam.courseName} från ${dateStr}`,
    };
}

export default async function ExamViewerPage({ params }: PageProps) {
    const { courseCode, examId } = await params;
    const code = courseCode.toUpperCase();

    // Fetch the exam
    const exam = await db.query.exams.findFirst({
        where: and(
            eq(exams.id, examId),
            eq(exams.courseCode, code)
        ),
    });

    if (!exam) {
        notFound();
    }

    return (
        <ExamViewer
            exam={{
                id: exam.id,
                courseCode: exam.courseCode,
                courseName: exam.courseName,
                examDate: exam.examDate,
                examType: exam.examType,
                fileName: exam.fileName,
                hasSolution: exam.hasSolution ?? false,
                solutionFileName: exam.solutionFileName,
            }}
        />
    );
}
