import { getCourseByCode, getCourseById } from '@/app/actions/courses';
import { getCourseOverview } from '@/app/actions/course-overview';
import CourseLearningPlan from '@/components/courses/CourseLearningPlan';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CoursePlanPage({
    params,
}: {
    params: Promise<{ code: string }>;
}) {
    const { code } = await params;

    let courseResult = code.includes('-')
        ? await getCourseById(code)
        : { data: null };

    if (!courseResult.data) {
        courseResult = await getCourseByCode(code);
    }

    if (!courseResult.data) return notFound();

    const course = courseResult.data;
    const overview = await getCourseOverview(course.id);

    if ('error' in overview) {
        return (
            <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-black dark:text-white">
                <div className="mx-auto max-w-4xl">
                    <Link
                        href={`/courses/${course.code}`}
                        className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Tillbaka till kursen
                    </Link>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                        <h1 className="text-xl font-black">Studieplan ej tillgänglig</h1>
                        <p className="mt-2 text-sm leading-6">{overview.error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-20 text-zinc-900 dark:bg-black dark:text-white">
            <div className="fixed inset-0 bg-gradient-to-br from-emerald-50/60 via-transparent to-violet-50/60 pointer-events-none dark:from-emerald-950/20 dark:via-black dark:to-violet-950/20" />
            <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
                <Link
                    href={`/courses/${course.code}`}
                    className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Tillbaka till kursen
                </Link>
                <CourseLearningPlan data={overview} />
            </div>
        </div>
    );
}
