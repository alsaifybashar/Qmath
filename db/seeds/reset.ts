import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

/**
 * Reset database - drops all data and re-seeds
 * Run with: npx tsx db/seeds/reset.ts
 * 
 * WARNING: This will DELETE all data!
 */

async function reset() {
    console.log('⚠️  WARNING: This will DELETE all data in the database!');
    console.log('');

    // SQLite doesn't support TRUNCATE, use DELETE FROM
    // Also disable FK constraints potentially or just delete in order

    const tables = [
        'attempt_logs',
        'user_mastery',
        'questions',
        'topics',
        'courses',
        'profiles',
        'users',
        'universities',
    ];

    console.log('🗑️  Clearing tables...');

    // Disable foreign keys to avoid constraint issues during truncation-like behavior
    try {
        await db.run(sql`PRAGMA foreign_keys = OFF`);
    } catch (e) {
        // Better-sqlite3 run method vs execute. Drizzle execute should work.
    }

    for (const table of tables) {
        try {
            await db.run(sql.raw(`DELETE FROM "${table}"`));
            // Reset autoincrement sequence if any? UUIDs used, so no sequence usually.
            console.log(`   ✓ Cleared ${table}`);
        } catch (error) {
            console.error(`   ⚠ Could not clear ${table}:`, error);
        }
    }

    try {
        await db.run(sql`PRAGMA foreign_keys = ON`);
    } catch (e) { }

    console.log('\n🌱 Re-seeding database...\n');

    // Dynamic import and execute seed
    await import('./seed');
}

reset().catch((error) => {
    console.error('❌ Reset failed:', error);
    process.exit(1);
});
