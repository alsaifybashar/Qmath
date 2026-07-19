import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { courseAssignments, enrollments } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { type AppRole, normalizeRole } from '@/lib/security/roles';
import { emitSecurityEvent } from '@/lib/security/events';

export interface User {
    id: string;
    email: string;
    name: string | null;
    role: AppRole;
    sessionVersion: number;
}

export class AuthenticationError extends Error {
    readonly status = 401;
    constructor() {
        super('Unauthorized');
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends Error {
    readonly status = 403;
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'AuthorizationError';
    }
}

/** The only supported application identity source: a verified Auth.js session. */
export async function getUser(): Promise<User | null> {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) return null;

    return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null,
        role: normalizeRole(session.user.role),
        sessionVersion: session.user.sessionVersion,
    };
}

export async function requireAuth(): Promise<User> {
    const user = await getUser();
    if (!user) throw new AuthenticationError();
    return user;
}

export async function requireRole(...roles: readonly AppRole[]): Promise<User> {
    const user = await requireAuth();
    if (!roles.includes(user.role)) {
        emitSecurityEvent({
            category: 'authorization',
            action: 'role_required',
            outcome: 'denied',
            severity: 'medium',
            actorId: user.id,
            actorRole: user.role,
            reason: `requires_${roles.join('_or_')}`,
        });
        throw new AuthorizationError();
    }
    return user;
}

export async function requireAdmin(): Promise<User> {
    return requireRole('admin');
}

export async function requireCourseEditor(courseId: string): Promise<User> {
    const user = await requireRole('professor', 'admin');
    if (user.role === 'admin') return user;

    const assignment = await db
        .select({ id: courseAssignments.id })
        .from(courseAssignments)
        .where(and(
            eq(courseAssignments.professorId, user.id),
            eq(courseAssignments.courseId, courseId),
        ))
        .limit(1)
        .get();

    if (!assignment) {
        emitSecurityEvent({
            category: 'authorization',
            action: 'course.edit',
            outcome: 'denied',
            severity: 'medium',
            actorId: user.id,
            actorRole: user.role,
            resourceType: 'course',
            resourceId: courseId,
            reason: 'course_assignment_missing',
        });
        throw new AuthorizationError();
    }
    return user;
}

/** Object-level authorization for every course-scoped student data read. */
export async function requireCourseViewer(courseId: string): Promise<User> {
    const user = await requireAuth();
    if (user.role === 'admin') return user;

    const access = user.role === 'professor'
        ? await db
            .select({ id: courseAssignments.id })
            .from(courseAssignments)
            .where(and(
                eq(courseAssignments.professorId, user.id),
                eq(courseAssignments.courseId, courseId),
            ))
            .limit(1)
            .get()
        : await db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, courseId)))
            .limit(1)
            .get();

    if (!access) {
        emitSecurityEvent({
            category: 'authorization',
            action: 'course.view',
            outcome: 'denied',
            severity: 'medium',
            actorId: user.id,
            actorRole: user.role,
            resourceType: 'course',
            resourceId: courseId,
            reason: 'course_access_missing',
        });
        throw new AuthorizationError();
    }
    return user;
}
