import { getCourseSearchCatalog, getEnrolledCourseIds } from '@/app/actions/courses';
import CoursesSearchWorkspace from '@/components/courses/CoursesSearchWorkspace';

export const metadata = { title: 'Kurser | Qmath' };

export default async function CoursesPage() {
    const [courses, enrolledIds] = await Promise.all([
        getCourseSearchCatalog(),
        getEnrolledCourseIds(),
    ]);

    return (
        <CoursesSearchWorkspace
            courses={courses}
            enrolledIds={enrolledIds}
        />
    );
}
