import { getUserCoursesForAnalysis } from '@/app/actions/exam-analysis';
import { getEnrolledCourseIds } from '@/app/actions/courses';
import CoursesDiscover from '@/components/courses/CoursesDiscover';
import Link from 'next/link';
import { BookOpen, ChevronRight, GraduationCap, Plus } from 'lucide-react';

const C = {
    text: '#1A1D2E',
    textMuted: '#A0A5C0',
    textSec: '#6B7194',
    blue: '#4361EE',
    blueLight: '#EEF1FF',
    surface: 'white',
    surfaceAlt: '#F7F8FC',
    border: '#EFF1F8',
};

const courseGradients = [
    'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)',
    'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
    'linear-gradient(135deg, #4361EE 0%, #7C5CFC 100%)',
    'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
    'linear-gradient(135deg, #00C6FB 0%, #005BEA 100%)',
];

export const metadata = {
    title: 'Kurser | Qmath',
};

export default async function CoursesPage() {
    const [courses, enrolledIds] = await Promise.all([
        getUserCoursesForAnalysis(),
        getEnrolledCourseIds(),
    ]);

    return (
        <div className="p-7 max-w-[1060px] min-w-0 mx-auto">

            {/* ── Header ── */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold" style={{ color: C.text }}>
                    Kurser
                </h1>
                <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>
                    Dina registrerade kurser och studieverktyg
                </p>
            </div>

            {/* ── Enrolled courses ── */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold" style={{ color: C.text }}>
                        Mina kurser
                    </h2>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: C.blueLight, color: C.blue }}>
                        {courses.length} registrerade
                    </span>
                </div>

                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map((course, idx) => (
                            <Link
                                key={course.id}
                                href={`/courses/${course.code}`}
                                className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                style={{
                                    boxShadow: '0 2px 12px rgba(26,29,46,0.06)',
                                }}
                            >
                                {/* Gradient header */}
                                <div
                                    className="px-5 py-4 relative"
                                    style={{ background: courseGradients[idx % courseGradients.length] }}
                                >
                                    <div className="text-white/60 text-xs font-mono font-bold mb-0.5">
                                        {course.code}
                                    </div>
                                    <div className="text-white font-semibold text-base leading-snug">
                                        {course.name}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div
                                    className="px-5 py-3 flex items-center justify-between"
                                    style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}
                                >
                                    <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textSec }}>
                                        <GraduationCap size={13} />
                                        <span>Analys & studieplan</span>
                                    </div>
                                    <ChevronRight size={14} style={{ color: C.textMuted }} className="group-hover:text-blue-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div
                        className="rounded-2xl p-10 text-center"
                        style={{ background: C.surfaceAlt, border: `2px dashed ${C.border}` }}
                    >
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                            style={{ background: C.blueLight }}
                        >
                            <BookOpen size={24} style={{ color: C.blue }} />
                        </div>
                        <p className="font-semibold mb-1" style={{ color: C.text }}>Inga kurser än</p>
                        <p className="text-sm mb-5" style={{ color: C.textMuted }}>
                            Sök nedan för att hitta kurser och lägg till dem i din lista.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Divider ── */}
            <div
                className="flex items-center gap-3 mb-6"
                style={{ borderTop: `1px solid ${C.border}` }}
            >
                <div
                    className="mt-[-1px] flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: C.blueLight, color: C.blue }}
                >
                    <Plus size={12} /> Lägg till en kurs
                </div>
            </div>

            {/* ── Discover section (client component) ── */}
            <div
                className="rounded-2xl p-6"
                style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    boxShadow: '0 2px 12px rgba(26,29,46,0.06)',
                }}
            >
                <CoursesDiscover enrolledIds={enrolledIds} />
            </div>
        </div>
    );
}
