/**
 * Content Validation API
 * 
 * POST /api/content/validate - Validate student answer against expected
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { SymbolicValidator } from '@/lib/content-generation';

export async function POST(request: NextRequest) {
    try {
        // Note: No authentication required for validation
        // This is a pure mathematical function that doesn't access user data

        // Parse request body
        const body = await request.json();
        const {
            studentAnswer,
            expectedAnswer,
            alternativeForms,
            problemType
        } = body;

        // Validate required fields
        if (!studentAnswer) {
            return NextResponse.json(
                { error: 'studentAnswer is required' },
                { status: 400 }
            );
        }

        if (!expectedAnswer) {
            return NextResponse.json(
                { error: 'expectedAnswer is required' },
                { status: 400 }
            );
        }

        // Validate answer
        const validator = new SymbolicValidator();
        const result = await validator.validate({
            studentAnswer,
            expectedAnswer,
            alternativeForms,
            problemType,
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Content validation API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
