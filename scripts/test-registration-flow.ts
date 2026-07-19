
import { db } from '../db/drizzle';
import { users, profiles, universities } from '../db/schema';
import { eq } from 'drizzle-orm';
import { SignupFormSchema } from '../app/lib/definitions';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

async function runTests() {
    console.log('🔍 Starting QA & Security Validation for Registration Flow...');

    let passed = true;

    // --- UNIT TEST: Validation Logic ---
    console.log('\n[TEST 1] Testing Validation Logic (Zod Schema)...');
    try {
        const validData = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securePassword123',
        };

        const result = SignupFormSchema.safeParse(validData);
        if (result.success) {
            console.log('✅ Valid data accepted correctly.');
        } else {
            console.error('❌ Valid data failed validation:', result.error);
            passed = false;
        }

        const invalidData = {
            name: 'J', // too short
            email: 'invalid-email',
            password: '123', // too short
        };

        const invalidResult = SignupFormSchema.safeParse(invalidData);
        if (!invalidResult.success) {
            const errors = invalidResult.error.flatten().fieldErrors;
            if (errors.name && errors.email && errors.password) {
                console.log('✅ Invalid data correctly rejected with expected errors.');
            } else {
                console.error('❌ Invalid data rejected but some errors missing:', errors);
                passed = false;
            }
        } else {
            console.error('❌ Invalid data was accepted!');
            passed = false;
        }
    } catch (e) {
        console.error('❌ Validation Test Crashed:', e);
        passed = false;
    }


    // --- INTEGRATION TEST: Database Persistence ---
    console.log('\n[TEST 2] Testing Database Persistence (Integration)...');
    const testEmail = `qa_test_${Date.now()}@example.com`;
    let userId: string | null = null;
    let universityId: string | null = null;

    try {
        console.log(`Creating test user: ${testEmail}`);

        // Create dummy university for foreign key constraint
        const [dummyUni] = await db.insert(universities).values({
            name: 'QA Test University',
            country: 'Sweden'
        }).returning();
        universityId = dummyUni.id;

        // Simulate what the action does: Insert User
        const [newUser] = await db.insert(users).values({
            email: testEmail,
            name: 'QA Test User',
            password: 'hashed_password_placeholder',
            role: 'student',
        }).returning();
        userId = newUser.id;

        // Simulate what the action does: Insert Profile
        await db.insert(profiles).values({
            id: newUser.id,
            universityId: universityId,
            studyYear: 3,
            universityProgram: 'Engineering Physics'
        });

        // Verify Persistence
        const fetchedUser = await db.query.users.findFirst({
            where: eq(users.email, testEmail),
            with: {
                profile: true
            }
        });

        if (!fetchedUser || !fetchedUser.profile) {
            console.error('❌ Failed to fetch created user/profile from DB.');
            passed = false;
        } else {
            const p = fetchedUser.profile;
            if (p.studyYear === 3 && p.universityProgram === 'Engineering Physics') {
                console.log('✅ Data persisted correctly (`studyYear` and `universityProgram`).');
                console.log(`   - University ID: ${p.universityId} (Matches created dummy university)`);
            } else {
                console.error(`❌ Data mismatch! Expected studyYear=3, program='Engineering Physics'. Got:`, p);
                passed = false;
            }
        }

    } catch (e) {
        console.error('❌ Database Integration Test Failed:', e);
        passed = false;
    } finally {
        // Cleanup
        if (userId) {
            console.log('Cleaning up test user...');
            await db.delete(users).where(eq(users.id, userId));
        }
        if (universityId) {
            console.log('Cleaning up test university...');
            await db.delete(universities).where(eq(universities.id, universityId));
        }
    }

    if (passed) {
        console.log('\n✅ ALL TESTS PASSED');
        process.exit(0);
    } else {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    }
}

runTests();
