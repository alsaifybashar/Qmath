-- Qmath production security controls.
-- Apply once after the existing schema/bootstrap migrations.

UPDATE users SET role = 'student' WHERE role IS NULL;

ALTER TABLE users ADD COLUMN session_version integer NOT NULL DEFAULT 1;

CREATE TRIGGER users_role_validate_insert
BEFORE INSERT ON users
WHEN NEW.role NOT IN ('student', 'professor', 'admin')
BEGIN
    SELECT RAISE(ABORT, 'invalid user role');
END;

CREATE TRIGGER users_role_validate_update
BEFORE UPDATE OF role ON users
WHEN NEW.role NOT IN ('student', 'professor', 'admin')
BEGIN
    SELECT RAISE(ABORT, 'invalid user role');
END;

CREATE TABLE course_assignments (
    id text PRIMARY KEY NOT NULL,
    professor_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    assigned_by text REFERENCES users(id) ON DELETE SET NULL,
    created_at integer NOT NULL,
    CONSTRAINT course_assignments_professor_role CHECK (length(professor_id) > 0)
);

CREATE UNIQUE INDEX course_assignments_professor_course_idx
ON course_assignments (professor_id, course_id);

