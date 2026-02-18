import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { generateStudyPlan } from '@/app/actions/ai';
import type { StudyPlanResult } from '@/app/actions/ai';
import assert from 'node:assert';

const log = (...args: any[]) => console.log('🧪', ...args);
const err = (...args: any[]) => console.error('❌', ...args);

async function runTests() {
    log('=== AI Study Plan Integration Tests ===\n');
    let passed = 0;
    let failed = 0;

    // --- TEST 1: Plan has correct shape ---
    try {
        log('Test 1: Study plan result shape');
        const plan = await generateStudyPlan('Linear Algebra', 'TEST01', ['Vectors'], []);
        assert.ok(Array.isArray(plan.areas), 'areas should be array');
        assert.ok(Array.isArray(plan.study_schedule), 'schedule should be array');
        assert.ok(typeof plan.strategy === 'string', 'strategy should be string');
        assert.ok(typeof plan.cached === 'boolean', 'cached should be boolean');
        assert.ok(typeof plan.generatedAt === 'string', 'generatedAt should be string');
        assert.ok(typeof plan.examsAnalyzed === 'number', 'examsAnalyzed should be number');
        log(`  → ${plan.areas.length} areas, cached=${plan.cached}, examsAnalyzed=${plan.examsAnalyzed}`);
        log('✅ Passed\n');
        passed++;
    } catch (e: any) { err(e.message + '\n'); failed++; }

    // --- TEST 2: Cache mechanism ---
    try {
        log('Test 2: Cache works (second call faster)');
        const t1 = Date.now();
        await generateStudyPlan('Cache Test', 'CACHE01', [], []);
        const d1 = Date.now() - t1;

        const t2 = Date.now();
        const plan2 = await generateStudyPlan('Cache Test', 'CACHE01', [], []);
        const d2 = Date.now() - t2;

        log(`  → Call 1: ${d1}ms, Call 2: ${d2}ms`);
        if (process.env.ANTHROPIC_API_KEY) {
            assert.ok(plan2.cached === true, 'Second call should be cached');
            assert.ok(d2 < d1, 'Cached call should be faster');
        }
        log('✅ Passed\n');
        passed++;
    } catch (e: any) { err(e.message + '\n'); failed++; }

    // --- TEST 3: XSS protection ---
    try {
        log('Test 3: XSS in input does not leak to output');
        const xss = '<script>alert("xss")</script>';
        const plan = await generateStudyPlan(xss, xss, [xss], []);
        const json = JSON.stringify(plan);
        assert.ok(!json.includes('<script>'), 'No script tags in output');
        log('✅ Passed\n');
        passed++;
    } catch (e: any) { err(e.message + '\n'); failed++; }

    // --- TEST 4: Empty exam list returns valid plan ---
    try {
        log('Test 4: Empty exams still returns valid plan');
        const plan = await generateStudyPlan('Test', 'EMPTY01', [], []);
        assert.ok(plan.areas.length > 0, 'Should have areas even without exams');
        assert.ok(plan.study_schedule.length > 0, 'Should have schedule');
        log(`  → ${plan.areas.length} areas, ${plan.study_schedule.length} weeks`);
        log('✅ Passed\n');
        passed++;
    } catch (e: any) { err(e.message + '\n'); failed++; }

    // --- TEST 5: Non-existent file path handled gracefully ---
    try {
        log('Test 5: Missing PDF file handled gracefully');
        const plan = await generateStudyPlan('Test', 'MISSING01', [], [
            { filePath: 'uploads/exams/FAKE/nonexistent.pdf', year: '2025', type: 'TEN1' }
        ]);
        assert.ok(plan.areas.length > 0, 'Should return fallback areas');
        log('✅ Passed\n');
        passed++;
    } catch (e: any) { err(e.message + '\n'); failed++; }

    // --- TEST 6: Importance values are valid ---
    try {
        log('Test 6: Area importance values are valid numbers 1-10');
        const plan = await generateStudyPlan('Validation', 'VALID01', ['Topic'], []);
        for (const area of plan.areas) {
            assert.ok(typeof area.importance === 'number', `Expected number, got ${typeof area.importance}`);
            assert.ok(area.importance >= 1 && area.importance <= 10, `Importance ${area.importance} outside 1-10`);
        }
        log(`  → All ${plan.areas.length} areas have valid importance`);
        log('✅ Passed\n');
        passed++;
    } catch (e: any) { err(e.message + '\n'); failed++; }

    // --- SUMMARY ---
    log(`\n${'='.repeat(40)}`);
    log(`Results: ${passed} passed, ${failed} failed`);
    log(`${'='.repeat(40)}`);
    if (failed > 0) process.exit(1);
}

runTests().catch(e => {
    console.error('Test runner crashed:', e);
    process.exit(1);
});
