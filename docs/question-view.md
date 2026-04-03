# Question View — Design Description

The question view is a focused, distraction-free study interface built around a single question at a time.

## Question Presentation

The question text is rendered at the top of the view in large, readable font using a `MathRenderer` component that supports both plain text and inline/block LaTeX (KaTeX). For multiple-choice questions, answer options are stacked vertically below as full-width buttons, each prefixed with a lettered circle indicator (A, B, C…). For numeric questions, a custom on-screen keypad is displayed instead, allowing digit entry, sign toggling, decimal input, and fraction input.

## Correct Answer State

When the user selects the correct option, the chosen button transitions to a green background with a `CheckCircle` icon replacing the selection indicator. A green feedback panel slides in below with a "Rätt svar!" (Correct!) heading. An optional "Visa lösning" (Show solution) toggle reveals the step-by-step explanation.

## Wrong Answer State

On an incorrect answer, the selected button turns red with a shake animation and an `XCircle` icon. A red feedback panel auto-expands showing a two-column diff — the student's answer on the left, the correct answer on the right. An AI-classified error badge (e.g. "Begreppsfel", "Beräkningsfel") appears alongside a contextual message. Action buttons allow the student to review a prerequisite concept or view a worked example.

## Hint System

Hints are surfaced via a `HintBubble` component with three progressive levels:
- **Level 1 — Ledtråd** (amber, lightbulb icon): a gentle directional nudge.
- **Level 2 — Formel** (blue, book icon): the relevant formula.
- **Level 3 — Första steget** (violet, sparkles icon): the first solution step.

Each bubble animates in with a spring transition and displays three dots in the top-right corner to indicate the current hint depth. A dismiss button (×) sits above the bubble corner.
