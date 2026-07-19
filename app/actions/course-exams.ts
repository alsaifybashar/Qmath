'use server';

import { db } from '@/db/drizzle';
import { courses, exams } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireCourseViewer } from '@/lib/auth';
import { z } from 'zod';

export interface CourseExam {
    id: string;
    courseCode: string;
    courseName: string;
    examDate: Date;
    examType: string;
    fileName: string;
    fileSize: number | null;
    hasSolution: boolean;
    solutionFileName: string | null;
}

export async function getCourseExams(courseCode: string): Promise<CourseExam[]> {
    courseCode = z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,24}$/).parse(courseCode);
    const course = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq(courses.code, courseCode))
        .limit(1)
        .get();
    if (!course) return [];
    await requireCourseViewer(course.id);

    try {
        const rows = await db
            .select({
                id: exams.id,
                courseCode: exams.courseCode,
                courseName: exams.courseName,
                examDate: exams.examDate,
                examType: exams.examType,
                fileName: exams.fileName,
                fileSize: exams.fileSize,
                hasSolution: exams.hasSolution,
                solutionFileName: exams.solutionFileName,
            })
            .from(exams)
            .where(eq(exams.courseCode, courseCode))
            .orderBy(desc(exams.examDate));

        return rows.map((r) => ({
            ...r,
            examDate: r.examDate instanceof Date ? r.examDate : new Date(r.examDate),
            hasSolution: r.hasSolution ?? false,
            solutionFileName: r.solutionFileName ?? null,
        }));
    } catch {
        return [];
    }
}
