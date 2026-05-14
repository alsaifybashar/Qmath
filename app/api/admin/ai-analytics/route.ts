import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { aiRequestLogs } from '@/db/schema';
import { eq, count, avg, sum, gte, and, desc, sql } from 'drizzle-orm';

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
        const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') ?? '30', 10)));
        const since = new Date();
        since.setDate(since.getDate() - days);

        const [overview] = await db
            .select({
                total: count(),
                successful: sql<number>`sum(case when ${aiRequestLogs.success} = 1 then 1 else 0 end)`,
                avgLatency: avg(aiRequestLogs.latencyMs),
                totalPromptTokens: sum(aiRequestLogs.promptTokens),
                totalCompletionTokens: sum(aiRequestLogs.completionTokens),
            })
            .from(aiRequestLogs)
            .where(gte(aiRequestLogs.createdAt, since));

        const total = overview?.total ?? 0;
        const successful = Number(overview?.successful ?? 0);
        const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
        const avgLatencyMs = Math.round(Number(overview?.avgLatency ?? 0));
        const totalTokens =
            Number(overview?.totalPromptTokens ?? 0) +
            Number(overview?.totalCompletionTokens ?? 0);

        // Per-model breakdown
        const byModel = await db
            .select({
                model: aiRequestLogs.model,
                provider: aiRequestLogs.provider,
                requests: count(),
                successful: sql<number>`sum(case when ${aiRequestLogs.success} = 1 then 1 else 0 end)`,
                avgLatency: avg(aiRequestLogs.latencyMs),
                totalTokens: sql<number>`sum(coalesce(${aiRequestLogs.promptTokens}, 0) + coalesce(${aiRequestLogs.completionTokens}, 0))`,
            })
            .from(aiRequestLogs)
            .where(gte(aiRequestLogs.createdAt, since))
            .groupBy(aiRequestLogs.model, aiRequestLogs.provider)
            .orderBy(desc(count()));

        // Per-requestType breakdown
        const byRequestType = await db
            .select({
                requestType: aiRequestLogs.requestType,
                requests: count(),
                avgLatency: avg(aiRequestLogs.latencyMs),
            })
            .from(aiRequestLogs)
            .where(gte(aiRequestLogs.createdAt, since))
            .groupBy(aiRequestLogs.requestType)
            .orderBy(desc(count()));

        // Daily time series for the chart — group by date string (SQLite: strftime)
        const dailySeries = await db
            .select({
                date: sql<string>`strftime('%Y-%m-%d', datetime(${aiRequestLogs.createdAt} / 1000, 'unixepoch'))`,
                requests: count(),
                successful: sql<number>`sum(case when ${aiRequestLogs.success} = 1 then 1 else 0 end)`,
            })
            .from(aiRequestLogs)
            .where(gte(aiRequestLogs.createdAt, since))
            .groupBy(sql`strftime('%Y-%m-%d', datetime(${aiRequestLogs.createdAt} / 1000, 'unixepoch'))`)
            .orderBy(sql`strftime('%Y-%m-%d', datetime(${aiRequestLogs.createdAt} / 1000, 'unixepoch'))`);

        return NextResponse.json({
            overview: {
                total,
                successRate,
                avgLatencyMs,
                totalTokens,
            },
            byModel: byModel.map((r) => ({
                model: r.model,
                provider: r.provider,
                requests: r.requests,
                successRate:
                    r.requests > 0
                        ? Math.round((Number(r.successful) / r.requests) * 100)
                        : 0,
                avgLatencyMs: Math.round(Number(r.avgLatency ?? 0)),
                totalTokens: Number(r.totalTokens ?? 0),
            })),
            byRequestType: byRequestType.map((r) => ({
                requestType: r.requestType ?? 'unknown',
                requests: r.requests,
                avgLatencyMs: Math.round(Number(r.avgLatency ?? 0)),
            })),
            dailySeries: dailySeries.map((r) => ({
                date: r.date,
                requests: r.requests,
                successful: Number(r.successful),
            })),
        });
    } catch (error) {
        console.error('AI analytics fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch AI analytics' }, { status: 500 });
    }
}
