import Database from 'better-sqlite3';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const configured = process.env.DATABASE_URL ?? 'file:./qmath.db';
if (!configured.startsWith('file:')) {
    throw new Error('The current Drizzle adapter supports SQLite file: URLs only. PostgreSQL migration is required before production.');
}

const databasePath = path.resolve(process.cwd(), configured.slice('file:'.length));
const sqlite = new Database(databasePath);
sqlite.pragma('foreign_keys = ON');

const hasSessionVersion = sqlite
    .prepare("SELECT 1 FROM pragma_table_info('users') WHERE name = 'session_version'")
    .get();

sqlite.transaction(() => {
    sqlite.prepare("UPDATE users SET role = 'student' WHERE role IS NULL").run();
    if (!hasSessionVersion) {
        sqlite.prepare('ALTER TABLE users ADD COLUMN session_version integer NOT NULL DEFAULT 1').run();
    }

    sqlite.exec(`
        CREATE TRIGGER IF NOT EXISTS users_role_validate_insert
        BEFORE INSERT ON users
        WHEN NEW.role NOT IN ('student', 'professor', 'admin')
        BEGIN
            SELECT RAISE(ABORT, 'invalid user role');
        END;

        CREATE TRIGGER IF NOT EXISTS users_role_validate_update
        BEFORE UPDATE OF role ON users
        WHEN NEW.role NOT IN ('student', 'professor', 'admin')
        BEGIN
            SELECT RAISE(ABORT, 'invalid user role');
        END;

        CREATE TABLE IF NOT EXISTS course_assignments (
            id text PRIMARY KEY NOT NULL,
            professor_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            assigned_by text REFERENCES users(id) ON DELETE SET NULL,
            created_at integer NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS course_assignments_professor_course_idx
        ON course_assignments (professor_id, course_id);
    `);
})();

sqlite.close();
console.log('Security schema migration applied.');

