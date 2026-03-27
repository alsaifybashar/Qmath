# Developer Guide: Integrating Fading Steps

## Overview

This guide covers:
1. How fading is computed (server-side)
2. How to fetch a question with revealed steps
3. How to handle the `/api/check-step` response on the frontend
4. Testing fading with mocked mastery levels
5. Common pitfalls and how to avoid them

## Core Fading Algorithm

### The Fade Function

Location: `/home/ubnutu/github/Qmath/lib/math/fade-logic.ts`

```typescript
export function getRevealedSteps(steps: QuestionStep[], mastery: number): RevealedStep[] {
    const n = steps.length;
    const revealCount =
        mastery < 0.35 ? n :
        mastery < 0.55 ? Math.ceil(n * 0.66) :
        mastery < 0.75 ? Math.ceil(n * 0.33) : 0;
    return steps.map((s, i) => ({ ...s, revealed: i < revealCount }));
}
```

**Input:**
- `steps` — all steps in order (sorted by stepNumber)
- `mastery` — current mastery probability [0.0, 1.0]

**Output:**
- Array of `RevealedStep` objects with boolean `revealed` flag
- Steps are revealed in contiguous prefix order (steps[0], steps[1], ... steps[revealCount-1])

**Phase Mapping:**

```typescript
export function fadePhase(mastery: number): 1 | 2 | 3 | 4 {
    if (mastery < 0.35) return 1;
    if (mastery < 0.55) return 2;
    if (mastery < 0.75) return 3;
    return 4;
}
```

### Example

For a 5-step question:

| Mastery | Phase | Steps to Show | Calculation |
|---------|-------|---------------|-------------|
| 0.10 | 1 | 5 | `mastery < 0.35` → show all |
| 0.45 | 2 | 4 | `0.35 ≤ mastery < 0.55` → `ceil(5 * 0.66) = ceil(3.3) = 4` |
| 0.65 | 3 | 2 | `0.55 ≤ mastery < 0.75` → `ceil(5 * 0.33) = ceil(1.65) = 2` |
| 0.90 | 4 | 0 | `mastery ≥ 0.75` → show 0 |

## Fetching a Question with Revealed Steps

### Server-Side: `getQuestion`

When you fetch a question for display, you need:
1. All steps (to populate the UI)
2. Current mastery (to compute revealed steps)
3. Revealed steps (to know which ones to show)

```typescript
// app/actions/study-questions.ts or similar

import { db } from '@/db/drizzle';
import { questions, questionSteps, userMastery } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRevealedSteps } from '@/lib/math/fade-logic';
import { auth } from '@/auth';

export async function getQuestionWithRevealedSteps(
  questionId: string,
  topicId: string
) {
  // 1. Auth
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // 2. Fetch question metadata
  const question = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .get();

  if (!question) {
    throw new Error('Question not found');
  }

  // 3. Fetch all steps (strip correctAnswer before sending to client)
  const allSteps = await db
    .select({
      id: questionSteps.id,
      stepNumber: questionSteps.stepNumber,
      instruction: questionSteps.instruction,
      displayLatex: questionSteps.displayLatex,
      hint: questionSteps.hint,
      questionType: questionSteps.questionType,
    })
    .from(questionSteps)
    .where(eq(questionSteps.questionId, questionId))
    .all();

  const sortedSteps = allSteps.sort((a, b) => a.stepNumber - b.stepNumber);

  // 4. Fetch current mastery
  const masteryRow = await db
    .select()
    .from(userMastery)
    .where(
      and(
        eq(userMastery.userId, session.user.id),
        eq(userMastery.topicId, topicId)
      )
    )
    .get();

  const mastery = masteryRow?.masteryProbability ?? 0.1;

  // 5. Compute revealed steps
  const revealedSteps = getRevealedSteps(sortedSteps, mastery);

  return {
    question,
    allSteps: sortedSteps,
    revealedSteps,
    mastery,
  };
}
```

**Client Usage:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getQuestionWithRevealedSteps } from '@/app/actions/study-questions';

export default function StepRenderer({ questionId, topicId }: Props) {
  const [state, setState] = useState(null);

  useEffect(() => {
    getQuestionWithRevealedSteps(questionId, topicId).then(setState);
  }, [questionId, topicId]);

  if (!state) return <div>Loading...</div>;

  const { question, allSteps, revealedSteps, mastery } = state;

  return (
    <div>
      <h2>{question.contentMarkdown}</h2>
      <p>Your mastery: {(mastery * 100).toFixed(1)}%</p>

      {allSteps.map((step, i) => {
        const revealedStep = revealedSteps.find(r => r.id === step.id);
        const isRevealed = revealedStep?.revealed ?? false;

        return (
          <div
            key={step.id}
            style={{
              opacity: isRevealed ? 1 : 0.3,
              pointerEvents: isRevealed ? 'auto' : 'none',
            }}
          >
            <h3>Step {step.stepNumber}</h3>
            <p>{step.instruction}</p>
            {isRevealed && step.hint && <p>💡 {step.hint}</p>}
            {isRevealed && (
              <input
                type="text"
                placeholder="Enter your answer"
                onSubmit={(e) => submitAnswer(step.id, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

## Handling the `/api/check-step` Response

When the client submits an answer, the response includes:
- `isCorrect` — whether the answer was graded as correct
- `newMastery` — updated mastery score
- `revealedSteps` — steps to show at new mastery level
- `feedback` — optional misconception feedback

### Frontend State Management

```typescript
'use client';

import { useState } from 'react';
import type { CheckStepResponse } from '@/types/study';

interface QuestionState {
  mastery: number;
  revealedSteps: RevealedStep[];
  feedback?: string;
  lastIsCorrect?: boolean;
}

export function StepComponent() {
  const [state, setState] = useState<QuestionState>({
    mastery: 0.1,
    revealedSteps: [],
    feedback: undefined,
    lastIsCorrect: undefined,
  });

  async function handleSubmitAnswer(stepId: string, studentInput: string) {
    try {
      const response = await fetch('/api/check-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          questionId: props.questionId,
          topicId: props.topicId,
          studentInput,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          setError('Too many requests. Please wait a moment.');
        } else {
          setError(error.error);
        }
        return;
      }

      const result: CheckStepResponse = await response.json();

      // Update state with new mastery and revealed steps
      setState({
        mastery: result.newMastery,
        revealedSteps: result.revealedSteps,
        feedback: result.feedback,
        lastIsCorrect: result.isCorrect,
      });

      // Provide user feedback
      if (result.isCorrect) {
        // Move to next step or show celebration
        showNextStep();
      } else {
        // Show feedback and allow retry
        showFeedback(result.feedback);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  }

  return (
    <div>
      <MasteryIndicator mastery={state.mastery} />
      <StepList
        revealedSteps={state.revealedSteps}
        onSubmit={handleSubmitAnswer}
      />
      {state.feedback && <Feedback message={state.feedback} />}
    </div>
  );
}
```

### Rate Limit Handling

The response includes `X-RateLimit-Remaining` header:

```typescript
async function submitWithRateLimit(
  stepId: string,
  studentInput: string
) {
  const response = await fetch('/api/check-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stepId, questionId, topicId, studentInput }),
  });

  const remaining = parseInt(
    response.headers.get('X-RateLimit-Remaining') ?? '20'
  );

  if (response.status === 429) {
    // Show rate limit warning
    showWarning(`Du har gjort för många försök. Vänta 60 sekunder.`);
    // Disable submit button for 60 seconds
    disableSubmitFor(60000);
    return;
  }

  if (remaining <= 5) {
    // Warn user they're approaching limit
    showNotice(`${remaining} requests remaining this minute`);
  }

  return await response.json();
}
```

## Testing: Mocking Different Mastery Levels

### Unit Tests

```typescript
// __tests__/fade-logic.test.ts

import { describe, it, expect } from 'vitest';
import { getRevealedSteps, fadePhase } from '@/lib/math/fade-logic';
import type { QuestionStep } from '@/lib/math/fade-logic';

describe('fadePhase and getRevealedSteps', () => {
  const steps: QuestionStep[] = [
    {
      id: 'step-1',
      stepNumber: 1,
      instruction: 'Identify the pattern',
      displayLatex: null,
      hint: 'Look for (a+b)²',
      questionType: 'algebra',
    },
    {
      id: 'step-2',
      stepNumber: 2,
      instruction: 'Apply the formula',
      displayLatex: null,
      hint: 'a² + 2ab + b²',
      questionType: 'algebra',
    },
    {
      id: 'step-3',
      stepNumber: 3,
      instruction: 'Write the answer',
      displayLatex: null,
      hint: null,
      questionType: 'algebra',
    },
  ];

  it('should reveal all steps in phase 1 (mastery < 0.35)', () => {
    const revealed = getRevealedSteps(steps, 0.1);
    expect(revealed.filter(s => s.revealed)).toHaveLength(3);
    expect(fadePhase(0.1)).toBe(1);
  });

  it('should reveal ~66% in phase 2 (0.35 ≤ mastery < 0.55)', () => {
    const revealed = getRevealedSteps(steps, 0.4);
    const count = revealed.filter(s => s.revealed).length;
    expect(count).toBe(2); // ceil(3 * 0.66) = 2
    expect(fadePhase(0.4)).toBe(2);
  });

  it('should reveal ~33% in phase 3 (0.55 ≤ mastery < 0.75)', () => {
    const revealed = getRevealedSteps(steps, 0.65);
    const count = revealed.filter(s => s.revealed).length;
    expect(count).toBe(1); // ceil(3 * 0.33) = 1
    expect(fadePhase(0.65)).toBe(3);
  });

  it('should reveal 0 steps in phase 4 (mastery ≥ 0.75)', () => {
    const revealed = getRevealedSteps(steps, 0.9);
    expect(revealed.filter(s => s.revealed)).toHaveLength(0);
    expect(fadePhase(0.9)).toBe(4);
  });
});
```

Run tests:
```bash
npm test
```

### Integration Testing

To test mastery simulation in your local environment:

1. **Set a fake mastery in the database:**

```bash
# In SQLite (if using better-sqlite3)
sqlite3 qmath.db

UPDATE user_mastery
SET mastery_probability = 0.4
WHERE user_id = 'your-user-id' AND topic_id = 'your-topic-id';
```

2. **Fetch the question and observe step visibility:**

```typescript
const { revealedSteps, mastery } = await getQuestionWithRevealedSteps(
  questionId,
  topicId
);

console.log(`Mastery: ${mastery}, Phase: ${fadePhase(mastery)}`);
revealedSteps.forEach(s => {
  console.log(`Step ${s.stepNumber}: ${s.revealed ? 'VISIBLE' : 'HIDDEN'}`);
});
```

## Bayesian Knowledge Tracing (BKT)

### How Mastery Updates

Location: `/home/ubnutu/github/Qmath/lib/adaptive-engine/knowledge-tracing.ts`

```typescript
export class BayesianKnowledgeTracing {
  updateMastery(currentMastery: number, isCorrect: boolean): number {
    const { pGuess, pSlip, pLearn } = this.params;

    if (isCorrect) {
      const pCorrectGivenLearned = 1 - pSlip;
      const pCorrectGivenNotLearned = pGuess;

      const numerator = currentMastery * pCorrectGivenLearned;
      const denominator =
        currentMastery * pCorrectGivenLearned +
        (1 - currentMastery) * pCorrectGivenNotLearned;

      return numerator / denominator;
    } else {
      // Similar logic for incorrect answer
    }
  }
}
```

**Default Parameters:**
- `pInit: 0.1` — Initial mastery (pessimistic)
- `pLearn: 0.2` — Probability of learning after correct answer
- `pGuess: 0.25` — Guessing probability (assumes 4-option MC)
- `pSlip: 0.1` — Careless error rate

**Intuition:** When a student answers correctly, Bayes' theorem updates our belief about whether they know the material. A correct answer *could* be a lucky guess, but it increases our confidence.

## Common Pitfalls & How to Avoid Them

### 1. Leaking the Correct Answer

❌ **Bad:**
```typescript
const step = await db.select().from(questionSteps)
  .where(eq(questionSteps.id, stepId))
  .get(); // includes correctAnswer!

return { step }; // Sends correctAnswer to client
```

✅ **Good:**
```typescript
const step = await db.select({
  id: questionSteps.id,
  stepNumber: questionSteps.stepNumber,
  instruction: questionSteps.instruction,
  displayLatex: questionSteps.displayLatex,
  hint: questionSteps.hint,
  // ❌ DO NOT include correctAnswer
}).from(questionSteps)
  .where(eq(questionSteps.id, stepId))
  .get();

return { step }; // Safe
```

### 2. Not Caching Mastery

❌ **Bad:**
```typescript
// Fetching mastery on every page load → slow
const mastery = await db.select().from(userMastery)
  .where(and(
    eq(userMastery.userId, userId),
    eq(userMastery.topicId, topicId)
  ))
  .get();
```

✅ **Good:**
```typescript
// Cache in session or Redis (for production)
const cachedMastery = cache.get(`mastery:${userId}:${topicId}`);

if (!cachedMastery) {
  const mastery = await db.select().from(userMastery)...
  cache.set(`mastery:${userId}:${topicId}`, mastery, 5 * 60 * 1000); // 5 min TTL
}
```

### 3. Forgetting Rate Limit Checks

❌ **Bad:**
```typescript
export async function POST(req: NextRequest) {
  // No rate limit — attackers can brute force answers
  const { studentInput } = await req.json();
  // ...
}
```

✅ **Good:**
```typescript
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await auth();
  const { allowed } = checkRateLimit(session.user.id);

  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ...
}
```

### 4. Not Sorting Steps by Step Number

❌ **Bad:**
```typescript
const steps = await db.select().from(questionSteps)
  .where(eq(questionSteps.questionId, questionId))
  .all(); // Database order is undefined!

const revealedSteps = getRevealedSteps(steps, mastery);
// Steps might be in wrong order, fading breaks
```

✅ **Good:**
```typescript
const steps = await db.select().from(questionSteps)
  .where(eq(questionSteps.questionId, questionId))
  .all();

const sorted = steps.sort((a, b) => a.stepNumber - b.stepNumber);
const revealedSteps = getRevealedSteps(sorted, mastery);
```

### 5. Assuming Mastery Only Increases

❌ **Bad:**
```typescript
// Wrong: mastery monotonically increases
expect(newMastery).toBeGreaterThan(oldMastery);
```

✅ **Good:**
```typescript
// Correct: incorrect answers can decrease mastery
if (isCorrect) {
  expect(newMastery).toBeGreaterThan(oldMastery);
} else {
  expect(newMastery).toBeLessThanOrEqual(oldMastery);
}
```

## See Also

- **API Reference:** [`/docs/api/check-step.md`](../api/check-step.md)
- **Admin Guide:** [`/docs/admin/fading-steps-admin.md`](../admin/fading-steps-admin.md)
- **Architecture:** [`/docs/dev/architecture.md`](../dev/architecture.md)
