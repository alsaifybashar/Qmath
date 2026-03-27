# Admin Guide: Creating and Managing Fading Steps Questions

## What are Tonande Lösningssteg (Fading Steps)?

**Tonande Lösningssteg** (Fading Steps) is a scaffolding technique that gradually removes hints and step-by-step guidance as students demonstrate mastery. The system automatically adjusts the visibility of each step based on:

1. **Student's mastery score** — updated after each correct/incorrect answer
2. **Cognitive benefits** — research shows guided practice → independent problem-solving improves retention

### The Four Phases of Fading

| Phase | Mastery Range | Steps Shown | Student Experience |
|-------|---------------|-------------|-------------------|
| **1: Full Guidance** | 0.0 – 0.35 | All steps | "Guided handholding" — see every step and hint |
| **2: Partial Fading** | 0.35 – 0.55 | ~66% of steps | "Scaffolding reduces" — some steps become hidden |
| **3: Heavy Fading** | 0.55 – 0.75 | ~33% of steps | "Challenge mode" — most steps hidden, student must recall |
| **4: No Support** | 0.75 – 1.0 | 0 steps | "Independent" — student solves alone, no hints |

**Progression is automatic:** As students answer correctly, mastery increases and steps fade.

### Pedagogical Rationale

Fading steps leverage the **Cognitive Load Theory**:
- **Novices** need external structure (all steps visible)
- **Intermediate learners** benefit from withdrawing support to force deeper processing
- **Experts** solve independently with no cognitive load from hints

This mimics how good teachers gradually reduce scaffolding as students demonstrate understanding.

## Creating a Fading Steps Question

### Step 1: Navigate to Question Editor

1. Log in as teacher/admin
2. Go to **Courses** → select your course
3. Select a **Topic**
4. Click **New Question** → choose **Type: CAS Steps**

### Step 2: Fill in the Question Stem

| Field | Notes |
|-------|-------|
| **Question Text** | "Simplify the expression: $x^2 + 2x + 1$" |
| **Question Math** | Optional LaTeX rendering: `$x^2 + 2x + 1$` |
| **Difficulty** | 1–5 (for question selection algorithms) |

### Step 3: Build Steps using the Step Builder UI

The **Step Builder** is an interface where you:

1. **Click "Add Step"** at the bottom
2. For each step, fill in:

   | Field | Example | Notes |
   |-------|---------|-------|
   | **Step Instruction** | "Recognize the pattern as a perfect square trinomial" | Tell student *what to do*, not the answer |
   | **Step LaTeX** (optional) | `$a^2 + 2ab + b^2 = (a+b)^2$` | Display formula or worked example |
   | **Correct Answer** | `(x+1)^2` | The answer students must enter for this step |
   | **Hint** (optional) | "Look for $(a+b)^2$ pattern where $a=x$, $b=1$" | Shown only in Phase 1–2 |
   | **Question Type** | `algebra` (default) | Affects feedback generation |

3. **Reorder steps** by dragging (system saves order automatically)
4. **Preview your steps** — see how they appear at each mastery level

### Example: Step Builder for Factoring $x^2 + 2x + 1$

**Step 1 (Foundation)**
- Instruction: "Identify the quadratic form"
- LaTeX: `$x^2 + 2x + 1$`
- Correct Answer: `x^2 + 2*x + 1`
- Hint: "This is a trinomial: ax² + bx + c"
- Question Type: `algebra`

**Step 2 (Recognition)**
- Instruction: "Recognize the pattern: a² + 2ab + b²"
- LaTeX: `$1, 2, 1$ are the coefficients`
- Correct Answer: `a^2 + 2*a*b + b^2`
- Hint: "Does $(a+b)^2$ expand to $a^2 + 2ab + b^2$?"
- Question Type: `algebra`

**Step 3 (Application)**
- Instruction: "Factor the expression completely"
- LaTeX: null (no hint here; student must know)
- Correct Answer: `(x+1)^2`
- Hint: null
- Question Type: `algebra`

**Result:**
- **Phase 1 (mastery 0.0–0.35):** Student sees all 3 steps with all hints
- **Phase 2 (mastery 0.35–0.55):** Student sees steps 1–2 (2 out of 3)
- **Phase 3 (mastery 0.55–0.75):** Student sees step 1 only (1 out of 3)
- **Phase 4 (mastery 0.75–1.0):** Student sees no steps; solves independently

## Best Practices: How Many Steps? What Makes a Good Step?

### Recommended Step Count

| Problem Type | Step Count | Reasoning |
|---|---|---|
| Simple algebra (factor, simplify) | 2–3 | Too few = not enough scaffolding; too many = cognitive overload |
| Multi-step calculus (integrate, then substitute) | 3–4 | Each major transformation is a step |
| Complex proof or application | 4–5 | Break into logical sub-goals |
| Quick recall (e.g., trig identity) | 1–2 | No fading needed; use simple Q instead |

### What Makes a Good Step?

✅ **Good Steps:**
1. **Actionable** — Instruction tells student what to *do*, not the answer
   - Good: "Factor out the common term"
   - Bad: "Factor out $x$ to get $x(x + 2)$"

2. **Scaffolded progression** — Each step builds on the previous
   - Step 1: Recognize pattern
   - Step 2: Extract parameters
   - Step 3: Apply formula

3. **Single cognitive load** — Each step asks for one thing
   - Good: "Simplify $\sqrt{8}$"
   - Bad: "Simplify and rationalize $\frac{1}{\sqrt{8}}$" (two tasks)

4. **Correct Answer is testable** — Student input can be compared via CAS
   - Good: `sin(x)` (math.js can verify equivalence)
   - Bad: "Explain why" (requires NLP, not graded by CAS)

❌ **Poor Steps:**
- Vague instructions: "Solve this" (solve what part?)
- Non-math answers: "What is the geometric interpretation?" (not graded by CAS)
- Too easy/hard relative to neighbors: breaks learning progression
- Unreasonable intermediate form: student may reach correct final answer differently

### Hint Strategy

| Phase | Hint Visibility | Recommendation |
|-------|---|---|
| Phase 1 | Always shown | Use **verbose, encouraging hints**: "Look for a factor of 2..." |
| Phase 2 | Shown | Use **medium hints**: "Check for common factors" |
| Phase 3 | Hidden | Leave hint field empty or minimal: null |
| Phase 4 | Hidden | Leave empty |

**Hint Style Guide (Swedish):**
- Start with: "Försök att..." (Try to...)
- Ask a guiding question: "Vilken term är gemensam?" (Which term is common?)
- Avoid revealing the answer: "Tänk på kvadreringsregeln" vs. "använd $(a+b)^2$"

## How Mastery & Fading Works (Non-Technical Overview)

### Mastery Score

Each student has a **mastery probability** for each topic (0.0 = "definitely doesn't know" → 1.0 = "definitely knows").

**How it updates:**
- Starts at 0.1 (pessimistic assumption: student doesn't know yet)
- **Correct answer** → mastery increases (e.g., 0.1 → 0.25)
- **Incorrect answer** → mastery decreases or stays low (e.g., 0.25 → 0.15)
- **Multiple correct answers** → mastery converges toward 1.0

**Bayesian intuition:** We update our belief ("Is this student ready for independence?") based on evidence (correct/incorrect).

### Fade Logic

When student submits an answer, the system:
1. Grades the answer (correct/incorrect)
2. Updates mastery (Bayesian Knowledge Tracing)
3. Recomputes which steps to show (fade function)
4. Returns revealed steps in response

**Fade thresholds (hard-coded):**
```
mastery < 0.35  → show all steps (Phase 1)
0.35 ≤ mastery < 0.55  → show 66% of steps (Phase 2)
0.55 ≤ mastery < 0.75  → show 33% of steps (Phase 3)
0.75 ≤ mastery  → show 0 steps (Phase 4)
```

**Example:** For a 3-step question:
- Phase 1: show steps 1, 2, 3
- Phase 2: show steps 1, 2 (66% ≈ 2 out of 3)
- Phase 3: show step 1 only (33% ≈ 1 out of 3)
- Phase 4: show nothing

### Why This Order?

Steps are revealed **in order** (step 1 first, then step 2, etc.). This ensures:
- Students always see foundational steps before advanced ones
- No "gaps" in understanding (student can't skip step 1 and see step 3)
- Progressive difficulty matches learning progression

## Publishing & Testing a Question

### Before Publishing: Test Your Question

1. **As the admin, go to the question page**
2. **Simulate different mastery levels:**
   - In browser console, you can mock mastery (DevTools → Network tab → filter `/api/check-step`)
   - **Better:** Use the admin testing panel (if available) to set `userMastery.masteryProbability` in DB

3. **Verify:**
   - Phase 1: All steps visible? All hints shown?
   - Phase 2: Exactly 66% visible?
   - Phase 3: Exactly 33% visible?
   - Phase 4: No steps shown?
   - Hints appear/disappear at the right phases?

4. **Check CAS grading:**
   - Can the system correctly identify equivalent forms?
     - `x^2 + 1` vs `1 + x^2` → both should be correct
     - `2*x + 2` vs `2*(x+1)` → both should be correct (or set `ignoreConstant: true` for integrals)
   - Incorrect answers: does feedback make sense?

### Publish Steps

1. **Mark as "Ready"** (status: draft → ready)
2. **Set visibility:** Published | Draft | Archived
3. **Click "Publish"**

Students will now see this question in their topic practice.

## Complete Examples

### Example 1: Integral with Constant (Calculus)

**Problem:** "Integrate $x^2 + 2x$ with respect to $x$."

| Step | Instruction | LaTeX | Correct Answer | Hint | Type |
|------|---|---|---|---|---|
| 1 | "Recall the power rule: $\int x^n dx = \frac{x^{n+1}}{n+1} + C$" | `$\int x^n dx = \frac{x^{n+1}}{n+1} + C$` | `x^(n+1)/(n+1)` | "What's the exponent?" | algebra |
| 2 | "Apply to the first term $x^2$" | `$\int x^2 dx = ?$` | `x^3/3` | "Use n=2" | algebra |
| 3 | "Apply to the second term $2x$" | `$\int 2x dx = ?$` | `x^2` | "Use n=1, pull out 2" | algebra |
| 4 | "Combine both terms and add the constant of integration" | null | `x^3/3 + x^2 + C` | null | algebra |

**Fade behavior:**
- Phase 1: See all steps 1–4 (learn the process step-by-step)
- Phase 2: See steps 1–3 (already know how to add C)
- Phase 3: See step 1 only (just need the power rule reminder)
- Phase 4: Solve independently (master)

### Example 2: Derivative (Calculus)

**Problem:** "Find $\frac{d}{dx}(3x^2 + 5x + 2)$."

| Step | Instruction | LaTeX | Correct Answer | Hint | Type |
|------|---|---|---|---|---|
| 1 | "Recognize this as a polynomial" | `$3x^2 + 5x + 2$` | `polynomial` | "It has terms with powers of x" | algebra |
| 2 | "Apply the power rule to $3x^2$" | `$\frac{d}{dx}(3x^2) = 3 \cdot 2 \cdot x^{2-1}$` | `6*x` | "Multiply coefficient by exponent, reduce exponent" | algebra |
| 3 | "Apply the power rule to $5x$" | `$\frac{d}{dx}(5x) = ?$` | `5` | "x = x¹, so 1·x⁰ = 1" | algebra |
| 4 | "Apply the power rule to the constant" | `$\frac{d}{dx}(2) = ?$` | `0` | "Constants vanish" | algebra |
| 5 | "Combine all derivatives" | null | `6*x + 5` | null | algebra |

### Example 3: Algebraic Simplification

**Problem:** "Simplify $(2x + 3)^2 - (x + 1)^2$."

| Step | Instruction | LaTeX | Correct Answer | Hint | Type |
|------|---|---|---|---|---|
| 1 | "Expand $(2x + 3)^2$ using $(a+b)^2 = a^2 + 2ab + b^2$" | `$(2x)^2 + 2(2x)(3) + 3^2$` | `4*x^2 + 12*x + 9` | "a = 2x, b = 3" | algebra |
| 2 | "Expand $(x + 1)^2$" | `$(x)^2 + 2(x)(1) + 1^2$` | `x^2 + 2*x + 1` | "a = x, b = 1" | algebra |
| 3 | "Subtract: first result minus second result" | `$(4x^2 + 12x + 9) - (x^2 + 2x + 1)$` | `3*x^2 + 10*x + 8` | "Change signs in the second part" | algebra |
| 4 | "Factor if possible (bonus)" | null | `(3*x + 4)*(x + 2)` | null (challenge) | algebra |

## Troubleshooting

### Issue: Steps are not fading as expected

**Possible causes:**
1. **Mastery not updating:** Check that answers are being submitted to `/api/check-step`
   - Look in network tab for 200 responses with `newMastery` field
2. **Fade thresholds not being hit:** Correct answers may not be raising mastery fast enough
   - Check BKT parameters in `lib/adaptive-engine/knowledge-tracing.ts`
   - Default: `pLearn: 0.2` (20% jump per correct answer)
3. **Steps not reordered:** Check that step numbers are sequential (1, 2, 3, ...)

**Solution:**
- Review the question edit page → scroll to "Mastery Simulation" section
- Manually set a mastery value to 0.4, 0.6, 0.8 and verify steps show/hide correctly

### Issue: CAS grader says answer is wrong, but it's mathematically correct

**Possible causes:**
1. **Input normalization:** Student entered `2x` but correct answer is `2*x`
   - The pre-parser should handle this; if not, check `/lib/math/pre-parser.ts`
2. **Equivalent but different form:** Student entered `(x+1)^2` but correct answer is `x^2+2*x+1`
   - This triggers Tier 2 (SymPy sidecar); if SymPy is down, grades incorrectly
3. **Constant handling:** For integrals, correct answer is `x^2/2 + C`, student wrote `x^2/2 + 5`
   - Set the step's `ignoreConstant: true` option (if UI supports it) or update feedback

**Solution:**
- Contact the dev team to check SymPy sidecar status
- Review the step's **Correct Answer** field — is it in the canonical form?

## Glossary

| Term | Definition |
|------|-----------|
| **Fading** | Gradual withdrawal of instructional support (hints, steps) |
| **Mastery** | Bayesian probability [0.0, 1.0] representing student knowledge of a topic |
| **Scaffold** | Temporary support structure; in this case, step-by-step hints that fade as mastery increases |
| **CAS** | Computer Algebra System (math.js); grades math expressions |
| **BKT** | Bayesian Knowledge Tracing; algorithm that updates mastery based on performance |
| **Pre-parser** | Normalizes student input (e.g., `3xy` → `3*x*y`) before CAS evaluation |

## See Also

- **Developer Guide:** [`/docs/dev/integrating-fading-steps.md`](../dev/integrating-fading-steps.md) — How fading is computed
- **API Reference:** [`/docs/api/check-step.md`](../api/check-step.md) — Endpoint documentation
- **Architecture:** [`/docs/dev/architecture.md`](../dev/architecture.md) — System design and scaling
