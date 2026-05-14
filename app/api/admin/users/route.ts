import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq, like, or, count, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = request.nextUrl;
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
        const search = searchParams.get('search')?.trim() ?? '';
        const roleFilter = searchParams.get('role') ?? '';

        const offset = (page - 1) * limit;

        const conditions = [];
        if (search) {
            conditions.push(
                or(
                    like(users.email, `%${search}%`),
                    like(users.name, `%${search}%`)
                )
            );
        }
        if (roleFilter && (roleFilter === 'admin' || roleFilter === 'student')) {
            conditions.push(eq(users.role, roleFilter));
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const [rows, [totalResult]] = await Promise.all([
            db
                .select({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    role: users.role,
                    createdAt: users.createdAt,
                    updatedAt: users.updatedAt,
                })
                .from(users)
                .where(where)
                .orderBy(desc(users.createdAt))
                .limit(limit)
                .offset(offset),
            db.select({ count: count() }).from(users).where(where),
        ]);

        const total = totalResult?.count ?? 0;

        return NextResponse.json({
            users: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Admin users fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
