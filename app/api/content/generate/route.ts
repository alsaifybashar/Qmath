/**
 * Content Generation API
 * 
 * POST /api/content/generate - Generate content for a topic
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { ContentGenerator } from '@/lib/content-generation';
import type { ContentType } from '@/db/content-schema';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const user = await getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const {
            topicId,
            contentType,
            difficulty,
            sourceExamQuestionIds,
            count = 1
        } = body;

        // Validate required fields
        if (!topicId) {
            return NextResponse.json(
                { error: 'topicId is required' },
                { status: 400 }
            );
        }

        if (!contentType) {
            return NextResponse.json(
                { error: 'contentType is required' },
                { status: 400 }
            );
        }

        // Validate content type
        const validTypes: ContentType[] = [
            'free_form_symbolic',
            'faded_worked_example',
            'parsons_problem',
            'line_by_line',
            'graphical_manipulation',
            'counter_example',
            'error_spotting',
            'confidence_tagged'
        ];

        if (!validTypes.includes(contentType)) {
            return NextResponse.json(
                { error: `Invalid contentType. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Create generator and generate content
        const generator = new ContentGenerator(process.env.AI_PROVIDER || 'mock');
        const results = [];
        for (let i = 0; i < count; i++) {
            const result = await generator.generate({
                topicId,
                contentType,
                difficulty,
                sourceExamQuestionIds,
            });
            results.push(result);
        }

        // Return results
        if (count === 1) {
            return NextResponse.json(results[0]);
        }

        return NextResponse.json({
            success: results.every(r => r.success),
            results,
            successCount: results.filter(r => r.success).length,
            failCount: results.filter(r => !r.success).length,
        });

    } catch (error) {
        console.error('Content generation API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
