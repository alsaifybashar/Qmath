'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MathRenderer } from '@/components/MathRenderer';
import {
    getAdminCourses,
    getAdminTopics,
    getAdminQuestions,
    createQuestion,
    updateQuestion,
    createTopic,
    deleteQuestion,
    updateQuestionStatus,
    publishQuestions,
    unpublishQuestion,
} from '@/app/actions/admin-questions';
import {
    analyzeQuestionDifficulty,
    analyzeQuestionsBatch,
} from '@/app/actions/ai-question-analysis';
import type { AIQuestionAnalysis } from '@/app/actions/ai-question-analysis';
import {
    Plus,
    Trash2,
    X,
    ChevronDown,
    BookOpen,
    HelpCircle,
    Layers,
    ArrowRight,
    Check,
    Edit,
    Sparkles,
    Send,
    Eye,
    Loader2,
    Brain,
    Clock,
    Target,
    Lightbulb,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    FileText,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SolutionStep {
    label: string;
    content: string;
}

interface FormData {
    contentMarkdown: string;
    questionType: string;
    correctAnswer: string;
    options: string;
    difficultyTier: number;
    solutionSteps: SolutionStep[];
}

const DEFAULT_FORM: FormData = {
    contentMarkdown: '',
    questionType: 'multiple_choice',
    correctAnswer: '',
    options: '["Option A", "Option B", "Option C", "Option D"]',
    difficultyTier: 1,
    solutionSteps: [{ label: 'Step 1', content: '' }],
};

type TabKey = 'draft' | 'ai_review' | 'ready' | 'published';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'draft', label: 'Utkast', icon: <FileText className="w-4 h-4" /> },
    { key: 'ai_review', label: 'AI-analys', icon: <Loader2 className="w-4 h-4" /> },
    { key: 'ready', label: 'Redo', icon: <Eye className="w-4 h-4" /> },
    { key: 'published', label: 'Publicerad', icon: <CheckCircle2 className="w-4 h-4" /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stepsToMarkdown(steps: SolutionStep[]): string {
    return steps
        .filter(s => s.content.trim())
        .map(s => `### ${s.label}\n${s.content}`)
        .join('\n\n');
}

const DIFFICULTY_LABELS = ['', 'Beginner', 'Easy', 'Intermediate', 'Hard', 'Expert'];
const DIFFICULTY_COLORS = [
    '',
    'bg-emerald-100 text-emerald-700',
    'bg-green-100 text-green-700',
    'bg-yellow-100 text-yellow-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
];

function DifficultyBadge({ tier, label }: { tier: number; label?: string }) {
    const t = Math.max(1, Math.min(5, tier));
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${DIFFICULTY_COLORS[t]}`}>
            {label && <span className="opacity-60">{label}:</span>}
            {t} — {DIFFICULTY_LABELS[t]}
        </span>
    );
}

// ─── LaTeX Editor ─────────────────────────────────────────────────────────────

function LatexEditor({
    label,
    hint,
    value,
    onChange,
    placeholder,
    rows = 6,
}: {
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
            )}
            {hint && <p className="text-xs text-zinc-500 mb-2">{hint}</p>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    rows={rows}
                    className="w-full p-3 rounded-lg border border-zinc-200 bg-white text-zinc-900 font-mono text-sm resize-y"
                    placeholder={placeholder}
                />
                <div
                    className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 overflow-y-auto"
                    style={{ minHeight: `${rows * 1.5}rem` }}
                >
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Preview</p>
                    <div className="prose max-w-none text-sm">
                        <MathRenderer content={value || '*Nothing to preview yet.*'} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── AI Analysis Card ─────────────────────────────────────────────────────────

function AIAnalysisCard({ question }: { question: any }) {
    const analysis = question.aiAnalysis as AIQuestionAnalysis | null;
    if (!analysis) return null;

    return (
        <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                <Brain className="w-4 h-4" />
                AI-analys
                {question.aiAnalyzedAt && (
                    <span className="text-[10px] font-normal text-blue-500 ml-auto">
                        {new Date(question.aiAnalyzedAt).toLocaleString('sv-SE')}
                    </span>
                )}
            </div>

            {/* Difficulty comparison */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Admin:</span>
                    <DifficultyBadge tier={question.difficultyTier} />
                </div>
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">AI:</span>
                    <DifficultyBadge tier={analysis.difficulty} />
                </div>
                {question.difficultyTier !== analysis.difficulty && (
                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                        Avvikelse
                    </span>
                )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                    <Target className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">Bloom-nivå</p>
                        <p className="text-zinc-700 capitalize">{analysis.bloomLevel}</p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">Estimerad tid</p>
                        <p className="text-zinc-700">{analysis.estimatedTimeMinutes} min</p>
                    </div>
                </div>
            </div>

            {/* Concepts */}
            {analysis.conceptsTested.length > 0 && (
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Koncept som testas</p>
                    <div className="flex flex-wrap gap-1.5">
                        {analysis.conceptsTested.map(c => (
                            <span key={c} className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-xs text-zinc-600">
                                {c.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Prerequisites */}
            {analysis.prerequisiteTopics.length > 0 && (
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Förkunskaper</p>
                    <div className="flex flex-wrap gap-1.5">
                        {analysis.prerequisiteTopics.map(p => (
                            <span key={p} className="px-2 py-0.5 bg-purple-50 border border-purple-200 rounded text-xs text-purple-600">
                                {p.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Strategy tag */}
            {analysis.strategyTag && (
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Strategi</p>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
                        {analysis.strategyTag.replace(/_/g, ' ')}
                    </span>
                </div>
            )}

            {/* Admin feedback */}
            {analysis.feedbackForAdmin && (
                <div className="bg-white rounded-lg p-3 border border-zinc-100">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">AI-kommentar</p>
                    <p className="text-sm text-zinc-700">{analysis.feedbackForAdmin}</p>
                </div>
            )}

            {/* Suggested hints */}
            {analysis.suggestedHints && analysis.suggestedHints.length > 0 && (
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Föreslagna ledtrådar
                    </p>
                    <ol className="space-y-1">
                        {analysis.suggestedHints.map((h, i) => (
                            <li key={i} className="text-xs text-zinc-600 flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                {h}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminQuestionsPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const preselectedCourseId = searchParams.get('course') ?? '';

    // Data
    const [courses, setCourses] = useState<any[]>([]);
    const [topics, setTopics] = useState<any[]>([]);
    const [allQuestions, setAllQuestions] = useState<any[]>([]);

    // Selection
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [activeTab, setActiveTab] = useState<TabKey>('draft');

    // UI modes
    const [isCreatingTopic, setIsCreatingTopic] = useState(false);
    const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

    // New topic form
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [newTopicDesc, setNewTopicDesc] = useState('');

    // Question form
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

    // Loading
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [submittingQuestion, setSubmittingQuestion] = useState(false);
    const [submittingTopic, setSubmittingTopic] = useState(false);
    const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
    const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());

    // Filtered questions per tab
    const filteredQuestions = allQuestions.filter(q => {
        const status = q.status || (q.isPublished ? 'published' : 'draft');
        return status === activeTab;
    });

    // Tab counts
    const tabCounts: Record<TabKey, number> = {
        draft: allQuestions.filter(q => (q.status || 'draft') === 'draft').length,
        ai_review: allQuestions.filter(q => q.status === 'ai_review').length,
        ready: allQuestions.filter(q => q.status === 'ready').length,
        published: allQuestions.filter(q => q.status === 'published' || (!q.status && q.isPublished)).length,
    };

    // ── Refresh questions ────────────────────────────────────────────────────

    const refreshQuestions = useCallback(async () => {
        if (!selectedTopicId) return;
        const { data } = await getAdminQuestions(selectedTopicId);
        if (data) setAllQuestions(data);
    }, [selectedTopicId]);

    // ── Fetching ─────────────────────────────────────────────────────────────

    useEffect(() => {
        (async () => {
            const { data } = await getAdminCourses();
            if (data) {
                setCourses(data);
                if (preselectedCourseId) {
                    const match = data.find((c: any) => c.id === preselectedCourseId);
                    if (match) setSelectedCourse(match);
                }
            }
            setLoadingCourses(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedCourse) { setTopics([]); return; }
        (async () => {
            setLoadingTopics(true);
            const { data } = await getAdminTopics(selectedCourse.id);
            if (data) setTopics(data);
            setLoadingTopics(false);
        })();
    }, [selectedCourse]);

    useEffect(() => {
        if (!selectedTopicId) { setAllQuestions([]); return; }
        (async () => {
            setLoadingQuestions(true);
            const { data } = await getAdminQuestions(selectedTopicId);
            if (data) setAllQuestions(data);
            setLoadingQuestions(false);
        })();
    }, [selectedTopicId]);

    // ── Topic creation ───────────────────────────────────────────────────────

    const handleCreateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse || !newTopicTitle.trim()) return;
        setSubmittingTopic(true);
        const result = await createTopic({
            courseId: selectedCourse.id,
            title: newTopicTitle.trim(),
            description: newTopicDesc.trim() || undefined,
        });
        if (result.success) {
            const { data } = await getAdminTopics(selectedCourse.id);
            if (data) setTopics(data);
            setNewTopicTitle('');
            setNewTopicDesc('');
            setIsCreatingTopic(false);
            if (result.data) setSelectedTopicId(result.data.id);
        } else {
            alert(result.error);
        }
        setSubmittingTopic(false);
    };

    // ── Question form helpers ────────────────────────────────────────────────

    const addStep = () => {
        setFormData(f => ({
            ...f,
            solutionSteps: [
                ...f.solutionSteps,
                { label: `Step ${f.solutionSteps.length + 1}`, content: '' },
            ],
        }));
    };

    const removeStep = (index: number) => {
        setFormData(f => ({
            ...f,
            solutionSteps: f.solutionSteps.filter((_, i) => i !== index),
        }));
    };

    const updateStep = (index: number, field: keyof SolutionStep, value: string) => {
        setFormData(f => ({
            ...f,
            solutionSteps: f.solutionSteps.map((s, i) =>
                i === index ? { ...s, [field]: value } : s
            ),
        }));
    };

    const handleEditQuestion = (q: any) => {
        let optionsStr = '[]';
        if (typeof q.options === 'string') optionsStr = q.options;
        else if (Array.isArray(q.options)) optionsStr = JSON.stringify(q.options);

        const steps: SolutionStep[] = [];
        const stepRegex = /###\s+(.*?)\n([\s\S]*?)(?=###\s+|$)/g;
        let match;
        while ((match = stepRegex.exec(q.explanationMarkdown)) !== null) {
            steps.push({ label: match[1].trim(), content: match[2].trim() });
        }

        if (steps.length === 0 && q.explanationMarkdown) {
            steps.push({ label: 'Solution', content: q.explanationMarkdown });
        } else if (steps.length === 0) {
            steps.push({ label: 'Step 1', content: '' });
        }

        setFormData({
            contentMarkdown: q.contentMarkdown,
            questionType: q.questionType,
            correctAnswer: q.correctAnswer,
            options: optionsStr,
            difficultyTier: q.difficultyTier,
            solutionSteps: steps,
        });
        setEditingQuestionId(q.id);
        setIsCreatingQuestion(true);
        setActiveTab('draft');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmitQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingQuestion(true);

        let parsedOptions: string[] | undefined;
        if (formData.questionType === 'multiple_choice') {
            try {
                const parsed = JSON.parse(formData.options);
                if (!Array.isArray(parsed)) {
                    alert('Options must be a JSON array. Example: ["A", "B", "C", "D"]');
                    setSubmittingQuestion(false);
                    return;
                }
                parsedOptions = parsed as string[];
            } catch {
                alert('Options field contains invalid JSON. Example: ["A", "B", "C", "D"]');
                setSubmittingQuestion(false);
                return;
            }
        }

        const explanationMarkdown = stepsToMarkdown(formData.solutionSteps);

        let result;
        if (editingQuestionId) {
            result = await updateQuestion(editingQuestionId, {
                contentMarkdown: formData.contentMarkdown,
                questionType: formData.questionType,
                correctAnswer: formData.correctAnswer,
                options: parsedOptions,
                explanationMarkdown,
                difficultyTier: formData.difficultyTier,
            });
        } else {
            result = await createQuestion({
                topicId: selectedTopicId,
                contentMarkdown: formData.contentMarkdown,
                questionType: formData.questionType,
                correctAnswer: formData.correctAnswer,
                options: parsedOptions,
                explanationMarkdown,
                difficultyTier: formData.difficultyTier,
            });
        }

        if (result.success) {
            await refreshQuestions();
            setIsCreatingQuestion(false);
            setEditingQuestionId(null);
            setFormData(DEFAULT_FORM);
            setActiveTab('draft');
        } else {
            alert(`Failed to ${editingQuestionId ? 'update' : 'create'} question.`);
        }
        setSubmittingQuestion(false);
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Delete this question? This cannot be undone.')) return;
        const result = await deleteQuestion(id);
        if (result.success) await refreshQuestions();
    };

    // ── AI Analysis ──────────────────────────────────────────────────────────

    const handleAnalyze = async (id: string) => {
        setAnalyzingIds(prev => new Set(prev).add(id));
        const result = await analyzeQuestionDifficulty(id);
        await refreshQuestions();
        setAnalyzingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        if (!result.success) alert(result.error);
    };

    const handleAnalyzeBatch = async () => {
        const draftIds = allQuestions
            .filter(q => (q.status || 'draft') === 'draft')
            .map(q => q.id);
        if (draftIds.length === 0) return;
        const batch = draftIds.slice(0, 5);
        setAnalyzingIds(new Set(batch));
        await analyzeQuestionsBatch(batch);
        await refreshQuestions();
        setAnalyzingIds(new Set());
    };

    // ── Publishing ───────────────────────────────────────────────────────────

    const handlePublish = async (id: string) => {
        setPublishingIds(prev => new Set(prev).add(id));
        await publishQuestions([id]);
        await refreshQuestions();
        setPublishingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    // Direct publish from draft — skips AI analysis requirement
    const handlePublishDirect = async (id: string) => {
        setPublishingIds(prev => new Set(prev).add(id));
        await updateQuestionStatus(id, 'published');
        await refreshQuestions();
        setPublishingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const handlePublishAll = async () => {
        const readyIds = allQuestions
            .filter(q => q.status === 'ready')
            .map(q => q.id);
        if (readyIds.length === 0) return;
        setPublishingIds(new Set(readyIds));
        await publishQuestions(readyIds);
        await refreshQuestions();
        setPublishingIds(new Set());
    };

    const handleUnpublish = async (id: string) => {
        await unpublishQuestion(id);
        await refreshQuestions();
    };

    if (!session) return null;

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <div className="p-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                        Frågehantering
                    </h1>
                    <p className="text-zinc-600">
                        Skapa frågor, analysera med AI och publicera till studenter.
                    </p>
                </div>

                {/* ── Step 1: Course selection ── */}
                <section className="mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Steg 1 — Välj kurs
                    </h2>

                    {loadingCourses ? (
                        <p className="text-zinc-500 text-sm">Laddar kurser...</p>
                    ) : courses.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-sm">
                            Inga kurser tillgängliga. Kurser skapas automatiskt när du laddar upp gamla tentor via{' '}
                            <a href="/admin/upload-exam" className="underline font-medium">Ladda upp tenta</a>.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {courses.map(course => (
                                <button
                                    key={course.id}
                                    onClick={() => {
                                        setSelectedCourse(course);
                                        setSelectedTopicId('');
                                        setIsCreatingQuestion(false);
                                        setIsCreatingTopic(false);
                                    }}
                                    className={`text-left p-4 rounded-xl border transition-all ${selectedCourse?.id === course.id
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                                        : 'border-zinc-200 bg-white hover:border-blue-400'
                                        }`}
                                >
                                    <div className="font-mono font-bold text-zinc-900 text-lg">
                                        {course.code}
                                    </div>
                                    <div className="text-sm text-zinc-600 truncate">
                                        {course.name}
                                    </div>
                                    {selectedCourse?.id === course.id && (
                                        <Check className="w-4 h-4 text-blue-600 mt-1" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Step 2: Topic selection ── */}
                {selectedCourse && (
                    <section className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <Layers className="w-4 h-4" /> Steg 2 — Välj eller skapa ämne
                            </h2>
                            {!isCreatingTopic && (
                                <button
                                    onClick={() => setIsCreatingTopic(true)}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                >
                                    <Plus className="w-3 h-3" /> Nytt ämne
                                </button>
                            )}
                        </div>

                        {isCreatingTopic && (
                            <form
                                onSubmit={handleCreateTopic}
                                className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4 space-y-3"
                            >
                                <h3 className="font-semibold text-blue-900 text-sm">
                                    Skapa nytt ämne för {selectedCourse.code}
                                </h3>
                                <input
                                    type="text"
                                    value={newTopicTitle}
                                    onChange={e => setNewTopicTitle(e.target.value)}
                                    placeholder="Ämnesnamn (t.ex. Matriser, Derivator)"
                                    required
                                    className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm"
                                />
                                <textarea
                                    value={newTopicDesc}
                                    onChange={e => setNewTopicDesc(e.target.value)}
                                    placeholder="Kort beskrivning (valfritt)"
                                    rows={2}
                                    className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm resize-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={submittingTopic || !newTopicTitle.trim()}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
                                    >
                                        {submittingTopic ? 'Skapar...' : 'Skapa ämne'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingTopic(false)}
                                        className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg text-sm"
                                    >
                                        Avbryt
                                    </button>
                                </div>
                            </form>
                        )}

                        {loadingTopics ? (
                            <p className="text-zinc-500 text-sm">Laddar ämnen...</p>
                        ) : topics.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">
                                Inga ämnen för denna kurs. Skapa ett ovan.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {topics.map(topic => (
                                    <button
                                        key={topic.id}
                                        onClick={() => {
                                            setSelectedTopicId(topic.id);
                                            setIsCreatingQuestion(false);
                                            setActiveTab('draft');
                                        }}
                                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedTopicId === topic.id
                                            ? 'border-blue-500 bg-blue-600 text-white'
                                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-blue-400'
                                            }`}
                                    >
                                        {topic.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ── Step 3: Questions with workflow tabs ── */}
                {selectedTopicId && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <HelpCircle className="w-4 h-4" /> Steg 3 — Frågor
                                {allQuestions.length > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-zinc-100 rounded-full text-xs text-zinc-600">
                                        {allQuestions.length}
                                    </span>
                                )}
                            </h2>
                            {!isCreatingQuestion && (
                                <button
                                    onClick={() => {
                                        setIsCreatingQuestion(true);
                                        setEditingQuestionId(null);
                                        setFormData(DEFAULT_FORM);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Ny fråga
                                </button>
                            )}
                        </div>

                        {/* ── Question creation form ── */}
                        {isCreatingQuestion && (
                            <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-zinc-900">
                                        {editingQuestionId ? 'Redigera fråga' : 'Ny fråga'}
                                    </h3>
                                    <button
                                        onClick={() => { setIsCreatingQuestion(false); setFormData(DEFAULT_FORM); setEditingQuestionId(null); }}
                                        className="text-zinc-400 hover:text-zinc-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmitQuestion} className="space-y-6">
                                    <LatexEditor
                                        label="Frågetext (Markdown + LaTeX)"
                                        hint="Använd $$...$$ för block-ekvationer och $...$ för inline-matte."
                                        value={formData.contentMarkdown}
                                        onChange={v => setFormData(f => ({ ...f, contentMarkdown: v }))}
                                        placeholder={"Lös ekvationssystemet:\n$$\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}$$"}
                                        rows={6}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">Frågetyp</label>
                                            <select
                                                value={formData.questionType}
                                                onChange={e => setFormData(f => ({ ...f, questionType: e.target.value }))}
                                                className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm"
                                            >
                                                <option value="multiple_choice">Flerval</option>
                                                <option value="numeric">Numeriskt svar</option>
                                                <option value="free_response">Fri text</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">Korrekt svar</label>
                                            <input
                                                type="text"
                                                value={formData.correctAnswer}
                                                onChange={e => setFormData(f => ({ ...f, correctAnswer: e.target.value }))}
                                                required
                                                placeholder="t.ex. Alternativ A, eller 3.14"
                                                className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">Svårighetsgrad</label>
                                            <select
                                                value={formData.difficultyTier}
                                                onChange={e => setFormData(f => ({ ...f, difficultyTier: Number(e.target.value) }))}
                                                className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm"
                                            >
                                                <option value={1}>1 – Nybörjare</option>
                                                <option value={2}>2 – Lätt</option>
                                                <option value={3}>3 – Medel</option>
                                                <option value={4}>4 – Svår</option>
                                                <option value={5}>5 – Expert</option>
                                            </select>
                                        </div>
                                    </div>

                                    {formData.questionType === 'multiple_choice' && (
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                                                Svarsalternativ (JSON-array — LaTeX tillåtet)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.options}
                                                onChange={e => setFormData(f => ({ ...f, options: e.target.value }))}
                                                placeholder='["$x=2$", "$x=3$", "$x=-1$", "$x=0$"]'
                                                className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 font-mono text-sm"
                                            />
                                        </div>
                                    )}

                                    {/* Step-by-step solution */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-zinc-700">
                                                Steg-för-steg-lösning (Markdown + LaTeX)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={addStep}
                                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                            >
                                                <Plus className="w-3 h-3" /> Lägg till steg
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {formData.solutionSteps.map((step, index) => (
                                                <div key={index} className="border border-zinc-200 rounded-xl p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <input
                                                            type="text"
                                                            value={step.label}
                                                            onChange={e => updateStep(index, 'label', e.target.value)}
                                                            className="w-32 p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm font-semibold"
                                                        />
                                                        <ArrowRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                                                        <span className="text-xs text-zinc-500 flex-1">Beskriv vad som görs i detta steg</span>
                                                        {formData.solutionSteps.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeStep(index)}
                                                                className="text-zinc-400 hover:text-red-500"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <LatexEditor
                                                        label=""
                                                        value={step.content}
                                                        onChange={v => updateStep(index, 'content', v)}
                                                        placeholder={"Multiplicera båda sidor med 2:\n$$2 \\cdot \\frac{x}{2} = 2 \\cdot 3$$\nSå $x = 6$."}
                                                        rows={4}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                                        <button
                                            type="button"
                                            onClick={() => { setIsCreatingQuestion(false); setFormData(DEFAULT_FORM); setEditingQuestionId(null); }}
                                            className="px-4 py-2 rounded-lg text-zinc-600 hover:bg-zinc-100 text-sm"
                                        >
                                            Avbryt
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submittingQuestion}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
                                        >
                                            {submittingQuestion ? 'Sparar...' : (editingQuestionId ? 'Uppdatera fråga' : 'Spara som utkast')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ── Workflow tabs ── */}
                        <div className="flex gap-1 border-b border-zinc-200 mb-4">
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                                        activeTab === tab.key
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tabCounts[tab.key] > 0 && (
                                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            activeTab === tab.key
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-zinc-100 text-zinc-500'
                                        }`}>
                                            {tabCounts[tab.key]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* ── Batch actions ── */}
                        {activeTab === 'draft' && tabCounts.draft > 0 && (
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={handleAnalyzeBatch}
                                    disabled={analyzingIds.size > 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
                                >
                                    {analyzingIds.size > 0 ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    Analysera alla med AI ({Math.min(tabCounts.draft, 5)})
                                </button>
                            </div>
                        )}

                        {activeTab === 'ready' && tabCounts.ready > 0 && (
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={handlePublishAll}
                                    disabled={publishingIds.size > 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
                                >
                                    {publishingIds.size > 0 ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Publicera alla ({tabCounts.ready})
                                </button>
                            </div>
                        )}

                        {/* ── Question list ── */}
                        {loadingQuestions ? (
                            <p className="text-zinc-500 text-sm text-center py-8">Laddar frågor...</p>
                        ) : filteredQuestions.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                                <HelpCircle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                                <p className="text-zinc-500">
                                    {activeTab === 'draft' && 'Inga utkast. Skapa en ny fråga ovan.'}
                                    {activeTab === 'ai_review' && 'Inga frågor under analys.'}
                                    {activeTab === 'ready' && 'Inga frågor redo att publiceras. Analysera utkast med AI först.'}
                                    {activeTab === 'published' && 'Inga publicerade frågor ännu.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredQuestions.map(q => (
                                    <div
                                        key={q.id}
                                        className="bg-white rounded-xl border border-zinc-200 overflow-hidden"
                                    >
                                        {/* Question header */}
                                        <div className="flex items-start justify-between p-5">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <DifficultyBadge tier={q.difficultyTier} label="Admin" />
                                                    {q.aiDifficultyTier && (
                                                        <DifficultyBadge tier={q.aiDifficultyTier} label="AI" />
                                                    )}
                                                    <span className="text-xs text-zinc-400 uppercase tracking-wide">
                                                        {q.questionType === 'multiple_choice' ? 'Flerval' :
                                                         q.questionType === 'numeric' ? 'Numeriskt' : 'Fri text'}
                                                    </span>
                                                    {q.strategyTag && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {q.strategyTag.replace(/_/g, ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="prose max-w-none text-sm text-zinc-800 line-clamp-2">
                                                    <MathRenderer content={q.contentMarkdown} />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                                {/* Tab-specific actions */}
                                                {activeTab === 'draft' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAnalyze(q.id)}
                                                            disabled={analyzingIds.has(q.id) || publishingIds.has(q.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                            title="Analysera med AI"
                                                        >
                                                            {analyzingIds.has(q.id) ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                            )}
                                                            AI
                                                        </button>
                                                        <button
                                                            onClick={() => handlePublishDirect(q.id)}
                                                            disabled={publishingIds.has(q.id) || analyzingIds.has(q.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                            title="Publicera direkt utan AI-analys"
                                                        >
                                                            {publishingIds.has(q.id) ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Send className="w-3.5 h-3.5" />
                                                            )}
                                                            Publicera
                                                        </button>
                                                    </>
                                                )}
                                                {activeTab === 'ai_review' && (
                                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Analyserar...
                                                    </div>
                                                )}
                                                {activeTab === 'ready' && (
                                                    <button
                                                        onClick={() => handlePublish(q.id)}
                                                        disabled={publishingIds.has(q.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        {publishingIds.has(q.id) ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Send className="w-3.5 h-3.5" />
                                                        )}
                                                        Publicera
                                                    </button>
                                                )}
                                                {activeTab === 'published' && (
                                                    <button
                                                        onClick={() => handleUnpublish(q.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-medium transition-colors"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Avpublicera
                                                    </button>
                                                )}

                                                {/* Expand solution */}
                                                {q.explanationMarkdown && (
                                                    <button
                                                        onClick={() => setExpandedQuestionId(prev => prev === q.id ? null : q.id)}
                                                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-blue-600 transition-colors"
                                                    >
                                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedQuestionId === q.id ? 'rotate-180' : ''}`} />
                                                        Lösning
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEditQuestion(q)}
                                                    className="text-zinc-400 hover:text-blue-500 transition-colors"
                                                    title="Redigera"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                                    title="Ta bort"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* AI Analysis panel (shown in Ready + Published tabs) */}
                                        {(activeTab === 'ready' || activeTab === 'published') && q.aiAnalysis && (
                                            <div className="px-5 pb-5">
                                                <AIAnalysisCard question={q} />
                                            </div>
                                        )}

                                        {/* Expanded solution */}
                                        {expandedQuestionId === q.id && q.explanationMarkdown && (
                                            <div className="border-t border-zinc-100 bg-zinc-50 p-5">
                                                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                                                    Steg-för-steg-lösning
                                                </p>
                                                <div className="prose max-w-none text-sm">
                                                    <MathRenderer content={q.explanationMarkdown} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
