'use server';

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { db } from '@/db/drizzle';
import { courseExamAnalysisCache } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// ============ ANTHROPIC CLIENT ============

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ============ TYPES ============

interface ExamMeta {
    filePath: string;
    solutionFilePath?: string | null;
    year: string;
    type: string;
}

// ── Legacy types (kept for backwards-compat) ──────────────────────────────────
export interface StudyPlanArea {
    name: string;
    importance: number;
    reasoning: string;
    recommended_focus: 'High' | 'Medium' | 'Low';
}

export interface StudyPlanWeek {
    week: number;
    focus: string;
    activity: string;
}

export interface StudyPlanResult {
    areas: StudyPlanArea[];
    study_schedule: StudyPlanWeek[];
    strategy: string;
    cached: boolean;
    generatedAt: string;
    examsAnalyzed: number;
}

// ── New rich exam-analysis types ──────────────────────────────────────────────

/** A single topic area extracted by Claude from reading actual exam PDFs */
export interface AIExamTopic {
    name: string;                                       // e.g. "Egenvärden och egenvektorer"
    importance: number;                                 // 1–10 (10 = appears every exam)
    frequency: string;                                  // Descriptive: "8/10 exams", "every exam"
    examSection: string;                                // e.g. "A", "B", "C", "Del B"
    difficulty: 'easy' | 'medium' | 'hard';
    phase: 'foundation' | 'core' | 'advanced';          // AI-determined learning phase
    reasoning: string;                                  // Why this topic appears + what's tested
    studyTips: string[];                                // 2–3 actionable tips
    commonMistakes: string[];                           // 2–3 common student mistakes
    recommended_focus: 'High' | 'Medium' | 'Low';
}

/** A section/part of the exam as detected by Claude from the PDFs */
export interface AIExamSection {
    id: string;                                         // "A", "B", "C", "I", "II" …
    label: string;                                      // "Del A", "Section I" …
    description: string;                                // What this section tests
    points: number;                                     // Max points for this section
    difficulty: 'easy' | 'medium' | 'hard';
    taskCount: number;                                  // Number of tasks/questions
}

/** Full result from the new generateExamAnalysis() function */
export interface AIExamAnalysisResult {
    examStructure: {
        sections: AIExamSection[];
        totalPoints: number;
        gradingInfo: string;                            // "Grade 3 ≥8p, Grade 4 ≥12p, Grade 5 ≥16p"
    };
    topics: AIExamTopic[];
    strategy: string;                                   // 2–3 sentence overall insight
    cached: boolean;
    generatedAt: string;
    examsAnalyzed: number;
}

// ============ IN-MEMORY CACHE ============

interface CacheEntry {
    data: StudyPlanResult;
}

interface ExamAnalysisCacheEntry {
    data: AIExamAnalysisResult;
}

// No TTL — cache lives until invalidated by a new exam upload
const studyPlanCache = new Map<string, CacheEntry>();
const examAnalysisCache = new Map<string, ExamAnalysisCacheEntry>();

function getCacheKey(courseCode: string, examFingerprint: string): string {
    return `study-plan:${courseCode}:${examFingerprint}`;
}

function getExamAnalysisCacheKey(courseCode: string, examFingerprint: string): string {
    return `exam-analysis:${courseCode}:${examFingerprint}`;
}

function computeExamFingerprint(examData: ExamMeta[]): string {
    const raw = examData.map(e => `${e.filePath}|${e.year}`).sort().join(';');
    return crypto.createHash('md5').update(raw).digest('hex').slice(0, 12);
}

// ============ DB CACHE HELPERS ============
// L2 persistent cache — survives server restarts.
// L1 (in-memory Map) sits in front of this for ultra-fast repeated reads within
// the same Node.js process lifetime.

/**
 * Read a cached AIExamAnalysisResult from SQLite.
 * Returns null on cache miss or parse error.
 */
async function readDbCache(courseCode: string, fingerprint: string): Promise<AIExamAnalysisResult | null> {
    try {
        const rows = await db
            .select()
            .from(courseExamAnalysisCache)
            .where(
                and(
                    eq(courseExamAnalysisCache.courseCode, courseCode),
                    eq(courseExamAnalysisCache.examFingerprint, fingerprint),
                )
            )
            .limit(1);

        if (rows.length === 0) return null;

        const parsed = JSON.parse(rows[0].analysisJson) as AIExamAnalysisResult;
        // Mark as cached so callers know this came from storage
        return { ...parsed, cached: true };
    } catch (err) {
        console.warn('[AI] DB cache read error (non-fatal):', err);
        return null;
    }
}

/**
 * Write (upsert) an AIExamAnalysisResult to SQLite.
 * Replaces any existing row for (courseCode, fingerprint).
 */
async function writeDbCache(
    courseCode: string,
    fingerprint: string,
    result: AIExamAnalysisResult,
): Promise<void> {
    try {
        const json = JSON.stringify(result);

        // SQLite / Drizzle: delete-then-insert (simple upsert pattern for SQLite)
        await db
            .delete(courseExamAnalysisCache)
            .where(
                and(
                    eq(courseExamAnalysisCache.courseCode, courseCode),
                    eq(courseExamAnalysisCache.examFingerprint, fingerprint),
                )
            );

        await db.insert(courseExamAnalysisCache).values({
            courseCode,
            examFingerprint: fingerprint,
            analysisJson: json,
            examsAnalyzed: result.examsAnalyzed,
            updatedAt: new Date(),
        });

        console.log(`[AI] 💾 DB cache written for ${courseCode} (fingerprint: ${fingerprint})`);
    } catch (err) {
        // Non-fatal — we still return the fresh result to the user
        console.warn('[AI] DB cache write error (non-fatal):', err);
    }
}

/**
 * Exported: called by the exam upload route when a new exam is saved.
 * Deletes ALL cached analyses for a courseCode so the next analysis call
 * triggers a fresh Claude API request with the updated exam set.
 */
export async function invalidateExamAnalysisCache(courseCode: string): Promise<void> {
    try {
        await db
            .delete(courseExamAnalysisCache)
            .where(eq(courseExamAnalysisCache.courseCode, courseCode));

        // Also clear L1 in-memory cache entries for this course
        for (const key of examAnalysisCache.keys()) {
            if (key.startsWith(`exam-analysis:${courseCode}:`)) {
                examAnalysisCache.delete(key);
            }
        }

        // Clear legacy study plan cache for this course too
        for (const key of studyPlanCache.keys()) {
            if (key.startsWith(`study-plan:${courseCode}:`)) {
                studyPlanCache.delete(key);
            }
        }

        console.log(`[AI] 🗑️  Cache invalidated for ${courseCode} (DB + memory + study plans)`);
    } catch (err) {
        console.warn('[AI] Cache invalidation error (non-fatal):', err);
    }
}

// ============ CONSTANTS ============

// Rate limit: 30k input tokens/minute
// Each PDF ≈ 3,000–5,000 tokens depending on page count
// Strategy: Send up to 3 exam PDFs + 2 solution PDFs per request = ~15-25k tokens
// This stays safely within the 30k limit in a single batch.
const MAX_EXAM_PDFS_PER_REQUEST = 3;
const MAX_SOLUTION_PDFS_PER_REQUEST = 2;

// ============ NEW: RICH EXAM ANALYSIS ============

/**
 * generateExamAnalysis — sends up to 3 exam PDFs + 2 solution PDFs to Claude,
 * asking it to extract:
 *   1. Exam structure (sections, points, difficulty)
 *   2. All topic areas with importance, phase, tips, mistakes
 *   3. An overall study strategy
 *
 * This is the primary function for the Exam Analysis page.
 * generateStudyPlan() is kept for backwards-compat.
 */
export async function generateExamAnalysis(
    courseName: string,
    courseCode: string,
    examData: ExamMeta[] = []
): Promise<AIExamAnalysisResult> {

    console.log(`[AI] === generateExamAnalysis called ===`);
    console.log(`[AI] Course: ${courseCode} (${courseName})`);
    console.log(`[AI] Exams provided: ${examData.length}`);

    // --- L1: In-memory cache check (ultra-fast, same process) ---
    const fingerprint = computeExamFingerprint(examData);
    const cacheKey = getExamAnalysisCacheKey(courseCode, fingerprint);
    const memCached = examAnalysisCache.get(cacheKey);
    if (memCached) {
        console.log(`[AI] ⚡ L1 memory cache HIT for ${courseCode}`);
        return { ...memCached.data, cached: true };
    }

    // --- L2: DB cache check (survives server restarts) ---
    const dbCached = await readDbCache(courseCode, fingerprint);
    if (dbCached) {
        console.log(`[AI] ⚡ L2 DB cache HIT for ${courseCode} (fingerprint: ${fingerprint})`);
        // Promote to L1 so subsequent requests in this process are instant
        examAnalysisCache.set(cacheKey, {
            data: dbCached,
        });
        return dbCached;
    }

    console.log(`[AI] Cache MISS (L1+L2) for ${courseCode} — calling Claude API`);

    // --- Validate API key ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.warn('[AI] No ANTHROPIC_API_KEY — returning fallback exam analysis');
        return getExamAnalysisFallback(courseCode, 0);
    }

    try {
        // --- Smart PDF selection (same strategy as generateStudyPlan) ---
        const examsToProcess = examData.slice(0, 10);
        const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];
        let loadedExamCount = 0;
        let loadedSolnCount = 0;

        for (const exam of examsToProcess) {
            if (loadedExamCount < MAX_EXAM_PDFS_PER_REQUEST) {
                const block = await loadPdfAsBase64(exam.filePath);
                if (block) {
                    contentBlocks.push({ type: 'text', text: `\n=== EXAM PDF: ${exam.type} (${exam.year}) ===` });
                    contentBlocks.push(block);
                    loadedExamCount++;
                }
                if (exam.solutionFilePath && loadedSolnCount < MAX_SOLUTION_PDFS_PER_REQUEST) {
                    const solBlock = await loadPdfAsBase64(exam.solutionFilePath);
                    if (solBlock) {
                        contentBlocks.push({ type: 'text', text: `=== SOLUTION for ${exam.type} (${exam.year}) ===` });
                        contentBlocks.push(solBlock);
                        loadedSolnCount++;
                    }
                }
            } else {
                contentBlocks.push({
                    type: 'text',
                    text: `[ADDITIONAL EXAM – not attached] ${exam.type} (${exam.year}) – ${exam.filePath}${exam.solutionFilePath ? '. Solution available.' : ''}`
                });
            }
        }

        const totalExams = examsToProcess.length;
        const attachedNote = loadedExamCount > 0
            ? `I have attached ${loadedExamCount} exam PDF${loadedExamCount > 1 ? 's' : ''} and ${loadedSolnCount} solution PDF${loadedSolnCount > 1 ? 's' : ''}. ${totalExams > loadedExamCount ? `There are ${totalExams - loadedExamCount} additional exams described as text metadata.` : ''}`
            : 'No exam PDFs were available — provide a general analysis for this course type.';

        // --- Build the rich prompt ---
        const textPrompt: Anthropic.Messages.TextBlockParam = {
            type: 'text',
            text: `Analyze the following ${courseCode} — ${courseName} exam papers.

${attachedNote}

Your task is to carefully read the attached exam PDFs and extract precise, student-actionable information.

Return ONLY raw JSON (no markdown, no code fences) with EXACTLY this structure:

{
  "examStructure": {
    "sections": [
      {
        "id": "A",
        "label": "Del A",
        "description": "What this section tests (be specific about topic domains)",
        "points": 6,
        "difficulty": "easy",
        "taskCount": 3
      }
    ],
    "totalPoints": 18,
    "gradingInfo": "Grade 3 requires X points, Grade 4 requires Y points, Grade 5 requires Z points (extract from exam if visible, otherwise estimate)"
  },
  "topics": [
    {
      "name": "Ämnesnamn på svenska (t.ex. 'Egenvärden och egenvektorer', 'Derivataregler')",
      "importance": 9,
      "frequency": "Appears in most/every exam OR estimate like '8/10 exams'",
      "examSection": "Which section label this topic appears in (e.g. 'Del C' or 'B')",
      "difficulty": "hard",
      "phase": "core",
      "reasoning": "1-2 sentences: why this topic appears, what specifically is tested (cite actual question types you saw)",
      "studyTips": [
        "Specific actionable tip 1",
        "Specific actionable tip 2",
        "Specific actionable tip 3"
      ],
      "commonMistakes": [
        "Common mistake students make on this topic",
        "Another common mistake",
        "Third common mistake"
      ],
      "recommended_focus": "High"
    }
  ],
  "strategy": "2-3 sentence overall insight about what makes this exam distinctive and the single most important thing to focus on."
}

Rules for topics:
- Extract ALL distinct mathematical/conceptual topics you can identify from the exam questions
- importance 1-10: 10 = appears in every exam section and is fundamental, 1 = rarely tested
- phase: "foundation" = must learn first (basic definitions, simple computations), "core" = exam staples, "advanced" = for top grades (proofs, complex applications)
- difficulty: "easy" = routine calculation, "medium" = multi-step method, "hard" = proof or complex reasoning
- Sort topics by importance descending in your response
- Be specific — "Diagonalisering av matriser" is better than "Linear Algebra"
- studyTips and commonMistakes must be concrete, specific to the exam content you saw`
        };

        const allContent: Anthropic.Messages.ContentBlockParam[] = [textPrompt, ...contentBlocks];

        console.log(`[AI] Calling Claude for exam analysis: ${loadedExamCount} exam PDFs + ${loadedSolnCount} solution PDFs...`);
        const startTime = Date.now();

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 6000,
            temperature: 0.2,
            system: `Du är expert på att analysera universitetstentor inom alla STEM-ämnen — matematik, datavetenskap, statistik, fysik och teknik. Ditt jobb är att läsa faktiska tentamensfiler och extrahera precis, studentanpassad analys.

Du fokuserar enbart på vad du kan observera i tentamensfilerna. Du hänvisar till specifika uppgiftstyper och mönster du faktiskt ser. Du hittar aldrig på ämnen som inte finns i tentamen.

Svara alltid på svenska — alla ämnesnamn (topics.name), studyTips, commonMistakes, reasoning och strategy ska vara på svenska. Svara med råa JSON endast — ingen markdown, inga kodramar, inga förklaringar utanför JSON.`,
            messages: [
                { role: 'user', content: allContent }
            ]
        });

        const elapsed = Date.now() - startTime;
        console.log(`[AI] ✅ Exam analysis: Claude responded in ${elapsed}ms (${message.usage.input_tokens} in, ${message.usage.output_tokens} out)`);

        const raw = message.content[0].type === 'text' ? message.content[0].text : '';
        const parsed = parseExamAnalysisJson(raw);

        if (!parsed) {
            console.error('[AI] ❌ Failed to parse exam analysis JSON:', raw.slice(0, 300));
            return getExamAnalysisFallback(courseCode, loadedExamCount);
        }

        console.log(`[AI] ✅ Parsed: ${parsed.topics.length} topics, ${parsed.examStructure.sections.length} sections`);

        const result: AIExamAnalysisResult = {
            ...parsed,
            cached: false,
            generatedAt: new Date().toISOString(),
            examsAnalyzed: loadedExamCount,
        };

        // --- Write to L1 in-memory cache ---
        examAnalysisCache.set(cacheKey, {
            data: result,
        });
        console.log(`[AI] 💾 L1 memory cache written for ${courseCode}`);

        // --- Write to L2 DB cache (persists across restarts) ---
        await writeDbCache(courseCode, fingerprint, result);

        return result;

    } catch (error: unknown) {
        const err = error as { message?: string; status?: number; error?: { error?: { message?: string } } };
        console.error('[AI] ❌ Exam analysis error:', err?.message || error);
        if (err?.status) console.error('[AI] HTTP Status:', err.status);
        return getExamAnalysisFallback(courseCode, 0);
    }
}

// ============ MAIN FUNCTION (legacy) ============

export async function generateStudyPlan(
    courseName: string,
    courseCode: string,
    topicsList: string[] = [],
    examData: ExamMeta[] = []
): Promise<StudyPlanResult> {

    console.log(`[AI] === generateStudyPlan called ===`);
    console.log(`[AI] Course: ${courseCode} (${courseName})`);
    console.log(`[AI] Topics: ${topicsList.length}, Exams provided: ${examData.length}`);

    // --- 1. Check cache ---
    const fingerprint = computeExamFingerprint(examData);
    const cacheKey = getCacheKey(courseCode, fingerprint);
    const cached = studyPlanCache.get(cacheKey);

    if (cached) {
        console.log(`[AI] ⚡ Cache HIT for ${courseCode}`);
        return { ...cached.data, cached: true };
    }
    console.log(`[AI] Cache MISS for ${courseCode}`);

    // --- 2. Validate API key ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.warn('[AI] No ANTHROPIC_API_KEY — returning fallback');
        return getFallbackPlan(courseCode, 0);
    }
    console.log(`[AI] API key: SET (${apiKey.slice(0, 15)}...)`);

    try {
        // --- 3. Smart PDF Selection ---
        // We have up to 10 exams. To stay within rate limits:
        // - Send the 3 most RECENT exam PDFs (most indicative of current patterns)
        // - Send the 2 most RECENT solution PDFs (to understand expected answers)
        // - Describe all other exams as text metadata for context

        const examsToProcess = examData.slice(0, 10);
        const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];
        let loadedExamCount = 0;
        let loadedSolnCount = 0;

        for (const exam of examsToProcess) {
            if (loadedExamCount < MAX_EXAM_PDFS_PER_REQUEST) {
                // Load exam PDF
                const block = await loadPdfAsBase64(exam.filePath);
                if (block) {
                    contentBlocks.push({
                        type: 'text',
                        text: `\n=== EXAM PDF: ${exam.type} (${exam.year}) ===`
                    });
                    contentBlocks.push(block);
                    loadedExamCount++;
                }

                // Load solution if within limit
                if (exam.solutionFilePath && loadedSolnCount < MAX_SOLUTION_PDFS_PER_REQUEST) {
                    const solBlock = await loadPdfAsBase64(exam.solutionFilePath);
                    if (solBlock) {
                        contentBlocks.push({
                            type: 'text',
                            text: `=== SOLUTION for ${exam.type} (${exam.year}) ===`
                        });
                        contentBlocks.push(solBlock);
                        loadedSolnCount++;
                    }
                }
            } else {
                // Beyond the PDF limit — describe as text metadata
                contentBlocks.push({
                    type: 'text',
                    text: `[ADDITIONAL EXAM – not attached as PDF] ${exam.type} (${exam.year}) – file: ${exam.filePath}${exam.solutionFilePath ? '. Solution available.' : ''}`
                });
            }
        }

        // --- 4. Build prompt ---
        const topicsContext = topicsList.length > 0
            ? `\nKnown syllabus topics: ${topicsList.join(', ')}.`
            : '';

        const totalExams = examsToProcess.length;
        const attachedNote = loadedExamCount > 0
            ? `I have attached ${loadedExamCount} exam PDF${loadedExamCount > 1 ? 's' : ''} and ${loadedSolnCount} solution PDF${loadedSolnCount > 1 ? 's' : ''}. ${totalExams > loadedExamCount ? `There are ${totalExams - loadedExamCount} additional exams not attached but listed as metadata.` : ''}`
            : 'No exam PDFs were available.';

        const textPrompt: Anthropic.Messages.TextBlockParam = {
            type: 'text',
            text: `Create a detailed study plan for: ${courseCode} — ${courseName}
${topicsContext}

${attachedNote}

Analyze the attached exam PDFs carefully. Identify:
1. ALL distinct topic areas across the exams
2. For each area: importance score 1–10 (10 = appears every exam, must-know)
3. Cite specific exam questions when visible (e.g. "Task 3 always tests eigenvalues")
4. A weekly study schedule (4–6 weeks)
5. A strategy paragraph

Return ONLY raw JSON (no markdown, no code fences):
{
  "areas": [{"name":"...","importance":10,"reasoning":"...","recommended_focus":"High|Medium|Low"}],
  "study_schedule": [{"week":1,"focus":"...","activity":"..."}],
  "strategy": "..."
}`
        };

        const allContent: Anthropic.Messages.ContentBlockParam[] = [textPrompt, ...contentBlocks];

        // --- 5. Call Claude ---
        console.log(`[AI] Calling Claude: ${loadedExamCount} exam PDFs + ${loadedSolnCount} solution PDFs (${contentBlocks.length} blocks)...`);
        const startTime = Date.now();

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.3,
            system: 'Du är en expert på universitetsundervisning med specialisering inom matematik. Du analyserar riktiga tentamenspapper för att skapa precisa, handlingsbara studieplaner. Svara alltid på svenska — alla ämnesnamn, reasoning, activity och strategy ska vara på svenska. Svara med råa JSON endast — ingen markdown, inga kodramar.',
            messages: [
                { role: 'user', content: allContent }
            ]
        });

        const elapsed = Date.now() - startTime;
        console.log(`[AI] ✅ Claude responded in ${elapsed}ms (${message.usage.input_tokens} input tokens, ${message.usage.output_tokens} output tokens)`);

        const raw = message.content[0].type === 'text' ? message.content[0].text : '';

        // --- 6. Parse ---
        const parsed = parseAIJson(raw);
        if (!parsed) {
            console.error('[AI] ❌ Failed to parse JSON:', raw.slice(0, 300));
            return getFallbackPlan(courseCode, loadedExamCount);
        }
        console.log(`[AI] ✅ Parsed: ${parsed.areas.length} areas, ${parsed.study_schedule.length} weeks`);

        const result: StudyPlanResult = {
            ...parsed,
            cached: false,
            generatedAt: new Date().toISOString(),
            examsAnalyzed: loadedExamCount,
        };

        // --- 7. Cache ---
        studyPlanCache.set(cacheKey, {
            data: result,
        });
        console.log(`[AI] 💾 Cached until invalidated (key: ${cacheKey})`);

        return result;

    } catch (error: any) {
        console.error('[AI] ❌ Error:', error?.message || error);
        if (error?.status) console.error('[AI] HTTP Status:', error.status);
        if (error?.error?.error?.message) console.error('[AI] Detail:', error.error.error.message);
        return getFallbackPlan(courseCode, 0);
    }
}

// ============ HELPERS ============

async function loadPdfAsBase64(filePath: string): Promise<Anthropic.Messages.DocumentBlockParam | null> {
    try {
        const absolutePath = path.join(process.cwd(), filePath);
        await fs.access(absolutePath);
        const buffer = await fs.readFile(absolutePath);

        if (buffer.length > 25 * 1024 * 1024) {
            console.warn(`[AI] Skipping oversized PDF (${(buffer.length / 1024 / 1024).toFixed(1)}MB): ${filePath}`);
            return null;
        }

        console.log(`[AI] 📄 Loaded: ${filePath} (${(buffer.length / 1024).toFixed(0)} KB)`);

        return {
            type: 'document',
            source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: buffer.toString('base64'),
            },
        };
    } catch (err) {
        console.warn(`[AI] ⚠️ Could not load: ${filePath}`);
        return null;
    }
}

function parseAIJson(text: string): { areas: StudyPlanArea[]; study_schedule: StudyPlanWeek[]; strategy: string } | null {
    // Strip markdown fencing if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end > start) {
            try {
                return JSON.parse(cleaned.slice(start, end + 1));
            } catch {
                return null;
            }
        }
        return null;
    }
}

function getFallbackPlan(courseCode: string, examsAnalyzed: number): StudyPlanResult {
    return {
        areas: [
            { name: 'Core Theory', importance: 9, reasoning: 'Foundational concepts tested in every exam.', recommended_focus: 'High' },
            { name: 'Computation Methods', importance: 8, reasoning: 'Practical problem-solving appears frequently.', recommended_focus: 'High' },
            { name: 'Proofs & Definitions', importance: 6, reasoning: 'Usually worth moderate points.', recommended_focus: 'Medium' },
            { name: 'Applied Problems', importance: 5, reasoning: 'Contextual questions for higher grades.', recommended_focus: 'Low' },
        ],
        study_schedule: [
            { week: 1, focus: 'Core Theory', activity: 'Review lecture notes and textbook chapters.' },
            { week: 2, focus: 'Computation Methods', activity: 'Work through practice problem sets.' },
            { week: 3, focus: 'Proofs & Definitions', activity: 'Memorize key theorems and definitions.' },
            { week: 4, focus: 'Full Exam Practice', activity: 'Solve 2–3 past exams under timed conditions.' },
        ],
        strategy: 'AI analysis is currently unavailable (rate limit or missing API key). This is a general study template. Try refreshing in a minute for personalized analysis based on your uploaded exams.',
        cached: false,
        generatedAt: new Date().toISOString(),
        examsAnalyzed,
    };
}

// ── Helpers for the new generateExamAnalysis() ────────────────────────────────

function parseExamAnalysisJson(text: string): Omit<AIExamAnalysisResult, 'cached' | 'generatedAt' | 'examsAnalyzed'> | null {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    try {
        const parsed = JSON.parse(cleaned);
        // Basic validation
        if (!parsed.topics || !Array.isArray(parsed.topics)) return null;
        if (!parsed.examStructure || !Array.isArray(parsed.examStructure.sections)) return null;
        return parsed;
    } catch {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end > start) {
            try {
                const parsed = JSON.parse(cleaned.slice(start, end + 1));
                if (!parsed.topics || !Array.isArray(parsed.topics)) return null;
                if (!parsed.examStructure || !Array.isArray(parsed.examStructure.sections)) return null;
                return parsed;
            } catch {
                return null;
            }
        }
        return null;
    }
}

function getExamAnalysisFallback(courseCode: string, examsAnalyzed: number): AIExamAnalysisResult {
    return {
        examStructure: {
            sections: [
                { id: 'A', label: 'Del A', description: 'Grundläggande teori och beräkningar', points: 6, difficulty: 'easy', taskCount: 3 },
                { id: 'B', label: 'Del B', description: 'Tillämpade problem', points: 6, difficulty: 'medium', taskCount: 3 },
                { id: 'C', label: 'Del C', description: 'Fördjupningsuppgifter och bevis', points: 9, difficulty: 'hard', taskCount: 3 },
            ],
            totalPoints: 21,
            gradingInfo: 'AI-analys ej tillgänglig — ladda upp tentamensfiler för automatisk betygsanalys',
        },
        topics: [
            {
                name: 'Grundläggande Teori',
                importance: 9,
                frequency: 'Varje tentamen',
                examSection: 'A',
                difficulty: 'easy',
                phase: 'foundation',
                reasoning: 'AI-analys ej tillgänglig. Ladda upp tentamens-PDF:er för specifik analys av kursens innehåll.',
                studyTips: [
                    'Gå igenom kurslitteraturen och förstå grunddefinitionerna',
                    'Lös enkla uppgifter utan hjälpmedel',
                    'Repetera teorin aktivt — skriv upp nyckelformler',
                ],
                commonMistakes: [
                    'Missar grundläggande definitioner',
                    'Räknar utan att förstå metoden',
                    'Hoppar över bevis och förklaringar',
                ],
                recommended_focus: 'High',
            },
            {
                name: 'Beräkningsmetoder',
                importance: 8,
                frequency: 'Nästan varje tentamen',
                examSection: 'B',
                difficulty: 'medium',
                phase: 'core',
                reasoning: 'Praktiska beräkningsuppgifter förekommer i de flesta tentamen.',
                studyTips: [
                    'Öva på varianter av standarduppgifter',
                    'Sätt timer — 10–15 min per uppgift',
                    'Kontrollera alltid svaret',
                ],
                commonMistakes: [
                    'Räknefel i mellansteg',
                    'Glömmer kantfall',
                    'För lite utrymme för kontroll',
                ],
                recommended_focus: 'High',
            },
            {
                name: 'Fördjupning och Bevis',
                importance: 6,
                frequency: 'Ofta i Del C',
                examSection: 'C',
                difficulty: 'hard',
                phase: 'advanced',
                reasoning: 'Avancerade uppgifter krävs för höga betyg.',
                studyTips: [
                    'Prioritera uppgifter du kan lösa',
                    'Visa alltid dina steg tydligt',
                    'Öva gamla Del C-uppgifter under tidspress',
                ],
                commonMistakes: [
                    'Ofullständiga motiveringar',
                    'Hoppar över svåra uppgifter utan att försöka',
                    'Glömmer att specificera antaganden i bevis',
                ],
                recommended_focus: 'Medium',
            },
        ],
        strategy: `AI-analys är för tillfället inte tillgänglig för ${courseCode}. Kontrollera att du har laddat upp tentamens-PDF:er och att API-nyckeln är konfigurerad. Ladda om sidan för att försöka igen.`,
        cached: false,
        generatedAt: new Date().toISOString(),
        examsAnalyzed,
    };
}
