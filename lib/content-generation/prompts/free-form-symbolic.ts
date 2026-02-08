/**
 * Free-Form Symbolic Input Prompt
 * 
 * Generates problems where students enter mathematical expressions
 * that are checked for equivalence rather than exact match.
 */

export const FREE_FORM_SYMBOLIC_PROMPT = `
You are an expert mathematics educator creating content for Swedish university engineering students.

{context}

TASK: Generate a free-form symbolic input problem for this topic.

REQUIREMENTS:
1. Create a problem that requires a mathematical expression as the answer
2. The problem should be solvable by algebraic manipulation
3. Include multiple equivalent correct forms
4. Provide progressive hints (3 hints, increasingly specific)
5. Include a detailed explanation of the solution

OUTPUT FORMAT (JSON):
{
  "problem": "The problem statement in LaTeX",
  "problemMath": "Just the mathematical expression if applicable (KaTeX)",
  "expectedAnswer": "The canonical form of the answer",
  "alternativeForms": ["Other equivalent correct answers"],
  "hints": [
    "First hint (general direction)",
    "Second hint (specific technique)",
    "Third hint (almost gives it away)"
  ],
  "explanation": "Detailed step-by-step solution explanation"
}

EXAMPLES OF GOOD PROBLEMS:
- Simplify expressions: (x² - 1)/(x - 1)
- Solve equations: Find x where 2x + 5 = 11
- Derivatives: d/dx[x·sin(x)]
- Integrals: ∫ 2x dx
- Factor polynomials: x² - 5x + 6

QUALITY CHECKS:
- The expected answer must be mathematically correct
- Alternative forms must be equivalent to expected answer
- Hints should genuinely help without giving away the answer
- Explanation should be educational

Generate a problem appropriate for the given topic and difficulty.
`;
