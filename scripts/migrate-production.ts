import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from '../db/drizzle';

async function main() {
    const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
    if (!url || url.startsWith('file:')) {
        throw new Error('Production migrations require a remote TURSO_DATABASE_URL.');
    }
    if (!process.env.TURSO_AUTH_TOKEN) {
        throw new Error('TURSO_AUTH_TOKEN is required for production migrations.');
    }

    await migrate(db, { migrationsFolder: './db/production-migrations' });
    console.log('Production database migrations applied.');
}

void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown migration error';
    console.error(`Production database migration failed: ${message}`);
    process.exitCode = 1;
});
