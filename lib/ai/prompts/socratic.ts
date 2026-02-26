export const SOCRATIC_SYSTEM_PROMPT = `You are a world-class university mathematics tutor utilizing strict Socratic pedagogical principles.
Your primary goal is to guide students to discover the answers themselves rather than giving them away.

CORE PEDAGOGICAL RULES:
1. NEVER GIVE THE DIRECT ANSWER or solve the problem completely for the student.
2. If the student asks for the answer, gently deflect and ask a guiding question that points them to the next logical step.
3. Diagnose the student's errors conceptually. If they make a mistake, identify what type of mistake it is (e.g., computational, conceptual, sign error) and guide them to find it.
4. Keep your responses concise (1-3 sentences).
5. Use an encouraging, warm, and supportive tone. Celebrate small wins.
6. Before confirming if their math expression is correct, ALWAYS use the 'validate_math' tool. This tool will mathematically compare their expression to the correct answer. DO NOT evaluate complex algebra yourself without using the tool, as language models can make algebraic mistakes.
7. If a student is struggling to visualize a function or if you want to illustrate a mathematical concept, use the 'plot_function' tool. This helps bridge the gap between abstract equations and visual intuition.
8. Use the student's mastery level to gauge how much scaffolding to provide. A struggling student needs more direct hints; a proficient student needs lighter nudges.
9. To present an interactive widget (e.g. for calculus derivatives, linear algebra vectors, grid multiplication, or column addition), unconditionally use the 'render_visual_widget' tool. This overrides text explanations with a powerful interactive UI.
10. UNCERTAINTY HANDLING & CLARIFICATION: If the student's request is vague, ambiguous, or lacks sufficient context for you to give an accurate mathematical answer or spawn the right widget, DO NOT guess or hallucinate. Instead, clearly ask the student to provide more details or clarify their question. Only provide a solution path or widget when you have high confidence it directly addresses what the student is studying.

You will receive context about the current problem, the correct answer, the student's previous attempts, and their current mastery level.`;

export const getMathValidationTool = () => {
    return {
        name: "validate_math",
        description: "Evaluates whether the student's mathematical expression is equivalent to the expected correct answer. Call this tool whenever a student offers a mathematical final answer or intermediate step to check its correctness algebraically.",
        input_schema: {
            type: "object" as const,
            properties: {
                student_expression: {
                    type: "string",
                    description: "The mathematical expression provided by the student, formatted as plain text or basic LaTeX."
                },
                expected_expression: {
                    type: "string",
                    description: "The expected correct mathematical expression to evaluate against."
                }
            },
            required: ["student_expression", "expected_expression"]
        }
    };
};

export const getPlotTool = () => {
    return {
        name: "plot_function",
        description: "Generates a 2D graph/plot of a mathematical function to help the student visualize it.",
        input_schema: {
            type: "object" as const,
            properties: {
                expression: {
                    type: "string",
                    description: "The mathematical expression to plot (e.g., 'x^2', 'sin(x)', '2x + 1'). Use 'x' as the independent variable."
                },
                title: {
                    type: "string",
                    description: "A short, descriptive title for the graph."
                },
                x_range: {
                    type: "array",
                    items: { type: "number" },
                    minItems: 2,
                    maxItems: 2,
                    description: "[min, max] range for the x-axis. Defaults to [-10, 10] if not provided."
                },
                y_range: {
                    type: "array",
                    items: { type: "number" },
                    minItems: 2,
                    maxItems: 2,
                    description: "[min, max] range for the y-axis. Used to properly scale the chart. Optional."
                }
            },
            required: ["expression", "title"]
        }
    };
};

export const getVisualWidgetTool = () => {
    return {
        name: "render_visual_widget",
        description: "Renders an interactive educational tool (a React widget) within the chat to help the student visualize mathematical concepts. Use this when the student is struggling to understand matrix multiplication, long column addition, calculus derivatives/tangent lines, or geometric vector addition.",
        input_schema: {
            type: "object" as const,
            properties: {
                type: {
                    type: "string",
                    enum: ["GridMultiplier", "ColumnAddition", "CalculusTangent", "VectorSpace"],
                    description: "The type of interactive widget to render. Choose based on context: 'GridMultiplier' for basic matrix multiplication, 'ColumnAddition' for multi-digit addition, 'CalculusTangent' for derivatives and slopes, and 'VectorSpace' for linear algebra vector addition."
                },
                props: {
                    type: "object",
                    description: "A JSON object of properties to configure the chosen widget.\nGridMultiplier: { initialRows: number, initialCols: number, targetRows: number, targetCols: number }\nColumnAddition: { numbers: number[] } (array of integers to add)\nCalculusTangent: { expression: string (e.g. '0.5*x^2'), title: string, domain: [number, number] } (always provide domain!)\nVectorSpace: { title: string, description: string }"
                }
            },
            required: ["type", "props"]
        }
    };
};
