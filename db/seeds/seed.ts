import { db } from '../drizzle';
import { universities, courses, topics, questions, users, profiles } from '../schema';
import bcrypt from 'bcryptjs';

/**
 * Seed data for Qmath development and testing
 * Run with: npx tsx db/seeds/seed.ts
 */

async function seed() {
    console.log('🌱 Starting database seed...\n');

    // ============================================
    // 1. UNIVERSITIES
    // ============================================
    console.log('📚 Seeding universities...');

    const universityData = [
        { name: 'Linköpings universitet', country: 'Sweden', logoUrl: '/logos/liu.png' },
        { name: 'KTH Royal Institute of Technology', country: 'Sweden', logoUrl: '/logos/kth.png' },
        { name: 'Chalmers University of Technology', country: 'Sweden', logoUrl: '/logos/chalmers.png' },
        { name: 'Stockholm University', country: 'Sweden', logoUrl: '/logos/stockholm.png' },
        { name: 'MIT', country: 'United States', logoUrl: '/logos/mit.png' },
    ];

    const insertedUniversities = await db.insert(universities).values(universityData).returning();
    console.log(`   ✓ Inserted ${insertedUniversities.length} universities`);

    // Get LiU for course references
    const liu = insertedUniversities.find(u => u.name.includes('Linköpings'))!;

    // ============================================
    // 2. COURSES — Only the three active courses
    // ============================================
    console.log('📖 Seeding courses...');

    const courseData = [
        {
            universityId: liu.id,
            code: 'TATA24',
            name: 'Linjär algebra',
            nameSv: 'Linjär algebra',
            description: 'Linjär algebra för teknologer vid LiTH',
            semester: 'HT 2026',
        },
        {
            universityId: liu.id,
            code: 'TATA41',
            name: 'Envariabel analys',
            nameSv: 'Envariabel analys',
            description: 'Envariabelanalys för teknologer vid LiTH',
            semester: 'HT 2026',
        },
        {
            universityId: liu.id,
            code: 'TSRT19',
            name: 'Reglerteknik',
            nameSv: 'Reglerteknik',
            description: 'Grundläggande reglerteknik vid LiTH',
            semester: 'VT 2026',
        },
    ];

    const insertedCourses = await db.insert(courses).values(courseData).returning();
    console.log(`   ✓ Inserted ${insertedCourses.length} courses`);

    const tata41 = insertedCourses.find(c => c.code === 'TATA41')!;
    const tata24 = insertedCourses.find(c => c.code === 'TATA24')!;
    const tsrt19 = insertedCourses.find(c => c.code === 'TSRT19')!;

    // ============================================
    // 3. TOPICS
    // ============================================
    console.log('🎯 Seeding topics...');

    const topicData = [
        // TATA24 — Linjär algebra
        {
            courseId: tata24.id,
            slug: 'vektorer-rn',
            title: 'Vektorer i Rⁿ',
            description: 'Vektorer, operationer och geometrisk tolkning',
            baseDifficulty: 2,
            engineeringContext: 'Vektorer används överallt i teknik: kraftanalys, signalbehandling och robotkinematik.',
        },
        {
            courseId: tata24.id,
            slug: 'linjara-ekvationssystem',
            title: 'Linjära ekvationssystem',
            description: 'Lösa ekvationssystem med Gausselimination',
            baseDifficulty: 3,
            engineeringContext: 'Linjära ekvationssystem är grunden för FEM-analys och maskininlärning.',
        },
        {
            courseId: tata24.id,
            slug: 'matriser',
            title: 'Matriser och matrisoperationer',
            description: 'Matrisaddition, multiplikation, transponering och invers',
            baseDifficulty: 3,
            engineeringContext: 'Matrismultiplikation driver neurala nätverk och bildfiltrering.',
        },
        {
            courseId: tata24.id,
            slug: 'determinanter',
            title: 'Determinanter',
            description: 'Beräkning och tolkning av determinanter',
            baseDifficulty: 4,
            engineeringContext: 'Determinanter avgör om ett system har en unik lösning.',
        },
        {
            courseId: tata24.id,
            slug: 'egenvarden',
            title: 'Egenvärden och egenvektorer',
            description: 'Hitta och tillämpa egenvärden och egenvektorer',
            baseDifficulty: 5,
            engineeringContext: 'Egenvärden används i vibrationsanalys, Googles PageRank och PCA.',
        },
        // TATA41 — Envariabelanalys 1
        {
            courseId: tata41.id,
            slug: 'gransvarden',
            title: 'Gränsvärden och kontinuitet',
            description: 'Förstå gränsvärden och kontinuerliga funktioner',
            baseDifficulty: 3,
            engineeringContext: 'Gränsvärden är grunden för alla approximationer i numeriska metoder.',
        },
        {
            courseId: tata41.id,
            slug: 'derivata',
            title: 'Derivata och differentieringsregler',
            description: 'Differentieringsregler och tillämpningar',
            baseDifficulty: 3,
            engineeringContext: 'Derivata = förändringshastighet. Hastighet, acceleration, strömstyrka.',
        },
        {
            courseId: tata41.id,
            slug: 'integration',
            title: 'Integraler och integrationstekniker',
            description: 'Bestämda och obestämda integraler, substitution, partiell integration',
            baseDifficulty: 4,
            engineeringContext: 'Integraler beräknar area, volym, energi och sannolikhet.',
        },
        {
            courseId: tata41.id,
            slug: 'taylorutveckling',
            title: 'Taylorutveckling och serier',
            description: 'Taylorserier, konvergenstest och potensserier',
            baseDifficulty: 5,
            engineeringContext: 'Taylorserier möjliggör approximationer i reglerteknik och signalbehandling.',
        },
        // TSRT19 — Reglerteknik
        {
            courseId: tsrt19.id,
            slug: 'laplacetransform',
            title: 'Laplacetransform',
            description: 'Laplacetransform och dess egenskaper',
            baseDifficulty: 4,
            engineeringContext: 'Laplacetransform konverterar differentialekvationer till algebraiska ekvationer.',
        },
        {
            courseId: tsrt19.id,
            slug: 'transferfunktion',
            title: 'Transferfunktioner och blockdiagram',
            description: 'Transferfunktioner, blockdiagram och signalflödesgrafer',
            baseDifficulty: 4,
            engineeringContext: 'Transferfunktioner beskriver ingenjörssystem i frekvensplanet.',
        },
        {
            courseId: tsrt19.id,
            slug: 'stabilitet',
            title: 'Stabilitet och Routh-Hurwitz',
            description: 'Stabilitetskriterier och Routh-Hurwitz',
            baseDifficulty: 5,
            engineeringContext: 'Stabilitetsanalys är avgörande för säker design av reglersystem.',
        },
    ];

    const insertedTopics = await db.insert(topics).values(topicData).returning();
    console.log(`   ✓ Inserted ${insertedTopics.length} topics`);

    // Get topic references for questions
    const gransvarden = insertedTopics.find(t => t.slug === 'gransvarden')!;
    const derivata = insertedTopics.find(t => t.slug === 'derivata')!;
    const matriser = insertedTopics.find(t => t.slug === 'matriser')!;
    const egenvarden = insertedTopics.find(t => t.slug === 'egenvarden')!;

    // ============================================
    // 4. QUESTIONS (sample — admin creates real ones)
    // ============================================
    console.log('❓ Seeding sample questions...');

    const questionData = [
        // Gränsvärden
        {
            topicId: gransvarden.id,
            contentMarkdown: 'Beräkna $\\lim_{x \\to 2} (3x + 1)$',
            questionType: 'numeric',
            correctAnswer: '7',
            options: null,
            explanationMarkdown: 'Direkt insättning: $3 \\cdot 2 + 1 = 7$',
            difficultyTier: 1,
            status: 'published',
            isPublished: true,
        },
        {
            topicId: gransvarden.id,
            contentMarkdown: 'Beräkna $\\lim_{x \\to 0} \\dfrac{\\sin x}{x}$',
            questionType: 'numeric',
            correctAnswer: '1',
            options: null,
            explanationMarkdown: 'Detta är ett klassiskt gränsvärde. Via L\'Hôpitals regel eller klämlemmat är gränsvärdet 1.',
            difficultyTier: 3,
            status: 'published',
            isPublished: true,
        },
        // Derivata
        {
            topicId: derivata.id,
            contentMarkdown: 'Vad är derivatan av $f(x) = x^3$?',
            questionType: 'multiple_choice',
            correctAnswer: '3x²',
            options: ['x²', '3x²', '3x³', 'x³'],
            explanationMarkdown: 'Potensregeln: $\\frac{d}{dx}x^n = nx^{n-1}$, alltså $\\frac{d}{dx}x^3 = 3x^2$',
            difficultyTier: 1,
            status: 'published',
            isPublished: true,
        },
        // Matriser
        {
            topicId: matriser.id,
            contentMarkdown: 'Beräkna skalärprodukten av vektorerna $\\vec{a} = (3, 4)$ och $\\vec{b} = (2, -1)$.',
            questionType: 'numeric',
            correctAnswer: '2',
            options: null,
            explanationMarkdown: 'Skalärprodukten: $\\vec{a} \\cdot \\vec{b} = 3 \\cdot 2 + 4 \\cdot (-1) = 6 - 4 = 2$',
            difficultyTier: 1,
            status: 'published',
            isPublished: true,
        },
        // Egenvärden (draft — needs AI analysis)
        {
            topicId: egenvarden.id,
            contentMarkdown: 'Vilka är egenvärden till matrisen $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$?',
            questionType: 'multiple_choice',
            correctAnswer: '1 och 3',
            options: ['1 och 3', '2 och 2', '0 och 4', '−1 och 3'],
            explanationMarkdown: 'Karakteristisk ekvation: $\\det(A - \\lambda I) = (2-\\lambda)^2 - 1 = 0$, ger $\\lambda = 1$ och $\\lambda = 3$.',
            difficultyTier: 3,
            status: 'draft',
            isPublished: false,
        },
    ];

    const insertedQuestions = await db.insert(questions).values(questionData).returning();
    console.log(`   ✓ Inserted ${insertedQuestions.length} questions`);

    // ============================================
    // 5. TEST USER (for development)
    // ============================================
    console.log('👤 Seeding test users...');

    const hashedPassword = await bcrypt.hash('test123456', 10);
    const adminHashedPassword = await bcrypt.hash('admin123456', 10);

    const [testUser] = await db.insert(users).values({
        email: 'test@qmath.se',
        password: hashedPassword,
        name: 'Test Student',
        role: 'student',
    }).returning();

    await db.insert(profiles).values({
        id: testUser.id,
        universityId: liu.id,
        universityProgram: 'Civilingenjör D',
        enrollmentYear: 2024,
        targetGpa: 4.5,
    });

    const [adminUser] = await db.insert(users).values({
        email: 'admin@qmath.se',
        password: adminHashedPassword,
        name: 'Admin',
        role: 'admin',
    }).returning();

    await db.insert(profiles).values({
        id: adminUser.id,
        universityId: liu.id,
        universityProgram: 'Staff',
    });

    console.log(`   ✓ Created test user: test@qmath.se (password: test123456)`);
    console.log(`   ✓ Created admin user: admin@qmath.se (password: admin123456)`);

    // ============================================
    // DONE
    // ============================================
    console.log('\n✅ Database seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   • ${insertedUniversities.length} universities`);
    console.log(`   • ${insertedCourses.length} courses (TATA41, TATA24, TSRT19)`);
    console.log(`   • ${insertedTopics.length} topics`);
    console.log(`   • ${insertedQuestions.length} questions (${questionData.filter(q => q.isPublished).length} published)`);
    console.log(`   • 2 test users`);
    console.log('\n🔐 Test credentials:');
    console.log('   Email: test@qmath.se / Password: test123456');
    console.log('   Email: admin@qmath.se / Password: admin123456');

    process.exit(0);
}

seed().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
