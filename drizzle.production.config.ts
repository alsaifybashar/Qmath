import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true, quiet: true });

const url = process.env.TURSO_DATABASE_URL ?? '';
if (!url || url.startsWith('file:')) {
    throw new Error('TURSO_DATABASE_URL must reference a remote Turso/libSQL database.');
}

export default {
    schema: ['./db/schema.ts', './db/dashboard-schema.ts', './db/content-schema.ts'],
    out: './db/production-migrations',
    dialect: 'turso',
    dbCredentials: {
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
    },
} satisfies Config;
