'use client';

import { useState, useEffect } from 'react';
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
} from '@/app/actions/admin-questions';
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
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SolutionStep {
    label: string;  // e.g. "Step 1"
    content: string; // Markdown + LaTeX
}

interface FormData {
    contentMarkdown: string;
    questionType: string;
    correctAnswer: string;
    options: string;
    difficultyTier: number;
    solutionSteps: SolutionStep[];
    isPublished: boolean;
}

const DEFAULT_FORM: FormData = {
    contentMarkdown: '',
    questionType: 'multiple_choice',
    correctAnswer: '',
    options: '["Option A", "Option B", "Option C", "Option D"]',
    difficultyTier: 1,
    solutionSteps: [{ label: 'Step 1', content: '' }],
    isPublished: false,
};

// ─── Helper: build explanationMarkdown from steps ─────────────────────────────

function stepsToMarkdown(steps: SolutionStep[]): string {
    return steps
        .filter(s => s.content.trim())
        .map(s => `### ${s.label}\n${s.content}`)
        .join('\n\n');
}

// ─── Shared textarea + preview panel ─────────────────────────────────────────

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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {label}
            </label>
            {hint && <p className="text-xs text-zinc-500 mb-2">{hint}</p>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    rows={rows}
                    className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm resize-y"
                    placeholder={placeholder}
                />
                <div
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto"
                    style={{ minHeight: `${rows * 1.5}rem` }}
                >
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Preview</p>
                    <div className="prose dark:prose-invert max-w-none text-sm">
                        <MathRenderer content={value || '*Nothing to preview yet.*'} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminQuestionsPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    // Optional: pre-select a course when navigating from /admin/courses
    const preselectedCourseId = searchParams.get('course') ?? '';

    // Data
    const [courses, setCourses] = useState<any[]>([]);
    const [topics, setTopics] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);

    // Selection
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState('');

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

    // Loading / submitting
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [submittingQuestion, setSubmittingQuestion] = useState(false);
    const [submittingTopic, setSubmittingTopic] = useState(false);

    // ── Fetching ──────────────────────────────────────────────────────────────

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
        if (!selectedTopicId) { setQuestions([]); return; }
        (async () => {
            setLoadingQuestions(true);
            const { data } = await getAdminQuestions(selectedTopicId);
            if (data) setQuestions(data);
            setLoadingQuestions(false);
        })();
    }, [selectedTopicId]);

    // ── Topic creation ────────────────────────────────────────────────────────

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
        }
        setSubmittingTopic(false);
    };

    // ── Question creation / editing ──────────────────────────────────────────

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
        // Parse options safely
        let optionsStr = '[]';
        if (typeof q.options === 'string') optionsStr = q.options;
        else if (Array.isArray(q.options)) optionsStr = JSON.stringify(q.options);

        // Parse solution steps from markdown
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
            isPublished: q.isPublished ?? false,
        });
        setEditingQuestionId(q.id);
        setIsCreatingQuestion(true);

        // Scroll to form
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
                isPublished: formData.isPublished,
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
                isPublished: formData.isPublished,
            });
        }

        if (result.success) {
            const { data } = await getAdminQuestions(selectedTopicId);
            if (data) setQuestions(data);
            setIsCreatingQuestion(false);
            setEditingQuestionId(null);
            setFormData(DEFAULT_FORM);
        } else {
            alert(`Failed to ${editingQuestionId ? 'update' : 'create'} question. Please try again.`);
        }
        setSubmittingQuestion(false);
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Delete this question? This cannot be undone.')) return;
        const result = await deleteQuestion(id);
        if (result.success) {
            const { data } = await getAdminQuestions(selectedTopicId);
            if (data) setQuestions(data);
        }
    };

    if (!session) return null;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <div className="p-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Manage Questions
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Select a course with old exams, choose or create a topic, then add questions with step-by-step LaTeX solutions.
                    </p>
                </div>

                {/* ── Step 1: Course selection ── */}
                <section className="mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Step 1 — Select a Course
                    </h2>

                    {loadingCourses ? (
                        <p className="text-zinc-500 text-sm">Loading courses…</p>
                    ) : courses.length === 0 ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-amber-800 dark:text-amber-300 text-sm">
                            No courses available yet. Courses are created automatically when you upload old exams via{' '}
                            <a href="/admin/upload-exam" className="underline font-medium">Upload Exam</a>.
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
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-600'
                                        }`}
                                >
                                    <div className="font-mono font-bold text-zinc-900 dark:text-white text-lg">
                                        {course.code}
                                    </div>
                                    <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                        {course.name}
                                    </div>
                                    {selectedCourse?.id === course.id && (
                                        <div className="mt-1">
                                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
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
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                <Layers className="w-4 h-4" /> Step 2 — Select or Create a Topic
                            </h2>
                            {!isCreatingTopic && (
                                <button
                                    onClick={() => setIsCreatingTopic(true)}
                                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    <Plus className="w-3 h-3" /> New Topic
                                </button>
                            )}
                        </div>

                        {/* New topic form */}
                        {isCreatingTopic && (
                            <form
                                onSubmit={handleCreateTopic}
                                className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-4 space-y-3"
                            >
                                <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                                    Create new topic for {selectedCourse.code}
                                </h3>
                                <input
                                    type="text"
                                    value={newTopicTitle}
                                    onChange={e => setNewTopicTitle(e.target.value)}
                                    placeholder="Topic title (e.g. Matrix Inversion)"
                                    required
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                                />
                                <textarea
                                    value={newTopicDesc}
                                    onChange={e => setNewTopicDesc(e.target.value)}
                                    placeholder="Short description (optional)"
                                    rows={2}
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm resize-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={submittingTopic || !newTopicTitle.trim()}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
                                    >
                                        {submittingTopic ? 'Creating…' : 'Create Topic'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingTopic(false)}
                                        className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Topic list */}
                        {loadingTopics ? (
                            <p className="text-zinc-500 text-sm">Loading topics…</p>
                        ) : topics.length === 0 ? (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                                No topics for this course yet. Create one above.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {topics.map(topic => (
                                    <button
                                        key={topic.id}
                                        onClick={() => {
                                            setSelectedTopicId(topic.id);
                                            setIsCreatingQuestion(false);
                                        }}
                                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedTopicId === topic.id
                                            ? 'border-blue-500 bg-blue-600 text-white'
                                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                                            }`}
                                    >
                                        {topic.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ── Step 3: Questions ── */}
                {selectedTopicId && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                <HelpCircle className="w-4 h-4" /> Step 3 — Questions
                                {questions.length > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs text-zinc-600 dark:text-zinc-400">
                                        {questions.length}
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
                                    <Plus className="w-4 h-4" /> Add Question
                                </button>
                            )}
                        </div>

                        {/* ── Question creation form ── */}
                        {isCreatingQuestion && (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                                        {editingQuestionId ? 'Edit Question' : 'New Question'}
                                    </h3>
                                    <button
                                        onClick={() => { setIsCreatingQuestion(false); setFormData(DEFAULT_FORM); setEditingQuestionId(null); }}
                                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmitQuestion} className="space-y-6">

                                    {/* Question content */}
                                    <LatexEditor
                                        label="Question Text (Markdown + LaTeX)"
                                        hint="Use $$...$$ for block equations and $...$ for inline math."
                                        value={formData.contentMarkdown}
                                        onChange={v => setFormData(f => ({ ...f, contentMarkdown: v }))}
                                        placeholder={"Solve the system of equations:\n$$\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}$$"}
                                        rows={6}
                                    />

                                    {/* Question type & difficulty */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                Question Type
                                            </label>
                                            <select
                                                value={formData.questionType}
                                                onChange={e => setFormData(f => ({ ...f, questionType: e.target.value }))}
                                                className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                                            >
                                                <option value="multiple_choice">Multiple Choice</option>
                                                <option value="numeric">Numeric Answer</option>
                                                <option value="free_response">Free Response</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                Correct Answer
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.correctAnswer}
                                                onChange={e => setFormData(f => ({ ...f, correctAnswer: e.target.value }))}
                                                required
                                                placeholder="e.g. Option A, or 3.14"
                                                className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                Difficulty
                                            </label>
                                            <select
                                                value={formData.difficultyTier}
                                                onChange={e => setFormData(f => ({ ...f, difficultyTier: Number(e.target.value) }))}
                                                className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                                            >
                                                <option value={1}>1 – Beginner</option>
                                                <option value={2}>2 – Easy</option>
                                                <option value={3}>3 – Intermediate</option>
                                                <option value={4}>4 – Hard</option>
                                                <option value={5}>5 – Expert</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Multiple choice options */}
                                    {formData.questionType === 'multiple_choice' && (
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                Answer Options (JSON array — LaTeX allowed inside strings)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.options}
                                                onChange={e => setFormData(f => ({ ...f, options: e.target.value }))}
                                                placeholder='["$x=2$", "$x=3$", "$x=-1$", "$x=0$"]'
                                                className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm"
                                            />
                                        </div>
                                    )}

                                    {/* Step-by-step solution */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                Step-by-Step Solution (Markdown + LaTeX)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={addStep}
                                                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                <Plus className="w-3 h-3" /> Add Step
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {formData.solutionSteps.map((step, index) => (
                                                <div key={index} className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <input
                                                            type="text"
                                                            value={step.label}
                                                            onChange={e => updateStep(index, 'label', e.target.value)}
                                                            className="w-32 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-semibold"
                                                        />
                                                        <ArrowRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                                                        <span className="text-xs text-zinc-500 flex-1">Describe what to do in this step</span>
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
                                                        placeholder={"Multiply both sides by 2:\n$$2 \\cdot \\frac{x}{2} = 2 \\cdot 3$$\nSo $x = 6$."}
                                                        rows={4}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Publishing Options */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isPublished"
                                            checked={formData.isPublished}
                                            onChange={e => setFormData(f => ({ ...f, isPublished: e.target.checked }))}
                                            className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500"
                                        />
                                        <label htmlFor="isPublished" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 select-none">
                                            Publish Question (Visible to Students)
                                        </label>
                                    </div>

                                    {/* Submit */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                        <button
                                            type="button"
                                            onClick={() => { setIsCreatingQuestion(false); setFormData(DEFAULT_FORM); setEditingQuestionId(null); }}
                                            className="px-4 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submittingQuestion}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 transition-colors"
                                        >
                                            {submittingQuestion ? 'Saving…' : 'Save Question'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ── Question list ── */}
                        {loadingQuestions ? (
                            <p className="text-zinc-500 text-sm text-center py-8">Loading questions…</p>
                        ) : questions.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <HelpCircle className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                                <p className="text-zinc-500 dark:text-zinc-400">No questions in this topic yet.</p>
                                {!isCreatingQuestion && (
                                    <button
                                        onClick={() => setIsCreatingQuestion(true)}
                                        className="mt-3 text-blue-600 hover:underline text-sm"
                                    >
                                        Add the first question
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {questions.map(q => (
                                    <div
                                        key={q.id}
                                        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                                    >
                                        {/* Question header */}
                                        <div className="flex items-start justify-between p-5">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.difficultyTier <= 2
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : q.difficultyTier === 3
                                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        Tier {q.difficultyTier}
                                                    </span>
                                                    <span className="text-xs text-zinc-400 uppercase tracking-wide">
                                                        {q.questionType.replace('_', ' ')}
                                                    </span>
                                                    {q.isPublished ? (
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                            Published
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                                            Draft
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="prose dark:prose-invert max-w-none text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2">
                                                    <MathRenderer content={q.contentMarkdown} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                                {q.explanationMarkdown && (
                                                    <button
                                                        onClick={() =>
                                                            setExpandedQuestionId(prev =>
                                                                prev === q.id ? null : q.id
                                                            )
                                                        }
                                                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    >
                                                        <ChevronDown
                                                            className={`w-4 h-4 transition-transform ${expandedQuestionId === q.id ? 'rotate-180' : ''}`}
                                                        />
                                                        Solution
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEditQuestion(q)}
                                                    className="text-zinc-400 hover:text-blue-500 transition-colors ml-1"
                                                    title="Edit question"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    className="text-zinc-400 hover:text-red-500 transition-colors ml-1"
                                                    title="Delete question"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded solution */}
                                        {expandedQuestionId === q.id && q.explanationMarkdown && (
                                            <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5">
                                                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                                                    Step-by-Step Solution
                                                </p>
                                                <div className="prose dark:prose-invert max-w-none text-sm">
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
