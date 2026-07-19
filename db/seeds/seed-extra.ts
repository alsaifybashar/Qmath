import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../drizzle';
import { courses, topics, users, prerequisiteEdges, articles } from '../schema';
import { flashcardDecks, flashcards, flashcardCardState } from '../dashboard-schema';
import { and, eq } from 'drizzle-orm';
import { ArticleBlock } from '../../types/articles';

async function seedExtra() {
    try {
        console.log('🌱 Seeding extra mock data (prerequisites, articles, flashcards)...');

        // 1. Fetch required database entities
        const testUser = await db.query.users.findFirst({
            where: eq(users.email, 'test@qmath.se'),
        });
        const adminUser = await db.query.users.findFirst({
            where: eq(users.email, 'admin@qmath.se'),
        });

        if (!testUser || !adminUser) {
            console.error('❌ Test or Admin user not found. Please run base seeds first.');
            process.exit(1);
        }

        const allCourses = await db.select().from(courses);
        const allTopics = await db.select().from(topics);

        const findTopicBySlug = (slug: string) => allTopics.find(t => t.slug === slug);

        // 2. PREREQUISITE EDGES (Topic dependency tree)
        console.log('🔗 Seeding prerequisite edges...');
        const prerequisites = [
            // Linear Algebra
            { from: 'vektorer-rn', to: 'matriser', strength: 0.8, type: 'required' },
            { from: 'linjara-ekvationssystem', to: 'matriser', strength: 0.9, type: 'required' },
            { from: 'matriser', to: 'determinanter', strength: 0.9, type: 'required' },
            { from: 'determinanter', to: 'egenvarden', strength: 0.95, type: 'required' },
            { from: 'matriser', to: 'egenvarden', strength: 0.85, type: 'recommended' },
            // Calculus
            { from: 'gransvarden', to: 'derivata', strength: 0.95, type: 'required' },
            { from: 'derivata', to: 'integration', strength: 0.9, type: 'required' },
            { from: 'derivata', to: 'taylorutveckling', strength: 0.85, type: 'required' },
            // Control Theory
            { from: 'laplacetransform', to: 'transferfunktion', strength: 0.9, type: 'required' },
            { from: 'transferfunktion', to: 'stabilitet', strength: 0.95, type: 'required' },
        ];

        let prereqCount = 0;
        for (const prereq of prerequisites) {
            const fromTopic = findTopicBySlug(prereq.from);
            const toTopic = findTopicBySlug(prereq.to);

            if (fromTopic && toTopic) {
                // Clear existing first
                await db.delete(prerequisiteEdges).where(and(
                    eq(prerequisiteEdges.fromTopicId, fromTopic.id),
                    eq(prerequisiteEdges.toTopicId, toTopic.id),
                ));

                await db.insert(prerequisiteEdges).values({
                    fromTopicId: fromTopic.id,
                    toTopicId: toTopic.id,
                    strength: prereq.strength,
                    edgeType: prereq.type,
                });
                prereqCount++;
            }
        }
        console.log(`   ✓ Seeded ${prereqCount} prerequisite edges`);

        // 3. ARTICLES
        console.log('📖 Seeding study articles...');
        const linAlgCourse = allCourses.find(c => c.code === 'TATA24');
        const calcCourse = allCourses.find(c => c.code === 'TATA41');

        const matriserTopic = findTopicBySlug('matriser');
        const limitsTopic = findTopicBySlug('gransvarden');

        const articleData = [
            {
                slug: 'understanding-matrices-and-vectors',
                title: 'Understanding Matrices and Vectors',
                titleSv: 'Förstå matriser och vektorer',
                excerpt: 'A foundational introduction to matrices, matrix multiplication, and vector spaces for engineering students.',
                courseId: linAlgCourse?.id || null,
                topicId: matriserTopic?.id || null,
                status: 'published' as const,
                authorId: adminUser.id,
                tags: ['linear-algebra', 'matrices', 'vectors', 'foundation'],
                readingTimeMinutes: 5,
                publishedAt: new Date(),
                contentBlocks: [
                    {
                        type: 'heading' as const,
                        level: 2,
                        text: 'What is a Matrix?'
                    },
                    {
                        type: 'text' as const,
                        markdown: 'A **matrix** is a rectangular array of numbers arranged in rows and columns. In engineering applications, matrices are used to represent linear transformations, solve systems of linear equations, and represent physical state spaces.'
                    },
                    {
                        type: 'latex' as const,
                        display: 'block' as const,
                        formula: 'A = \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}',
                        caption: 'A standard 2x2 matrix representation'
                    },
                    {
                        type: 'callout' as const,
                        variant: 'definition' as const,
                        title: 'Definition of Matrix Dimensions',
                        text: 'A matrix with $m$ rows and $n$ columns is called an $m \\times n$ matrix (read as "m by n matrix"). The numbers $m$ and $n$ are its dimensions.'
                    },
                    {
                        type: 'heading' as const,
                        level: 2,
                        text: 'Matrix Multiplication'
                    },
                    {
                        type: 'text' as const,
                        markdown: 'Multiplying two matrices is only possible if the number of columns in the first matrix equals the number of rows in the second. If $A$ is an $m \\times n$ matrix and $B$ is an $n \\times p$ matrix, their product $C = AB$ is an $m \\times p$ matrix.'
                    },
                    {
                        type: 'latex' as const,
                        display: 'block' as const,
                        formula: 'c_{ij} = \\sum_{k=1}^{n} a_{ik} b_{kj}',
                        caption: 'Formula for the element at row i and column j of the product matrix'
                    },
                    {
                        type: 'callout' as const,
                        variant: 'example' as const,
                        title: 'Real-world application',
                        text: 'In 3D computer graphics, matrices represent rotations, translations, and scaling operations. Multiplying state vectors by these matrices updates the position of 3D objects in real time!'
                    }
                ] as ArticleBlock[],
            },
            {
                slug: 'limits-and-continuity',
                title: 'Limits and Continuity',
                titleSv: 'Gränsvärden och kontinuitet',
                excerpt: 'Master the concept of limits, how to handle indeterminate forms, and the mathematical definition of continuity.',
                courseId: calcCourse?.id || null,
                topicId: limitsTopic?.id || null,
                status: 'published' as const,
                authorId: adminUser.id,
                tags: ['calculus', 'limits', 'continuity', 'core'],
                readingTimeMinutes: 4,
                publishedAt: new Date(),
                contentBlocks: [
                    {
                        type: 'heading' as const,
                        level: 2,
                        text: 'Intuitive Definition of a Limit'
                    },
                    {
                        type: 'text' as const,
                        markdown: 'In calculus, we are often interested in the behavior of a function $f(x)$ as $x$ gets extremely close to a value $a$, without necessarily reaching it. We say that the limit of $f(x)$ as $x$ approaches $a$ is $L$.'
                    },
                    {
                        type: 'latex' as const,
                        display: 'block' as const,
                        formula: '\\lim_{x \\to a} f(x) = L',
                        caption: 'Mathematical notation for a limit'
                    },
                    {
                        type: 'callout' as const,
                        variant: 'tip' as const,
                        title: 'One-Sided Limits',
                        text: 'For the limit to exist at a point, the left-hand limit $\\lim_{x \\to a^-} f(x)$ and the right-hand limit $\\lim_{x \\to a^+} f(x)$ must both exist and be equal.'
                    },
                    {
                        type: 'heading' as const,
                        level: 2,
                        text: 'Defining Continuity'
                    },
                    {
                        type: 'text' as const,
                        markdown: 'Graphically, a function is continuous if you can draw its graph without lifting your pen. Formally, a function $f(x)$ is continuous at a point $a$ if three conditions are met:'
                    },
                    {
                        type: 'text' as const,
                        markdown: '1. $f(a)$ is defined (the point is in the domain of $f$).\n2. $\\lim_{x \\to a} f(x)$ exists.\n3. $\\lim_{x \\to a} f(x) = f(a)$ (the limit equals the actual value).'
                    },
                    {
                        type: 'latex' as const,
                        display: 'block' as const,
                        formula: '\\lim_{x \\to a} f(x) = f(a)',
                        caption: 'The formal definition of continuity at a point'
                    }
                ] as ArticleBlock[],
            }
        ];

        for (const art of articleData) {
            // Delete existing article with the same slug first
            await db.delete(articles).where(eq(articles.slug, art.slug));

            await db.insert(articles).values({
                slug: art.slug,
                title: art.title,
                titleSv: art.titleSv,
                excerpt: art.excerpt,
                courseId: art.courseId,
                topicId: art.topicId,
                status: art.status,
                authorId: art.authorId,
                tags: art.tags,
                readingTimeMinutes: art.readingTimeMinutes,
                publishedAt: art.publishedAt,
                contentBlocks: JSON.stringify(art.contentBlocks),
            });
            console.log(`   ✓ Seeded article: "${art.title}"`);
        }

        // 4. FLASHCARDS & FLASHCARD DECKS
        console.log('📇 Seeding flashcard decks & cards...');
        
        // Deck 1: Linear Algebra
        const [linAlgDeck] = await db.insert(flashcardDecks).values({
            userId: testUser.id,
            name: 'Linear Algebra - Matrices',
            description: 'Core concepts, matrix multiplication, and properties.',
            color: 'blue',
            topicId: matriserTopic?.id || null,
        }).returning();
        
        // Deck 2: Calculus
        const derivataTopic = findTopicBySlug('derivata');
        const [calcDeck] = await db.insert(flashcardDecks).values({
            userId: testUser.id,
            name: 'Calculus - Derivatives',
            description: 'Common differentiation rules and derivatives of standard functions.',
            color: 'green',
            topicId: derivataTopic?.id || null,
        }).returning();

        // Flashcards for Linear Algebra
        const linAlgCards = [
            {
                front: 'What is the condition for matrix multiplication $AB$ to be defined?',
                back: 'The number of columns in $A$ must equal the number of rows in $B$.',
                frontMath: 'A_{m \\times n} B_{p \\times q} \\implies \\text{defined if } ?',
                backMath: 'n = p',
            },
            {
                front: 'Is matrix multiplication commutative in general (i.e. does $AB = BA$)?',
                back: 'No, matrix multiplication is generally not commutative. Even if both products are defined, $AB$ and $BA$ may have different dimensions or different elements.',
                frontMath: 'AB = BA \\quad ?',
                backMath: '\\text{False in general}',
            },
            {
                front: 'What is the transpose of a product of two matrices $(AB)^T$?',
                back: 'The transpose of a product is the product of the transposes in reverse order.',
                frontMath: '(AB)^T = ?',
                backMath: 'B^T A^T',
            }
        ];

        // Flashcards for Calculus
        const calcCards = [
            {
                front: 'What is the derivative of $\\ln(x)$?',
                back: 'The derivative of $\\ln(x)$ is $1/x$ for $x > 0$.',
                frontMath: '\\frac{d}{dx} \\ln(x) = ?',
                backMath: '\\frac{1}{x}',
            },
            {
                front: 'What is the Product Rule for differentiation?',
                back: 'The derivative of a product of two functions is the derivative of the first times the second, plus the first times the derivative of the second.',
                frontMath: '\\frac{d}{dx} [f(x)g(x)] = ?',
                backMath: "f'(x)g(x) + f(x)g'(x)",
            },
            {
                front: 'What is the derivative of $\\sin(x)$ and $\\cos(x)$?',
                back: 'The derivative of $\\sin(x)$ is $\\cos(x)$, and the derivative of $\\cos(x)$ is $-\\sin(x)$.',
                frontMath: '\\frac{d}{dx} \\sin(x) = ? \\quad \\text{and} \\quad \\frac{d}{dx} \\cos(x) = ?',
                backMath: '\\cos(x) \\quad \\text{and} \\quad -\\sin(x)',
            }
        ];

        const insertDeckCards = async (deckId: string, topicId: string | null, cards: typeof linAlgCards) => {
            for (const card of cards) {
                const [insertedCard] = await db.insert(flashcards).values({
                    userId: testUser.id,
                    deckId,
                    topicId,
                    type: 'basic',
                    front: card.front,
                    back: card.back,
                    frontMath: card.frontMath,
                    backMath: card.backMath,
                    sourceContextType: 'manual',
                }).returning();

                // Initialize state for spaced repetition (FSRS)
                await db.insert(flashcardCardState).values({
                    cardId: insertedCard.id,
                    userId: testUser.id,
                    stability: 1.0,
                    difficulty: 1.0,
                    elapsedDays: 0,
                    scheduledDays: 0,
                    reps: 0,
                    lapses: 0,
                    state: 'new',
                    nextReview: new Date(),
                });
            }
        };

        await insertDeckCards(linAlgDeck.id, matriserTopic?.id || null, linAlgCards);
        await insertDeckCards(calcDeck.id, derivataTopic?.id || null, calcCards);

        console.log('   ✓ Seeded flashcards and cards states');
        
        console.log('\n✅ Extra seeding complete! All advanced sections populated.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Extra seeding failed:', error);
        process.exit(1);
    }
}

seedExtra();
