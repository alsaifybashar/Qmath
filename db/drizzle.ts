import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema';
import * as dashboardSchema from './dashboard-schema';
import * as contentSchema from './content-schema';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..');
dotenv.config({ path: path.join(repoRoot, '.env.local'), quiet: true });

const databaseUrl = process.env.TURSO_DATABASE_URL
    ?? process.env.DATABASE_URL
    ?? 'file:qmath.db';
const isLocalFile = databaseUrl.startsWith('file:');
const isSupportedRemote = databaseUrl.startsWith('libsql:')
    || databaseUrl.startsWith('https:')
    || databaseUrl.startsWith('http:')
    || databaseUrl.startsWith('wss:')
    || databaseUrl.startsWith('ws:');

if (!isLocalFile && !isSupportedRemote) {
    throw new Error('Unsupported database URL. Configure a Turso/libSQL URL or a local file: URL.');
}
if (process.env.VERCEL && isLocalFile) {
    throw new Error('Production requires TURSO_DATABASE_URL; local SQLite files are ephemeral on Vercel.');
}
if (!isLocalFile && !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is required in production.');
}

export const databaseClient = createClient({
    url: databaseUrl,
    authToken: isLocalFile ? undefined : process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(databaseClient, {
    schema: { ...schema, ...dashboardSchema, ...contentSchema },
});
