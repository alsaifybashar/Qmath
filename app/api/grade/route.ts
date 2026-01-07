import { NextRequest, NextResponse } from "next/server";
import { BayesianKnowledgeTracing } from "@/lib/adaptive-engine/knowledge-tracing";
import { AttemptEvent } from "@/lib/data-model/types";

// Create a reusable BKT instance
const bkt = new BayesianKnowledgeTracing();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { attempt, currentMastery } = body as { attempt: AttemptEvent, currentMastery: number };

        if (!attempt || typeof currentMastery !== 'number') {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // 1. Calculate new mastery using Bayesian Knowledge Tracing
        const newMastery = bkt.updateMastery(currentMastery, attempt.is_correct);

        // 2. Determine next step (Scaffold or Advance)
        let action = "continue";
        if (!attempt.is_correct && currentMastery < 0.4) {
            // Scaffold if wrong and low mastery
            action = "scaffold";
        } else if (!attempt.is_correct) {
            // Just continue if wrong but decent mastery
            action = "retry";
        }

        // 3. Predict probability of correct on next attempt
        const predictedSuccess = bkt.predictCorrect(newMastery);

        // 4. Check if topic is mastered
        const isMastered = bkt.isMastered(newMastery, 0.85);

        return NextResponse.json({
            success: true,
            new_mastery: newMastery,
            predicted_success: predictedSuccess,
            is_mastered: isMastered,
            action: action,
            feedback: attempt.is_correct
                ? "Great job! Your mastery is improving."
                : action === "scaffold"
                    ? "Let's break this down into simpler steps."
                    : "Not quite right. Try again!"
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
