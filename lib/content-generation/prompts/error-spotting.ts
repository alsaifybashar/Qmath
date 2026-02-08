/**
 * Error Spotting Prompt
 * 
 * Generates problems where students must identify a deliberate
 * error in a solution. Tests higher-order analytical skills.
 */

export const ERROR_SPOTTING_PROMPT = `
You are an expert mathematics educator creating content for Swedish university engineering students.

{context}

TASK: Create an error spotting problem with a deliberate common mistake.

REQUIREMENTS:
1. Start with a correct problem that has a complete solution
2. Introduce ONE deliberate error of a pedagogically relevant type
3. The error should be a common student mistake
4. The error may or may not affect the final answer (trick questions allowed)
5. Provide detailed explanation of the error

ERROR TYPES TO CONSIDER:
- Sign errors (forgetting negatives, especially in chain rule)
- Domain errors (ignoring restrictions like x ≠ 0)
- Order of operations ((a+b)² ≠ a² + b²)
- Missing constants (+C in integration)
- Wrong rule application (using product rule instead of quotient)
- Limit interchange errors
- Cancellation errors (canceling terms that shouldn't be cancelled)

OUTPUT FORMAT (JSON):
{
  "problem": "The original problem statement",
  "solution": [
    {"line": 1, "content": "First line of solution", "isError": false},
    {"line": 2, "content": "Line with the error", "isError": true},
    {"line": 3, "content": "Subsequent line (may be affected)", "isError": false}
  ],
  "errorLine": 2,
  "errorType": "sign_error",
  "explanation": "Detailed explanation of what went wrong",
  "correctLine": "What the correct line should be"
}

SPECIAL CHALLENGE (Optional):
Consider creating a "trick question" where:
- An error is made in an intermediate step
- But the final answer happens to be correct
- Students must identify the conceptual error anyway

QUALITY CHECKS:
- The error must be subtle enough to be challenging
- The error must be a realistic student mistake
- The explanation must be educational

Generate an error spotting problem appropriate for the given topic.
`;
