import { getCourseById, getCourseByCode } from '@/app/actions/courses';
import { getExamAnalysis } from '@/app/actions/exam-analysis';
import { getCourseOverview } from '@/app/actions/course-overview';
import { getCourseExams } from '@/app/actions/course-exams';
import CourseHub from '@/components/courses/CourseHub';
import { notFound } from 'next/navigation';

function getCourseError(result: Awaited<ReturnType<typeof getCourseByCode>>) {
    return 'error' in result ? result.error : undefined;
}

export default async function CoursePage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    console.log(`[CoursePage] Resolving course for param: "${code}"`);

    // 1. Try to find course by ID (UUID) if it looks like one
    let courseResult = code.includes('-')
        ? await getCourseById(code)
        : { data: null };

    // 2. If not found or not UUID-like, try by Code (e.g. TATA24)
    if (!courseResult.data) {
        courseResult = await getCourseByCode(code);
    }

    // 3. Also try uppercased code directly (e.g. URL is /courses/TATA24)
    if (!courseResult.data && 'error' in courseResult) {
        console.log(`[CoursePage] getCourseByCode("${code}") returned error:`, getCourseError(courseResult));
        // Try the original code as-is (in case toUpperCase isn't matching)
        courseResult = await getCourseByCode(code.toUpperCase());
    }

    if (!courseResult.data) {
        console.log(`[CoursePage] Course not found for code: "${code}" (tried both original and uppercase)`);
        return notFound();
    }

    const course = courseResult.data;
    console.log(`[CoursePage] Found course: ${course.code} (${course.name}), id: ${course.id}`);

    // Fetch all course data in parallel
    const [analysisData, overviewData, courseExams] = await Promise.all([
        getExamAnalysis(course.id),
        getCourseOverview(course.id),
        getCourseExams(course.code),
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
            courseExams={courseExams}
        />
    );
}

