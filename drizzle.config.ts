
import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: '.env.local' });

// For sqlite, use absolute path
const dbUrl = process.env.DATABASE_URL || 'file:./qmath.db';
const relativePath = dbUrl.replace('file:', '').replace('./', '');
const url = path.resolve(process.cwd(), relativePath);

export default {
    schema: ['./db/schema.ts', './db/dashboard-schema.ts', './db/content-schema.ts'],
    out: './db/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: url,
    },
} satisfies Config;
