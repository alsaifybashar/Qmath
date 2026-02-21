import Link from 'next/link';
import { getPublishedArticles } from '@/app/actions/articles';
import { BookOpen, Clock, Eye, Tag, Search, ChevronRight, FileText } from 'lucide-react';

export const metadata = {
    title: 'Artiklar — Qmath',
    description: 'Studieartiklar i ingenjörsmatematik',
};

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
    text: '#1A1D2E',
    textSec: '#6B7194',
    textMuted: '#A0A5C0',
    blue: '#4361EE',
    purple: '#7C5CFC',
    blueLight: '#EEF1FF',
    blueBorder: '#D6DAFB',
    bg: '#F0F2F8',
    surface: '#FFFFFF',
    surfaceAlt: '#F7F8FC',
    border: '#EFF1F8',
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

    // Group by course for organized browsing
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
        <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
                    Studieartiklar
                </h1>
                <p style={{ color: C.textSec }}>
                    Djupdykning i matematikens koncept — skrivet för ingenjörsstudenter
                </p>
            </div>

            {/* Search */}
            <form className="mb-8">
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: C.textMuted }} />
                    <input
                        name="q"
                        defaultValue={params.q ?? ''}
                        placeholder="Sök artiklar (t.ex. egenvärden, derivator, integraler)..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#4361EE]/30 focus:border-[#4361EE]"
                        style={{
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            color: C.text,
                        }}
                    />
                </div>
                {params.q && (
                    <div className="mt-2 text-sm" style={{ color: C.textSec }}>
                        {articleList.length} resultat för &quot;{params.q}&quot;
                        <Link href="/articles" className="ml-3 hover:underline" style={{ color: C.blue }}>Rensa</Link>
                    </div>
                )}
                {params.tag && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ background: C.blueLight, color: C.blue }}>
                            <Tag className="w-3 h-3" /> {params.tag}
                        </span>
                        <Link href="/articles" className="text-xs hover:underline" style={{ color: C.textMuted }}>
                            Rensa filter
                        </Link>
                    </div>
                )}
            </form>

            {/* Search results or grouped view */}
            {displayList !== null ? (
                /* Flat list for search/filter results */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayList.length === 0 ? (
                        <div className="col-span-3 py-16 text-center">
                            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: C.textMuted }} />
                            <p style={{ color: C.textMuted }}>Inga artiklar matchade din sökning.</p>
                        </div>
                    ) : (
                        displayList.map(article => <ArticleCard key={article.id} article={article} />)
                    )}
                </div>
            ) : (
                /* Grouped by course */
                <div className="space-y-10">
                    {Object.entries(grouped).map(([courseKey, articles]) => (
                        <section key={courseKey}>
                            <div className="flex items-center gap-3 mb-4">
                                <h2 className="text-lg font-semibold" style={{ color: C.text }}>{courseKey}</h2>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                    style={{ background: C.blueLight, color: C.blue }}>
                                    {articles.length} artikel{articles.length !== 1 ? 'ar' : ''}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {articles.map(article => <ArticleCard key={article.id} article={article} />)}
                            </div>
                        </section>
                    ))}
                    {Object.keys(grouped).length === 0 && (
                        <div className="py-20 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: C.textMuted }} />
                            <p className="text-lg font-medium mb-1" style={{ color: C.textSec }}>
                                Inga artiklar publicerade ännu
                            </p>
                            <p className="text-sm" style={{ color: C.textMuted }}>
                                Nya artiklar kommer snart!
                            </p>
                        </div>
                    )}
                </div>
            )}
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
        <Link
            href={`/articles/${article.slug}`}
            className="group flex flex-col rounded-2xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{
                background: '#FFFFFF',
                border: '1px solid #EFF1F8',
                boxShadow: '0 2px 12px rgba(26,29,46,0.04)',
            }}
        >
            {/* Course / topic badge */}
            {article.courseCode && (
                <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: C.blueLight, color: C.blue }}>
                        {article.courseCode}
                    </span>
                    {article.topicTitle && (
                        <span className="text-[10px] truncate" style={{ color: C.textMuted }}>
                            {article.topicTitle}
                        </span>
                    )}
                </div>
            )}

            {/* Title */}
            <h3 className="font-semibold text-sm leading-snug mb-1 group-hover:text-[#4361EE] transition-colors line-clamp-2"
                style={{ color: C.text }}>
                {article.title}
            </h3>
            {article.titleSv && article.titleSv !== article.title && (
                <p className="text-[11px] mb-2 italic" style={{ color: C.textMuted }}>{article.titleSv}</p>
            )}

            {/* Excerpt */}
            {article.excerpt && (
                <p className="text-xs leading-relaxed line-clamp-3 flex-1" style={{ color: C.textSec }}>
                    {article.excerpt}
                </p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-3">
                    {tags.slice(0, 3).map(tag => (
                        <span key={tag} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: C.surfaceAlt, color: C.textMuted }}>
                            <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3 text-[11px]" style={{ color: C.textMuted }}>
                    {article.readingTimeMinutes && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readingTimeMinutes} min</span>
                    )}
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount ?? 0}</span>
                </div>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-all"
                    style={{ color: C.textMuted }} />
            </div>
        </Link>
    );
}
