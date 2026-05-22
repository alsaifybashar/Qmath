'use client';

/**
 * QuickAddOverlay
 *
 * Three-screen modal for capturing a flashcard from anywhere on the site:
 *   1. Capture  — front/back inputs, AI draft, optional image-occlusion
 *   2. Confirm  — read-only preview before saving
 *   3. Saved    — confetti + "Skapat!" then auto-close
 *
 * Notes:
 *  - Custom modal (no UI lib in this repo) with keyboard escape and a
 *    minimal tab-cycle focus trap.
 *  - All animations are gated on `useReducedMotion`.
 *  - Image storage: v1 stores image as base64 data URL on the card row.
 *    Acceptable while card volume is low; switch to file storage for v2.
 */

import React, {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    motion,
    AnimatePresence,
    useReducedMotion,
} from 'framer-motion';
import {
    ImagePlus,
    Loader2,
    Sparkles,
    X,
    ChevronRight,
    ChevronLeft,
    Layers,
    Zap,
    PenLine,
    Check,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import {
    createFlashcard,
    draftFlashcardsFromContext,
    type FlashcardSourceContextType,
    type FlashcardType,
    type OcclusionMask,
} from '@/app/actions/flashcards';
import ImageOcclusionEditor from './ImageOcclusionEditor';
import ImageOcclusionCard from './ImageOcclusionCard';
import MilestoneCelebration from '@/components/analytics/MilestoneCelebration';

const InlineMath = dynamic(
    () => import('react-katex').then(m => m.InlineMath),
    { ssr: false },
);

const MAX_IMAGE_BYTES = 1_200_000; // ~1.2 MB after base64 — keeps DB rows sane

export interface QuickAddContext {
    contextType: FlashcardSourceContextType;
    sourceContextId?: string;
    topicId?: string;
    topicName?: string;
    /** Pre-fill text (e.g. the question stem). */
    prefillFront?: string;
}

interface QuickAddOverlayProps {
    open: boolean;
    onClose: () => void;
    context: QuickAddContext;
}

type Screen = 'capture' | 'confirm' | 'saved';

export default function QuickAddOverlay({
    open,
    onClose,
    context,
}: QuickAddOverlayProps) {
    const titleId = useId();
    const reduceMotion = useReducedMotion();
    const dialogRef = useRef<HTMLDivElement | null>(null);

    const [screen, setScreen] = useState<Screen>('capture');
    const [cardType, setCardType] = useState<FlashcardType>('basic');
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [frontMath, setFrontMath] = useState('');
    const [backMath, setBackMath] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [masks, setMasks] = useState<OcclusionMask[]>([]);
    const [aiBusy, setAiBusy] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Reset state when the overlay opens
    useEffect(() => {
        if (!open) return;
        setScreen('capture');
        setCardType('basic');
        setFront(context.prefillFront ?? '');
        setBack('');
        setFrontMath('');
        setBackMath('');
        setImageUrl(null);
        setMasks([]);
        setAiBusy(false);
        setAiError(null);
        setSaving(false);
        setSaveError(null);
    }, [open, context.prefillFront]);

    // Escape to close
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Focus the dialog when it opens
    useEffect(() => {
        if (open) {
            const t = setTimeout(() => {
                dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
            }, 30);
            return () => clearTimeout(t);
        }
    }, [open]);

    // Minimal tab-cycle focus trap
    const onKeyDownDialog = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key !== 'Tab') return;
            const root = dialogRef.current;
            if (!root) return;
            const focusables = root.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        },
        [],
    );

    const isCaptureValid = useMemo(() => {
        if (cardType === 'basic') return front.trim().length > 0 && back.trim().length > 0;
        return !!imageUrl && masks.length > 0;
    }, [cardType, front, back, imageUrl, masks]);

    const handleImageFile = useCallback(async (file: File) => {
        if (file.size > MAX_IMAGE_BYTES) {
            setSaveError('Bilden är för stor. Välj en under ~1 MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setImageUrl(typeof reader.result === 'string' ? reader.result : null);
            setMasks([]);
        };
        reader.readAsDataURL(file);
    }, []);

    const onAiDraft = useCallback(async () => {
        setAiBusy(true);
        setAiError(null);
        try {
            const snippet = [front, back, context.prefillFront ?? '']
                .filter(Boolean)
                .join('\n')
                .trim();
            const drafts = await draftFlashcardsFromContext({
                snippet,
                topicName: context.topicName,
                contextType: 'ai_draft',
                maxDrafts: 1,
            });
            const draft = drafts[0];
            if (!draft) {
                setAiError('AI:n kom inte med något användbart utkast.');
            } else {
                if (draft.front) setFront(draft.front);
                if (draft.back) setBack(draft.back);
                setFrontMath(draft.frontMath ?? '');
                setBackMath(draft.backMath ?? '');
            }
        } catch (err) {
            console.error(err);
            setAiError('Något gick fel när AI:n skulle skissa kortet.');
        } finally {
            setAiBusy(false);
        }
    }, [front, back, context.prefillFront, context.topicName]);

    const onSave = useCallback(async () => {
        setSaving(true);
        setSaveError(null);
        try {
            await createFlashcard({
                type: cardType,
                topicId: context.topicId,
                front: front.trim() || undefined,
                back: back.trim() || undefined,
                frontMath: frontMath.trim() || null,
                backMath: backMath.trim() || null,
                imageUrl: cardType === 'image_occlusion' ? imageUrl ?? undefined : undefined,
                occlusionMasks: cardType === 'image_occlusion' ? masks : undefined,
                sourceContextType: context.contextType,
                sourceContextId: context.sourceContextId,
            });
            setScreen('saved');
        } catch (err) {
            console.error(err);
            setSaveError('Kunde inte spara kortet. Försök igen.');
        } finally {
            setSaving(false);
        }
    }, [cardType, context, front, back, frontMath, backMath, imageUrl, masks]);

    // After 'saved' screen mounts, auto-close after a short celebration
    useEffect(() => {
        if (screen !== 'saved') return;
        const t = setTimeout(() => {
            onClose();
        }, 1500);
        return () => clearTimeout(t);
    }, [screen, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[60] flex items-center justify-center px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    aria-hidden={false}
                >
                    {/* Backdrop */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Stäng"
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        onKeyDown={onKeyDownDialog}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 18 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                        transition={
                            reduceMotion
                                ? { duration: 0.15 }
                                : { type: 'spring', damping: 24, stiffness: 260 }
                        }
                        className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950/85 text-white shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-400/15 text-violet-100 shadow-lg shadow-violet-500/20">
                                <Layers className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 id={titleId} className="truncate text-base font-bold">
                                    {screen === 'saved' ? 'Skapat!' : 'Snabbt flashcard'}
                                </h2>
                                <p className="truncate text-xs text-white/55">
                                    {context.topicName
                                        ? `Kopplas till ${context.topicName}`
                                        : 'Sparas i din standardkortlek'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
                                aria-label="Stäng"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Screens */}
                        {screen === 'capture' && (
                            <CaptureScreen
                                cardType={cardType}
                                setCardType={setCardType}
                                front={front}
                                setFront={setFront}
                                back={back}
                                setBack={setBack}
                                frontMath={frontMath}
                                setFrontMath={setFrontMath}
                                backMath={backMath}
                                setBackMath={setBackMath}
                                imageUrl={imageUrl}
                                setImageUrl={setImageUrl}
                                masks={masks}
                                setMasks={setMasks}
                                onImageFile={handleImageFile}
                                onAiDraft={onAiDraft}
                                aiBusy={aiBusy}
                                aiError={aiError}
                                isValid={isCaptureValid}
                                onNext={() => setScreen('confirm')}
                            />
                        )}

                        {screen === 'confirm' && (
                            <ConfirmScreen
                                cardType={cardType}
                                front={front}
                                back={back}
                                frontMath={frontMath}
                                backMath={backMath}
                                imageUrl={imageUrl}
                                masks={masks}
                                saving={saving}
                                saveError={saveError}
                                onBack={() => setScreen('capture')}
                                onSave={onSave}
                            />
                        )}

                        {screen === 'saved' && <SavedScreen />}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Capture screen
// ─────────────────────────────────────────────────────────────────────────────

interface CaptureScreenProps {
    cardType: FlashcardType;
    setCardType: (t: FlashcardType) => void;
    front: string;
    setFront: (s: string) => void;
    back: string;
    setBack: (s: string) => void;
    frontMath: string;
    setFrontMath: (s: string) => void;
    backMath: string;
    setBackMath: (s: string) => void;
    imageUrl: string | null;
    setImageUrl: (u: string | null) => void;
    masks: OcclusionMask[];
    setMasks: (m: OcclusionMask[]) => void;
    onImageFile: (f: File) => void;
    onAiDraft: () => void;
    aiBusy: boolean;
    aiError: string | null;
    isValid: boolean;
    onNext: () => void;
}

function CaptureScreen(p: CaptureScreenProps) {
    return (
        <div className="space-y-4 px-5 py-5">
            {/* Card-type tabs */}
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs font-bold">
                <button
                    type="button"
                    onClick={() => p.setCardType('basic')}
                    data-autofocus={p.cardType === 'basic' ? true : undefined}
                    className={`rounded-lg px-3 py-1.5 transition ${
                        p.cardType === 'basic'
                            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow'
                            : 'text-white/55 hover:text-white'
                    }`}
                >
                    Grund
                </button>
                <button
                    type="button"
                    onClick={() => p.setCardType('image_occlusion')}
                    data-autofocus={p.cardType === 'image_occlusion' ? true : undefined}
                    className={`rounded-lg px-3 py-1.5 transition ${
                        p.cardType === 'image_occlusion'
                            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow'
                            : 'text-white/55 hover:text-white'
                    }`}
                >
                    Bild med dolda områden
                </button>
            </div>

            {p.cardType === 'basic' ? (
                <BasicCapture
                    front={p.front}
                    setFront={p.setFront}
                    back={p.back}
                    setBack={p.setBack}
                    frontMath={p.frontMath}
                    setFrontMath={p.setFrontMath}
                    backMath={p.backMath}
                    setBackMath={p.setBackMath}
                />
            ) : (
                <ImageCapture
                    imageUrl={p.imageUrl}
                    setImageUrl={p.setImageUrl}
                    masks={p.masks}
                    setMasks={p.setMasks}
                    onImageFile={p.onImageFile}
                    front={p.front}
                    setFront={p.setFront}
                />
            )}

            {/* AI draft */}
            <div className="rounded-xl border border-violet-300/20 bg-violet-400/10 p-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-violet-100">
                        <Sparkles className="h-3.5 w-3.5" />
                        Be om utkast från AI
                    </span>
                    <button
                        type="button"
                        onClick={p.onAiDraft}
                        disabled={p.aiBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-bold text-zinc-900 transition hover:bg-violet-100 disabled:opacity-50"
                    >
                        {p.aiBusy ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" /> Tänker…
                            </>
                        ) : (
                            <>
                                <Zap className="h-3 w-3" /> Skissa
                            </>
                        )}
                    </button>
                </div>
                {p.aiError && (
                    <p className="mt-2 text-amber-200">{p.aiError}</p>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                <button
                    type="button"
                    onClick={p.onNext}
                    disabled={!p.isValid}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-400 px-4 py-2 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-105 disabled:opacity-40"
                >
                    Granska
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function BasicCapture(p: {
    front: string;
    setFront: (s: string) => void;
    back: string;
    setBack: (s: string) => void;
    frontMath: string;
    setFrontMath: (s: string) => void;
    backMath: string;
    setBackMath: (s: string) => void;
}) {
    return (
        <div className="space-y-3">
            <FieldGroup
                label="Front (fråga)"
                math={p.frontMath}
                setMath={p.setFrontMath}
            >
                <textarea
                    value={p.front}
                    onChange={e => p.setFront(e.target.value)}
                    placeholder="Vad ska du fråga dig själv?"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-violet-300/50 focus:outline-none"
                />
            </FieldGroup>

            <FieldGroup
                label="Back (svar)"
                math={p.backMath}
                setMath={p.setBackMath}
            >
                <textarea
                    value={p.back}
                    onChange={e => p.setBack(e.target.value)}
                    placeholder="Det korta, exakta svaret."
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-violet-300/50 focus:outline-none"
                />
            </FieldGroup>
        </div>
    );
}

function FieldGroup({
    label,
    children,
    math,
    setMath,
}: {
    label: string;
    children: React.ReactNode;
    math: string;
    setMath: (s: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-white/55">
                <span className="inline-flex items-center gap-1.5">
                    <PenLine className="h-3 w-3" /> {label}
                </span>
            </div>
            {children}
            <input
                type="text"
                value={math}
                onChange={e => setMath(e.target.value)}
                placeholder="LaTeX (frivilligt) — t.ex. \\frac{d}{dx}\\sin x = \\cos x"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[12px] text-white placeholder:text-white/30 focus:border-violet-300/50 focus:outline-none"
            />
            {math.trim() && (
                <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm">
                    <KatexSafe math={math} />
                </div>
            )}
        </div>
    );
}

function KatexSafe({ math }: { math: string }) {
    // KaTeX renders its own inline error message when the source is invalid,
    // so we don't need an outer guard. (Wrapping JSX in try/catch would not
    // catch render errors anyway — that requires an error boundary.)
    return <InlineMath math={math} />;
}

function ImageCapture(p: {
    imageUrl: string | null;
    setImageUrl: (u: string | null) => void;
    masks: OcclusionMask[];
    setMasks: (m: OcclusionMask[]) => void;
    onImageFile: (f: File) => void;
    front: string;
    setFront: (s: string) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    return (
        <div className="space-y-3">
            <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-white/55">
                    Caption (frivilligt)
                </label>
                <input
                    type="text"
                    value={p.front}
                    onChange={e => p.setFront(e.target.value)}
                    placeholder="T.ex. Bode-diagram — markera asymptoter"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-violet-300/50 focus:outline-none"
                />
            </div>

            {!p.imageUrl ? (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/15 bg-white/[0.03] px-3 py-8 text-sm text-white/65 transition hover:border-violet-300/40 hover:text-white"
                >
                    <ImagePlus className="h-4 w-4" />
                    Välj en bild att maskera
                </button>
            ) : (
                <ImageOcclusionEditor
                    imageUrl={p.imageUrl}
                    masks={p.masks}
                    onChange={p.setMasks}
                />
            )}

            {p.imageUrl && (
                <button
                    type="button"
                    onClick={() => {
                        p.setImageUrl(null);
                        p.setMasks([]);
                    }}
                    className="text-xs text-white/55 hover:text-white"
                >
                    Byt bild
                </button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) p.onImageFile(f);
                }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm screen
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmScreen(p: {
    cardType: FlashcardType;
    front: string;
    back: string;
    frontMath: string;
    backMath: string;
    imageUrl: string | null;
    masks: OcclusionMask[];
    saving: boolean;
    saveError: string | null;
    onBack: () => void;
    onSave: () => void;
}) {
    return (
        <div className="space-y-4 px-5 py-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/45">
                    Front
                </div>
                {p.cardType === 'image_occlusion' && p.imageUrl ? (
                    <div className="space-y-2">
                        {p.front && <p className="text-sm text-white/85">{p.front}</p>}
                        <ImageOcclusionCard
                            imageUrl={p.imageUrl}
                            masks={p.masks}
                            revealed={false}
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {p.front && <p className="text-base font-medium text-white">{p.front}</p>}
                        {p.frontMath && (
                            <div className="rounded-md bg-black/30 px-3 py-2 text-sm">
                                <KatexSafe math={p.frontMath} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/45">
                    Back
                </div>
                {p.cardType === 'image_occlusion' && p.imageUrl ? (
                    <ImageOcclusionCard
                        imageUrl={p.imageUrl}
                        masks={p.masks}
                        revealed={true}
                    />
                ) : (
                    <div className="space-y-2">
                        {p.back && <p className="text-base font-medium text-white">{p.back}</p>}
                        {p.backMath && (
                            <div className="rounded-md bg-black/30 px-3 py-2 text-sm">
                                <KatexSafe math={p.backMath} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-100">
                <Sparkles className="h-3 w-3" />
                +5 XP när du sparar
            </div>

            {p.saveError && (
                <p className="text-sm text-amber-300">{p.saveError}</p>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-4">
                <button
                    type="button"
                    onClick={p.onBack}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/65 hover:text-white"
                >
                    <ChevronLeft className="h-4 w-4" /> Redigera
                </button>
                <button
                    type="button"
                    onClick={p.onSave}
                    disabled={p.saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-zinc-950 shadow-lg transition hover:bg-emerald-100 disabled:opacity-50"
                >
                    {p.saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Sparar…
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4" /> Spara kortet
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Saved screen
// ─────────────────────────────────────────────────────────────────────────────

function SavedScreen() {
    return (
        <div className="relative flex flex-col items-center justify-center px-5 py-10 text-center">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 240 }}
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 shadow-lg shadow-emerald-500/30"
            >
                <Check className="h-8 w-8 text-zinc-950" />
            </motion.div>
            <h3 className="text-xl font-bold">Skapat!</h3>
            <p className="mt-1 text-sm text-white/65">
                Kortet är schemalagt för repetition. +5 XP.
            </p>
            <MilestoneCelebration trigger={true} />
        </div>
    );
}
