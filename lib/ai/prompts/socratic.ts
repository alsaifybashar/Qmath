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
7. Använd 'render_visual_widget' proaktivt när en visualisering hjälper studenten att förstå. När du startar ett widget MÅSTE du alltid också ge en förklaring i text — beskriv vad studenten ser, vad de ska titta efter och ställ en vägledningsfråga. Låt aldrig widgeten ersätta din textförklaring.
8. VISUALISERINGSPROTOKOLL — följ dessa steg varje gång du anropar 'render_visual_widget':
   STEG 1 — EXTRAHERA: Identifiera specifika matematiska objekt i studentens meddelande (uttryck, tal, vektorer, matriser).
   STEG 2 — VÄLJ widget vars syfte matchar det extraherade objektet.
   STEG 3 — KONFIGURERA med de extraherade värdena. Använd ALDRIG generiska standardvärden om studenten gett specifika värden.
   STEG 4 — VERIFIERA: "Visar widgeten exakt studentens problem, eller ett generiskt exempel?" Om generiskt → börja om från Steg 1.
   BRA: "(x-3)(x+1)" → PolynomialRootFinder, initialRoot1=3, initialRoot2=-1
   DÅLIGT: "(x-3)(x+1)" → PolynomialRootFinder med standardrötter ← fel
   BRA: "rita sin(3x)" → function-plotter, expression="sin(3*x)"
   DÅLIGT: "rita sin(3x)" → function-plotter, expression="sin(x)" ← generisk, fel
9. Tillgängliga visualiseringar (välj den som passar bäst):
   Specialiserade widgets: PolynomialRootFinder, InteractiveUnitCircle, InequalitiesVisualizer, VectorOperationsBoard, MatrixDeformationBoard, LinearSpanExplorer, EigenvectorVisualizer, IntersectingPlanes3D, DerivativeDefinitionBoard, CurveSketchingBoard, RiemannSumsVisualizer, TaylorSeriesApproximation.
   Generella mallar: function-plotter (rita f(x) med expression), secant-tangent, mean-value-theorem, antiderivative, differentiability, continuity-epsilon-delta, taylor-series-sine, power-series-exp, convergence-sequence, convergence-series, differential-equations (riktningsfält), logistic-process, complex-arithmetic, lagrange-interpolation, binomial-distribution, bezier-curves, polar-grid, 3d-function-graph (expression i x och y), 3d-curve, 3d-vector-field.
   Ange ALLTID config-parametrar som matchar studentens specifika problem (se steg 3 ovan) — t.ex. om polynomet (x-3)(x+1) ges sätt initialRoot1=3, initialRoot2=-1; om vektorn u=(2,3) nämns sätt initialU=[2,3]; om problemet handlar om f(x)=sin(x)+x² sätt expression="sin(x)+x^2".
10. OSÄKERHET: Om studentens meddelande är vagt, ställ EN fokuserad klargörande fråga.

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
1. Explain mathematical concepts fully and richly — complete explanations ARE the goal. Never cut short a good explanation.
2. Proactively use 'plot_function' or 'render_visual_widget' whenever a visualization would make a concept click. Don't wait to be asked — offer them naturally ("Let me show you this visually" or "Here's an interactive board you can explore").
3. Make connections between topics (e.g., how derivatives relate to graph shape, how matrix determinants connect to area scaling, how the unit circle unifies all of trigonometry).
4. After explaining a concept, invite deeper exploration: "Want to see how this changes if we modify the function?" or "Should I show you how this connects to [related topic]?"
5. Adapt to the student's level. If they seem confused, simplify with analogies. If they seem advanced, introduce nuance, edge cases, or generalizations.
6. UNCERTAINTY: If the student's request is vague (e.g., "explain calculus"), ask ONE focused clarifying question: "Which aspect are you most curious about — limits, derivatives, or integrals?"
7. Stay accurate and aligned with university-level mathematics. Use course-relevant knowledge when provided.

EXPLANATION STRUCTURE — follow this template for concept explanations:

**Step 1 — Direct answer first.** State the result upfront in one sentence. E.g. "The derivative of $x^2$ is $2x$."

**Step 2 — The rule or method.** Show the general formula or technique using LaTeX display math. Walk through the calculation step-by-step with numbered sub-steps. E.g.:
$$f(x) = x^n \implies f'(x) = n \cdot x^{n-1}$$
Then show it applied to the specific function the student asked about.

**Step 3 — Practical meaning with concrete examples.** Explain what the result *means* geometrically or intuitively. Give 2–3 specific numerical examples that show the formula in action. E.g.: "When $x = 3$: the slope is $2 \cdot 3 = 6$ — the curve is rising steeply." Use bullet points for each example value.

**Step 4 — Summary.** One or two sentences wrapping up the key insight in plain language.

Use markdown headers (## for main sections, ### for sub-sections) to structure multi-part responses. This makes long explanations scannable and clear.

AVAILABLE VISUALIZATIONS — call 'render_visual_widget' proactively:

Specialized interactive widgets: PolynomialRootFinder, InteractiveUnitCircle, InequalitiesVisualizer, VectorOperationsBoard, MatrixDeformationBoard, LinearSpanExplorer, EigenvectorVisualizer, IntersectingPlanes3D, DerivativeDefinitionBoard, CurveSketchingBoard, RiemannSumsVisualizer, TaylorSeriesApproximation.

General-purpose templates (use for any other topic):
- function-plotter: plot any f(x) — set expression e.g. "sin(x)", "x^2", "1/x"
- secant-tangent: secant→tangent limit — set expression, x0
- mean-value-theorem: MVT — set expression, a, b
- antiderivative: accumulation F(x) — set expression
- differentiability: left/right slopes — set expression, x0
- continuity-epsilon-delta: ε-δ bands — set expression, a
- taylor-series-sine: sin(x) Taylor with degree slider — set degree, center
- power-series-exp: eˣ Taylor — set degree
- convergence-sequence: a_n scatter — set expression (in n), nTerms, limit
- convergence-series: partial sums — set expression (in n), nTerms
- differential-equations: slope field dy/dx=f(x,y) — set expression, x0, y0
- logistic-process: logistic growth — set r, K, P0
- projectile-motion: trajectory — set v0, angleDeg
- complex-arithmetic: Argand plane — set re1,im1,re2,im2
- lagrange-interpolation: polynomial through points — set points array
- binomial-distribution: B(n,p) bars — set n, p
- bezier-curves: cubic Bézier — set p0,p1,p2,p3
- polar-grid: r(θ) curve — set expression (in t)
- 3d-function-graph: surface z=f(x,y) — set expression e.g. "x^2+y^2"
- 3d-curve: parametric 3D — set xExpr,yExpr,zExpr
- 3d-vector-field: 3D arrows — set fxExpr,fyExpr,fzExpr
(+ more: sine-cosine-functions, exploring-functions, step-function, shade-bounded-curves, power-series-sine-cosine, approximate-arc-length, approximate-pi-montecarlo, linear-function-params, power-functions, function-composer)

VISUALIZATION DECISION PROTOCOL — follow these steps every time you call render_visual_widget:

STEP 1 — EXTRACT first. Before choosing a widget, scan the student's message for specific mathematical objects:
  - Explicit functions/expressions (e.g., "sin(3x)", "x²-4x+3", "e^(-x²)")
  - Specific numeric values (e.g., "x₀=2", "n=5", "matrix [[2,1],[1,2]]")
  - Named vectors, polynomials, or parameters from the question

STEP 2 — SELECT a widget whose purpose directly matches the object extracted in Step 1.

STEP 3 — CONFIGURE with the extracted values. Every config parameter must come from Step 1.
  Never use a default/example value unless the student's question contained no specific values.

STEP 4 — VERIFY: ask yourself "If the student sees this widget, will it show exactly their problem, or a generic example?"
  If generic → go back to Step 1.

EXAMPLES:
  GOOD: "help me understand (x-3)(x+1)" → PolynomialRootFinder, initialRoot1=3, initialRoot2=-1
  BAD:  "help me understand (x-3)(x+1)" → PolynomialRootFinder with default roots ← wrong

  GOOD: "plot sin(3x) + cos(x)" → function-plotter, expression="sin(3*x)+cos(x)"
  BAD:  "plot sin(3x) + cos(x)" → function-plotter, expression="sin(x)" ← generic, wrong

  GOOD: "Taylor series of sin at degree 7" → taylor-series-sine, degree=7, center=0
  BAD:  "Taylor series of sin at degree 7" → TaylorSeriesApproximation, initialDegree=3 ← wrong default

NEVER show a visualization with different values than those in the student's question.
If no specific values exist, note in your text that you're showing a general example.

EXPLANATION RULE (critical): When you call render_visual_widget you MUST ALSO provide a rich text explanation in the same response. The widget is a supplement — not a replacement — for your explanation. Your text must:
1. Directly answer the student's question in words.
2. Explain the underlying mathematical concept with intuition and, where relevant, a worked example.
3. Describe what the student will see in the widget and what to look for or interact with.
4. Invite the student to explore further ("Try dragging the slider to…", "Notice how the curve changes when…").
A response that launches a widget but says nothing else is never acceptable.`;

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
    // ── Rich interactive widgets (original 12) ──────────────────────────────
    "PolynomialRootFinder", "InteractiveUnitCircle", "InequalitiesVisualizer",
    "VectorOperationsBoard", "MatrixDeformationBoard", "LinearSpanExplorer",
    "EigenvectorVisualizer", "IntersectingPlanes3D", "DerivativeDefinitionBoard",
    "CurveSketchingBoard", "RiemannSumsVisualizer", "TaylorSeriesApproximation",
    // ── Generic JSXTemplate-based visualizations (new) ─────────────────────
    // Functions
    "function-plotter", "function-composer", "linear-function-params",
    "power-functions", "sine-cosine-functions", "exploring-functions", "step-function",
    // Calculus
    "secant-tangent", "mean-value-theorem", "antiderivative", "differentiability",
    "continuity-epsilon-delta", "approximate-arc-length", "shade-bounded-curves",
    // Series
    "taylor-series-sine", "power-series-exp", "power-series-sine-cosine",
    "convergence-sequence", "convergence-series",
    // Analysis / ODE / Physics
    "differential-equations", "logistic-process", "projectile-motion",
    "complex-arithmetic", "lagrange-interpolation", "binomial-distribution",
    "bezier-curves", "polar-grid", "approximate-pi-montecarlo",
    // 3D
    "3d-function-graph", "3d-curve", "3d-vector-field",
    // Legacy widgets
    "GridMultiplier", "ColumnAddition", "CalculusTangent", "VectorSpace",
] as const;

export const getVisualWidgetTool = (provider: 'anthropic' | 'ollama' = 'anthropic') => {
    const isOllama = provider === 'ollama';

    return {
        name: "render_visual_widget",
        description: `Launch an interactive JSXGraph math visualization. Use this proactively whenever the student would benefit from seeing or interacting with a concept.

WIDGET SELECTION GUIDE — pick the best match:

RICH INTERACTIVE WIDGETS (specialized controls):
- PolynomialRootFinder → polynomial roots, factoring, zeros
- InteractiveUnitCircle → trig, sine/cosine, angles on unit circle
- InequalitiesVisualizer → linear inequalities, feasible regions
- VectorOperationsBoard → vector addition, dot product, parallelogram law
- MatrixDeformationBoard → linear transformations, determinant, basis vectors
- LinearSpanExplorer → linear independence, span, basis in R²
- EigenvectorVisualizer → eigenvectors, eigenvalues
- IntersectingPlanes3D → 3D systems of equations, plane intersections
- DerivativeDefinitionBoard → limit definition of derivative, secant h→0
- CurveSketchingBoard → f(x) / f'(x) / f''(x) relationships
- RiemannSumsVisualizer → definite integral, area under curve
- TaylorSeriesApproximation → Taylor/Maclaurin for any function

GENERAL-PURPOSE TEMPLATES (configurable via expression/params):
Functions:
- function-plotter → plot any f(x); set expression, optional expression2; good for: hyperbola(1/x), exponential(exp(x)), logarithm(log(x)), parabola(x^2)
- function-composer → show f(x), g(x) and f(g(x)); set fExpression, gExpression
- linear-function-params → y=mx+b with m/b sliders; set m, b
- power-functions → x^n family; set n
- sine-cosine-functions → A·sin(ωx) and cos; set amplitude, omega; good for: waveforms, sawtooth, trigonometric functions
- exploring-functions → plot f(x) with live x/f(x)/f'(x) readout; set expression; good for: sketch polynomial, trace curve
- step-function → floor function ⌊x⌋ visualization

Calculus:
- secant-tangent → secant converging to tangent; set expression, x0; good for: secant on function graph
- mean-value-theorem → MVT with draggable a,b; set expression, a, b
- antiderivative → F(x)=∫f(t)dt accumulation; set expression, a
- differentiability → left/right slopes at a point; set expression, x0; good for: discontinuous derivative
- continuity-epsilon-delta → ε-δ bands; set expression, a; good for: non-uniform continuous, ε-δ criterium
- approximate-arc-length → chord sum → arc length; set expression, a, b, n
- shade-bounded-curves → area between two curves; set fExpression, gExpression, a, b

Series & Sequences:
- taylor-series-sine → Taylor polynomial for sin(x); set degree, center
- power-series-exp → Taylor for eˣ; set degree; good for: approximation of e, pointwise convergence
- power-series-sine-cosine → simultaneous sin/cos Taylor; set degree
- convergence-sequence → scatter plot of a_n terms; set expression (in n), nTerms, limit
- convergence-series → partial sums S_n; set expression (in n), nTerms

Analysis / ODE / Physics / Statistics:
- differential-equations → slope field + Euler curve; set expression (dy/dx = f(x,y)), x0, y0; good for: oscillator, autocatalytic, systems of DE
- logistic-process → logistic growth P(t); set r, K, P0; good for: population growth, epidemiology
- projectile-motion → trajectory with angle/speed sliders; set v0, angleDeg
- complex-arithmetic → Argand plane z₁+z₂; set re1,im1,re2,im2; good for: complex roots
- lagrange-interpolation → polynomial through draggable points; set points array
- binomial-distribution → B(n,p) bar chart; set n, p
- bezier-curves → cubic Bézier; set p0,p1,p2,p3; good for: approximate circular arc, B-splines
- polar-grid → polar grid + r(θ) curve; set expression (in t), tMax; good for: Archimedean spiral

3D:
- 3d-function-graph → z=f(x,y) surface; set expression (in x and y), range; good for: surface plot, gradient, tangent plane
- 3d-curve → parametric 3D curve; set xExpr,yExpr,zExpr,tMin,tMax; good for: helix, 3D Curve
- 3d-vector-field → 3D vector field arrows; set fxExpr,fyExpr,fzExpr

PERSONALIZATION RULE: Always extract values from the student's question.
- "(x-3)(x+1)" → PolynomialRootFinder, initialRoot1=3, initialRoot2=-1
- "vector u=(2,3)" → VectorOperationsBoard, initialU=[2,3]
- "plot sin(x)+cos(2x)" → function-plotter, expression="sin(x)+cos(2*x)"
- "Taylor series degree 5" → taylor-series-sine, degree=5
- "dy/dx = -y" → differential-equations, expression="-y"
- "3D surface z=x²+y²" → 3d-function-graph, expression="x^2+y^2"

MANDATORY: Config values MUST come from the student's question — not from examples in this description.
Before calling this tool, confirm you have at least one specific value from the student's message to use in config.
If no specific values exist, use sensible pedagogical defaults and tell the student in your text that you're showing a general example.`,
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
                    description: "Initial configuration for the widget. REQUIRED: Set parameters using specific values extracted from the student's question. Do NOT copy default/example values from this tool description unless the student's question contained no specific values.",
                    properties: {
                        initialRoot1: { type: "number" as const, description: "First root for PolynomialRootFinder. Use the actual root from the student's polynomial (e.g. for (x-3)(x+1) use 3)." },
                        initialRoot2: { type: "number" as const, description: "Second root for PolynomialRootFinder (e.g. for (x-3)(x+1) use -1)." },
                        initialAngleDeg: { type: "number" as const, description: "Starting angle in degrees for InteractiveUnitCircle (e.g. 45, 90, 135)." },
                        initialSlope: { type: "number" as const, description: "Slope of the inequality line for InequalitiesVisualizer." },
                        initialIntercept: { type: "number" as const, description: "Y-intercept of the inequality line for InequalitiesVisualizer." },
                        initialU: { type: "array" as const, items: { type: "number" as const }, description: "[x, y] for vector u in VectorOperationsBoard. Use the actual vector from the question (e.g. [2, 3])." },
                        initialV: { type: "array" as const, items: { type: "number" as const }, description: "[x, y] for vector v in VectorOperationsBoard (e.g. [1, -1])." },
                        initialMatrix: { type: "array" as const, items: { type: "number" as const }, description: "[iX, iY, jX, jY] — the 2×2 matrix columns for MatrixDeformationBoard. For matrix [[a,b],[c,d]] pass [a,c,b,d]. E.g. [[2,1],[1,2]] → [2,1,1,2]." },
                        initialV1: { type: "array" as const, items: { type: "number" as const }, description: "[x, y] first spanning vector for LinearSpanExplorer." },
                        initialV2: { type: "array" as const, items: { type: "number" as const }, description: "[x, y] second spanning vector for LinearSpanExplorer." },
                        initialVectorAngleDeg: { type: "number" as const, description: "Starting angle in degrees of the input vector for EigenvectorVisualizer." },
                        initialK: { type: "number" as const, description: "Plane parameter k for IntersectingPlanes3D." },
                        initialH: { type: "number" as const, description: "Starting h distance for secant line in DerivativeDefinitionBoard (default 1.5; smaller = closer to tangent)." },
                        initialA: { type: "number" as const, description: "Coefficient a in f(x)=ax³ for CurveSketchingBoard (default 1)." },
                        initialN: { type: "number" as const, description: "Number of rectangles for RiemannSumsVisualizer (e.g. 4, 8, 16)." },
                        method: { type: "string" as const, enum: ["left", "right", "middle"] as const, description: "Riemann sum method for RiemannSumsVisualizer." },
                        initialDegree: { type: "number" as const, description: "Starting polynomial degree for TaylorSeriesApproximation (e.g. 1, 3, 5)." },
                        centerPoint: { type: "number" as const, description: "Center point a for TaylorSeriesApproximation (0 = Maclaurin series)." },
                        // ── New template config params ────────────────────────────────────────
                        expression: { type: "string" as const, description: "Math expression string. For 1-var templates (function-plotter, exploring-functions, etc.) use x as variable (e.g. 'x^2 + 2*x', 'sin(x)', 'exp(-x^2)'). For differential-equations use x and y (e.g. '-y', 'x - y'). For 3d-function-graph use x and y. For polar-grid use t. For sequences use n." },
                        expression2: { type: "string" as const, description: "Optional second expression for function-plotter overlay (e.g. 'cos(x)')." },
                        fExpression: { type: "string" as const, description: "Outer function f(x) for function-composer or first curve for shade-bounded-curves." },
                        gExpression: { type: "string" as const, description: "Inner function g(x) for function-composer or second curve for shade-bounded-curves." },
                        xExpr: { type: "string" as const, description: "x(t) parametric expression for 3d-curve." },
                        yExpr: { type: "string" as const, description: "y(t) parametric expression for 3d-curve." },
                        zExpr: { type: "string" as const, description: "z(t) parametric expression for 3d-curve." },
                        fxExpr: { type: "string" as const, description: "Fx(x,y,z) for 3d-vector-field." },
                        fyExpr: { type: "string" as const, description: "Fy(x,y,z) for 3d-vector-field." },
                        fzExpr: { type: "string" as const, description: "Fz(x,y,z) for 3d-vector-field." },
                        xMin: { type: "number" as const, description: "Left x bound for function-plotter." },
                        xMax: { type: "number" as const, description: "Right x bound for function-plotter." },
                        yMin: { type: "number" as const, description: "Bottom y bound for function-plotter." },
                        yMax: { type: "number" as const, description: "Top y bound for function-plotter." },
                        a: { type: "number" as const, description: "Left endpoint a for shade-bounded-curves, mean-value-theorem, antiderivative, continuity-epsilon-delta, approximate-arc-length." },
                        b: { type: "number" as const, description: "Right endpoint b for shade-bounded-curves, mean-value-theorem, approximate-arc-length." },
                        x0: { type: "number" as const, description: "Point x₀ for secant-tangent and differentiability." },
                        m: { type: "number" as const, description: "Slope for linear-function-params." },
                        n: { type: "number" as const, description: "Exponent for power-functions, number of chords for approximate-arc-length, trials for binomial-distribution." },
                        amplitude: { type: "number" as const, description: "Amplitude A for sine-cosine-functions." },
                        omega: { type: "number" as const, description: "Angular frequency ω for sine-cosine-functions." },
                        degree: { type: "number" as const, description: "Taylor polynomial degree for taylor-series-sine, power-series-exp, power-series-sine-cosine." },
                        center: { type: "number" as const, description: "Taylor expansion center a for taylor-series-sine (0 = Maclaurin)." },
                        nTerms: { type: "number" as const, description: "Number of terms to show for convergence-sequence and convergence-series." },
                        limit: { type: "number" as const, description: "Known limit L to draw as a dashed line in convergence-sequence." },
                        y0: { type: "number" as const, description: "Initial y value for differential-equations." },
                        r: { type: "number" as const, description: "Growth rate r for logistic-process." },
                        K: { type: "number" as const, description: "Carrying capacity K for logistic-process." },
                        P0: { type: "number" as const, description: "Initial population P₀ for logistic-process." },
                        tMax: { type: "number" as const, description: "Maximum time t for logistic-process or parameter bound for polar-grid and 3d-curve." },
                        v0: { type: "number" as const, description: "Initial speed m/s for projectile-motion." },
                        angleDeg: { type: "number" as const, description: "Launch angle in degrees for projectile-motion." },
                        re1: { type: "number" as const, description: "Real part of z₁ for complex-arithmetic." },
                        im1: { type: "number" as const, description: "Imaginary part of z₁ for complex-arithmetic." },
                        re2: { type: "number" as const, description: "Real part of z₂ for complex-arithmetic." },
                        im2: { type: "number" as const, description: "Imaginary part of z₂ for complex-arithmetic." },
                        points: { type: "array" as const, items: { type: "array" as const, items: { type: "number" as const } }, description: "Array of [x,y] pairs for lagrange-interpolation (e.g. [[-2,1],[0,3],[2,1]])." },
                        p: { type: "number" as const, description: "Success probability 0<p<1 for binomial-distribution." },
                        p0: { type: "array" as const, items: { type: "number" as const }, description: "[x,y] control point P₀ for bezier-curves." },
                        p1: { type: "array" as const, items: { type: "number" as const }, description: "[x,y] control point P₁ for bezier-curves." },
                        p2: { type: "array" as const, items: { type: "number" as const }, description: "[x,y] control point P₂ for bezier-curves." },
                        p3: { type: "array" as const, items: { type: "number" as const }, description: "[x,y] control point P₃ for bezier-curves." },
                        range: { type: "number" as const, description: "Axis range ±range for 3d-function-graph (default 3)." },
                        tMin: { type: "number" as const, description: "Start parameter t for 3d-curve." },
                    },
                    additionalProperties: false,
                },
            },
            required: ["widget_type"],
        },
    };
};
