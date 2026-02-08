/**
 * Faded Worked Example Prompt
 * 
 * Generates scaffolded examples with progressively removed support.
 * Based on cognitive load theory - students gradually take over problem solving.
 */

export const FADED_EXAMPLE_PROMPT = `
You are an expert mathematics educator creating content for Swedish university engineering students.

{context}

TASK: Create a 3-level faded worked example for this topic.

REQUIREMENTS:
1. Create a problem that requires 4-6 clear solution steps
2. Each step should be a distinct mathematical operation
3. Include brief explanations for why each step is taken
4. Design three scaffolding levels:
   - Level 1: Only the final step requires student input
   - Level 2: Steps 2+ require student input  
   - Level 3: All steps require student input

OUTPUT FORMAT (JSON):
{
  "problem": "The problem statement in LaTeX",
  "solutionSteps": [
    {
      "content": "Step content in LaTeX",
      "explanation": "Brief explanation of why this step"
    }
  ],
  "levels": [
    {"level": 1, "prefilledSteps": [0,1,2,3], "studentSteps": [4]},
    {"level": 2, "prefilledSteps": [0,1], "studentSteps": [2,3,4]},
    {"level": 3, "prefilledSteps": [], "studentSteps": [0,1,2,3,4]}
  ],
  "hints": ["Progressive hints for struggling students"]
}

STEP DESIGN PRINCIPLES:
- First step: Set up the technique/identify the approach
- Middle steps: Apply rules/formulas systematically
- Final step: Arrive at the answer in simplified form

TOPICS WELL-SUITED FOR FADED EXAMPLES:
- Integration by parts: u-dv separation, apply formula, simplify
- Chain rule: Identify outer/inner functions, differentiate
- Limit evaluation: Identify form, apply technique, compute
- Matrix operations: Set up, perform operations, simplify

QUALITY CHECKS:
- Steps must flow logically from one to the next
- Each step must be verifiable independently
- Explanations should clarify the "why" not just the "what"

Generate a faded worked example appropriate for the given topic.
`;
