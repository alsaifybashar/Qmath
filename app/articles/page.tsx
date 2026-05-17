import Link from 'next/link';
import { getPublishedArticles } from '@/app/actions/articles';
import { BookOpen, Clock, Eye, Tag, Search, ChevronRight, FileText, Sparkles } from 'lucide-react';

export const metadata = {
    title: 'Artiklar — Qmath',
    description: 'Studieartiklar i ingenjörsmatematik',
};

export default async function ArticlesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; courseId?: string; tag?: string }>;
}) {
    const params = await searchParams;

    const articleList = await getPublishedArticles({
        search: params.q,
        courseId: params.courseId,
        tag: params.tag,
        limit: 48,
    });

    const grouped: Record<string, typeof articleList> = { 'Allmänt': [] };
    for (const article of articleList) {
        if (article.courseCode) {
            const key = `${article.courseCode} — ${article.courseName ?? ''}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(article);
        } else {
            grouped['Allmänt'].push(article);
        }
    }
    if (grouped['Allmänt'].length === 0) delete grouped['Allmänt'];

    const hasFilters = !!(params.q || params.courseId || params.tag);
    const displayList = hasFilters ? articleList : null;

    return (
        <div className="liquid-page pb-20">
            <div className="liquid-bg" />
            <div className="liquid-sheen" />

            <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
                <section className="liquid-card p-5 sm:p-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-100">
                                <BookOpen className="h-3.5 w-3.5" />
                                Studieartiklar
                            </div>
                            <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">Läs det som hjälper nästa steg</h1>
                            <p className="liquid-muted mt-3 max-w-2xl text-sm leading-6">
                                Djupdyk i matematiska koncept utan att tappa fokus. Sök, välj ett ämne och fortsätt plugga.
                            </p>
                        </div>

                        <form>
                            <div className="liquid-card-soft flex items-center gap-3 px-4 py-3">
                                <Search className="h-5 w-5 liquid-subtle" />
                                <input
                                    name="q"
                                    defaultValue={params.q ?? ''}
                                    placeholder="Sök artiklar..."
                                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-950 outline-none placeholder:text-zinc-500 dark:text-white dark:placeholder:text-white/35"
                                />
                            </div>
                            {(params.q || params.tag) && (
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className="liquid-muted">
                                        {articleList.length} resultat
                                    </span>
                                    <Link href="/articles" className="font-bold text-blue-700 hover:underline dark:text-blue-200">
                                        Rensa
                                    </Link>
                                </div>
                            )}
                        </form>
                    </div>
                </section>

                {params.tag && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-100">
                        <Tag className="h-3.5 w-3.5" />
                        {params.tag}
                    </div>
                )}

                <div className="mt-6">
                    {displayList !== null ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {displayList.length === 0 ? (
                                <div className="liquid-card col-span-full py-16 text-center">
                                    <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-40" />
                                    <p className="liquid-muted">Inga artiklar matchade din sökning.</p>
                                </div>
                            ) : (
                                displayList.map(article => <ArticleCard key={article.id} article={article} />)
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(grouped).map(([courseKey, articles]) => (
                                <section key={courseKey}>
                                    <div className="mb-3 flex items-center gap-3">
                                        <h2 className="text-lg font-bold">{courseKey}</h2>
                                        <span className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-2 py-1 text-xs font-bold text-blue-700 dark:text-blue-100">
                                            {articles.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {articles.map(article => <ArticleCard key={article.id} article={article} />)}
                                    </div>
                                </section>
                            ))}
                            {Object.keys(grouped).length === 0 && (
                                <div className="liquid-card py-20 text-center">
                                    <FileText className="mx-auto mb-3 h-12 w-12 opacity-30" />
                                    <p className="text-lg font-bold">Inga artiklar publicerade ännu</p>
                                    <p className="liquid-muted mt-1 text-sm">Nya artiklar kommer snart.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ArticleCard({ article }: { article: {
    id: string; slug: string; title: string; titleSv: string | null;
    excerpt: string | null; tags: unknown; readingTimeMinutes: number | null;
    viewCount: number | null; courseCode: string | null; courseName: string | null;
    topicTitle: string | null;
} }) {
    const tags = (article.tags as string[] | null) ?? [];

    return (
        <Link href={`/articles/${article.slug}`} className="liquid-card group flex min-h-[230px] flex-col p-4 transition hover:-translate-y-0.5">
            <div className="mb-3 flex items-center gap-1.5">
                {article.courseCode ? (
                    <span className="rounded-md border border-blue-300/20 bg-blue-400/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-100">
                        {article.courseCode}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-100">
                        <Sparkles className="h-3 w-3" />
                        Allmänt
                    </span>
                )}
                {article.topicTitle && <span className="liquid-subtle truncate text-[10px]">{article.topicTitle}</span>}
            </div>

            <h3 className="line-clamp-2 text-sm font-bold leading-snug transition group-hover:text-blue-700 dark:group-hover:text-blue-200">
                {article.title}
            </h3>
            {article.titleSv && article.titleSv !== article.title && (
                <p className="liquid-subtle mt-1 text-[11px] italic">{article.titleSv}</p>
            )}
            {article.excerpt && (
                <p className="liquid-muted mt-3 line-clamp-3 flex-1 text-xs leading-6">{article.excerpt}</p>
            )}

            {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {tags.slice(0, 2).map(tag => (
                        <span key={tag} className="liquid-card-soft inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] liquid-muted">
                            <Tag className="h-2.5 w-2.5" />
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3 text-[11px] dark:border-white/10">
                <div className="liquid-subtle flex items-center gap-3">
                    {article.readingTimeMinutes && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readingTimeMinutes} min</span>}
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.viewCount ?? 0}</span>
                </div>
                <ChevronRight className="h-4 w-4 liquid-subtle transition group-hover:translate-x-0.5" />
            </div>
        </Link>
    );
}
