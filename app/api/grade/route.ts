import { NextResponse } from 'next/server';

/**
 * Removed because the legacy endpoint accepted client-asserted correctness and
 * mastery. Authoritative grading now runs through submitAttempt/checkStepCore.
 */
export async function POST() {
    return NextResponse.json(
        {
            error: 'This endpoint has been retired. Use the authenticated study submission flow.',
        },
        { status: 410, headers: { 'Cache-Control': 'no-store' } },
    );
}
