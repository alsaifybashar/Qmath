import { getCourseById, getCourseByCode } from '@/app/actions/courses';
import { getExamAnalysis } from '@/app/actions/exam-analysis';
import { getCourseOverview } from '@/app/actions/course-overview';
import CourseHub from '@/components/courses/CourseHub';
import { notFound } from 'next/navigation';

export default async function CoursePage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    // 1. Try to find course by ID (UUID) if it looks like one
    let courseResult = code.includes('-')
        ? await getCourseById(code)
        : { data: null };

    // 2. If not found or not UUID-like, try by Code (e.g. TATA24)
    if (!courseResult.data) {
        courseResult = await getCourseByCode(code);
    }

    if (!courseResult.data) {
        return notFound();
    }

    const course = courseResult.data;

    // Fetch analysis + overview data in parallel (overview reuses cached analysis)
    const [analysisData, overviewData] = await Promise.all([
        getExamAnalysis(course.id),
        getCourseOverview(course.id),
    ]);

    return (
        <CourseHub
            course={{
                id: course.id,
                name: course.name,
                code: course.code,
                university: course.university,
                description: course.description || undefined
            }}
            analysisData={analysisData}
            overviewData={overviewData}
        />
    );
}
