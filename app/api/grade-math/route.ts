import { NextRequest, NextResponse } from 'next/server';
import { gradeAnswer } from '@/lib/math/cas-grader';
import { runFeedbackTree } from '@/lib/math/feedback-tree';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            studentInput,
            correctAnswer,
            ignoreConstant = false,
            questionType = 'other',
        } = body as {
            studentInput: string;
            correctAnswer: string;
            ignoreConstant?: boolean;
            questionType?: 'integral' | 'derivative' | 'algebra' | 'other';
        };

        if (!studentInput || !correctAnswer) {
            return NextResponse.json({ error: 'Missing studentInput or correctAnswer' }, { status: 400 });
        }

        // Grade the answer
        const grade = await gradeAnswer(studentInput, correctAnswer, { ignoreConstant });

        // If wrong, run feedback tree
        const feedback = grade.isCorrect
            ? null
            : await runFeedbackTree(studentInput, correctAnswer, { questionType });

        return NextResponse.json({
            isCorrect: grade.isCorrect,
            parsedStudent: grade.parsedStudent,
            feedback,
        });
    } catch (err) {
        console.error('[grade-math]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
