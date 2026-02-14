import { register } from '../app/actions/auth';
import { db } from '../db/drizzle';
import { users, universities, profiles } from '../db/schema';
import { eq } from 'drizzle-orm';

async function testRegistration() {
    console.log('🧪 Testing registration flow...');

    const email = `test-${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Test User';
    const universityName = 'Test University';
    const program = 'Computer Science';
    const yearOfStudy = 2;

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('name', name);
    formData.append('university', universityName);
    formData.append('program', program);
    formData.append('yearOfStudy', String(yearOfStudy));

    console.log(`Creating user: ${email}`);

    try {
        // We need to mock signIn or handle the redirect error, as running server action in script won't have request context for next-auth.
        // However, the action calls signIn which throws redirect.
        // We'll catch that.
        await register(null, formData).catch((err) => {
            if (err.message === 'NEXT_REDIRECT') {
                console.log('✅ Redirect triggered (Success)');
            } else {
                // signIn might throw other errors in non-request context?
                // actually, next-auth signIn might fail entirely without request context.
                console.log('⚠️  Registration triggered error (could be expected in script context):', err.message);
            }
        });

        // Verify DB state
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (!user) {
            console.error('❌ User not found in DB!');
            process.exit(1);
        }
        console.log('✅ User created in DB');

        const profile = await db.query.profiles.findFirst({
            where: eq(profiles.id, user.id)
        });

        if (!profile) {
            console.error('❌ Profile not found!');
            process.exit(1);
        }
        console.log('✅ Profile created');

        // Check validation of university creation
        const uni = await db.query.universities.findFirst({
            where: eq(universities.name, universityName)
        });

        if (!uni) {
            console.error('❌ University not created!');
            process.exit(1);
        }
        console.log('✅ University auto-created');

        if (profile.universityId !== uni.id) {
            console.error('❌ Profile not linked to university correctly');
            process.exit(1);
        }
        console.log('✅ Profile linked to university');

        console.log('🎉 Registration logic verified successfully!');

    } catch (e) {
        console.error('❌ Unexpected error:', e);
        process.exit(1);
    }
}

testRegistration();
