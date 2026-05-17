import { getUserCoursesForAnalysis } from '@/app/actions/exam-analysis';
import { getEnrolledCourseIds } from '@/app/actions/courses';
import CoursesDiscover from '@/components/courses/CoursesDiscover';
import Link from 'next/link';
import { BookOpen, ChevronRight, Compass, GraduationCap, Layers, Plus } from 'lucide-react';

const courseGradients = [
    'linear-gradient(135deg, #4361EE 0%, #22C55E 100%)',
    'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
    'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
    'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    'linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #0891B2 0%, #4ADE80 100%)',
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
        <div className="liquid-theme relative min-h-screen overflow-hidden bg-slate-50 pb-20 text-zinc-950 dark:bg-[#08091f] dark:text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(67,97,238,0.20),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(34,197,94,0.16),transparent_30%),radial-gradient(circle_at_52%_90%,rgba(14,165,233,0.14),transparent_34%),linear-gradient(135deg,#f8fbff_0%,#edf7ff_48%,#f0fff8_100%)] dark:bg-[radial-gradient(circle_at_12%_14%,rgba(67,97,238,0.45),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(34,197,94,0.32),transparent_30%),radial-gradient(circle_at_52%_90%,rgba(14,165,233,0.24),transparent_34%),linear-gradient(135deg,#050816_0%,#101d50_48%,#052c24_100%)]" />
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55),transparent_24%,rgba(255,255,255,0.24)_52%,transparent_76%)] dark:bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_24%,rgba(255,255,255,0.04)_52%,transparent_76%)]" />

            <div className="relative z-10 mx-auto max-w-[1060px] px-4 py-8">
                <section className="liquid-card p-5 sm:p-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-100">
                                <Compass className="h-3.5 w-3.5" />
                                Kurskompass
                            </div>
                            <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
                                Välj bana, följ progressionen
                            </h1>
                            <p className="liquid-muted mt-3 max-w-2xl text-sm leading-6">
                                Dina kurser samlas som tydliga lärbanor med tentafokus, övning och analys ett klick bort.
                            </p>
                        </div>
                        <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 shadow-xl shadow-emerald-500/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-300/15 text-emerald-700 dark:text-emerald-100">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-200">Registrerade</p>
                                    <p className="text-2xl font-bold">{courses.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-bold">Mina kurser</h2>
                        <span className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-100">
                            {courses.length} aktiva
                        </span>
                    </div>

                    {courses.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course, idx) => (
                                <CourseTile
                                    key={course.id}
                                    code={course.code}
                                    name={course.name}
                                    gradient={courseGradients[idx % courseGradients.length]}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="liquid-card p-10 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg border border-blue-300/20 bg-blue-400/10 text-blue-700 dark:text-blue-100">
                                <BookOpen size={24} />
                            </div>
                            <p className="font-bold">Inga kurser än</p>
                            <p className="liquid-muted mt-1 text-sm">Sök nedan för att hitta kurser och lägga till dem i din lista.</p>
                        </div>
                    )}
                </section>

                <div className="my-6 flex items-center gap-3 border-t border-black/10 dark:border-white/10">
                    <div className="-mt-px inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-100">
                        <Plus size={12} />
                        Lägg till en kurs
                    </div>
                </div>

                <section className="liquid-card p-5 sm:p-6">
                    <CoursesDiscover enrolledIds={enrolledIds} />
                </section>
            </div>
        </div>
    );
}

function CourseTile({
    code,
    name,
    gradient,
}: {
    code: string;
    name: string;
    gradient: string;
}) {
    return (
        <Link href={`/courses/${code}`} className="group block overflow-hidden rounded-lg transition hover:-translate-y-1">
            <div className="relative min-h-[150px] p-5 text-white shadow-2xl shadow-blue-500/10" style={{ background: gradient }}>
                <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.18),transparent_35%,rgba(255,255,255,0.08)_70%,transparent)]" />
                <div className="relative z-10 flex h-full min-h-[110px] flex-col justify-between">
                    <div>
                        <div className="mb-2 inline-flex rounded-md bg-white/15 px-2 py-1 text-xs font-mono font-bold text-white/75">
                            {code}
                        </div>
                        <h3 className="text-base font-bold leading-snug">{name}</h3>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/75">
                            <GraduationCap size={13} />
                            Analys & studieplan
                        </span>
                        <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
