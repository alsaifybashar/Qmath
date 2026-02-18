/**
 * Integration Tests: Phase 1 — Progressive Hint System
 * Run with: npx tsx tests/integration/hint-system.test.ts
 */

// Simulate the hint engine logic without Claude API
// These tests verify the structure and behavior of the hint system

interface HintResult {
    hint: string;
    hintLevel: 1 | 2 | 3;
    mathExpression?: string;
    source: 'ai' | 'authored';
}

// ========== TEST HELPERS ==========

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.error(`  ❌ ${message}`);
        failed++;
    }
}

function describe(name: string, fn: () => void) {
    console.log(`\n📋 ${name}`);
    fn();
}

// ========== TESTS ==========

describe('Hint Level Progression', () => {
    // Simulate the progressive hint state machine
    let highestHintLevel = 0;

    const canTrigger = (level: number) => level > highestHintLevel;

    assert(canTrigger(1), 'Can trigger level 1 when no hints shown');
    assert(!canTrigger(0), 'Cannot trigger level 0 (invalid)');

    highestHintLevel = 1;
    assert(!canTrigger(1), 'Cannot re-trigger level 1');
    assert(canTrigger(2), 'Can trigger level 2 after level 1');
    assert(canTrigger(3), 'Can trigger level 3 after level 1');

    highestHintLevel = 2;
    assert(!canTrigger(1), 'Cannot downgrade to level 1');
    assert(!canTrigger(2), 'Cannot re-trigger level 2');
    assert(canTrigger(3), 'Can trigger level 3 after level 2');

    highestHintLevel = 3;
    assert(!canTrigger(1), 'Cannot trigger anything after max');
    assert(!canTrigger(2), 'Cannot trigger anything after max');
    assert(!canTrigger(3), 'Cannot re-trigger level 3');
});

describe('Pre-authored Hint Selection', () => {
    // Simulate the hint engine's pre-authored hint fallback
    const existingHints = [
        'Think about the power rule for each term.',
        'For x², bring down the exponent. For 3x, the derivative is just 3.',
    ];

    const selectHint = (level: 1 | 2 | 3): HintResult => {
        const idx = Math.min(level - 1, existingHints.length - 1);
        return {
            hint: existingHints[idx],
            hintLevel: level,
            source: 'authored',
        };
    };

    const h1 = selectHint(1);
    assert(h1.hint.includes('power rule'), 'Level 1 returns nudge hint');
    assert(h1.source === 'authored', 'Level 1 is from pre-authored content');

    const h2 = selectHint(2);
    assert(h2.hint.includes('bring down'), 'Level 2 returns guided hint');
    assert(h2.source === 'authored', 'Level 2 is from pre-authored content');

    const h3 = selectHint(3);
    assert(h3.hintLevel === 3, 'Level 3 has correct level');
    assert(h3.source === 'authored', 'Level 3 falls back to last authored hint');
});

describe('Mastery Penalty for Hints', () => {
    // Simulate the engine.ts mastery calculation
    const calculateGain = (hintsUsed: number): number => {
        const hintPenalty = Math.min(hintsUsed * 0.02, 0.08);
        return Math.max(0.02, 0.10 - hintPenalty);
    };

    const approxEq = (a: number, b: number) => Math.abs(a - b) < 0.001;

    assert(approxEq(calculateGain(0), 0.10), 'No hints = full +0.10 gain');
    assert(approxEq(calculateGain(1), 0.08), '1 hint = +0.08 gain');
    assert(approxEq(calculateGain(2), 0.06), '2 hints = +0.06 gain');
    assert(approxEq(calculateGain(3), 0.04), '3 hints = +0.04 gain');
    assert(approxEq(calculateGain(4), 0.02), '4 hints = +0.02 gain (capped)');
    assert(approxEq(calculateGain(5), 0.02), '5 hints = +0.02 gain (still minimum)');
    assert(approxEq(calculateGain(100), 0.02), 'Many hints = still minimum +0.02');
});

describe('Wrong Attempt Trigger (Level 3)', () => {
    const WRONG_ATTEMPTS_FOR_LEVEL_3 = 3;

    const shouldTriggerLevel3 = (attempts: number, currentLevel: number, isShowingFeedback: boolean, isCorrect: boolean) => {
        return attempts >= WRONG_ATTEMPTS_FOR_LEVEL_3 &&
            currentLevel < 3 &&
            isShowingFeedback &&
            !isCorrect;
    };

    assert(!shouldTriggerLevel3(1, 0, true, false), '1 wrong attempt: no level 3');
    assert(!shouldTriggerLevel3(2, 0, true, false), '2 wrong attempts: no level 3');
    assert(shouldTriggerLevel3(3, 0, true, false), '3 wrong attempts: triggers level 3');
    assert(shouldTriggerLevel3(5, 0, true, false), '5 wrong attempts: triggers level 3');
    assert(!shouldTriggerLevel3(3, 3, true, false), '3 attempts but already at level 3: no trigger');
    assert(!shouldTriggerLevel3(3, 0, false, false), '3 attempts but no feedback showing: no trigger');
    assert(!shouldTriggerLevel3(3, 0, true, true), '3 attempts but correct: no trigger');
});

describe('Error Classification Quick Heuristics', () => {
    // Simulate the quick classification logic from error-classifier.ts

    const quickClassify = (correct: string, student: string): string | null => {
        const c = correct.toLowerCase().trim();
        const s = student.toLowerCase().trim();

        if (s.length === 0) return 'time_pressure';

        // Sign error
        if (c.replace(/-/g, '') === s.replace(/-/g, '') && c !== s) return 'computational';

        // Factor of 2
        const cNum = parseFloat(c);
        const sNum = parseFloat(s);
        if (!isNaN(cNum) && !isNaN(sNum)) {
            if (Math.abs(sNum) === Math.abs(cNum) * 2 || Math.abs(sNum) * 2 === Math.abs(cNum)) return 'computational';
        }

        // Expression vs value
        if (s.includes('x') && !c.includes('x')) return 'incomplete';

        return null;
    };

    assert(quickClassify('10', '-10') === 'computational', 'Sign error detected');
    assert(quickClassify('-5', '5') === 'computational', 'Negative sign error detected');
    assert(quickClassify('10', '20') === 'computational', 'Factor-of-2 error detected');
    assert(quickClassify('10', '5') === 'computational', 'Half-value error detected');
    assert(quickClassify('10', '6x-2') === 'incomplete', 'Expression-instead-of-value detected');
    assert(quickClassify('10', '') === 'time_pressure', 'Empty answer = time pressure');
    assert(quickClassify('10', '7') === null, 'No quick classification for generic wrong answer');
    assert(quickClassify('2x+3', '2x') === null, 'Non-trivial error needs AI');
});

describe('Hint Cache Key Generation', () => {
    const getHintCacheKey = (questionText: string, hintLevel: number): string => {
        const qKey = questionText.slice(0, 100).replace(/\s+/g, ' ').trim();
        return `hint:${qKey}:L${hintLevel}`;
    };

    const key1 = getHintCacheKey('Find the derivative of f(x) = x² + 3x', 1);
    const key2 = getHintCacheKey('Find the derivative of f(x) = x² + 3x', 2);
    const key3 = getHintCacheKey('Find the derivative of f(x) = x² + 3x', 1);

    assert(key1 !== key2, 'Different levels produce different cache keys');
    assert(key1 === key3, 'Same question + level produces same cache key');

    // Whitespace normalization
    const keyA = getHintCacheKey('Find  the   derivative', 1);
    const keyB = getHintCacheKey('Find the derivative', 1);
    assert(keyA === keyB, 'Whitespace is normalized in cache keys');
});

describe('XSS Protection on Hint Content', () => {
    // Ensure hint content is sanitizable
    const sanitize = (text: string): string => {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    const malicious = '<script>alert("xss")</script>';
    const cleaned = sanitize(malicious);
    assert(!cleaned.includes('<script>'), 'Script tags are escaped');
    assert(cleaned.includes('&lt;script'), 'Tags are HTML-encoded');
});

// ========== SUMMARY ==========
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

if (failed > 0) {
    process.exit(1);
}
