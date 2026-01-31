
import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// For sqlite, url is just the filename usually for better-sqlite3
const url = process.env.DATABASE_URL?.replace('file:', '') || 'qmath.db';

export default {
    schema: './db/schema.ts',
    out: './db/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: url,
    },
} satisfies Config;
