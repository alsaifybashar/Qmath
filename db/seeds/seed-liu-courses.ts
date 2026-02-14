import { db } from '../drizzle';
import { universities, courses } from '../schema';
import { eq } from 'drizzle-orm';

const liuCourses = [
    { code: 'TDDC75', name: 'Diskreta strukturer', description: 'Logic, set theory, combinatorics, and graph theory' },
    { code: 'TATB04', name: 'Inledande matematisk analys', description: 'Introductory calculus and algebra' },
    { code: 'TANA23', name: 'Matematiska algoritmer och modeller', description: 'Numerical methods and mathematical modeling' },
    { code: 'TATA41', name: 'Envariabelanalys 1', description: 'Calculus in one variable, part 1' },
    { code: 'TATA24', name: 'Linjär algebra', description: 'Linear algebra and geometry' },
    { code: 'TATA91', name: 'En- och flervariabelanalys', description: 'Calculus in one and several variables' },
    { code: 'TAMS42', name: 'Sannolikhetslära och statistik, grundkurs', description: 'Probability theory and statistics' },
];

async function seedLiuCourses() {
    console.log('🌱 Seeding LiU courses...');

    // 1. Find Linköping University
    const liu = await db.query.universities.findFirst({
        where: eq(universities.name, 'Linköping University')
    });

    if (!liu) {
        console.error('❌ Linköping University not found in DB. Please run seed-universities-full.ts first.');
        // Try to create it if missing for robustness
        const [newLiu] = await db.insert(universities).values({
            name: 'Linköping University',
            country: 'Sweden'
        }).returning();
        console.log('   ✓ Created Linköping University');

        await insertCourses(newLiu.id);
    } else {
        await insertCourses(liu.id);
    }

    console.log('\n✅ LiU Course seeding complete!');
    process.exit(0);
}

async function insertCourses(universityId: string) {
    for (const course of liuCourses) {
        const existing = await db.query.courses.findFirst({
            where: (courses, { and, eq }) => and(
                eq(courses.code, course.code),
                eq(courses.universityId, universityId)
            )
        });

        if (!existing) {
            await db.insert(courses).values({
                universityId,
                code: course.code,
                name: course.name,
                description: course.description,
                semester: 'General'
            });
            console.log(`   ✓ Inserted: ${course.code} - ${course.name}`);
        } else {
            console.log(`   • Skipped (exists): ${course.code}`);
        }
    }
}

seedLiuCourses().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
