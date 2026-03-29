/**
 * Input preprocessor — cleans user messages before they reach the AI.
 *
 * Students frequently paste content from PDFs, scanned documents, or
 * web pages that contain encoding artifacts, duplicate paragraphs, page
 * numbers, control characters, and excessive whitespace. Sending this
 * raw content wastes tokens and can confuse the model.
 *
 * This module strips the noise while preserving all mathematical content
 * (LaTeX, symbols, expressions) and the semantic meaning of the message.
 *
 * Can be imported in both Node.js (API route) and the browser (client component).
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Hard cap before we truncate. ~24 000 chars ≈ 6 000 tokens.
 * A full exam question with context rarely exceeds 2 000 chars; anything
 * larger is almost certainly an accidental paste of a full document.
 */
const MAX_CHARS = 24_000;

// ── Result type ───────────────────────────────────────────────────────────────

export interface PreprocessResult {
    /** The cleaned text ready to send to the AI. */
    cleaned: string;
    /** Estimated token count of the original input (chars ÷ 4). */
    originalTokens: number;
    /** Estimated token count after cleaning. */
    cleanedTokens: number;
    /** Positive = tokens saved; negative = should not happen. */
    savedTokens: number;
    /** True when the cleaned text differs from the raw input. */
    wasCleaned: boolean;
    /**
     * Human-readable labels for each kind of noise that was removed.
     * Used by the UI badge to tell the student what was detected.
     */
    flags: CleanFlag[];
}

export type CleanFlag =
    | 'control_chars'      // null bytes / C0 control characters
    | 'zero_width_chars'   // zero-width spaces, soft hyphens, BOM, etc.
    | 'encoding_artifacts' // garbled UTF-8 from bad PDF export
    | 'pdf_ligatures'      // ﬁ ﬂ ﬀ ﬃ ﬄ replaced with ASCII equivalents
    | 'pdf_hyphenation'    // word-\nbreak reassembled
    | 'page_numbers'       // lone integers on their own line removed
    | 'separator_lines'    // -----  /  ===== lines removed
    | 'duplicate_content'  // repeated paragraphs removed
    | 'excess_whitespace'  // multiple spaces / 3+ blank lines collapsed
    | 'truncated';         // input exceeded MAX_CHARS and was cut

// ── Core function ─────────────────────────────────────────────────────────────

export function preprocessUserInput(raw: string): PreprocessResult {
    if (!raw) {
        return {
            cleaned: '',
            originalTokens: 0,
            cleanedTokens: 0,
            savedTokens: 0,
            wasCleaned: false,
            flags: [],
        };
    }

    const flags = new Set<CleanFlag>();
    let text = raw;

    // ── Step 1: Control characters ─────────────────────────────────────────
    // Remove C0 control chars except \t (9), \n (10), \r (13).
    // These appear in binary-exported PDFs and corrupt the token stream.
    {
        const next = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        if (next !== text) { flags.add('control_chars'); text = next; }
    }

    // ── Step 2: Zero-width / invisible Unicode ─────────────────────────────
    // Soft hyphen (U+00AD), zero-width space (U+200B), joiners, BOM, etc.
    {
        const next = text.replace(/[\u00AD\u200B\u200C\u200D\u200E\u200F\u2028\u2029\uFEFF\u2060]/g, '');
        if (next !== text) { flags.add('zero_width_chars'); text = next; }
    }

    // ── Step 3: Common garbled UTF-8 / mojibake sequences ─────────────────
    // Bad PDF-to-text converters often produce these byte-sequence artefacts.
    {
        const next = text
            .replace(/â€™/g, "'")
            .replace(/â€œ/g, '"')
            .replace(/â€/g, '"')
            .replace(/Ã©/g, 'é')
            .replace(/Ã¨/g, 'è')
            .replace(/Ã¤/g, 'ä')
            .replace(/Ã¶/g, 'ö')
            .replace(/Ã¥/g, 'å')
            .replace(/â•/g, '')        // box-drawing artifacts
            .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, ''); // drop remaining non-printable
        if (next !== text) { flags.add('encoding_artifacts'); text = next; }
    }

    // ── Step 4: PDF typographic ligatures ─────────────────────────────────
    // Many PDF exporters encode ligatures as single Unicode code points.
    {
        const next = text
            .replace(/ﬁ/g, 'fi')
            .replace(/ﬂ/g, 'fl')
            .replace(/ﬀ/g, 'ff')
            .replace(/ﬃ/g, 'ffi')
            .replace(/ﬄ/g, 'ffl')
            .replace(/ﬅ/g, 'st')
            .replace(/ﬆ/g, 'st')
            // Smart/curly quotes → ASCII equivalents
            .replace(/[\u2018\u2019\u02BC]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/\u2013/g, '-')    // en dash
            .replace(/\u2014/g, '--')   // em dash
            .replace(/\u2026/g, '...');  // ellipsis
        if (next !== text) { flags.add('pdf_ligatures'); text = next; }
    }

    // ── Step 5: Hyphenated line-breaks (PDF reflow artefact) ──────────────
    // "hypoth-\nesis" → "hypothesis"
    {
        const next = text.replace(/([a-zA-Z])-\r?\n([a-zA-Z])/g, '$1$2');
        if (next !== text) { flags.add('pdf_hyphenation'); text = next; }
    }

    // ── Step 6: Isolated page numbers ─────────────────────────────────────
    // A line that contains ONLY a 1-4 digit number is almost certainly a page
    // number from a pasted PDF. We keep numbers that appear in-line with text.
    {
        const next = text.replace(/^[ \t]*\d{1,4}[ \t]*$/gm, '');
        if (next !== text) { flags.add('page_numbers'); text = next; }
    }

    // ── Step 7: Separator lines ────────────────────────────────────────────
    // Lines that are only dashes, equals signs, underscores, or asterisks
    // (PDF headers/footers, section dividers with no semantic value).
    // We KEEP markdown `---` (3 chars) since MarkdownMessage renders it as <hr>.
    {
        const next = text.replace(/^[ \t]*[-=_*]{5,}[ \t]*$/gm, '');
        if (next !== text) { flags.add('separator_lines'); text = next; }
    }

    // ── Step 8: Excess whitespace ──────────────────────────────────────────
    {
        // Multiple spaces/tabs on the same line → single space
        const a = text.replace(/[ \t]{2,}/g, ' ');
        // 3+ consecutive blank lines → exactly 2 (one blank line)
        const b = a.replace(/\n{3,}/g, '\n\n');
        // Trailing spaces at end of each line
        const next = b.split('\n').map(l => l.trimEnd()).join('\n');
        if (next !== text) { flags.add('excess_whitespace'); text = next; }
    }

    // ── Step 9: Duplicate paragraphs ──────────────────────────────────────
    // Students sometimes paste the same excerpt multiple times, or a
    // document has repeated header/footer text between every section.
    {
        const paragraphs = text.split(/\n{2,}/);
        const seen = new Set<string>();
        const deduped: string[] = [];
        let removed = false;
        for (const para of paragraphs) {
            const key = para.trim().toLowerCase().replace(/\s+/g, ' ');
            // Only deduplicate paragraphs with enough content to identify
            if (key.length >= 30 && seen.has(key)) {
                removed = true;
                continue;
            }
            seen.add(key);
            if (para.trim()) deduped.push(para.trim());
        }
        if (removed) {
            flags.add('duplicate_content');
            text = deduped.join('\n\n');
        }
    }

    // ── Step 10: Truncate extremely long inputs ────────────────────────────
    if (text.length > MAX_CHARS) {
        flags.add('truncated');
        text = text.slice(0, MAX_CHARS).trimEnd() +
            '\n\n[Input truncated — original was longer than the processing limit.]';
    }

    // ── Final trim ─────────────────────────────────────────────────────────
    text = text.trim();

    const originalTokens = Math.ceil(raw.length / 4);
    const cleanedTokens  = Math.ceil(text.length / 4);

    return {
        cleaned: text,
        originalTokens,
        cleanedTokens,
        savedTokens: Math.max(0, originalTokens - cleanedTokens),
        wasCleaned: text !== raw.trim(),
        flags: [...flags],
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Human-readable summary of a CleanFlag array for UI display. */
export function describeCleaning(flags: CleanFlag[]): string {
    const labels: Record<CleanFlag, string> = {
        control_chars:      'control characters',
        zero_width_chars:   'invisible characters',
        encoding_artifacts: 'encoding errors',
        pdf_ligatures:      'PDF ligatures',
        pdf_hyphenation:    'PDF line-breaks',
        page_numbers:       'page numbers',
        separator_lines:    'separator lines',
        duplicate_content:  'duplicate text',
        excess_whitespace:  'extra whitespace',
        truncated:          'content truncated',
    };
    return flags.map(f => labels[f] ?? f).join(', ');
}
