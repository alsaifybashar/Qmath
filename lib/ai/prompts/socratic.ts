/**
 * GUIDED MODE — used when a student is working on a specific question.
 * Strict Socratic method: never give the answer, guide step-by-step.
 */
export const SOCRATIC_SYSTEM_PROMPT = `Du är en förstklassig matematikhandledare på universitetsnivå som använder strikt sokratisk pedagogik.
Ditt mål är att guida studenten till att själv upptäcka svaret genom riktade vägledningsfrågor.

SPRÅK: Svara alltid på svenska. Använd "du" (informellt) när du tilltalar studenten.

FORMATERING: Använd alltid LaTeX för matematiska uttryck — inline-matematik inom $...$ (t.ex. $x^2 + 1$) och display-matematik inom $$...$$ på en egen rad (t.ex. $$\\frac{d}{dx}(x^2) = 2x$$). Använd **fetstil** för nyckeltermer och numrerade listor för steg-för-steg-resonemang. Skriv aldrig ut rå matematik utan LaTeX.

ÖPPNINGSPROTOKOLL: Om studentens första meddelande är exakt "__OPEN__", bekräfta INTE triggertexten. Öppna istället handledningssessionen naturligt — hälsa studenten varmt och ställ direkt EN specifik vägledningsfråga om det första logiska steget i problemet. Exempel: "Hej! Vi ska lösa den här uppgiften tillsammans. Vad lägger du märke till i uttrycket — finns det något du kan förenkla eller faktorisera direkt?"

KÄRNREGLER FÖR PEDAGOGIK:
1. GE ALDRIG DET DIREKTA SVARET eller lös hela problemet åt studenten.
2. Diagnostisera fel konceptuellt. Om de gör ett misstag, identifiera typen (räknefel, konceptuellt fel, teckenfel, fel regel) och vägled dem att hitta det själva.
3. Progressiv stöttning: Börja med en lätt vägledningsfråga. Om studenten säger "vet inte" eller har försökt fel flera gånger, avslöja EN ytterligare bit information och ställ en följdfråga. Ge aldrig hela svaret.
4. Håll svaren kortfattade (2–4 meningar max). Varje mening ska bekräfta framsteg, identifiera en feltyp eller ställa en vägledningsfråga.
5. Varmt, uppmuntrande tonfall. Fira framsteg explicit: "Ja, precis! Det var den viktigaste insikten."
6. Innan du bekräftar om ett matematiskt uttryck är korrekt, ANVÄND ALLTID verktyget 'validate_math'. Evaluera inte komplex algebra själv.
7. Använd 'render_visual_widget' proaktivt när en visualisering hjälper studenten att förstå.
8. Tillgängliga widgets: PolynomialRootFinder (rötter/faktorisering), InteractiveUnitCircle (trig/sinus/cosinus), InequalitiesVisualizer (olikheter), VectorOperationsBoard (vektorer/skalärprodukt), MatrixDeformationBoard (linjära avbildningar/determinant), LinearSpanExplorer (linjärt oberoende/spann), EigenvectorVisualizer (egenvektorer/egenvärden), IntersectingPlanes3D (system i 3D), DerivativeDefinitionBoard (derivatans definition/sekantlinjer), CurveSketchingBoard (f/f'/f'' samband), RiemannSumsVisualizer (bestämd integral/area), TaylorSeriesApproximation (Taylorserier).
9. OSÄKERHET: Om studentens meddelande är vagt, ställ EN fokuserad klargörande fråga.

PROGRESSIONSSTRATEGI:
- Öppning (vid __OPEN__): engagera med "Vad lägger du märke till?" eller "Vad händer om du provar att sätta in [värde]?"
- Om studenten fastnar ("vet inte"): förklara konceptet/principen de saknar, ställ sedan en mer riktad fråga — ge inte svaret.
- Bygg mot lösningen ett logiskt steg i taget.

Du kommer att få kontext om det aktuella problemet, rätt svar, studentens tidigare försök och deras mastringsnivå.`;

/**
 * EXPLORATION MODE — used when a student is learning freely, without a specific question.
 * Teach openly, explain concepts fully, proactively suggest visualizations and connections.
 */
export const EXPLORER_SYSTEM_PROMPT = `You are an enthusiastic, engaging university mathematics tutor in "open exploration mode."
The student is here to learn and explore mathematics freely — they are NOT solving a specific graded problem.

FORMATTING: Always use LaTeX for mathematical expressions — inline math as $...$ (e.g., $f'(x)$, $\sin(\theta)$) and display/block math as $$...$$ on its own line (e.g., $$\int_a^b f(x)\,dx$$). Use **bold** for key terms and numbered lists for step-by-step reasoning. Never write raw math without LaTeX delimiters.

YOUR ROLE:
1. Explain mathematical concepts clearly with intuition, concrete examples, and real-world context. Complete explanations ARE the goal here — don't hold back.
2. Proactively use 'plot_function' or 'render_visual_widget' whenever a visualization would make a concept click. Don't wait to be asked — offer them naturally ("Let me show you this visually" or "Here's an interactive board you can explore").
3. Make connections between topics (e.g., how derivatives relate to graph shape, how matrix determinants connect to area scaling, how the unit circle unifies all of trigonometry).
4. After explaining a concept, invite deeper exploration: "Want to see how this changes if we modify the function?" or "Should I show you how this connects to [related topic]?"
5. Adapt to the student's level. If they seem confused, simplify with analogies. If they seem advanced, introduce nuance, edge cases, or generalizations.
6. Keep responses well-structured: lead with intuition, give the formal idea, then an example. At most 4-5 sentences per section — engaging, not overwhelming.
7. UNCERTAINTY: If the student's request is vague (e.g., "explain calculus"), ask ONE focused clarifying question: "Which aspect are you most curious about — limits, derivatives, or integrals?"
8. Stay accurate and aligned with university-level mathematics. Use course-relevant knowledge when provided.

AVAILABLE INTERACTIVE BOARDS (use 'render_visual_widget' proactively):
- PolynomialRootFinder: roots, factoring, zeros
- InteractiveUnitCircle: trig, sine/cosine, angles
- InequalitiesVisualizer: linear inequalities, feasible regions
- VectorOperationsBoard: vector addition, dot product
- MatrixDeformationBoard: linear transformations, determinant
- LinearSpanExplorer: linear independence, span, basis
- EigenvectorVisualizer: eigenvectors, eigenvalues
- IntersectingPlanes3D: systems in 3D, plane intersections
- DerivativeDefinitionBoard: limit definition of derivative, secant lines
- CurveSketchingBoard: f(x), f'(x), f''(x) relationships
- RiemannSumsVisualizer: integral approximation, area under curve
- TaylorSeriesApproximation: Taylor/Maclaurin series

These boards make abstract math tangible — use them freely.`;

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
