import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { topics, userMastery } from '@/db/schema';
import { getStudyQuestions } from '@/app/actions/study-questions';
import { StudySessionClient } from '@/components/study/StudySessionClient';

export default async function StudyPage({
    searchParams,
}: {
    searchParams: Promise<{ topic?: string; course?: string }>;
}) {
    const [{ topic: topicId, course: courseCode }, session] = await Promise.all([
        searchParams,
        auth(),
    ]);

    const fallbackHref = courseCode ? `/courses/${courseCode}` : '/courses';
    if (!topicId || !session?.user?.id) {
        return <StudyEmptyState href={fallbackHref} />;
    }

    const [allQuestions, topic, mastery] = await Promise.all([
        getStudyQuestions(topicId),
        db.query.topics.findFirst({
            where: eq(topics.id, topicId),
            with: { course: true },
        }),
        db.query.userMastery.findFirst({
            where: and(
                eq(userMastery.userId, session.user.id),
                eq(userMastery.topicId, topicId),
            ),
        }),
    ]);

    const questions = allQuestions.filter((question) => question.hasSteps);
    if (!topic || questions.length === 0) {
        return <StudyEmptyState href={fallbackHref} topicName={topic?.titleSv || topic?.title} />;
    }

    const resolvedCourseCode = courseCode || topic.course?.code || '';
    const topicHref = resolvedCourseCode
        ? `/courses/${resolvedCourseCode}/topics/${topic.id}`
        : fallbackHref;

    return (
        <StudySessionClient
            topicId={topic.id}
            topicName={topic.titleSv || topic.title}
            courseLabel={resolvedCourseCode}
            exitHref={topicHref}
            initialMastery={mastery?.masteryProbability ?? 0.1}
            questions={questions}
        />
    );
}

function StudyEmptyState({ href, topicName }: { href: string; topicName?: string }) {
    return (
        <main className="study-focus study-airlock flex min-h-screen items-center justify-center px-5 text-white">
            <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl shadow-black/25 backdrop-blur-xl">
                <BookOpen className="mx-auto h-8 w-8 text-blue-200" />
                <h1 className="mt-4 text-xl font-bold">Inga träningsfrågor ännu</h1>
                <p className="mt-2 text-sm leading-6 text-white/60">
                    {topicName
                        ? `${topicName} saknar publicerade frågor med lösningssteg.`
                        : 'Välj ett ämne från en kurs för att starta en träningssession.'}
                </p>
                <Link href={href} className="pressable mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-zinc-950">
                    <ArrowLeft className="h-4 w-4" />
                    Tillbaka till kursen
                </Link>
            </section>
        </main>
    );
}
