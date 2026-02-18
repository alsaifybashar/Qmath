import { getCourseByCode } from '@/app/actions/courses';
import { getCourseOverview } from '@/app/actions/course-overview';
import TopicPage from '@/components/courses/TopicPage';
import { notFound } from 'next/navigation';

export default async function CourseTopicPage({
    params,
}: {
    params: Promise<{ code: string; topicSlug: string }>;
}) {
    const { code, topicSlug } = await params;

    // Find course
    const courseResult = await getCourseByCode(code);
    if (!courseResult.data) return notFound();

    const course = courseResult.data;

    // Get overview to find the topic
    const overview = await getCourseOverview(course.id);
    if ('error' in overview) return notFound();

    // Find the topic across all modules
    let foundTopic = null;
    let foundModule = null;
    for (const mod of overview.modules) {
        const t = mod.topics.find((t) => t.id === topicSlug);
        if (t) {
            foundTopic = t;
            foundModule = mod;
            break;
        }
    }

    if (!foundTopic || !foundModule) return notFound();

    return (
        <TopicPage
            course={{ id: course.id, name: course.name, code: course.code }}
            topic={foundTopic}
            phase={foundModule.phase}
            courseCode={course.code}
        />
    );
}
