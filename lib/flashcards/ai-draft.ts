/**
 * AI-assisted card drafting.
 *
 * Given a text snippet (selection from an article, a question stem, or a
 * topic name), ask the LLM to produce 1–3 high-quality flashcard candidates
 * in JSON. The student then reviews and saves whichever they like.
 *
 * Card quality is grounded in Anki community guidance:
 *  - One fact per card
 *  - Minimum information principle: ask for one thing
 *  - Front is a question, back is the answer (not "term/definition" pairs of
 *    arbitrary lengths)
 *  - Math gets isolated in `*Math` fields so KaTeX can render it cleanly.
 */

import { callOllama } from '@/lib/ollama';

export interface CardDraft {
    front: string;
    back: string;
    frontMath?: string;
    backMath?: string;
}

interface DraftInput {
    /** Free-text snippet to base cards on (selection, question stem, definition). */
    snippet?: string;
    /** Human-readable topic to anchor the cards (e.g. "Egenvärden"). */
    topicName?: string;
    /** Bias card style. */
    contextType?: 'manual' | 'question' | 'article' | 'ai_draft';
    /** Maximum draft count. Default 3. */
    maxDrafts?: number;
}

const SYSTEM_PROMPT = `Du är en pedagogisk assistent som hjälper en student att skapa flashcards för långtidsminne.

Regler för bra flashcards (efter Anki-community guidance):
- En fakta per kort. Inga "lista" eller "alla skillnader mellan X och Y".
- Front är en konkret fråga. Back är ett kort, exakt svar.
- Skilj matematik från text. Om svaret är en formel, lägg den i "backMath" som ren LaTeX (utan $ eller \\\\(). Annars lämna "backMath" tom.
- Skriv på svenska.
- Behåll varje svar under 25 ord.

Svara enbart med giltig JSON enligt formatet:
{ "drafts": [ { "front": "...", "back": "...", "frontMath": "", "backMath": "" }, ... ] }`;

function buildUserPrompt(input: DraftInput): string {
    const parts: string[] = [];
    if (input.topicName) {
        parts.push(`Ämne: ${input.topicName}`);
    }
    if (input.snippet) {
        parts.push(`Källtext:\n"""\n${input.snippet.trim()}\n"""`);
    }
    parts.push(
        `Skapa upp till ${input.maxDrafts ?? 3} korta flashcards som hjälper studenten att repetera detta innehåll på lång sikt. Returnera JSON.`,
    );
    return parts.join('\n\n');
}

interface ModelResponse {
    drafts?: CardDraft[];
}

function sanitiseDraft(d: unknown): CardDraft | null {
    if (!d || typeof d !== 'object') return null;
    const obj = d as Record<string, unknown>;
    const front = typeof obj.front === 'string' ? obj.front.trim() : '';
    const back = typeof obj.back === 'string' ? obj.back.trim() : '';
    if (!front || !back) return null;
    const frontMath = typeof obj.frontMath === 'string' && obj.frontMath.trim().length > 0
        ? obj.frontMath.trim()
        : undefined;
    const backMath = typeof obj.backMath === 'string' && obj.backMath.trim().length > 0
        ? obj.backMath.trim()
        : undefined;
    return { front, back, frontMath, backMath };
}

/** Returns 1–N card drafts, or an empty list if the LLM is unavailable. */
export async function draftCards(input: DraftInput): Promise<CardDraft[]> {
    if (!input.snippet && !input.topicName) return [];

    let raw: string;
    try {
        raw = await callOllama({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(input) },
            ],
            format: 'json',
            temperature: 0.3,
            maxTokens: 600,
            timeoutMs: 25_000,
        });
    } catch {
        return [];
    }

    let parsed: ModelResponse;
    try {
        parsed = JSON.parse(raw) as ModelResponse;
    } catch {
        return [];
    }

    if (!parsed.drafts || !Array.isArray(parsed.drafts)) return [];

    const cleaned: CardDraft[] = [];
    for (const d of parsed.drafts) {
        const s = sanitiseDraft(d);
        if (s) cleaned.push(s);
        if (cleaned.length >= (input.maxDrafts ?? 3)) break;
    }
    return cleaned;
}
