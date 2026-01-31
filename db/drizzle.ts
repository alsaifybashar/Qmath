import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is missing in production');
}

// In development, we use a local sqlite file
// In production (if sticking to sqlite), we can point to a file on disk
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'qmath.db';

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
