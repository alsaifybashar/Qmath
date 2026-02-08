# Qmath AI Content Generation Strategy

A comprehensive framework for generating structured, accurate mathematics course content using example exams as source documents, implementing 8 scientifically-proven assessment methods.

---

## Executive Summary

This document outlines how Qmath will use AI to:
1. **Extract structure** from example exams to derive course topic taxonomy
2. **Generate diverse content** using 8 pedagogically-proven assessment formats
3. **Ensure mathematical accuracy** through multi-layer verification
4. **Scale systematically** from one course to the full curriculum

---

## I. Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AI CONTENT GENERATION PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    INPUT     │    │   EXTRACT    │    │   GENERATE   │    │   VERIFY     │  │
│  │   Example    │───▶│   Course     │───▶│   Content    │───▶│   Quality    │  │
│  │    Exams     │    │  Structure   │    │  (8 Types)   │    │   Control    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │                   │          │
│         ▼                   ▼                   ▼                   ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ PDF Parser   │    │ Topic        │    │ Question     │    │ SymPy CAS    │  │
│  │ LaTeX Reader │    │ Clustering   │    │ Generator    │    │ Validation   │  │
│  │ OCR (opt)    │    │ Prerequisite │    │ Explanation  │    │ Human Review │  │
│  │              │    │ Mapping      │    │ Generator    │    │ [TBD]        │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## II. Phase 1: Exam Document Processing

### Input Document Handling

| Format | Processing Method | Tools |
|--------|-------------------|-------|
| PDF (selectable text) | Direct extraction | PyMuPDF, pdfplumber |
| PDF (scanned) | OCR + Math recognition | Tesseract + Mathpix |
| LaTeX source | Direct parsing | pylatex, regex |
| Word/DOCX | XML extraction | python-docx |

### Extraction Pipeline

```python
class ExamProcessor:
    """
    Processes example exams to extract:
    1. Individual questions (with metadata)
    2. Topic indicators
    3. Difficulty markers
    4. Mathematical notation
    """
    
    def process_exam(self, document_path: str) -> ExamAnalysis:
        # 1. Parse document
        raw_content = self.parse_document(document_path)
        
        # 2. Segment into questions
        questions = self.segment_questions(raw_content)
        
        # 3. Extract metadata per question
        for q in questions:
            q.topic_tags = self.classify_topic(q)
            q.difficulty = self.estimate_difficulty(q)
            q.concepts = self.extract_concepts(q)
            q.prerequisites = self.infer_prerequisites(q)
        
        return ExamAnalysis(questions=questions)
```

### Question Metadata Schema

```json
{
  "question_id": "TATA41-2023-08-Q3",
  "original_text": "Beräkna ∫₀^π sin²(x) dx",
  "latex_form": "\\int_0^{\\pi} \\sin^2(x) \\, dx",
  "topic_tags": ["integration", "trigonometric-integrals", "definite-integral"],
  "concepts": ["power-reduction-formula", "integration-by-parts"],
  "prerequisites": ["basic-integration", "trigonometry"],
  "difficulty_estimate": 0.65,
  "points": 5,
  "exam_source": "TATA41-2023-08",
  "question_type": "calculation"
}
```

---

## III. Phase 2: Course Structure Discovery

Since you have **exam structure but not course structure**, the AI will derive the course taxonomy from exam analysis.

### Structure Discovery Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    COURSE STRUCTURE DISCOVERY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Step 1: Collect All Questions from N Exams                                     │
│         ┌─────┐ ┌─────┐ ┌─────┐                                                │
│         │Exam1│ │Exam2│ │Exam3│  ...                                           │
│         └──┬──┘ └──┬──┘ └──┬──┘                                                │
│            └───────┼───────┘                                                   │
│                    ▼                                                           │
│  Step 2: Extract Concept Tags from Each Question                               │
│         ┌──────────────────────────────────────────────────┐                   │
│         │ Q1: [integration, substitution]                   │                   │
│         │ Q2: [differential-equations, separable]           │                   │
│         │ Q3: [integration, parts, trigonometric]           │                   │
│         │ Q4: [limits, l'hopital]                           │                   │
│         │ ...                                               │                   │
│         └──────────────────────────────────────────────────┘                   │
│                    ▼                                                           │
│  Step 3: Cluster by Topic Similarity                                           │
│         ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │
│         │  Integration  │  │   Limits &    │  │  Differential │                │
│         │    Cluster    │  │  Continuity   │  │   Equations   │                │
│         │  (23 items)   │  │  (15 items)   │  │  (12 items)   │                │
│         └───────────────┘  └───────────────┘  └───────────────┘                │
│                    ▼                                                           │
│  Step 4: Build Hierarchical Topic Tree                                         │
│                                                                                 │
│         TATA41 (Envariabelanalys 1)                                            │
│         ├── 1. Limits & Continuity                                             │
│         │   ├── 1.1 Definition of limits                                       │
│         │   ├── 1.2 Limit laws                                                 │
│         │   ├── 1.3 Continuity                                                 │
│         │   └── 1.4 L'Hôpital's rule                                           │
│         ├── 2. Differentiation                                                 │
│         │   ├── 2.1 Definition & rules                                         │
│         │   ├── 2.2 Chain rule                                                 │
│         │   └── 2.3 Implicit differentiation                                   │
│         └── 3. Integration                                                     │
│             ├── 3.1 Basic integrals                                            │
│             ├── 3.2 Substitution                                               │
│             ├── 3.3 Integration by parts                                       │
│             └── 3.4 Trigonometric integrals                                    │
│                                                                                 │
│  Step 5: Map Prerequisites Between Topics                                      │
│         [1.1] ──▶ [1.2] ──▶ [1.3] ──▶ [1.4]                                   │
│                              │                                                 │
│                              ▼                                                 │
│         [2.1] ──▶ [2.2] ──▶ [2.3]                                             │
│           │                                                                    │
│           ▼                                                                    │
│         [3.1] ──▶ [3.2] ──▶ [3.3] ──▶ [3.4]                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Course Structure Output Schema

```json
{
  "course_code": "TATA41",
  "course_name": "Envariabelanalys 1",
  "derived_from": ["TATA41-2023-08", "TATA41-2023-01", "TATA41-2022-08", "..."],
  "total_exams_analyzed": 12,
  "structure": {
    "areas": [
      {
        "id": "area-1",
        "name": "Gränsvärden och kontinuitet",
        "name_en": "Limits and Continuity",
        "topics": [
          {
            "id": "topic-1.1",
            "name": "Definition av gränsvärde",
            "exam_frequency": 0.83,
            "avg_points": 4.2,
            "prerequisites": [],
            "difficulty_range": [0.3, 0.6]
          },
          {
            "id": "topic-1.2",
            "name": "Gränsvärdeslagar",
            "exam_frequency": 0.75,
            "avg_points": 3.8,
            "prerequisites": ["topic-1.1"],
            "difficulty_range": [0.4, 0.7]
          }
        ]
      }
    ]
  }
}
```

---

## IV. Phase 3: Content Generation (8 Assessment Methods)

For **each topic** in the derived course structure, generate content in all 8 scientifically-proven formats.

### Assessment Method Specifications

#### 1. Faded Worked Examples (Scaffolding)

**Purpose:** Reduce cognitive load, focus on solution logic

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FADED WORKED EXAMPLE: Integration by Parts                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Problem: ∫ x·e^x dx                                                           │
│                                                                                 │
│  Level 1 (Full Support):                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Step 1: Let u = x, dv = e^x dx                         [PRE-FILLED]      │ │
│  │ Step 2: Then du = dx, v = e^x                          [PRE-FILLED]      │ │
│  │ Step 3: ∫udv = uv - ∫vdu = xe^x - ∫e^x dx              [PRE-FILLED]      │ │
│  │ Step 4: = xe^x - e^x + C                               [STUDENT INPUT]   │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  Level 2 (Partial Support):                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Step 1: Let u = x, dv = e^x dx                         [PRE-FILLED]      │ │
│  │ Step 2: Then du = ___, v = ___                         [STUDENT INPUT]   │ │
│  │ Step 3: Apply formula: ___                             [STUDENT INPUT]   │ │
│  │ Step 4: Final answer: ___                              [STUDENT INPUT]   │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  Level 3 (Full Independence):                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Solve: ∫ x·e^x dx                                      [ALL STEPS]       │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Generation Prompt Template:**
```
Given this exam question about {topic}:
"{original_question}"

Generate a 3-level faded worked example where:
- Level 1: Only the final step requires student input
- Level 2: Steps 2-4 require student input
- Level 3: Full problem solving required

Include LaTeX formatting for all mathematical expressions.
```

**Database Schema:**
```sql
CREATE TABLE faded_worked_examples (
    id UUID PRIMARY KEY,
    topic_id UUID REFERENCES topics(id),
    problem_latex TEXT NOT NULL,
    levels JSONB NOT NULL,  -- Array of {level: int, steps: [{pre_filled: bool, content: str}]}
    source_exam_question UUID REFERENCES exam_questions(id),
    difficulty FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 2. Parsons Problems (Logic & Proofs)

**Purpose:** Test logical reasoning without syntax errors

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PARSONS PROBLEM: Prove that lim(x→0) sin(x)/x = 1                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SCRAMBLED STEPS:                          │  CORRECT ORDER:                   │
│  ┌─────────────────────────────────────┐   │  ┌─────────────────────────────┐  │
│  │ ④ Therefore lim = 1 by squeeze     │   │  │ ① Start with squeeze...    │  │
│  │   theorem                           │   │  │ ② For 0 < x < π/2...       │  │
│  │ ① Start with squeeze theorem       │   │  │ ③ Taking limits...         │  │
│  │   approach                          │   │  │ ④ Therefore lim = 1...     │  │
│  │ ③ Taking limits as x→0+, both      │   │  └─────────────────────────────┘  │
│  │   cos(x) and 1 approach 1           │   │                                   │
│  │ ② For 0 < x < π/2, we have         │   │  [DRAG & DROP INTERFACE]          │
│  │   cos(x) ≤ sin(x)/x ≤ 1            │   │                                   │
│  └─────────────────────────────────────┘   │                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Generation Prompt Template:**
```
Given this proof/derivation from the exam:
"{original_proof}"

Create a Parsons problem by:
1. Breaking the proof into 4-7 logical steps
2. Each step must be a complete logical unit
3. Include 1-2 distractor steps (plausible but incorrect)
4. Mark the correct order

Output format:
{
  "correct_steps": ["step1", "step2", ...],
  "distractor_steps": ["wrong_step1"],
  "topic": "{topic}",
  "difficulty": 0.7
}
```

**Database Schema:**
```sql
CREATE TABLE parsons_problems (
    id UUID PRIMARY KEY,
    topic_id UUID REFERENCES topics(id),
    problem_statement TEXT NOT NULL,
    correct_steps JSONB NOT NULL,  -- Ordered array of steps
    distractor_steps JSONB,        -- Optional wrong steps
    source_exam_question UUID REFERENCES exam_questions(id),
    difficulty FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 3. Line-by-Line Validation (Step-wise CAS Checks)

**Purpose:** Catch errors early, promote metacognition

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LINE-BY-LINE VALIDATION: ∫ x²·sin(x) dx                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Line 1: Let u = x², dv = sin(x)dx                                             │
│          ┌──────────────────────────────────────────────────────────────────┐  │
│          │ Student Input: u = [x²]  dv = [sin(x)dx]           ✓ Valid      │  │
│          └──────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  Line 2: Then du = ___, v = ___                                                │
│          ┌──────────────────────────────────────────────────────────────────┐  │
│          │ Student Input: du = [2x dx]  v = [-cos(x)]         ✓ Valid      │  │
│          └──────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  Line 3: Apply ∫udv = uv - ∫vdu:                                               │
│          ┌──────────────────────────────────────────────────────────────────┐  │
│          │ Student Input: [-x²cos(x) + ∫2xcos(x)dx]           ✓ Valid      │  │
│          │                                                                   │  │
│          │ CAS Check: SymPy confirms this is equivalent to the correct      │  │
│          │ intermediate form                                                 │  │
│          └──────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  Line 4: Repeat integration by parts for ∫2x·cos(x)dx:                         │
│          ┌──────────────────────────────────────────────────────────────────┐  │
│          │ Student Input: [2xsin(x) + 2cos(x)]               ✗ Error!      │  │
│          │                                                                   │  │
│          │ CAS Check: Expected -∫vdu, not +∫vdu. Sign error detected.       │  │
│          │ Hint: Check the formula ∫udv = uv - ∫vdu (note the minus!)       │  │
│          └──────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**SymPy Validation Logic:**
```python
from sympy import sympify, simplify, Eq

def validate_step(previous_line: str, current_line: str, context: dict) -> ValidationResult:
    """
    Validates that current_line is a valid mathematical transformation
    of previous_line given the context (substitutions, etc.)
    """
    try:
        prev_expr = sympify(previous_line)
        curr_expr = sympify(current_line)
        
        # Check direct equivalence
        if simplify(prev_expr - curr_expr) == 0:
            return ValidationResult(valid=True)
        
        # Check with context (e.g., after substitution)
        if context.get('substitution'):
            # Apply substitution and check
            expected = prev_expr.subs(context['substitution'])
            if simplify(expected - curr_expr) == 0:
                return ValidationResult(valid=True)
        
        # If not equivalent, analyze the error
        error_type = analyze_error(prev_expr, curr_expr)
        return ValidationResult(
            valid=False,
            error_type=error_type,
            hint=generate_hint(error_type)
        )
    except:
        return ValidationResult(valid=False, error_type="parse_error")
```

**Database Schema:**
```sql
CREATE TABLE stepwise_problems (
    id UUID PRIMARY KEY,
    topic_id UUID REFERENCES topics(id),
    problem_latex TEXT NOT NULL,
    steps JSONB NOT NULL,  -- Array of {step_num, prompt, expected_forms: [str], validation_rules: {...}}
    source_exam_question UUID REFERENCES exam_questions(id),
    difficulty FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 4. Dynamic Graphical Manipulation (Embodied Cognition)

**Purpose:** Connect symbolic math to visual intuition

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  GRAPHICAL MANIPULATION: Orthogonal Vectors                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Task: Drag vector v⃗ to make it orthogonal to u⃗ = (3, 2)                       │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                              ↑ y                                          │ │
│  │                              │                                            │ │
│  │                         u⃗    │     ●────→ v⃗ (draggable)                  │ │
│  │                          ╲   │    /                                       │ │
│  │                           ╲  │   /                                        │ │
│  │                            ╲ │  /                                         │ │
│  │  ─────────────────────────────●────────────────────────→ x               │ │
│  │                              │                                            │ │
│  │                              │                                            │ │
│  │                              │                                            │ │
│  │                              │                                            │ │
│  │  [Dot Product: u⃗·v⃗ = 14]    [Angle: 30°]                                 │ │
│  │                                                                           │ │
│  │  Target: Dot Product = 0                                                  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  Interactive Elements:                                                          │
│  • Drag endpoint of v⃗ with mouse                                               │
│  • Real-time dot product calculation                                            │
│  • Angle indicator updates live                                                 │
│  • Success: Green highlight when orthogonal                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Types of Graphical Problems:**

| Topic Area | Manipulation Type | Success Condition |
|------------|-------------------|-------------------|
| Linear Algebra | Vector positioning | Dot product = 0 |
| Linear Algebra | Matrix transformation | Apply T to basis vectors |
| Calculus | Tangent line | Slope = f'(x₀) |
| Calculus | Riemann sum | Rectangles approximate area |
| Differential Equations | Slope field | Follow solution curve |
| Optimization | Contour navigation | Find local minimum |

**Frontend Component (React + Mafs):**
```jsx
import { Mafs, Coordinates, Vector, useMovablePoint } from "mafs";

function OrthogonalVectorProblem({ fixedVector, onSuccess }) {
  const [u_x, u_y] = fixedVector;
  const movable = useMovablePoint([1, 1]);
  
  const dotProduct = u_x * movable.point[0] + u_y * movable.point[1];
  const isOrthogonal = Math.abs(dotProduct) < 0.1;
  
  useEffect(() => {
    if (isOrthogonal) onSuccess();
  }, [isOrthogonal]);

  return (
    <Mafs>
      <Coordinates.Cartesian />
      <Vector tail={[0, 0]} tip={fixedVector} color="blue" />
      <Vector 
        tail={[0, 0]} 
        tip={movable.point} 
        color={isOrthogonal ? "green" : "red"} 
      />
      {movable.element}
      <text x={3} y={-2}>Dot product: {dotProduct.toFixed(2)}</text>
    </Mafs>
  );
}
```

**Database Schema:**
```sql
CREATE TABLE graphical_problems (
    id UUID PRIMARY KEY,
    topic_id UUID REFERENCES topics(id),
    problem_type VARCHAR(50) NOT NULL,  -- 'vector_orthogonal', 'tangent_line', etc.
    initial_state JSONB NOT NULL,       -- Starting configuration
    success_condition JSONB NOT NULL,   -- Mathematical condition to check
    hints JSONB,
    source_exam_question UUID REFERENCES exam_questions(id),
    difficulty FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 5. Counter-Example Generation

**Purpose:** Test deep conceptual boundaries

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  COUNTER-EXAMPLE CHALLENGE                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FALSE CONJECTURE:                                                              │
│  "If a function f has a limit at x = a, then f is continuous at x = a"         │
│                                                                                 │
│  YOUR TASK: Define a function that disproves this statement                     │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  f(x) = {                                                                 │ │
│  │           [____________] , if x ≠ a                                       │ │
│  │           [____________] , if x = a                                       │ │
│  │         }                                                                 │ │
│  │                                                                           │ │
│  │  Let a = [___]                                                            │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  VERIFICATION:                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  ✓ lim(x→a) f(x) exists: [checking...]                                   │ │
│  │  ✓ f(a) is defined: [checking...]                                        │ │
│  │  ✗ f is NOT continuous at a: lim ≠ f(a) [checking...]                    │ │
│  │                                                                           │ │
│  │  [SUBMIT COUNTER-EXAMPLE]                                                 │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  EXAMPLE VALID COUNTER-EXAMPLE:                                                 │
│  f(x) = { x,  if x ≠ 0                                                         │
│         { 5,  if x = 0                                                         │
│  lim(x→0) f(x) = 0 exists, but f(0) = 5 ≠ 0, so f is discontinuous at 0       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Common False Conjectures by Topic:**

| Topic | False Conjecture | Required Understanding |
|-------|------------------|------------------------|
| Limits | "lim exists ⟹ continuous" | Removable discontinuity |
| Derivatives | "continuous ⟹ differentiable" | Corner/cusp |
| Integration | "convergent series ⟹ convergent integral" | Improper integrals |
| Linear Algebra | "det(A) = 0 ⟹ A = 0" | Singular matrices |
| Sequences | "bounded ⟹ convergent" | Oscillation |

**Validation Logic:**
```python
def validate_counter_example(conjecture_id: str, student_answer: dict) -> ValidationResult:
    """
    Validates that the student's function/example actually disproves the conjecture
    """
    conjecture = get_conjecture(conjecture_id)
    
    # Parse student's function definition
    f = parse_piecewise_function(student_answer['function'])
    a = student_answer['point']
    
    # Check condition 1: The premise of the conjecture holds
    premise_holds = evaluate_condition(conjecture.premise, f, a)
    
    # Check condition 2: The conclusion of the conjecture does NOT hold
    conclusion_fails = not evaluate_condition(conjecture.conclusion, f, a)
    
    if premise_holds and conclusion_fails:
        return ValidationResult(valid=True, feedback="Excellent counter-example!")
    elif not premise_holds:
        return ValidationResult(valid=False, feedback="Your example doesn't satisfy the premise")
    else:
        return ValidationResult(valid=False, feedback="Your example doesn't disprove the conclusion")
```

---

#### 6. Error Spotting / Debugging

**Purpose:** Higher-order analysis, internal validity checks

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ERROR SPOTTING: Find the mistake in this solution                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Problem: Find the derivative of f(x) = ln(x²)                                 │
│                                                                                 │
│  SOLUTION:                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                           │ │
│  │  Line 1:  f(x) = ln(x²)                                            [○]   │ │
│  │                                                                           │ │
│  │  Line 2:  Using chain rule: f'(x) = 1/x² · d/dx[x²]                [○]   │ │
│  │                                                                           │ │
│  │  Line 3:  f'(x) = 1/x² · 2x                                        [○]   │ │
│  │                                                                           │ │
│  │  Line 4:  f'(x) = 2x/x²                                            [○]   │ │
│  │                                                                           │ │
│  │  Line 5:  f'(x) = 2/x  ✓                                           [○]   │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  CLICK ON THE LINE WITH THE ERROR                                              │
│                                                                                 │
│  ──────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  [!] ERROR FOUND: Line 2                                                       │
│                                                                                 │
│  EXPLANATION:                                                                   │
│  The error is in the application of chain rule. For f(x) = ln(g(x)),          │
│  the derivative is f'(x) = g'(x)/g(x), not g'(x)/[g(x)]².                     │
│                                                                                 │
│  Correct Line 2: f'(x) = 1/x² · d/dx[x²] should be:                           │
│                  f'(x) = (1/x²) · 2x = 2/x  ← Still gets right answer!        │
│                                                                                 │
│  WAIT - this is actually a TRICK QUESTION! The answer 2/x is correct,         │
│  but the method in Line 2 has a conceptual error that happens to cancel.      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Error Types to Generate:**

| Error Category | Common Mistakes | Topic |
|----------------|-----------------|-------|
| Sign errors | Forgetting negative in chain rule | Differentiation |
| Domain errors | Ignoring absolute value in ln(x²) | Logarithms |
| Order of operations | (a+b)² ≠ a² + b² | Algebra |
| Integration constants | Missing +C | Integration |
| Limit interchange | Swapping limit and sum | Series |

**Generation Strategy:**
```python
def generate_error_spotting_problem(correct_solution: Solution, topic: str) -> ErrorSpottingProblem:
    """
    Takes a correct solution and introduces a deliberate, pedagogically-relevant error
    """
    # Select error type appropriate for topic
    error_type = select_error_type(topic)
    
    # Find suitable line to corrupt
    target_line = find_corruptible_line(correct_solution, error_type)
    
    # Generate incorrect version of that line
    incorrect_line = corrupt_line(target_line, error_type)
    
    # Determine if error propagates or cancels
    error_propagates = check_error_propagation(correct_solution, target_line, incorrect_line)
    
    return ErrorSpottingProblem(
        lines=insert_error(correct_solution.lines, target_line, incorrect_line),
        error_line=target_line.index,
        error_type=error_type,
        explanation=generate_error_explanation(error_type),
        is_trick=(not error_propagates)  # Error that still gives correct answer
    )
```

---

#### 7. Free-Form Symbolic Input (Equivalence Checking)

**Purpose:** Assess mathematical truth, not notation style

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FREE-FORM SYMBOLIC INPUT                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Problem: Simplify (x² - 1)/(x - 1)                                            │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                           │ │
│  │  Your answer: [________________________]                                  │ │
│  │                                                                           │ │
│  │  Accepted input formats:                                                  │ │
│  │  • x + 1                                                                  │ │
│  │  • 1 + x                                                                  │ │
│  │  • (x+1)                                                                  │ │
│  │  • x+1 for x≠1                                                            │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  VALIDATION LOGIC:                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  Student: "1+x"                                                          │ │
│  │  Expected: "x+1"                                                          │ │
│  │                                                                           │ │
│  │  SymPy check: simplify(sympify("1+x") - sympify("x+1")) = 0              │ │
│  │  Result: ✓ EQUIVALENT                                                    │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**SymPy Backend Implementation:**
```python
from sympy import sympify, simplify, trigsimp, expand, factor
from sympy.parsing.latex import parse_latex

class SymbolicEquivalenceChecker:
    """
    Checks if student answer is mathematically equivalent to expected answer
    """
    
    def check_equivalence(
        self, 
        student_input: str, 
        expected: str, 
        problem_type: str = "algebraic"
    ) -> EquivalenceResult:
        
        try:
            # Parse inputs (support both ASCII and LaTeX)
            student_expr = self._parse_expression(student_input)
            expected_expr = self._parse_expression(expected)
            
            # Direct equivalence check
            difference = simplify(student_expr - expected_expr)
            if difference == 0:
                return EquivalenceResult(equivalent=True, confidence=1.0)
            
            # Try various simplification strategies
            strategies = [
                lambda e: simplify(e),
                lambda e: expand(e),
                lambda e: factor(e),
                lambda e: trigsimp(e),
            ]
            
            for strategy in strategies:
                if simplify(strategy(student_expr) - strategy(expected_expr)) == 0:
                    return EquivalenceResult(equivalent=True, confidence=0.95)
            
            # Check if they're numerically equivalent (floating point)
            if self._numerical_check(student_expr, expected_expr):
                return EquivalenceResult(equivalent=True, confidence=0.8)
            
            return EquivalenceResult(
                equivalent=False, 
                closest_form=str(simplify(student_expr)),
                expected_form=str(simplify(expected_expr))
            )
            
        except Exception as e:
            return EquivalenceResult(equivalent=False, parse_error=str(e))
    
    def _parse_expression(self, input_str: str):
        # Try LaTeX first, then ASCII
        try:
            if '\\' in input_str:
                return parse_latex(input_str)
            return sympify(input_str)
        except:
            return sympify(input_str)
```

---

#### 8. Confidence Tagging (Metacognition)

**Purpose:** Identify illusion of competence, guide review

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CONFIDENCE TAGGING                                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  After each answer, rate your confidence:                                       │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                           │ │
│  │  How confident are you in your answer?                                    │ │
│  │                                                                           │ │
│  │  [  LOW  ]     [  MEDIUM  ]     [  HIGH  ]                               │ │
│  │    😟              🤔               😊                                     │ │
│  │  "Just              "Pretty          "Definitely                          │ │
│  │   guessing"          sure"            correct"                            │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ANALYTICS MATRIX:                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                           │ │
│  │              │  Answer Correct   │  Answer Incorrect  │                   │ │
│  │  ────────────┼───────────────────┼────────────────────│                   │ │
│  │  Confident   │  ✓ MASTERY        │  ⚠️ OVERCONFIDENT   │                   │ │
│  │              │  (well calibrated) │  (needs attention) │                   │ │
│  │  ────────────┼───────────────────┼────────────────────│                   │ │
│  │  Not         │  💡 UNDERCONFIDENT │  📚 LEARNING        │                   │ │
│  │  Confident   │  (build confidence)│  (on track)        │                   │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  INTERVENTION TRIGGERS:                                                         │
│  • High overconfidence rate → "Let's slow down and check your work"            │
│  • High underconfidence + correct → "You know more than you think!"            │
│  • Consistent low confidence → "Would you like to review prerequisites?"        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Confidence Calibration Score:**
```python
def calculate_calibration_score(responses: List[Response]) -> CalibrationMetrics:
    """
    Measures how well a student's confidence predicts their accuracy
    """
    buckets = {"low": [], "medium": [], "high": []}
    
    for r in responses:
        buckets[r.confidence].append(r.is_correct)
    
    # Expected accuracy by confidence level
    expected = {"low": 0.33, "medium": 0.66, "high": 0.90}
    
    # Calculate actual accuracy per bucket
    actual = {
        level: sum(outcomes) / len(outcomes) if outcomes else 0
        for level, outcomes in buckets.items()
    }
    
    # Calibration error (lower is better)
    calibration_error = sum(
        abs(actual[level] - expected[level]) 
        for level in buckets
    ) / 3
    
    # Overconfidence detection
    overconfidence_rate = (
        len([r for r in responses if r.confidence == "high" and not r.is_correct])
        / len([r for r in responses if r.confidence == "high"])
        if any(r.confidence == "high" for r in responses) else 0
    )
    
    return CalibrationMetrics(
        calibration_error=calibration_error,
        overconfidence_rate=overconfidence_rate,
        buckets=actual,
        recommendation=generate_calibration_recommendation(calibration_error, overconfidence_rate)
    )
```

---

## V. Content Generation Prompts

### Master Prompt Template

```
You are an expert mathematics educator creating content for Swedish university engineering students.

CONTEXT:
- Course: {course_name} ({course_code})
- Topic: {topic_name}
- Prerequisite topics: {prerequisites}
- Source exam questions: {exam_questions}
- Target difficulty: {difficulty_range}

TASK: Generate {content_type} for this topic.

REQUIREMENTS:
1. Mathematical accuracy is paramount - verify all calculations
2. Use Swedish mathematical conventions where appropriate
3. LaTeX format for all mathematical expressions
4. Difficulty should match university engineering level
5. Reference the exam questions for style and scope

OUTPUT FORMAT:
{format_specification}

QUALITY CHECKS:
- All equations balance
- Units are consistent (if applicable)
- Variable names are clear
- Solution steps are complete
```

### Specific Content Type Prompts

See Appendix A for complete prompt templates for each of the 8 assessment types.

---

## VI. Verification Pipeline

### Multi-Layer Verification

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        VERIFICATION PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Layer 1: AUTOMATED VALIDATION                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  • SymPy algebraic verification                                           │ │
│  │  • Unit consistency checks                                                │ │
│  │  • Boundary condition testing                                             │ │
│  │  • Numerical spot-checks                                                  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                           │
│                                    ▼                                           │
│  Layer 2: [TO BE DETERMINED - User specified "something else"]                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  Options:                                                                 │ │
│  │  • Expert human review                                                    │ │
│  │  • Peer review by math TAs                                                │ │
│  │  • Community validation                                                   │ │
│  │  • Cross-LLM verification                                                 │ │
│  │  • University faculty approval                                            │ │
│  │  • Student feedback loop                                                  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                           │
│                                    ▼                                           │
│  Layer 3: CONTINUOUS QUALITY MONITORING                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  • Track student success rates per question                               │ │
│  │  • Flag questions with unusual error patterns                             │ │
│  │  • A/B test alternative phrasings                                         │ │
│  │  • Automatic difficulty recalibration                                     │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### SymPy Validation Implementation

```python
class MathematicalValidator:
    """
    Automated verification of generated mathematical content
    """
    
    def validate_solution(self, problem: str, solution: str, answer: str) -> ValidationReport:
        """
        Validates that the solution correctly solves the problem
        and arrives at the stated answer
        """
        report = ValidationReport()
        
        # 1. Parse all expressions
        try:
            problem_expr = self._parse_problem(problem)
            solution_steps = self._parse_solution_steps(solution)
            final_answer = sympify(answer)
        except ParseError as e:
            report.add_error("parse", str(e))
            return report
        
        # 2. Verify each step follows from previous
        for i, (prev, curr) in enumerate(zip(solution_steps[:-1], solution_steps[1:])):
            if not self._steps_are_valid(prev, curr):
                report.add_error("step_invalid", f"Step {i+1} to {i+2} is invalid")
        
        # 3. Verify final answer matches last step
        if simplify(solution_steps[-1] - final_answer) != 0:
            report.add_error("answer_mismatch", "Final step doesn't match stated answer")
        
        # 4. Verify answer actually solves original problem
        if not self._answer_solves_problem(problem_expr, final_answer):
            report.add_error("wrong_answer", "Answer doesn't solve the original problem")
        
        # 5. Numerical spot check
        if not self._numerical_verification(problem_expr, final_answer):
            report.add_warning("numerical", "Numerical check raised concerns")
        
        return report
```

---

## VII. Database Schema

### Complete Schema for Content Storage

```sql
-- Course Structure (Derived from Exams)
CREATE TABLE courses (
    id UUID PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    university VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_areas (
    id UUID PRIMARY KEY,
    course_id UUID REFERENCES courses(id),
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    order_index INT,
    exam_frequency FLOAT  -- How often this area appears on exams
);

CREATE TABLE topics (
    id UUID PRIMARY KEY,
    area_id UUID REFERENCES course_areas(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty_range FLOAT[2],  -- [min, max]
    prerequisites UUID[],  -- Array of topic IDs
    exam_frequency FLOAT,
    avg_points FLOAT
);

-- Source Exams
CREATE TABLE source_exams (
    id UUID PRIMARY KEY,
    course_id UUID REFERENCES courses(id),
    exam_date DATE,
    filename VARCHAR(255),
    parsed_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_questions (
    id UUID PRIMARY KEY,
    exam_id UUID REFERENCES source_exams(id),
    topic_id UUID REFERENCES topics(id),
    question_number INT,
    original_text TEXT,
    latex_form TEXT,
    points INT,
    difficulty_estimate FLOAT
);

-- Generated Content (All 8 Types)
CREATE TABLE generated_content (
    id UUID PRIMARY KEY,
    topic_id UUID REFERENCES topics(id),
    content_type VARCHAR(50) NOT NULL,  -- 'faded_example', 'parsons', etc.
    content JSONB NOT NULL,
    source_exam_questions UUID[],
    difficulty FLOAT,
    verification_status VARCHAR(20) DEFAULT 'pending',
    verified_by VARCHAR(100),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_type ON generated_content(content_type);
CREATE INDEX idx_content_topic ON generated_content(topic_id);
CREATE INDEX idx_content_status ON generated_content(verification_status);

-- Student Interactions
CREATE TABLE content_attempts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    content_id UUID REFERENCES generated_content(id),
    attempt_data JSONB,  -- Steps taken, time per step, etc.
    is_correct BOOLEAN,
    confidence_rating VARCHAR(10),  -- 'low', 'medium', 'high'
    time_spent_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Metrics
CREATE TABLE content_quality_metrics (
    content_id UUID REFERENCES generated_content(id),
    total_attempts INT DEFAULT 0,
    success_rate FLOAT,
    avg_time_seconds FLOAT,
    overconfidence_rate FLOAT,  -- % who were confident but wrong
    flagged_for_review BOOLEAN DEFAULT FALSE,
    last_calculated TIMESTAMPTZ
);
```

---

## VIII. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Exam document parser (PDF/LaTeX)
- [ ] Question extraction and metadata tagging
- [ ] Basic topic classification
- [ ] SymPy equivalence checker

### Phase 2: Structure Discovery (Weeks 5-8)
- [ ] Topic clustering algorithm
- [ ] Prerequisite mapping
- [ ] Course structure generation
- [ ] Manual structure refinement UI

### Phase 3: Content Generation (Weeks 9-16)
- [ ] Free-form symbolic input problems
- [ ] Faded worked examples
- [ ] Error spotting problems
- [ ] Parsons problems (proofs)

### Phase 4: Interactive Content (Weeks 17-24)
- [ ] Line-by-line validation
- [ ] Graphical manipulation (Mafs integration)
- [ ] Counter-example generation
- [ ] Confidence tagging system

### Phase 5: Quality & Scale (Weeks 25-30)
- [ ] Verification pipeline
- [ ] Quality monitoring dashboard
- [ ] Expand to additional courses
- [ ] Difficulty calibration

---

## IX. Open Questions

1. **Exam document format** — What format are the source exams in?
2. **Verification layer 2** — What is the "something else" verification method?
3. **First target course** — Which specific course to start with?
4. **Language** — Swedish only, or bilingual content?
5. **Volume** — How many practice problems per topic?

---

## Appendix A: Content Generation Prompt Templates

### A.1 Faded Worked Example Prompt

```
TASK: Create a 3-level faded worked example for the following topic.

TOPIC: {topic_name}
REFERENCE EXAM QUESTION: {exam_question}
DIFFICULTY: {difficulty}

REQUIREMENTS:
1. Choose a problem similar to the reference but not identical
2. Create complete solution with 4-6 clear steps
3. Level 1: Pre-fill all steps except final answer
4. Level 2: Pre-fill first 1-2 steps only
5. Level 3: No pre-filled content

OUTPUT JSON:
{
  "problem": "LaTeX problem statement",
  "solution_steps": ["step1", "step2", ...],
  "levels": [
    {"level": 1, "prefilled_steps": [0,1,2,3], "student_steps": [4]},
    {"level": 2, "prefilled_steps": [0,1], "student_steps": [2,3,4]},
    {"level": 3, "prefilled_steps": [], "student_steps": [0,1,2,3,4]}
  ],
  "hints": ["hint1", "hint2"]
}
```

### A.2 Parsons Problem Prompt

```
TASK: Create a Parsons problem (logical ordering) for a proof or derivation.

TOPIC: {topic_name}
REFERENCE: {proof_or_derivation}
DIFFICULTY: {difficulty}

REQUIREMENTS:
1. Break into 5-7 discrete logical steps
2. Each step must be self-contained
3. Include 1-2 distractor steps (plausible but wrong)
4. Distractors should represent common misconceptions

OUTPUT JSON:
{
  "problem_statement": "Prove that...",
  "correct_order": ["step1", "step2", "step3", ...],
  "distractor_steps": ["wrong_step1", "wrong_step2"],
  "explanation": "Why this order is correct"
}
```

### A.3 Error Spotting Prompt

```
TASK: Create an error spotting problem with a deliberate common mistake.

TOPIC: {topic_name}
REFERENCE: {correct_solution}
ERROR_TYPE: {sign_error | domain_error | order_of_operations | ...}

REQUIREMENTS:
1. Start with a correct problem and solution
2. Introduce ONE deliberate error of the specified type
3. Error should be a common student mistake
4. Provide detailed explanation of the error

OUTPUT JSON:
{
  "problem": "Original problem",
  "corrupted_solution": [
    {"line": 1, "content": "...", "is_error": false},
    {"line": 2, "content": "...", "is_error": true},
    ...
  ],
  "error_line": 2,
  "error_type": "sign_error",
  "explanation": "The student forgot that...",
  "correct_line": "What line 2 should be"
}
```

[Additional prompt templates continue for remaining content types...]

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Status: Draft - Pending clarification on verification method and exam format*