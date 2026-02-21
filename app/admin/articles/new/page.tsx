'use client';

import { useRouter } from 'next/navigation';
import { ArticleEditor } from '@/components/articles/ArticleEditor';
import { createArticle, getAllCoursesAndTopics } from '@/app/actions/articles';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ArticleBlock, ArticleStatus } from '@/types/articles';

export default function NewArticlePage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Array<{ id: string; code: string; name: string }>>([]);
    const [topics, setTopics] = useState<Array<{ id: string; title: string; courseId: string | null }>>([]);

    useEffect(() => {
        getAllCoursesAndTopics().then(({ courses, topics }) => {
            setCourses(courses);
            setTopics(topics);
        });
    }, []);

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
        const result = await createArticle({
            title: payload.title,
            titleSv: payload.titleSv || undefined,
            excerpt: payload.excerpt || undefined,
            contentBlocks: payload.contentBlocks,
            tags: payload.tags,
            courseId: payload.courseId || undefined,
            topicId: payload.topicId || undefined,
            status: payload.status,
        });
        router.push(`/admin/articles/${result.id}/edit`);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col h-screen" style={{ background: '#F0F2F8' }}>
                {/* Top bar */}
                <div className="flex items-center gap-4 px-6 py-3.5 bg-white"
                    style={{ borderBottom: '1px solid #EFF1F8' }}>
                    <Link href="/admin/articles"
                        className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                        style={{ color: '#6B7194' }}>
                        <ArrowLeft className="w-4 h-4" /> Tillbaka
                    </Link>
                    <div className="h-4 w-px" style={{ background: '#EFF1F8' }} />
                    <h1 className="text-sm font-semibold" style={{ color: '#1A1D2E' }}>Ny artikel</h1>
                </div>

                {/* Editor — full width, distraction-free */}
                <div className="flex-1 overflow-hidden px-6 py-4 lg:px-12">
                    <ArticleEditor
                        courses={courses}
                        topics={topics}
                        onSave={handleSave}
                        saveLabel="Skapa artikel"
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
