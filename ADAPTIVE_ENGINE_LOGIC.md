# Qmath Adaptive Learning Engine Logic

## Overview

The Qmath Adaptive Learning Engine is a sophisticated personalization system designed to optimize student learning paths in real-time. Unlike simple rule-based systems, it combines three powerful algorithmic models to understand not just *what* a student knows, but *how well* they know it and *when* they are likely to forget it.

The engine answers three critical questions at every step:
1.  **What is the student's current ability?** (Item Response Theory)
2.  **Have they mastered this specific skill?** (Bayesian Knowledge Tracing)
3.  **When should they review to maximize retention?** (Spaced Repetition)

---

## 1. Core Algorithms

### A. Item Response Theory (IRT)
**Purpose:** Accurate ability estimation and "Computer Adaptive Testing" (CAT).

IRT moves beyond simple "percentage correct" scores. It models the probability of a student answering a question correctly based on the interaction between the student's **Ability ($\theta$)** and the question's parameters.

#### The Model (3-Parameter Logistic - 3PL)
$$P(\theta) = c + (1 - c) \cdot \frac{1}{1 + e^{-a(\theta - b)}}$$

Where:
*   **$\theta$ (Theta)**: The student's estimated ability level (typically -3 to +3).
*   **$a$ (Discrimination)**: How well the question distinguishes between high and low performers. High $a$ means a sharp cutoff between those who know it and those who don't.
*   **$b$ (Difficulty)**: The ability level required to have a 50% chance of answering correctly.
*   **$c$ (Guessing)**: The probability that a student with very low ability guesses correctly (e.g., 0.25 for 4-option multiple choice).

#### Adaptive Selection (CAT)
The engine selects the next question by maximizing the **Fisher Information Function** $I(\theta)$.
*   A question provides maximum information when its difficulty ($b$) matches the student's current ability ($\theta$).
*   If a student answers correctly, $\theta$ increases, and the engine selects a harder question.
*   If incorrect, $\theta$ decreases, and the engine selects an easier question.

---

### B. Bayesian Knowledge Tracing (BKT)
**Purpose:** Tracking skill mastery over time.

BKT models student knowledge as a latent (hidden) variable—either "Known" or "Unknown"—and updates the probability of mastery after every attempt using Bayes' theorem.

#### The Parameters
*   $P(L_0)$: Initial probability the student knows the skill.
*   $P(T)$: Probability of **learning** the skill after an opportunity (Transition).
*   $P(G)$: Probability of **guessing** correctly despite not knowing the skill.
*   $P(S)$: Probability of **slipping** (making a mistake) despite knowing the skill.

#### The Update Loop
1.  **Update Posterior:** After an observation (Correct/Incorrect), we calculate the posterior probability that the student *already knew* the skill.
    *   If Correct: Belief in mastery increases (but discounted by guess probability).
    *   If Wrong: Belief in mastery decreases (but discounted by slip probability).
2.  **Apply Learning:** We account for the chance the student learned *during* the step.
    $$P(L_{t+1}) = P(L_t | Observation) + (1 - P(L_t | Observation)) \cdot P(T)$$

**Unique Qmath Enhancements:**
*   **Response Time adjustment:** Quick correct answers boost confidence in mastery; slow correct answers suggest "working through" rather than fluency.
*   **Hint Penalty:** Using hints reduces the mastery gain from a correct answer.

---

### C. Spaced Repetition (SM-2 / FSRS)
**Purpose:** Long-term retention and review scheduling.

Once a topic is "Mastered" via BKT, it moves into the retention phase. The engine calculates the optimal time to review the material to prevent the "Forgetting Curve" effect.

*   **Algorithm:** Modified SM-2 (SuperMemo 2) and FSRS.
*   **Mechanism:**
    *   Every review is graded (Quality 0-5).
    *   An **Easiness Factor (EF)** is tracked for every topic.
    *   **Intervals** between reviews expand exponentially (e.g., 1 day -> 3 days -> 7 days -> 21 days) as long as performance is good.
    *   If a student forgets during a review, the interval resets, and the engine flags the topic for "Re-learning".

---

## 2. The Adaptive Loop Workflow

1.  **Session Start**: Engine loads user's `StudentLearningState`.
2.  **Question Selection**:
    *   **Check Reviews**: Are there any "Due" items from Spaced Repetition? (Highest Priority)
    *   **Scaffolding**: Did the user just fail a question? If so, select a "breakdown" question.
    *   **New Learning**: Select a question where Item Information is maximized for current $\theta$ (ZPD - Zone of Proximal Development).
3.  **User Interaction**: Student answers question (tracks answer, time, hints).
4.  **Analysis & Update**:
    *   **Evaluation**: Compare answer, calculate distance from correct.
    *   **BKT Update**: Update mastery probability for the specific `topicId`.
    *   **IRT Update**: Recalculate global `estimatedAbility` ($\theta$) using Maximum Likelihood Estimation (MLE).
    *   **SR Update**: Schedule next review date based on response quality.
5.  **Feedback & Metrics**: Update XP, Streaks, Accuracy, and Session Stats.
6.  **Loop**: Return to Step 2.

---

## 3. Data & Metrics Tracked

The engine collects extensive telemetry to fine-tune the model:

### Performance
*   **Accuracy Rate**: Running average of correctness.
*   **First Attempt Success**: Measures true understanding vs. trial-and-error.
*   **Error Patterns**: Categorizes errors (Computational, Conceptual, Notation).

### Temporal (Time)
*   **Avg Time Per Question**: Baseline for detecting "Struggle" or "Fluency".
*   **Peak Performance Window**: Identifies time of day when student learns best (e.g., 18:00 - 20:00).
*   **Learning Velocity**: How fast mastery increases per practice session.

### Engagement
*   **Streaks**: Consecutive days of activity.
*   **Modality Preference**: Does the student perform better on visual or text-heavy questions?

---

## 4. Scaffolding System

When a student fails a difficult question (High Difficulty, Low Mastery), the engine triggers **Scaffolding Mode**.
1.  **Trigger**: Wrong answer + (Low Mastery OR High Distance from Correct).
2.  **Action**: The main question is paused.
3.  **Remediation**: The engine presents a sub-question (Scaffold) that addresses a specific prerequisite or step of the main problem.
    *   *Example*: "Integrate $x^2 e^x$ results in error" -> *Scaffold*: "First, identify $u$ and $dv$ for Integration by Parts."
4.  **Completion**: Upon solving the scaffold, the student returns to the main concept with reinforced understanding.

---

## 5. Exam Readiness & Risk

The engine synthesizes all data into a high-level **Exam Readiness Score** (0-100%).
*   **Inputs**: Weighted average of Topic Masteries + Retention Strength + Recent Accuracy.
*   **Risk Evaluation**:
    *   **Critical**: Readiness < 40% (Urgent intervention needed).
    *   **High**: Readiness 40-60%.
    *   **Medium**: Readiness 60-80%.
    *   **Low**: Readiness > 80% (On track).

This score drives the "Recommended Focus Areas" on the student dashboard.
