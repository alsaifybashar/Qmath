
import { db } from '../db/drizzle';
import { users, profiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log('🔍 Starting Backend Verification...');

    // 1. Test Limit Connection
    try {
        console.log('Testing Database Connection...');
        const result = await db.select().from(users).limit(1);
        console.log('✅ Database Connection Successful');
    } catch (e) {
        console.error('❌ Database Connection Failed:', e);
        console.log('⚠️  Please ensure your Postgres database is running and DATABASE_URL in .env.local is correct.');
        process.exit(1);
    }

    // 2. Test User Creation
    const testEmail = `test_${Date.now()}@example.com`;
    console.log(`\nCreating Test User (${testEmail})...`);

    try {
        const [user] = await db.insert(users).values({
            email: testEmail,
            name: 'Test Verify User',
            password: 'hashed_password_placeholder', // Setup script doesn't need real hash
            role: 'student',
        }).returning();

        console.log('✅ User Created:', user.id);

        // 3. Test Profile Creation
        await db.insert(profiles).values({
            id: user.id,
            universityProgram: 'Computer Science',
            enrollmentYear: 2024,
        });
        console.log('✅ Profile Created');

        // 4. Verification Query
        const fetchedUser = await db.query.users.findFirst({
            where: eq(users.email, testEmail),
            with: {
                profile: true
            }
        });

        if (fetchedUser && fetchedUser.profile) {
            console.log('✅ Verification Query Successful:');
            console.log(`   User: ${fetchedUser.name} (${fetchedUser.role})`);
            console.log(`   Program: ${fetchedUser.profile.universityProgram}`);
        } else {
            console.error('❌ Failed to fetch created user/profile.');
        }

    } catch (e) {
        console.error('❌ Verification Failed:', e);
    } finally {
        process.exit(0);
    }
}

main();
