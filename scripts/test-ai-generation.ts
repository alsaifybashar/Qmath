/**
 * Test AI Content Generation
 * Run with: npx tsx scripts/test-ai-generation.ts
 */

import dotenv from 'dotenv';
// Load .env.local first
dotenv.config({ path: '.env.local' });

import { ContentGenerator } from '../lib/content-generation';
import { db } from '../db/drizzle';
import { topics } from '../db/schema';

async function main() {
    console.log('Testing AI Content Generation with Anthropic...\n');

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('❌ ANTHROPIC_API_KEY not set in environment');
        process.exit(1);
    }
    console.log('✅ Anthropic API key found\n');

    // Get a topic
    const allTopics = await db.select().from(topics).limit(5);
    console.log(`Found ${allTopics.length} topics in database`);

    if (allTopics.length === 0) {
        console.error('❌ No topics found in database');
        process.exit(1);
    }

    const topic = allTopics[0];
    console.log(`📚 Using topic: ${topic.title}\n`);

    // Create generator with anthropic provider
    const generator = new ContentGenerator('anthropic');

    console.log('🤖 Generating free-form symbolic content...\n');
    const startTime = Date.now();

    const result = await generator.generate({
        topicId: topic.id,
        contentType: 'free_form_symbolic',
        difficulty: 0.5,
    });

    const elapsed = Date.now() - startTime;

    if (result.success) {
        console.log('✅ Content generated successfully!\n');
        console.log('📝 Generated content:');
        console.log(JSON.stringify(result.content, null, 2));
        console.log(`\n⏱️  Generation time: ${elapsed}ms`);
        console.log(`📌 Content ID: ${result.contentId}`);
    } else {
        console.error('❌ Generation failed:', result.error);
    }

    process.exit(0);
}

main().catch(console.error);
