'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import {
    getAdminCourseTopics,
    syncAITopics,
    updateTopic,
    deleteTopic,
    reorderTopics,
} from '@/app/actions/admin-topics';
import type { AdminTopic } from '@/app/actions/admin-topics';
import { createTopic } from '@/app/actions/admin-questions';
import {
    Sparkles,
    Plus,
    Trash2,
    Edit,
    X,
    Check,
    ChevronDown,
    ChevronUp,
    Loader2,
    ArrowLeft,
    BookOpen,
    Brain,
    Layers,
    Target,
    HelpCircle,
    GripVertical,
    AlertTriangle,
    Lightbulb,
    Save,
} from 'lucide-react';

// ── Phase config ─────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    foundation: { label: 'Grundläggande', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    core: { label: 'Kärna', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    advanced: { label: 'Fördjupning', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
    easy: { label: 'Lätt', color: 'text-emerald-600' },
    medium: { label: 'Medel', color: 'text-amber-600' },
    hard: { label: 'Svår', color: 'text-red-600' },
};

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCourseTopicsPage() {
    const { data: session } = useSession();
    const params = useParams();
    const courseId = params.courseId as string;

    const [allTopics, setAllTopics] = useState<AdminTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        title: string;
        description: string;
        phase: string;
        aiDifficulty: string;
    }>({ title: '', description: '', phase: 'core', aiDifficulty: 'medium' });
    const [saving, setSaving] = useState(false);

    // Create state
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPhase, setNewPhase] = useState('core');
    const [creating, setCreating] = useState(false);

    // Expanded details
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Group topics by phase
    const groupedTopics: Record<string, AdminTopic[]> = { foundation: [], core: [], advanced: [] };
    for (const t of allTopics) {
        const phase = t.phase || 'core';
        if (!groupedTopics[phase]) groupedTopics[phase] = [];
        groupedTopics[phase].push(t);
    }

    // ── Fetching ─────────────────────────────────────────────────────────────

    const refresh = useCallback(async () => {
        const result = await getAdminCourseTopics(courseId);
        if (result.success) setAllTopics(result.topics);
        setLoading(false);
    }, [courseId]);

    useEffect(() => { refresh(); }, [refresh]);

    // ── Sync AI topics ───────────────────────────────────────────────────────

    const handleSync = async () => {
        setSyncing(true);
        setSyncResult(null);
        const result = await syncAITopics(courseId);
        if (result.success) {
            setSyncResult(`Synkade ${result.total} ämnen (${result.imported} nya, ${result.updated} uppdaterade)`);
            await refresh();
        } else {
            setSyncResult(`Fel: ${result.error}`);
        }
        setSyncing(false);
    };

    // ── Create topic ─────────────────────────────────────────────────────────

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setCreating(true);
        const result = await createTopic({
            courseId,
            title: newTitle.trim(),
            description: newDesc.trim() || undefined,
        });
        if (result.success && result.data) {
            // Update the phase for the new topic
            await updateTopic(result.data.id, { phase: newPhase });
            await refresh();
            setNewTitle('');
            setNewDesc('');
            setIsCreating(false);
        } else if (!result.success) {
            alert(result.error);
        }
        setCreating(false);
    };

    // ── Edit topic ───────────────────────────────────────────────────────────

    const startEdit = (t: AdminTopic) => {
        setEditingId(t.id);
        setEditForm({
            title: t.title,
            description: t.description ?? '',
            phase: t.phase || 'core',
            aiDifficulty: t.aiDifficulty || 'medium',
        });
    };

    const handleSave = async () => {
        if (!editingId) return;
        setSaving(true);
        await updateTopic(editingId, {
            title: editForm.title,
            description: editForm.description,
            phase: editForm.phase,
            aiDifficulty: editForm.aiDifficulty,
        });
        await refresh();
        setEditingId(null);
        setSaving(false);
    };

    // ── Delete topic ─────────────────────────────────────────────────────────

    const handleDelete = async (id: string, title: string, questionCount: number) => {
        const msg = questionCount > 0
            ? `Ta bort "${title}"? Den har ${questionCount} frågor som också tas bort. Detta kan inte ångras.`
            : `Ta bort "${title}"? Detta kan inte ångras.`;
        if (!confirm(msg)) return;
        await deleteTopic(id);
        await refresh();
    };

    // ── Move topic (reorder) ─────────────────────────────────────────────────

    const moveTopic = async (topicId: string, direction: 'up' | 'down') => {
        const topic = allTopics.find(t => t.id === topicId);
        if (!topic) return;
        const phase = topic.phase || 'core';
        const phaseTopics = groupedTopics[phase] || [];
        const idx = phaseTopics.findIndex(t => t.id === topicId);
        if (idx === -1) return;
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === phaseTopics.length - 1) return;

        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        const updates = [
            { id: phaseTopics[idx].id, sortOrder: phaseTopics[swapIdx].sortOrder ?? swapIdx },
            { id: phaseTopics[swapIdx].id, sortOrder: phaseTopics[idx].sortOrder ?? idx },
        ];
        await reorderTopics(updates);
        await refresh();
    };

    if (!session) return null;

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <div className="p-8 max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/admin/courses"
                        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-blue-600 mb-3 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till kurser
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                        Hantera ämnen
                    </h1>
                    <p className="text-zinc-600">
                        Redigera, ta bort och sortera ämnen. Synka AI-ämnen från tentaanalys eller skapa nya manuellt.
                    </p>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                        {syncing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        Synka AI-ämnen från tenta
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nytt ämne
                    </button>
                    <span className="text-sm text-zinc-500 ml-auto">
                        {allTopics.length} ämne{allTopics.length !== 1 ? 'n' : ''}
                    </span>
                </div>

                {/* Sync result message */}
                {syncResult && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${
                        syncResult.startsWith('Fel')
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                        {syncResult}
                    </div>
                )}

                {/* Create form */}
                {isCreating && (
                    <form onSubmit={handleCreate} className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-blue-900 text-sm">Skapa nytt ämne</h3>
                            <button type="button" onClick={() => setIsCreating(false)} className="text-zinc-400 hover:text-zinc-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Ämnesnamn"
                                required
                                className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm"
                            />
                            <select
                                value={newPhase}
                                onChange={e => setNewPhase(e.target.value)}
                                className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm"
                            >
                                <option value="foundation">Grundläggande</option>
                                <option value="core">Kärna</option>
                                <option value="advanced">Fördjupning</option>
                            </select>
                        </div>
                        <textarea
                            value={newDesc}
                            onChange={e => setNewDesc(e.target.value)}
                            placeholder="Beskrivning (valfritt)"
                            rows={2}
                            className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm resize-none"
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={creating || !newTitle.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
                            >
                                {creating ? 'Skapar...' : 'Skapa ämne'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg text-sm"
                            >
                                Avbryt
                            </button>
                        </div>
                    </form>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="text-center py-16 text-zinc-500">Laddar ämnen...</div>
                ) : allTopics.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-zinc-200">
                        <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Inga ämnen</h3>
                        <p className="text-zinc-500 text-sm mb-4">
                            Synka AI-ämnen från tentaanalys eller skapa nya manuellt.
                        </p>
                    </div>
                ) : (
                    /* Phase groups */
                    (['foundation', 'core', 'advanced'] as const).map(phase => {
                        const phaseTopics = groupedTopics[phase];
                        if (!phaseTopics || phaseTopics.length === 0) return null;
                        const config = PHASE_CONFIG[phase];

                        return (
                            <div key={phase} className="mb-8">
                                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${config.bg} border ${config.border}`}>
                                    {phase === 'foundation' && <Layers className={`w-4 h-4 ${config.color}`} />}
                                    {phase === 'core' && <Target className={`w-4 h-4 ${config.color}`} />}
                                    {phase === 'advanced' && <Brain className={`w-4 h-4 ${config.color}`} />}
                                    <h2 className={`text-sm font-semibold uppercase tracking-widest ${config.color}`}>
                                        {config.label}
                                    </h2>
                                    <span className="text-xs text-zinc-500 ml-auto">{phaseTopics.length} ämnen</span>
                                </div>

                                <div className="space-y-2">
                                    {phaseTopics.map((t, idx) => (
                                        <div
                                            key={t.id}
                                            className="bg-white border border-zinc-200 rounded-xl overflow-hidden"
                                        >
                                            {/* Topic row */}
                                            {editingId === t.id ? (
                                                /* Edit mode */
                                                <div className="p-4 space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <input
                                                            type="text"
                                                            value={editForm.title}
                                                            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                                            className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm font-semibold"
                                                        />
                                                        <select
                                                            value={editForm.phase}
                                                            onChange={e => setEditForm(f => ({ ...f, phase: e.target.value }))}
                                                            className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm"
                                                        >
                                                            <option value="foundation">Grundläggande</option>
                                                            <option value="core">Kärna</option>
                                                            <option value="advanced">Fördjupning</option>
                                                        </select>
                                                        <select
                                                            value={editForm.aiDifficulty}
                                                            onChange={e => setEditForm(f => ({ ...f, aiDifficulty: e.target.value }))}
                                                            className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm"
                                                        >
                                                            <option value="easy">Lätt</option>
                                                            <option value="medium">Medel</option>
                                                            <option value="hard">Svår</option>
                                                        </select>
                                                    </div>
                                                    <textarea
                                                        value={editForm.description}
                                                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                                        rows={2}
                                                        placeholder="Beskrivning"
                                                        className="w-full p-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm resize-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleSave}
                                                            disabled={saving}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs disabled:opacity-50"
                                                        >
                                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                            Spara
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg text-xs"
                                                        >
                                                            Avbryt
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Display mode */
                                                <div className="flex items-center gap-3 p-4">
                                                    {/* Reorder buttons */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <button
                                                            onClick={() => moveTopic(t.id, 'up')}
                                                            disabled={idx === 0}
                                                            className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30"
                                                        >
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => moveTopic(t.id, 'down')}
                                                            disabled={idx === phaseTopics.length - 1}
                                                            className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30"
                                                        >
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Topic info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                            <h3 className="font-semibold text-zinc-900 text-sm">{t.title}</h3>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                                t.source === 'ai'
                                                                    ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                                                    : 'bg-zinc-100 text-zinc-500'
                                                            }`}>
                                                                {t.source === 'ai' ? 'AI' : 'Manuell'}
                                                            </span>
                                                            {t.aiDifficulty && (
                                                                <span className={`text-[10px] ${DIFFICULTY_CONFIG[t.aiDifficulty]?.color ?? 'text-zinc-500'}`}>
                                                                    {DIFFICULTY_CONFIG[t.aiDifficulty]?.label ?? t.aiDifficulty}
                                                                </span>
                                                            )}
                                                            {t.examFrequency && (
                                                                <span className="text-[10px] text-zinc-400">{t.examFrequency}</span>
                                                            )}
                                                        </div>
                                                        {t.description && (
                                                            <p className="text-xs text-zinc-500 line-clamp-1">{t.description}</p>
                                                        )}
                                                    </div>

                                                    {/* Question count */}
                                                    <Link
                                                        href={`/admin/questions?course=${courseId}`}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs text-zinc-600 transition-colors"
                                                    >
                                                        <HelpCircle className="w-3 h-3" />
                                                        {t.questionCount} frågor
                                                    </Link>

                                                    {/* Expand */}
                                                    {(t.studyTips?.length || t.commonMistakes?.length) && (
                                                        <button
                                                            onClick={() => setExpandedId(prev => prev === t.id ? null : t.id)}
                                                            className="text-zinc-400 hover:text-zinc-600"
                                                        >
                                                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === t.id ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    )}

                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => startEdit(t)}
                                                        className="text-zinc-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(t.id, t.title, t.questionCount)}
                                                        className="text-zinc-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Expanded details */}
                                            {expandedId === t.id && (
                                                <div className="border-t border-zinc-100 bg-zinc-50 p-4 space-y-3">
                                                    {t.studyTips && t.studyTips.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                                                                <Lightbulb className="w-3 h-3" /> Studietips
                                                            </p>
                                                            <ul className="space-y-1">
                                                                {t.studyTips.map((tip, i) => (
                                                                    <li key={i} className="text-xs text-zinc-600 flex items-start gap-1.5">
                                                                        <span className="text-emerald-500 mt-0.5">-</span>
                                                                        {tip}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {t.commonMistakes && t.commonMistakes.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                                                                <AlertTriangle className="w-3 h-3" /> Vanliga misstag
                                                            </p>
                                                            <ul className="space-y-1">
                                                                {t.commonMistakes.map((mistake, i) => (
                                                                    <li key={i} className="text-xs text-zinc-600 flex items-start gap-1.5">
                                                                        <span className="text-amber-500 mt-0.5">-</span>
                                                                        {mistake}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {t.examSections && t.examSections.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Tentadelar</p>
                                                            <div className="flex gap-1">
                                                                {t.examSections.map(s => (
                                                                    <span key={s} className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-xs text-zinc-600">
                                                                        {s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </AdminLayout>
    );
}
