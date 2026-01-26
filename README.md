# Qmath - Adaptive Learning Platform

Qmath is a state-of-the-art AI-driven intelligent tutoring system designed for university-level mathematics. It moves beyond traditional "rule-based" learning by utilizing a sophisticated **Adaptive Learning Engine** that combines psychometric models with probabilistic machine learning to optimize student learning paths in real-time.

## 1. System Architecture

The Qmath platform consists of a modern frontend interface powered by a complex logical core.

### Component Diagram

```mermaid
graph TD
    User([User / Student]) <--> Client[Next.js Client (Study Interface)]
    
    subgraph "Frontend Layer"
        Client --> Components[UI Components (KaTeX, Charts)]
        Client --> Hook[useAdaptiveEngine Hook]
    end

    subgraph "Adaptive Logic Core (lib/adaptive-engine)"
        Hook <--> Engine[AdaptiveEngine Class]
        
        Engine --> IRT[Item Response Theory (IRT)]
        Engine --> BKT[Bayesian Knowledge Tracing]
        Engine --> BKT_P[Parameters (Guess/Slip/Transit)]
        Engine --> SR[Spaced Repetition (SM-2/FSRS)]
    end

    subgraph "Data Persistence"
        Engine <--> State[Student State Management]
        State -.-> DB[(Supabase / PostgreSQL)]
    end
```

### Core Components
1.  **Next.js Frontend (`/app`)**: A React-based interface using the App Router. It handles user interaction, equation rendering (via KaTeX), and visualizing progress.
2.  **Adaptive Hook (`use-adaptive.tsx`)**: The bridge between the UI and the logic. It manages the session state, timer, and user actions.
3.  **Adaptive Engine (`engine.ts`)**: The brain of the application. It orchestrates the selection of questions and updates the student's knowledge model.
4.  **Math Modules (`irt.ts`, `knowledge-tracing.ts`, `spaced-repetition.ts`)**: Pure logic modules implementing the statistical algorithms.
5.  **Database**: PostgreSQL schema for persisting user progress and question banks.

---

## 2. Installation & Configuration

### Prerequisites
-   **Node.js**: v18.17.0 or higher
-   **npm**: v9.0.0 or higher

### Step 1: Download & Install
Clone the repository (or download the source) and install dependencies.

```bash
# Install dependencies
npm install
```

### Step 2: Configuration
Currently, Qmath is configured to run in a local development environment.
*   **Database**: The generic schema is located in `/db/schema.sql`. For local development without a connected DB, the engine uses an in-memory initial state.
*   **Environment Variables**: Create a `.env.local` file if you plan to connect to a real Supabase instance (optional for UI testing).

### Step 3: Run Locally
Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production
To create an optimized production build:

```bash
npm run build
npm start
```

---

## 3. Logic & Algorithms

The core of Qmath is its **Adaptive Learning Engine**, which answers three critical questions at every step:
1.  *What is the student's ability?*
2.  *Have they mastered this skill?*
3.  *When should they review?*

It achieves this by fusing three distinct algorithms:

### A. Item Response Theory (IRT)
*   **Purpose**: Estimating student ability ($\theta$) and selecting the perfect next question.
*   **Algorithm**: We use a **3-Parameter Logistic (3PL)** model.
    *   It calculates the probability of a correct answer based on student ability vs. question difficulty, discrimination, and guessing factor.
    *   **Selection Logic**: The engine selects questions that maximize the "Fisher Information," effectively picking problems where the student's outcome is most uncertain (the "Zone of Proximal Development").

### B. Bayesian Knowledge Tracing (BKT)
*   **Purpose**: Determining if a specific skill has been "Mastered."
*   **Algorithm**: A Hidden Markov Model that updates the probability ($P(L)$) that a student knows a skill after every attempt.
    *   **Updates**: It creates a posterior probability using Bayes' theorem, accounting for the chance of a lucky guess on a hard problem or a silly mistake ("slip") on an easy one.
*   **Threshold**: When $P(L) > 0.95$, the skill is marked as **MASTERED**.

### C. Spaced Repetition (SM-2 / FSRS)
*   **Purpose**: Long-term retention.
*   **Algorithm**: Modified SuperMemo-2 / Free Spaced Repetition Scheduler.
*   **Logic**: Once a topic is mastered, the engine schedules review sessions.
    *   Ideally, a review occurs just as the student is about to forget the material (Forgetting Curve).
    *   Successful reviews expand the interval (e.g., 3 days -> 7 days -> 21 days).

### The Adaptive Loop
1.  **Initialize**: Load student history.
2.  **Select**:
    *   *Is review due?* -> Trigger Spaced Repetition.
    *   *Did they just fail?* -> Trigger Scaffolding (easier sub-problem).
    *   *New content needed?* -> IRT selects question matching current $\theta$.
3.  **Interact**: Student solves the problem.
4.  **Update**:
    *   IRT recalculates global Ability ($\theta$).
    *   BKT updates local Skill Mastery ($P(L)$).
    *   SR schedules next review.
5.  **Repeat**.

> For a deep dive into the mathematical formulas and implementation details, see [`ADAPTIVE_ENGINE_LOGIC.md`](./ADAPTIVE_ENGINE_LOGIC.md).
