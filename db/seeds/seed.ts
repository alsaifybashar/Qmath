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
        { name: 'KTH Royal Institute of Technology', country: 'Sweden', logoUrl: '/logos/kth.png' },
        { name: 'Chalmers University of Technology', country: 'Sweden', logoUrl: '/logos/chalmers.png' },
        { name: 'Lund University', country: 'Sweden', logoUrl: '/logos/lund.png' },
        { name: 'Uppsala University', country: 'Sweden', logoUrl: '/logos/uppsala.png' },
        { name: 'Stockholm University', country: 'Sweden', logoUrl: '/logos/stockholm.png' },
        { name: 'MIT', country: 'United States', logoUrl: '/logos/mit.png' },
        { name: 'ETH Zürich', country: 'Switzerland', logoUrl: '/logos/eth.png' },
    ];

    const insertedUniversities = await db.insert(universities).values(universityData).returning();
    console.log(`   ✓ Inserted ${insertedUniversities.length} universities`);

    // Get KTH for course references
    const kth = insertedUniversities.find(u => u.name.includes('KTH'))!;
    const chalmers = insertedUniversities.find(u => u.name.includes('Chalmers'))!;

    // ============================================
    // 2. COURSES
    // ============================================
    console.log('📖 Seeding courses...');

    const courseData = [
        // KTH Courses
        { universityId: kth.id, code: 'SF1672', name: 'Linear Algebra', description: 'Fundamental linear algebra for engineering students', semester: 'Fall 2026' },
        { universityId: kth.id, code: 'SF1625', name: 'Calculus in One Variable', description: 'Differential and integral calculus', semester: 'Fall 2026' },
        { universityId: kth.id, code: 'SF1626', name: 'Calculus in Several Variables', description: 'Multivariable calculus and vector analysis', semester: 'Spring 2026' },
        { universityId: kth.id, code: 'SF1901', name: 'Probability Theory and Statistics', description: 'Fundamentals of probability and statistical inference', semester: 'Spring 2026' },
        { universityId: kth.id, code: 'SF1811', name: 'Optimization', description: 'Linear and nonlinear optimization methods', semester: 'Fall 2026' },
        // Chalmers Courses
        { universityId: chalmers.id, code: 'MVE035', name: 'Mathematical Analysis in One Variable', description: 'Single variable calculus', semester: 'Fall 2026' },
        { universityId: chalmers.id, code: 'MVE045', name: 'Linear Algebra', description: 'Linear algebra and matrix theory', semester: 'Fall 2026' },
        { universityId: chalmers.id, code: 'MVE055', name: 'Mathematical Analysis in Several Variables', description: 'Multivariable calculus', semester: 'Spring 2026' },
    ];

    const insertedCourses = await db.insert(courses).values(courseData).returning();
    console.log(`   ✓ Inserted ${insertedCourses.length} courses`);

    // Get course references
    const linearAlgebra = insertedCourses.find(c => c.code === 'SF1672')!;
    const calculus1 = insertedCourses.find(c => c.code === 'SF1625')!;

    // ============================================
    // 3. TOPICS
    // ============================================
    console.log('🎯 Seeding topics...');

    const topicData = [
        // Linear Algebra Topics
        { courseId: linearAlgebra.id, slug: 'vectors-in-rn', title: 'Vectors in Rⁿ', description: 'Introduction to vectors, operations, and geometric interpretation', baseDifficulty: 2, prerequisites: null },
        { courseId: linearAlgebra.id, slug: 'linear-equations', title: 'Systems of Linear Equations', description: 'Solving systems using Gaussian elimination', baseDifficulty: 3, prerequisites: ['vectors-in-rn'] },
        { courseId: linearAlgebra.id, slug: 'matrix-operations', title: 'Matrix Operations', description: 'Matrix addition, multiplication, transpose, and inverse', baseDifficulty: 3, prerequisites: ['linear-equations'] },
        { courseId: linearAlgebra.id, slug: 'determinants', title: 'Determinants', description: 'Computing and interpreting determinants', baseDifficulty: 4, prerequisites: ['matrix-operations'] },
        { courseId: linearAlgebra.id, slug: 'eigenvalues', title: 'Eigenvalues and Eigenvectors', description: 'Finding and applying eigenvalues and eigenvectors', baseDifficulty: 6, prerequisites: ['determinants'] },
        { courseId: linearAlgebra.id, slug: 'vector-spaces', title: 'Vector Spaces', description: 'Abstract vector spaces, subspaces, and linear independence', baseDifficulty: 5, prerequisites: ['matrix-operations'] },
        { courseId: linearAlgebra.id, slug: 'linear-transformations', title: 'Linear Transformations', description: 'Linear maps, kernel, and image', baseDifficulty: 6, prerequisites: ['vector-spaces'] },
        // Calculus Topics
        { courseId: calculus1.id, slug: 'limits', title: 'Limits and Continuity', description: 'Understanding limits and continuous functions', baseDifficulty: 3, prerequisites: null },
        { courseId: calculus1.id, slug: 'derivatives', title: 'Derivatives', description: 'Differentiation rules and applications', baseDifficulty: 4, prerequisites: ['limits'] },
        { courseId: calculus1.id, slug: 'integration', title: 'Integration', description: 'Definite and indefinite integrals', baseDifficulty: 5, prerequisites: ['derivatives'] },
        { courseId: calculus1.id, slug: 'integration-techniques', title: 'Integration Techniques', description: 'Substitution, parts, and partial fractions', baseDifficulty: 6, prerequisites: ['integration'] },
        { courseId: calculus1.id, slug: 'series', title: 'Infinite Series', description: 'Convergence tests and power series', baseDifficulty: 7, prerequisites: ['integration-techniques'] },
    ];

    const insertedTopics = await db.insert(topics).values(topicData).returning();
    console.log(`   ✓ Inserted ${insertedTopics.length} topics`);

    // Get topic references for questions
    const vectorsTopic = insertedTopics.find(t => t.slug === 'vectors-in-rn')!;
    const limitsTopic = insertedTopics.find(t => t.slug === 'limits')!;
    const derivativesTopic = insertedTopics.find(t => t.slug === 'derivatives')!;

    // ============================================
    // 4. QUESTIONS
    // ============================================
    console.log('❓ Seeding questions...');

    const questionData = [
        // Vectors Questions
        {
            topicId: vectorsTopic.id,
            contentMarkdown: 'Calculate the dot product of vectors $\\vec{a} = (3, 4)$ and $\\vec{b} = (2, -1)$.',
            questionType: 'numeric',
            correctAnswer: '2',
            options: null,
            explanationMarkdown: 'The dot product is $\\vec{a} \\cdot \\vec{b} = 3 \\times 2 + 4 \\times (-1) = 6 - 4 = 2$',
            difficultyTier: 1,
        },
        {
            topicId: vectorsTopic.id,
            contentMarkdown: 'What is the magnitude of vector $\\vec{v} = (3, 4)$?',
            questionType: 'numeric',
            correctAnswer: '5',
            options: null,
            explanationMarkdown: 'The magnitude is $|\\vec{v}| = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$',
            difficultyTier: 1,
        },
        {
            topicId: vectorsTopic.id,
            contentMarkdown: 'Which of the following is the cross product $\\vec{i} \\times \\vec{j}$?',
            questionType: 'multiple_choice',
            correctAnswer: 'k',
            options: ['i', 'j', 'k', '-k', '0'],
            explanationMarkdown: 'By the right-hand rule, $\\vec{i} \\times \\vec{j} = \\vec{k}$',
            difficultyTier: 2,
        },
        // Limits Questions
        {
            topicId: limitsTopic.id,
            contentMarkdown: 'Evaluate $\\lim_{x \\to 2} (3x + 1)$',
            questionType: 'numeric',
            correctAnswer: '7',
            options: null,
            explanationMarkdown: 'Direct substitution: $3(2) + 1 = 7$',
            difficultyTier: 1,
        },
        {
            topicId: limitsTopic.id,
            contentMarkdown: 'Evaluate $\\lim_{x \\to 0} \\frac{\\sin x}{x}$',
            questionType: 'numeric',
            correctAnswer: '1',
            options: null,
            explanationMarkdown: 'This is a famous limit. By L\'Hôpital\'s rule or the squeeze theorem, the limit equals 1.',
            difficultyTier: 3,
        },
        // Derivatives Questions
        {
            topicId: derivativesTopic.id,
            contentMarkdown: 'Find the derivative of $f(x) = x^3$',
            questionType: 'multiple_choice',
            correctAnswer: '3x²',
            options: ['x²', '3x²', '3x³', 'x³'],
            explanationMarkdown: 'Using the power rule: $\\frac{d}{dx}x^n = nx^{n-1}$, so $\\frac{d}{dx}x^3 = 3x^2$',
            difficultyTier: 1,
        },
        {
            topicId: derivativesTopic.id,
            contentMarkdown: 'Find $\\frac{d}{dx}[e^x \\sin x]$',
            questionType: 'multiple_choice',
            correctAnswer: 'eˣ(sin x + cos x)',
            options: ['eˣ cos x', 'eˣ sin x', 'eˣ(sin x + cos x)', 'eˣ(sin x - cos x)'],
            explanationMarkdown: 'Using the product rule: $(uv)\' = u\'v + uv\'$. Here $u = e^x$, $v = \\sin x$, so the derivative is $e^x \\sin x + e^x \\cos x = e^x(\\sin x + \\cos x)$',
            difficultyTier: 3,
        },
    ];

    const insertedQuestions = await db.insert(questions).values(questionData).returning();
    console.log(`   ✓ Inserted ${insertedQuestions.length} questions`);

    // ============================================
    // 5. TEST USER (for development)
    // ============================================
    console.log('👤 Seeding test user...');

    const hashedPassword = await bcrypt.hash('test123456', 10);

    const [testUser] = await db.insert(users).values({
        email: 'test@qmath.se',
        password: hashedPassword,
        name: 'Test Student',
        role: 'student',
    }).returning();

    await db.insert(profiles).values({
        id: testUser.id,
        universityId: kth.id,
        universityProgram: 'Computer Science',
        enrollmentYear: 2024,
        targetGpa: 4.5,
    });

    console.log(`   ✓ Created test user: test@qmath.se (password: test123456)`);

    // ============================================
    // DONE
    // ============================================
    console.log('\n✅ Database seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   • ${insertedUniversities.length} universities`);
    console.log(`   • ${insertedCourses.length} courses`);
    console.log(`   • ${insertedTopics.length} topics`);
    console.log(`   • ${insertedQuestions.length} questions`);
    console.log(`   • 1 test user`);
    console.log('\n🔐 Test credentials:');
    console.log('   Email: test@qmath.se');
    console.log('   Password: test123456');

    process.exit(0);
}

seed().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
