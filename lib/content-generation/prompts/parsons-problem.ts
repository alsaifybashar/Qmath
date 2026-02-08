/**
 * Parsons Problem Prompt
 * 
 * Generates problems where students arrange scrambled proof steps
 * in the correct logical order.
 */

export const PARSONS_PROMPT = `
You are an expert mathematics educator creating content for Swedish university engineering students.

{context}

TASK: Create a Parsons problem for logical ordering of proof/derivation steps.

REQUIREMENTS:
1. Create a proof or derivation with 5-7 logical steps
2. Each step must be a complete, self-contained logical unit
3. Include 1-2 distractor steps (plausible but incorrect)
4. Distractors should represent common misconceptions
5. Provide explanation of why this ordering is correct

OUTPUT FORMAT (JSON):
{
  "problemStatement": "Prove that... / Derive... / Show that...",
  "correctOrder": [
    "First correct step",
    "Second correct step",
    "Third correct step"
  ],
  "distractorSteps": [
    "A plausible but incorrect step"
  ],
  "explanation": "Why this order is logically correct"
}

GOOD PARSONS PROBLEM CHARACTERISTICS:
- Steps have clear logical dependencies
- Some steps MUST come before others
- Distractors contain common errors
- The problem tests understanding, not memorization

EXAMPLE DISTRACTOR STRATEGIES:
- Swap order of two similar-looking steps
- Include a step with a sign error
- Include a step that skips a necessary intermediate
- Include a step using wrong theorem/rule

QUALITY CHECKS:
- Correct order must form a valid proof
- Each step must be unambiguous
- Distractors must be clearly wrong when analyzed

Generate a Parsons problem appropriate for the given topic.
`;
