import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import * as dashboardSchema from './dashboard-schema';
import * as contentSchema from './content-schema';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const repoRoot = path.resolve(currentDir, '..');

dotenv.config({ path: path.join(repoRoot, '.env.local') });

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is missing in production');
}

// In development, we use a local sqlite file
// In production (if sticking to sqlite), we can point to a file on disk
const rawDatabasePath = process.env.DATABASE_URL?.replace('file:', '') || 'qmath.db';
const dbPath = path.isAbsolute(rawDatabasePath)
    ? rawDatabasePath
    : path.resolve(repoRoot, rawDatabasePath);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema: { ...schema, ...dashboardSchema, ...contentSchema } });
