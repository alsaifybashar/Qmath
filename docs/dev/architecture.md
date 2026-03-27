# Architecture: Tonande Lösningssteg System

## System Overview

The Fading Steps system consists of four coordinated components:

```
┌────────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                          │
│  • Student inputs answer to a step                             │
│  • Displays steps based on revealed/hidden flags               │
└──────────────────┬───────────────────────────────────────────┘
                   │ POST /api/check-step
                   │ { stepId, questionId, topicId, studentInput }
                   ▼
┌────────────────────────────────────────────────────────────────┐
│                    API HANDLER                                  │
│  POST /api/check-step/route.ts                                 │
│  • Authenticate user (JWT)                                     │
│  • Rate limit (20/min)                                         │
│  • Fetch step from DB (no answer leakage)                      │
└──────┬────────┬────────┬───────────────────────────────────────┘
       │        │        │
       ▼        ▼        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CORE MODULES                                   │
├──────────────────────────────────────────────────────────────────┤
│ 1. PRE-PARSER                                                   │
│    lib/math/pre-parser.ts                                       │
│    • Normalize student input (3xy → 3*x*y)                     │
│    • Handle unicode, LaTeX, degree notation                    │
│                                                                  │
│ 2. CAS GRADER (Two-Tier)                                        │
│    lib/math/cas-grader.ts                                       │
│    • Tier 1 (Tier 1): math.js numeric evaluation (<50ms)       │
│    • Tier 2 (Symbolic): SymPy sidecar (~200ms)                 │
│                                                                  │
│ 3. FEEDBACK TREE                                                │
│    lib/math/feedback-tree.ts                                    │
│    • Misconception-specific feedback (Swedish)                 │
│    • Only triggered if answer is incorrect                     │
│                                                                  │
│ 4. BAYESIAN KNOWLEDGE TRACING (BKT)                             │
│    lib/adaptive-engine/knowledge-tracing.ts                    │
│    • Update mastery based on Bayes' theorem                    │
│    • P(L|Correct) using conditional probability               │
└──────┬────────┬────────┬───────────────────────────────────────┘
       │        │        │
       └────────┼────────┘
                ▼
┌────────────────────────────────────────────────────────────────┐
│            FADE LOGIC (Pure Function)                          │
│  lib/math/fade-logic.ts                                        │
│  • Input: steps[], newMastery                                  │
│  • Output: RevealedStep[] (revealed flags only)                │
│  • No side effects, deterministic                              │
└──────┬─────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│                  DATABASE UPDATES                              │
│  user_mastery table (upsert)                                   │
│  • Store: userId, topicId, masteryProbability                  │
└──────┬─────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│                    API RESPONSE                                │
│  {                                                              │
│    isCorrect: boolean,                                         │
│    newMastery: number,                                         │
│    revealedSteps: RevealedStep[],  ← NEW state for UI         │
│    feedback?: string                                           │
│  }                                                              │
└──────┬─────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│                  CLIENT (Browser)                              │
│  • Update UI: hide/show steps based on revealedSteps           │
│  • Update mastery display                                      │
│  • Allow next step or show feedback                            │
└────────────────────────────────────────────────────────────────┘
```

## Design Decisions & Trade-Offs

### 1. Why math.js for CAS Grading?

**Why math.js (Tier 1)?**
- Fast (<50ms) numeric evaluation
- Handles most common algebra expressions
- Lightweight (no external dependencies)
- Works in Node.js and browser

**Limitations:**
- Cannot verify symbolic equivalence (e.g., `sin²x + cos²x = 1`)
- No simplification (e.g., `(x+1)²-1+x` vs `x²+3x`)

**Solution:** Tier 2 (SymPy sidecar)
- If Tier 1 says "not equivalent", try SymPy
- SymPy simplifies symbolically: `simplify(student - correct) = 0?`
- 4-second timeout limit (fail-safe)

**Alternatives considered:**
- **Wolfram Language API** → Expensive, high latency, overkill
- **SymPy only** → Too slow for every answer (~200ms per submission)
- **Custom symbolic parser** → Months of engineering, fragile

**Verdict:** Two-tier is optimal: fast path for 95% of cases, symbolic fallback for edge cases.

### 2. Why Bayesian Knowledge Tracing (BKT)?

**Why BKT?**
- Probabilistic: captures uncertainty ("Do I really know this or did I guess?")
- Proven in education research (15+ years of evidence)
- Fast (<1ms per update)
- Parameters learnable from data

**The BKT Model:**
```
P(Correct | Mastered, student guesses, careless) = P(Mastered) * (1 - P(slip))
                                                    + P(Not mastered) * P(guess)

P(Mastered | Correct) = Bayes' theorem applied to update belief
```

**Parameters:**
```
pInit = 0.1    (start: assume student doesn't know)
pLearn = 0.2   (20% chance of learning after correct answer)
pGuess = 0.25  (25% chance of guessing right on 4-option MC)
pSlip = 0.1    (10% chance of careless error)
```

**Alternatives considered:**
- **IRT (Item Response Theory)** → Good for difficulty estimation, not mastery over time
- **Spaced Repetition (SM-2/FSRS)** → Good for scheduling, not grading fades
- **Naive count** ("5 correct = mastered") → No uncertainty handling, too simple
- **Elo rating** → Works for games, not for skill mastery in education

**Verdict:** BKT is the research-backed standard for adaptive learning.

### 3. Why Redis for Rate Limiting & Caching?

**Current Implementation (Development):**
- In-memory `Map<string, RateLimitEntry>` in `lib/rate-limit.ts`
- Fast (microseconds), no network overhead
- Good for development and testing

**Production Upgrade Path:**
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function checkRateLimit(userId: string) {
  // Sliding window with redis.pipeline()
  // Shared across all server instances (horizontal scaling)
}
```

**Why Redis?**
- **Persistence:** Survives server restart
- **Horizontal scaling:** Multiple instances share state (critical at 5000 students)
- **Atomic operations:** Sliding window without race conditions
- **Sub-millisecond latency:** Negligible overhead

**Alternatives considered:**
- **PostgreSQL** → Works, but slower for high-frequency updates
- **Memcached** → No persistence, overkill for simple sliding window
- **DynamoDB** → AWS lock-in, more expensive
- **In-memory only** → Breaks on horizontal scaling, data loss on restart

**Verdict:** Redis is the industry standard for rate limiting.

### 4. Why Mastery Cache Separately from Steps?

**Current Architecture:**
- User mastery → cached in `user_mastery` table (indexed on userId, topicId)
- Steps fetched fresh (not cached)

**Why?**
- **Mastery is long-lived** (persists across sessions, updated infrequently)
- **Steps are immutable** after publication (query result cache wastes space)
- **Mastery impacts fading** (fetched frequently, indexes are fast)

**At Scale (5000 students):**
```
Scenario: 5000 students, 20 topics each, 100 attempts/day
Daily mastery updates: 5000 * 20 * ~100 / 20min = ~50k updates/hour
```
With indexing: database handles this easily.
Without caching: ~50k SELECT queries/hour → still acceptable.

**If mastery updates become bottleneck:**
Add Redis cache layer (5-minute TTL) before database lookup.

## Data Flow Diagram (Detailed)

### Submission Flow
```
┌──────────────────────┐
│ Student submits      │
│ answer to step       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 1. AUTHENTICATION                    │
│ • Verify JWT (next-auth)             │
│ • Extract userId                     │
│ Return 401 if unauthorized           │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 2. RATE LIMIT CHECK                  │
│ • checkRateLimit(userId)             │
│ • Sliding window: 20/min              │
│ Return 429 if exceeded               │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 3. INPUT VALIDATION                  │
│ • Check field types (strings)        │
│ • Cap length (max 1000 chars)        │
│ Return 400 if invalid                │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 4. FETCH STEP FROM DB                │
│ • SELECT * FROM question_steps       │
│ • WHERE id = stepId                  │
│ • Verify ownership (questionId)      │
│ Return 404 if not found              │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 5. PRE-PARSE STUDENT INPUT           │
│ • preParseInput(studentInput)        │
│ • Normalize notation                 │
│ Example: "3xy" → "3*x*y"             │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 6. CAS GRADING (TWO-TIER)            │
│                                      │
│ Tier 1: math.js numeric probe        │
│   ├─ Evaluate student − correct      │
│   ├─ at N random test points        │
│   └─ If diff ≈ 0 → CORRECT          │
│                                      │
│ Tier 2 (if Tier 1 fails):            │
│   ├─ Call SymPy sidecar             │
│   ├─ simplify(student − correct)     │
│   └─ If simplified = 0 → CORRECT    │
│                                      │
│ Result: isCorrect (boolean)          │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 7. GENERATE FEEDBACK (IF INCORRECT)  │
│ • runFeedbackTree(...)               │
│ • Match student error to misconception
│ • Return Swedish feedback message    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 8. BAYESIAN UPDATE                   │
│                                      │
│ • Fetch current mastery              │
│ • Apply BKT.updateMastery()          │
│ • Compute posterior probability      │
│ • newMastery ∈ [0.0, 1.0]            │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 9. DATABASE UPDATE                   │
│ • UPSERT user_mastery                │
│ • IF EXISTS: UPDATE                  │
│ •    elsE: INSERT                    │
│ • Set masteryProbability = newMastery
│ • Set lastPracticedAt = NOW()        │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 10. FETCH ALL STEPS                  │
│ • SELECT id, stepNumber, ...         │
│ •   (STRIP correctAnswer)            │
│ • FROM question_steps                │
│ • WHERE questionId = ?               │
│ • Sort by stepNumber                 │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 11. COMPUTE REVEALED STEPS           │
│ • getRevealedSteps(steps, newMastery)│
│ • Fade based on newMastery           │
│ • Return RevealedStep[]              │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ 12. RETURN RESPONSE                  │
│ {                                    │
│   isCorrect,                         │
│   parsedStudent,                     │
│   feedback,                          │
│   newMastery,                        │
│   revealedSteps,                     │
│   allStepsComplete                   │
│ }                                    │
│ Status: 200 OK                       │
│ Header: X-RateLimit-Remaining        │
└──────────────────────────────────────┘
```

## Scaling Strategy

### Stage 1: Single Instance (Current — 100 students)

```
┌──────────────┐
│ Next.js App  │
│ + SQLite DB  │
│ + In-memory  │
│   rate limit │
└──────────────┘
```

**Bottlenecks:**
- Rate limit data lost on restart (in-memory)
- Mastery lookups are fast (SQLite indexed)
- CAS grading latency negligible

**Monitoring:**
- Response time p95 < 150ms
- Database connection pool: 1 (SQLite)
- SymPy sidecar CPU < 50%

### Stage 2: Horizontal Scaling (1000 students)

```
┌─────────────┐         ┌─────────────┐
│ Instance 1  │         │ Instance 2  │
│ Next.js     │────────→│ Next.js     │
└─────────────┘         └─────────────┘
      ↓ ↓              ↓ ↓
      └─→ PostgreSQL ←─┘
         (shared)

      └─→ Redis ←─┘
          (rate limit)
```

**Changes:**
- Replace SQLite with PostgreSQL (shared, multi-instance)
- Replace in-memory rate limiter with Redis
- Add load balancer (nginx)

**Monitoring:**
- Database connection pool: 2 per instance
- Redis latency: <5ms
- API p95 latency: <200ms (network adds ~50ms)

### Stage 3: Full Scale (5000 students)

```
┌──────────────────────────────────────┐
│ Load Balancer (nginx/CloudFlare)     │
└───────┬───────────┬───────────┬──────┘
        ↓           ↓           ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│Instance 1│  │Instance 2│  │Instance N│
│(4 replicas per region)          │
└──────────┘  └──────────┘  └──────────┘
        │           │           │
        └───────────┴───────────┘
              ↓
        ┌─────────────┐
        │ PostgreSQL  │ (read replicas per region)
        │ (primary)   │
        └─────────────┘
              ↓
        ┌─────────────┐
        │ Redis       │ (cluster, distributed)
        │ (Upstash)   │
        └─────────────┘
              ↓
        ┌─────────────┐
        │ SymPy       │ (auto-scaling, 5x instances)
        │ Sidecar     │
        └─────────────┘
```

**Key Changes:**
1. **Database:** PostgreSQL read replicas (one per region)
   - Write always goes to primary
   - Mastery lookups can hit replicas
2. **Rate Limit:** Redis cluster (or Upstash managed)
   - Sliding window distributed across nodes
   - No single point of failure
3. **CAS Grading:** SymPy auto-scaling group
   - Monitor CPU; spin up instances if queue > 100ms
   - Load-balanced requests
4. **Session Cache:** Redis for mastery caching (5-min TTL)
   - Reduces database load by ~40%

**Monitoring (SLOs):**
- API p95 latency: <250ms
- Rate limit accuracy: 99.99% (sliding window)
- Database query p95: <50ms
- SymPy timeout rate: <0.1%

## Failure Modes & Recovery

### Scenario 1: SymPy Sidecar Down

**Symptom:** CAS grading timeout (>4 seconds)

**Current Behavior:**
```typescript
// app/api/check-step/route.ts
const gradeResult = await gradeAnswer(parsed, step.correctAnswer);
// If SymPy is down, Tier 1 (math.js) is used
// Tier 2 skipped, answer might be marked incorrect if it's a symbolic equivalence
```

**Fallback:**
- Tier 1 (math.js) always succeeds
- Tier 2 (SymPy) times out after 4 seconds
- Answer marked incorrect if only Tier 2 would have matched

**Fix:**
- Monitor SymPy uptime in logs
- If downtime > 5 minutes, page on-call engineer
- Consider cached results for "known hard cases"

### Scenario 2: Redis Down (Rate Limiting)

**Current:** In-memory rate limit (no Redis yet)
- Data loss on app restart
- Requests are allowed through

**Production (with Redis):**
```typescript
export async function checkRateLimit(userId: string) {
  try {
    return await redisCheckRateLimit(userId);
  } catch (err) {
    console.error('Redis down, falling back to in-memory');
    return inMemoryCheckRateLimit(userId); // Graceful degrade
  }
}
```

**Consequence:** Brief period of lax rate limiting (acceptable vs. blocking all requests)

### Scenario 3: Database Connection Pool Exhausted

**Symptom:** Error "too many connections" from PostgreSQL

**Monitoring:**
```sql
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

**Solution:**
- Increase pool size (default: 10 → 20 per instance)
- Add connection recycling (close idle after 30 min)
- Monitor pool utilization dashboard

## Performance Targets

| Metric | Target | How to Monitor |
|--------|--------|---|
| **API p95 latency** | <150ms | Datadog / CloudWatch |
| **Database query p95** | <50ms | Query logs, EXPLAIN ANALYZE |
| **CAS grading p95** | <100ms (Tier 1) / <250ms (Tier 2) | Sentry APM |
| **Rate limit accuracy** | 99.99% | Audit Redis keys |
| **Mastery cache hit rate** | >80% | Redis INFO stats |
| **SymPy timeout rate** | <0.1% | Application logs |

## Code Locations

| Component | Path |
|-----------|------|
| API Endpoint | `/home/ubnutu/github/Qmath/app/api/check-step/route.ts` |
| Fade Logic | `/home/ubnutu/github/Qmath/lib/math/fade-logic.ts` |
| BKT | `/home/ubnutu/github/Qmath/lib/adaptive-engine/knowledge-tracing.ts` |
| CAS Grader | `/home/ubnutu/github/Qmath/lib/math/cas-grader.ts` |
| Pre-Parser | `/home/ubnutu/github/Qmath/lib/math/pre-parser.ts` |
| Rate Limit | `/home/ubnutu/github/Qmath/lib/rate-limit.ts` |
| Schema | `/home/ubnutu/github/Qmath/db/schema.ts` |
| Migrations | `/home/ubnutu/github/Qmath/db/migrations/0004_lying_paladin.sql` |

## See Also

- **API Reference:** [`/docs/api/check-step.md`](../api/check-step.md)
- **Integration Guide:** [`/docs/dev/integrating-fading-steps.md`](../dev/integrating-fading-steps.md)
- **Deployment Guide:** [`/docs/ops/deployment.md`](../ops/deployment.md)
