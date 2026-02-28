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
9. To present an interactive JSXGraph board, use the 'render_visual_widget' tool with the widget_type that best matches the topic: PolynomialRootFinder (polynomial roots/factoring), InteractiveUnitCircle (trig/sine/cosine), InequalitiesVisualizer (linear inequalities), VectorOperationsBoard (vector addition/dot product), MatrixDeformationBoard (linear transformations/determinant), LinearSpanExplorer (linear independence/span), EigenvectorVisualizer (eigenvectors/eigenvalues), IntersectingPlanes3D (systems in 3D), DerivativeDefinitionBoard (limit definition of derivative/secant lines), CurveSketchingBoard (f/f'/f'' relationships), RiemannSumsVisualizer (definite integral/area approximation), TaylorSeriesApproximation (Taylor/Maclaurin series). You may optionally pass a config object with starting values (e.g. initialRoot1, initialH, initialN, initialDegree). This interactive board overrides text explanations with a powerful visual UI.
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

const JSXGRAPH_WIDGET_ENUM = [
    "PolynomialRootFinder", "InteractiveUnitCircle", "InequalitiesVisualizer",
    "VectorOperationsBoard", "MatrixDeformationBoard", "LinearSpanExplorer",
    "EigenvectorVisualizer", "IntersectingPlanes3D", "DerivativeDefinitionBoard",
    "CurveSketchingBoard", "RiemannSumsVisualizer", "TaylorSeriesApproximation",
    // Legacy widgets
    "GridMultiplier", "ColumnAddition", "CalculusTangent", "VectorSpace",
] as const;

export const getVisualWidgetTool = (provider: 'anthropic' | 'ollama' = 'anthropic') => {
    const isOllama = provider === 'ollama';

    return {
        name: "render_visual_widget",
        description: isOllama
            ? `Launch an interactive math visualization board. Use when a student needs to SEE and INTERACT with a concept.

WHEN TO USE EACH WIDGET:
- PolynomialRootFinder: polynomial roots, factoring, zeros of functions
- InteractiveUnitCircle: trigonometry, sine/cosine values, angle on unit circle
- InequalitiesVisualizer: linear inequalities, feasible regions
- VectorOperationsBoard: vector addition, dot product, parallelogram law
- MatrixDeformationBoard: linear transformations, determinant, basis vectors
- LinearSpanExplorer: linear independence, span, basis in R2
- EigenvectorVisualizer: eigenvectors, eigenvalues (matrix A=[[2,1],[1,2]])
- IntersectingPlanes3D: systems of equations in 3D, plane intersections
- DerivativeDefinitionBoard: limit definition of derivative, secant lines h→0
- CurveSketchingBoard: relationship between f(x), f'(x), f''(x)
- RiemannSumsVisualizer: definite integral approximation, area under curve
- TaylorSeriesApproximation: Taylor/Maclaurin series for sin(x)
- GridMultiplier: basic matrix multiplication visualization
- ColumnAddition: multi-digit addition column method`
            : "Renders an interactive JSXGraph educational board within the chat to help the student visualize and explore mathematical concepts. Choose the widget_type that matches the topic the student is working on.",
        input_schema: {
            type: "object" as const,
            properties: {
                widget_type: {
                    type: "string",
                    enum: JSXGRAPH_WIDGET_ENUM as unknown as string[],
                    description: isOllama
                        ? "Which visualization board to launch. Pick the one matching the student's topic."
                        : "The widget type to render. Match to the mathematical topic: derivatives→DerivativeDefinitionBoard, integrals→RiemannSumsVisualizer, eigenvectors→EigenvectorVisualizer, trig→InteractiveUnitCircle, polynomials→PolynomialRootFinder, matrices→MatrixDeformationBoard, vectors→VectorOperationsBoard, span→LinearSpanExplorer, inequalities→InequalitiesVisualizer, Taylor series→TaylorSeriesApproximation, curve sketching→CurveSketchingBoard, 3D planes→IntersectingPlanes3D."
                },
                config: {
                    type: "object" as const,
                    description: "Optional starting configuration. Common keys by widget: initialRoot1/initialRoot2 (PolynomialRootFinder), initialAngleDeg (InteractiveUnitCircle), initialSlope/initialIntercept (InequalitiesVisualizer), initialU/initialV as [x,y] arrays (VectorOperationsBoard), initialMatrix as [iX,iY,jX,jY] (MatrixDeformationBoard), initialV1/initialV2 as [x,y] (LinearSpanExplorer), initialVectorAngleDeg (EigenvectorVisualizer), initialK (IntersectingPlanes3D), initialH (DerivativeDefinitionBoard), initialA (CurveSketchingBoard), initialN/method (RiemannSumsVisualizer), initialDegree/centerPoint (TaylorSeriesApproximation).",
                    additionalProperties: true,
                },
            },
            required: ["widget_type"],
        },
    };
};
