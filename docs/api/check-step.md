# POST /api/check-step — Fading Steps Grading API

## Overview

The `/api/check-step` endpoint processes student answers to individual steps in a *Tonande Lösningssteg* (Fading Steps) question. It performs CAS-based grading, updates Bayesian Knowledge Tracing mastery scores, and returns revealed steps based on the student's current mastery level.

**Purpose:** Server-side answer evaluation with automatic mastery tracking and progressive hint fading.

## Request

### Method & Path
```
POST /api/check-step
```

### Authentication
Required. Bearer token (JWT) via `next-auth` session.

### Headers
```http
Content-Type: application/json
```

### Body Schema

```typescript
{
  stepId: string;           // UUID of the question step
  questionId: string;       // UUID of the parent question
  topicId: string;          // UUID of the topic (for mastery tracking)
  studentInput: string;     // Raw student input (max 1000 chars)
}
```

### Validation Rules
- All fields are required and must be non-empty strings
- `studentInput` is capped at 1000 characters (guards against oversized payloads reaching CAS)
- Field length violations return 400 Bad Request

### Example Request

```bash
curl -X POST http://localhost:3000/api/check-step \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stepId": "550e8400-e29b-41d4-a716-446655440000",
    "questionId": "550e8400-e29b-41d4-a716-446655440001",
    "topicId": "550e8400-e29b-41d4-a716-446655440002",
    "studentInput": "x^2 + 2*x + 1"
  }'
```

### TypeScript Client Example

```typescript
import { useSession } from 'next-auth/react';

export async function submitStep(
  stepId: string,
  questionId: string,
  topicId: string,
  studentInput: string
) {
  const session = await useSession();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const response = await fetch('/api/check-step', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.user.accessToken}`,
    },
    body: JSON.stringify({
      stepId,
      questionId,
      topicId,
      studentInput,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  return data as CheckStepResponse;
}
```

## Response

### Success Response (200 OK)

```typescript
{
  isCorrect: boolean;
  parsedStudent: string;              // Pre-parsed form of student input
  feedback?: string;                  // Misconception-specific feedback (if wrong)
  newMastery: number;                 // Updated mastery [0.0, 1.0]
  revealedSteps: RevealedStep[];      // Steps revealed at new mastery level
  allStepsComplete: boolean;          // Caller tracks multi-step completion
}
```

#### RevealedStep Type

```typescript
{
  id: string;
  stepNumber: number;
  instruction: string;
  displayLatex: string | null;
  hint: string | null;
  questionType: string | null;
  revealed: boolean;                  // true = student sees this step
}
```

### Example Response (Correct Answer)

```json
{
  "isCorrect": true,
  "parsedStudent": "x^2 + 2*x + 1",
  "feedback": null,
  "newMastery": 0.42,
  "revealedSteps": [
    {
      "id": "step-1",
      "stepNumber": 1,
      "instruction": "Factor the expression",
      "displayLatex": "x^2 + 2x + 1",
      "hint": "Look for (a+b)²",
      "questionType": "algebra",
      "revealed": true
    },
    {
      "id": "step-2",
      "stepNumber": 2,
      "instruction": "Write the final factored form",
      "displayLatex": null,
      "hint": null,
      "questionType": "algebra",
      "revealed": false
    }
  ],
  "allStepsComplete": false
}
```

### Example Response (Incorrect Answer)

```json
{
  "isCorrect": false,
  "parsedStudent": "x^2+2*x+1",
  "feedback": "Du är på rätt väg! Försök faktorisera som en perfekt kvadrat.",
  "newMastery": 0.18,
  "revealedSteps": [
    {
      "id": "step-1",
      "stepNumber": 1,
      "instruction": "Factor the expression",
      "displayLatex": "x^2 + 2x + 1",
      "hint": "Look for (a+b)²",
      "questionType": "algebra",
      "revealed": true
    },
    {
      "id": "step-2",
      "stepNumber": 2,
      "instruction": "Write the final factored form",
      "displayLatex": null,
      "hint": null,
      "questionType": "algebra",
      "revealed": true
    }
  ],
  "allStepsComplete": false
}
```

## Response Headers

| Header | Value | Notes |
|--------|-------|-------|
| `X-RateLimit-Remaining` | number | Requests remaining in current 60-second window |

## Error Responses

### 400 Bad Request

Returned when request validation fails.

```json
{
  "error": "Missing or invalid required fields"
}
```

Or:

```json
{
  "error": "Inmatningen är för lång (max 1000 tecken)."
}
```

**Swedish Error Messages:**
- "Saknade eller ogiltiga obligatoriska fält" — Missing required fields
- "Inmatningen är för lång (max 1000 tecken)." — Input exceeds 1000 characters
- "Steg hittades inte" — Step not found in database

### 401 Unauthorized

Returned when no valid JWT session is present.

```json
{
  "error": "Unauthorized"
}
```

**When:** User is not authenticated or session has expired.

### 404 Not Found

Returned when `stepId` or `questionId` do not exist, or when `stepId` belongs to a different `questionId`.

```json
{
  "error": "Step not found"
}
```

**When:**
- Step doesn't exist in database
- Step belongs to a different question (validation against InjectionAttack)

### 429 Too Many Requests

Returned when rate limit is exceeded: 20 requests per 60 seconds per user.

```json
{
  "error": "För många förfrågningar. Vänta en stund."
}
```

**Swedish:** "Too many requests. Wait a moment."

**Headers:**
```http
X-RateLimit-Remaining: 0
```

### 500 Internal Server Error

Returned when CAS grading, BKT update, or database write fails unexpectedly.

```json
{
  "error": "Internal server error"
}
```

**When:**
- SymPy sidecar timeout or connectivity failure
- Database connection lost
- Unhandled exception in BKT calculation

## Rate Limiting

**Limit:** 20 requests per 60-second sliding window, per authenticated user.

**Storage:** Currently in-memory (`lib/rate-limit.ts`). For production at scale (5000+ students), migrate to Redis.

**Response Headers:**
- `X-RateLimit-Remaining` — Requests left in window (0–20)

**Retry Strategy (Client):**
1. Check `X-RateLimit-Remaining` header
2. If 429, wait until response header `resetAt` or implement exponential backoff
3. Recommend client-side form debounce (min 500ms between submissions)

## Security Notes

### Answer Leakage Prevention
- `correctAnswer` is **never** included in the response
- Server-side database lookup ensures student cannot override grading
- Step object returned to client strips all sensitive fields

### Grading Flow (Defense in Depth)
1. Fetch step from database (serverside)
2. Pre-parse student input (normalize notation)
3. Grade via CAS (mathjs Tier 1 + SymPy Tier 2)
4. Update mastery without exposing Bayesian state details
5. Compute revealed steps server-side
6. Return only safe fields

### CAS Safety
- Input capped at 1000 chars before CAS evaluation
- SymPy sidecar has 4-second timeout
- math.js is sandboxed (no filesystem access)

### Rate Limit Notes
- Prevents brute-force answer guessing
- Sliding-window implementation (not fixed-window) prevents "bursts at boundaries"
- Monitor 429 rate in logs; spike may indicate automated attack

## Authentication Details

This endpoint requires a valid JWT from `next-auth`. The session is verified at the handler entry point:

```typescript
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

No additional API keys or tokens needed. Credentials are managed by `next-auth` configuration in `auth.ts`.

## Latency Targets

| Phase | Target | Notes |
|-------|--------|-------|
| Database lookup (step + mastery) | <10ms | Indexed on stepId, userId + topicId |
| Pre-parse + Tier 1 CAS | <50ms | mathjs numeric probe |
| Tier 2 CAS (SymPy sidecar, if triggered) | ~200ms | 4-second timeout total |
| BKT update + database write | <20ms | Upsert operation |
| **Total (p95)** | **<150ms** | Monitor via application metrics |

If p95 latency exceeds 300ms, check:
1. SymPy sidecar CPU/memory
2. Database connection pool saturation
3. Network latency to SymPy service

## Implementation Notes

### Code Locations
- **Endpoint:** `/home/ubnutu/github/Qmath/app/api/check-step/route.ts`
- **Fade logic:** `/home/ubnutu/github/Qmath/lib/math/fade-logic.ts`
- **Rate limit:** `/home/ubnutu/github/Qmath/lib/rate-limit.ts`
- **CAS grader:** `/home/ubnutu/github/Qmath/lib/math/cas-grader.ts`
- **BKT:** `/home/ubnutu/github/Qmath/lib/adaptive-engine/knowledge-tracing.ts`

### Database Schema

**question_steps:**
```sql
CREATE TABLE question_steps (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  display_latex TEXT,
  correct_answer TEXT NOT NULL,
  question_type TEXT DEFAULT 'algebra',
  hint TEXT,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

**user_mastery:**
```sql
CREATE TABLE user_mastery (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  mastery_probability REAL DEFAULT 0.1,
  last_practiced_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);
```

## Examples

See also: [`/docs/dev/integrating-fading-steps.md`](../dev/integrating-fading-steps.md) for frontend integration patterns.
