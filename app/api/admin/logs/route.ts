import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { auditLogs } from '@/db/schema';
import { eq, count, desc, and } from 'drizzle-orm';

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
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
        const typeFilter = searchParams.get('type')?.trim() ?? '';

        const offset = (page - 1) * limit;

        const where = typeFilter ? eq(auditLogs.type, typeFilter) : undefined;

        const [rows, [totalResult]] = await Promise.all([
            db
                .select()
                .from(auditLogs)
                .where(where)
                .orderBy(desc(auditLogs.createdAt))
                .limit(limit)
                .offset(offset),
            db.select({ count: count() }).from(auditLogs).where(where),
        ]);

        const total = totalResult?.count ?? 0;

        return NextResponse.json({
            logs: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Admin logs fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
