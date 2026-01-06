import { NextRequest, NextResponse } from "next/server";
import { AdaptiveLearningEngine } from "@/lib/adaptive-engine/engine";
import { AttemptEvent } from "@/lib/data-model/types";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { attempt, currentMastery } = body as { attempt: AttemptEvent, currentMastery: number };

        if (!attempt || typeof currentMastery !== 'number') {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // 1. Calculate new mastery
        // In a real system, we would fetch difficulty from DB based on attempt.question_id
        const mockDifficulty = 0.5;
        const newMastery = AdaptiveLearningEngine.calculateMasteryUpdate(currentMastery, attempt, mockDifficulty);

        // 2. Determine next step (Scaffold or Advance)
        let action = "continue";
        if (!attempt.is_correct) {
            action = "scaffold";
            // Logic to fetch sub-questions would go here
        }

        return NextResponse.json({
            success: true,
            new_mastery: newMastery,
            action: action,
            feedback: attempt.is_correct ? "Great job!" : "Let's break this down."
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
