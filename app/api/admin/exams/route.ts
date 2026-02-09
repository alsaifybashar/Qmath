import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { exams } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const allExams = await db
            .select()
            .from(exams)
            .orderBy(desc(exams.createdAt));

        return NextResponse.json({ exams: allExams });
    } catch (error) {
        console.error('Failed to fetch exams:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
