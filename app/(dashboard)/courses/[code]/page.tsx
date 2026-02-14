import { getCourseByCode, getCourseExams, getTopics } from '@/app/actions/courses';
import StudyPlan from '@/components/dashboard/StudyPlan';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { FileText, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function CoursePage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    // Fetch basic info
    const courseRes = await getCourseByCode(code);
    if (courseRes.error || !courseRes.data) {
        notFound();
    }
    const course = courseRes.data;

    // Fetch recent exams (simulated analysis source)
    const examsRes = await getCourseExams(code, 7);
    const recentExams = examsRes.data || [];

    // Fetch topics for context
    const topicsRes = await getTopics(course.id);
    const topics = topicsRes.data || [];

    return (
        <div className="min-h-screen bg-[#F0F2F8] p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{course.code}</h1>
                        <p className="text-gray-500 text-lg">{course.name}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-100/50 text-blue-700 rounded-full text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        AI Analysis Included
                    </div>
                </div>

                {/* Exam History Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-700">Analyzed Materials ({recentExams.length} Exams)</h3>
                    </div>

                    {recentExams.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                            {recentExams.map((exam) => (
                                <div key={exam.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors group cursor-default">
                                    <div className="text-xs font-bold text-gray-500 mb-1 group-hover:text-blue-600 transition-colors">{exam.examType}</div>
                                    <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
                                        <Calendar size={12} className="text-gray-400" />
                                        {new Date(exam.examDate).toISOString().split('T')[0]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                            No uploaded exams found. Analysis will be based on course syllabus.
                        </div>
                    )}
                </div>

                {/* AI Study Plan Component */}
                <StudyPlan
                    courseName={course.name}
                    courseCode={course.code}
                    topics={topics.map(t => t.title)}
                    exams={recentExams.map(e => ({
                        filePath: e.filePath,
                        year: new Date(e.examDate).getFullYear().toString(),
                        type: e.examType
                    }))}
                />
            </div>
        </div>
    );
}
