
import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true, quiet: true });

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:qmath.db';

export default {
    schema: ['./db/schema.ts', './db/dashboard-schema.ts', './db/content-schema.ts'],
    out: './db/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url,
    },
} satisfies Config;
