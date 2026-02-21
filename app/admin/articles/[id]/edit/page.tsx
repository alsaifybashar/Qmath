'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { ArticleEditor } from '@/components/articles/ArticleEditor';
import {
    getAdminArticleById, updateArticle, deleteArticle,
    getAllCoursesAndTopics, publishArticle, unpublishArticle
} from '@/app/actions/articles';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Trash2, Globe, EyeOff, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { ArticleBlock, ArticleStatus } from '@/types/articles';

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [article, setArticle] = useState<{
        id: string;
        title: string;
        titleSv: string | null;
        slug: string;
        excerpt: string | null;
        courseId: string | null;
        topicId: string | null;
        contentBlocks: unknown;
        status: string;
        tags: unknown;
    } | null>(null);
    const [courses, setCourses] = useState<Array<{ id: string; code: string; name: string }>>([]);
    const [topics, setTopics] = useState<Array<{ id: string; title: string; courseId: string | null }>>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        Promise.all([
            getAdminArticleById(id),
            getAllCoursesAndTopics(),
        ]).then(([art, { courses, topics }]) => {
            setArticle(art);
            setCourses(courses);
            setTopics(topics);
            setLoading(false);
        });
    }, [id]);

    const handleSave = async (payload: {
        title: string;
        titleSv: string;
        excerpt: string;
        contentBlocks: ArticleBlock[];
        tags: string[];
        courseId: string;
        topicId: string;
        status: ArticleStatus;
    }) => {
        await updateArticle(id, {
            title: payload.title,
            titleSv: payload.titleSv || undefined,
            excerpt: payload.excerpt || undefined,
            contentBlocks: payload.contentBlocks,
            tags: payload.tags,
            courseId: payload.courseId || undefined,
            topicId: payload.topicId || undefined,
            status: payload.status,
        });
    };

    const handleDelete = async () => {
        setDeleting(true);
        await deleteArticle(id);
        router.push('/admin/articles');
    };

    const handleTogglePublish = async () => {
        if (!article) return;
        setPublishing(true);
        if (article.status === 'published') {
            await unpublishArticle(id);
            setArticle(a => a ? { ...a, status: 'draft' } : null);
        } else {
            await publishArticle(id);
            setArticle(a => a ? { ...a, status: 'published' } : null);
        }
        setPublishing(false);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-screen" style={{ background: '#F0F2F8' }}>
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#A0A5C0' }} />
                </div>
            </AdminLayout>
        );
    }

    if (!article) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center h-screen" style={{ background: '#F0F2F8' }}>
                    <p className="text-lg" style={{ color: '#6B7194' }}>Artikel hittades inte.</p>
                    <Link href="/admin/articles" className="mt-4 hover:underline" style={{ color: '#4361EE' }}>Tillbaka</Link>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex flex-col h-screen" style={{ background: '#F0F2F8' }}>
                {/* Top bar */}
                <div className="flex items-center gap-4 px-6 py-3.5 bg-white flex-wrap"
                    style={{ borderBottom: '1px solid #EFF1F8' }}>
                    <Link href="/admin/articles"
                        className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                        style={{ color: '#6B7194' }}>
                        <ArrowLeft className="w-4 h-4" /> Tillbaka
                    </Link>
                    <div className="h-4 w-px" style={{ background: '#EFF1F8' }} />
                    <h1 className="text-sm font-medium truncate max-w-xs" style={{ color: '#1A1D2E' }}>
                        {article.title}
                    </h1>

                    <div className="flex-1" />

                    {/* Quick actions */}
                    {article.status === 'published' && (
                        <Link
                            href={`/articles/${article.slug}`}
                            target="_blank"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-[#F7F8FC]"
                            style={{ color: '#6B7194' }}
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> Visa publik
                        </Link>
                    )}
                    <button
                        onClick={handleTogglePublish}
                        disabled={publishing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        style={{
                            color: article.status === 'published' ? '#D97706' : '#059669',
                            background: article.status === 'published' ? '#FFF8ED' : '#ECFDF5',
                        }}
                    >
                        {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                            article.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                        {article.status === 'published' ? 'Avpublicera' : 'Publicera'}
                    </button>

                    {!deleteConfirm ? (
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-red-50"
                            style={{ color: '#EF4444' }}
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Radera
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-red-500">Bekräfta radering?</span>
                            <button onClick={handleDelete} disabled={deleting}
                                className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">
                                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ja, radera'}
                            </button>
                            <button onClick={() => setDeleteConfirm(false)}
                                className="px-3 py-1.5 text-xs rounded-lg hover:bg-[#F7F8FC]"
                                style={{ color: '#6B7194' }}>
                                Avbryt
                            </button>
                        </div>
                    )}
                </div>

                {/* Editor — full width, distraction-free */}
                <div className="flex-1 overflow-hidden px-6 py-4 lg:px-12">
                    <ArticleEditor
                        initialTitle={article.title}
                        initialTitleSv={article.titleSv ?? ''}
                        initialExcerpt={article.excerpt ?? ''}
                        initialBlocks={(article.contentBlocks as ArticleBlock[]) ?? []}
                        initialTags={(article.tags as string[]) ?? []}
                        initialCourseId={article.courseId ?? ''}
                        initialTopicId={article.topicId ?? ''}
                        initialStatus={article.status as ArticleStatus}
                        courses={courses}
                        topics={topics}
                        onSave={handleSave}
                        saveLabel="Spara ändringar"
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
