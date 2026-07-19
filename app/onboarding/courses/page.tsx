import { getCourseSearchCatalog } from '@/app/actions/courses';
import CourseSelectionOnboarding from './CourseSelectionOnboarding';

export default async function CourseSelectionPage() {
    const courses = await getCourseSearchCatalog();
    return <CourseSelectionOnboarding courses={courses} />;
}
