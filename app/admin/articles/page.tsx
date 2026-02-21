import Link from 'next/link';
import { getAdminArticles } from '@/app/actions/articles';
import type { ArticleStatus } from '@/types/articles';
import AdminLayout from '@/components/AdminLayout';
import {
    Plus, FileText, Eye, Calendar, Clock, BookOpen, Tag
} from 'lucide-react';

const statusStyles: Record<string, { label: string; className: string }> = {
    draft:     { label: 'Utkast',     className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    published: { label: 'Publicerad', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    archived:  { label: 'Arkiverad',  className: 'bg-zinc-100 text-zinc-500 border border-zinc-200' },
};

export default async function AdminArticlesPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string }>;
}) {
    const params = await searchParams;
    const validStatuses: ArticleStatus[] = ['draft', 'published', 'archived'];
    const statusFilter = validStatuses.includes(params.status as ArticleStatus)
        ? (params.status as ArticleStatus)
        : undefined;

    const articleList = await getAdminArticles({
        search: params.search,
        status: statusFilter,
    });

    return (
        <AdminLayout>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Artiklar</h1>
                        <p className="text-zinc-500">{articleList.length} artikel{articleList.length !== 1 ? 'ar' : ''}</p>
                    </div>
                    <Link
                        href="/admin/articles/new"
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" /> Ny artikel
                    </Link>
                </div>

                {/* Filters */}
                <form className="flex gap-3 mb-6 flex-wrap">
                    <input
                        name="search"
                        defaultValue={params.search ?? ''}
                        placeholder="Sök efter titel..."
                        className="flex-1 min-w-[200px] px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        name="status"
                        defaultValue={params.status ?? ''}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Alla statusar</option>
                        <option value="draft">Utkast</option>
                        <option value="published">Publicerade</option>
                        <option value="archived">Arkiverade</option>
                    </select>
                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Sök
                    </button>
                </form>

                {/* Articles table */}
                {articleList.length === 0 ? (
                    <div className="text-center py-24 text-zinc-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">Inga artiklar hittades</p>
                        <p className="text-sm mt-1">
                            <Link href="/admin/articles/new" className="text-blue-400 hover:underline">Skapa din första artikel</Link>
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Titel</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Kurs / Ämne</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Uppdaterad</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Visningar</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {articleList.map(article => {
                                    const style = statusStyles[article.status] ?? statusStyles.draft;
                                    return (
                                        <tr key={article.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-zinc-900 dark:text-white text-sm">{article.title}</div>
                                                {Array.isArray(article.tags) && article.tags.length > 0 && (
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {(article.tags as string[]).slice(0, 3).map(tag => (
                                                            <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
                                                                <Tag className="w-2.5 h-2.5" />{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-zinc-500">
                                                {article.courseCode && (
                                                    <div className="flex items-center gap-1">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        <span>{article.courseCode}</span>
                                                    </div>
                                                )}
                                                {article.topicTitle && (
                                                    <div className="text-xs text-zinc-400 mt-0.5 ml-4.5">{article.topicTitle}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.className}`}>
                                                    {style.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-zinc-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(article.updatedAt).toLocaleDateString('sv-SE')}
                                                </div>
                                                {article.readingTimeMinutes && (
                                                    <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                                                        <Clock className="w-3 h-3" />{article.readingTimeMinutes} min
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-zinc-500">
                                                <div className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {article.viewCount ?? 0}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Link
                                                    href={`/admin/articles/${article.id}/edit`}
                                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                >
                                                    Redigera
                                                </Link>
                                                {article.status === 'published' && (
                                                    <Link
                                                        href={`/articles/${article.slug}`}
                                                        target="_blank"
                                                        className="ml-2 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                    >
                                                        Visa
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
