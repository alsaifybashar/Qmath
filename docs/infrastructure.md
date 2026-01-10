# Qmath Infrastructure Report

> **Comprehensive Technical Documentation**  
> Last Updated: January 10, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Application Flow](#application-flow)
6. [Core Modules](#core-modules)
7. [Component Architecture](#component-architecture)
8. [API Layer](#api-layer)
9. [Data Model & Database](#data-model--database)
10. [Adaptive Learning Engine](#adaptive-learning-engine)
11. [Frontend Patterns](#frontend-patterns)
12. [Routing & Navigation](#routing--navigation)
13. [Styling System](#styling-system)
14. [State Management](#state-management)
15. [Third-Party Integrations](#third-party-integrations)
16. [Build & Deployment](#build--deployment)
17. [Security Considerations](#security-considerations)
18. [Future Considerations](#future-considerations)

---

## Executive Summary

**Qmath** is an AI-driven adaptive learning platform designed for university-level mathematics education. The platform features a sophisticated adaptive engine that models student understanding using cognitive science algorithms and dynamically adjusts learning content to optimize mastery.

### Key Characteristics

| Aspect | Details |
|--------|---------|
| **Platform Type** | Web-based SaaS Learning Platform |
| **Target Audience** | University Engineering Students |
| **Core Innovation** | Bayesian Knowledge Tracing + Item Response Theory |
| **Architecture Pattern** | Server-Side Rendered React (Next.js App Router) |
| **Primary Language** | TypeScript |
| **Deployment Target** | Vercel/Node.js Compatible Hosts |

---

## Technology Stack

### Frontend Framework
```
Next.js 14.2.14 (App Router)
├── React 18.3.1
├── React DOM 18.3.1
└── TypeScript 5.x
```

### Styling
```
Tailwind CSS 3.4.3
├── PostCSS 8.4.38
├── Autoprefixer 10.4.19
├── tailwind-merge 2.5.2
└── clsx 2.1.1 (Utility for conditional classes)
```

### Animation & Interactivity
```
Framer Motion 12.24.7
└── Declarative animations for React
```

### Math Rendering
```
KaTeX 0.16.27
└── react-katex 3.1.0 (React wrapper)
```

### Data Visualization
```
Recharts 3.6.0
├── LineChart
├── AreaChart
├── RadarChart
└── Custom components
```

### Icons
```
lucide-react 0.446.0
└── Modern SVG icon library
```

### Theming
```
next-themes 0.4.6
└── Dark/Light mode support
```

### Database (Planned)
```
PostgreSQL (via Supabase)
└── SQL Schema defined in /db
```

---

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js Frontend                       │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │  │
│  │  │   Pages     │ │  Components │ │   Adaptive Engine   │ │  │
│  │  │  (App Dir)  │ │  (Reusable) │ │   (Client-Side)     │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/REST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /api/grade                                               │  │
│  │  └── POST: Process answer, update mastery, return action  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ SQL (Planned)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL (Supabase)                        │
│  ┌─────────┐ ┌─────────────┐ ┌───────────┐ ┌────────────────┐  │
│  │profiles │ │   topics    │ │ questions │ │ user_mastery   │  │
│  └─────────┘ └─────────────┘ └───────────┘ └────────────────┘  │
│                      ┌────────────────┐                         │
│                      │  attempt_logs  │                         │
│                      └────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
RootLayout (app/layout.tsx)
├── ThemeProvider (next-themes)
│   ├── ThemeToggle
│   └── Page Content
│
├── Landing Page (app/page.tsx)
│   ├── Header (Navigation)
│   ├── ParticleBackground
│   ├── Hero Section (KaTeX Math)
│   ├── ScrollSection (Features)
│   ├── QuoteSeparator
│   └── Footer
│
├── Dashboard (app/dashboard/page.tsx)
│   ├── Sidebar
│   ├── SearchCommandPalette
│   ├── Academic Status Panel
│   ├── Course Health
│   ├── Study Rhythm Chart
│   ├── Diagnostics
│   ├── Next Actions
│   └── Progress Analytics (Recharts)
│
└── Study Session (app/study/page.tsx)
    ├── Session Header (Progress/XP)
    └── Question Components
        ├── GuidedStepSession
        ├── MultipleChoiceInput
        ├── NumericInput
        ├── FillBlankInput
        ├── DragDropInput
        ├── ToggleInput
        └── ExpressionBuilderInput
```

---

## Project Structure

```
Qmath/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page (home)
│   ├── globals.css              # Global styles
│   ├── favicon.ico
│   │
│   ├── about/                   # About page
│   ├── ai/                      # AI features
│   │   └── chat/                # AI tutor chat
│   ├── api/                     # API routes
│   │   └── grade/               # Grading endpoint
│   │       └── route.ts
│   ├── contact/                 # Contact page
│   ├── courses/                 # Course listing
│   ├── dashboard/               # Student dashboard
│   │   └── page.tsx             # Dashboard with analytics
│   ├── demo/                    # Demo page
│   ├── exam/                    # Exam mode
│   ├── exams/                   # Exam management
│   ├── features/                # Features showcase
│   ├── flashcards/              # Flashcard system
│   │   └── review/              # Flashcard review
│   ├── forgot-password/         # Password recovery
│   ├── help/                    # Help center
│   ├── login/                   # Authentication
│   ├── onboarding/              # User onboarding flow
│   │   ├── university/
│   │   ├── course/
│   │   ├── exam/
│   │   └── plan/
│   ├── practice/                # Practice mode
│   ├── pricing/                 # Pricing plans
│   ├── privacy/                 # Privacy policy
│   ├── profile/                 # User profile
│   ├── register/                # User registration
│   ├── settings/                # User settings
│   ├── study/                   # Interactive study session
│   │   └── page.tsx             # Main study interface
│   ├── terms/                   # Terms of service
│   ├── universities/            # University partnerships
│   └── why-qmath/               # Why choose Qmath
│
├── components/                   # Reusable UI components
│   ├── Header.tsx               # Global navigation header
│   ├── Sidebar.tsx              # Dashboard sidebar
│   ├── ParticleBackground.tsx   # Animated background
│   ├── QuestionCard.tsx         # Question display card
│   ├── QuoteSeparator.tsx       # Decorative quote section
│   ├── ScrollAnimation.tsx      # Scroll-triggered animations
│   ├── ThemeToggle.tsx          # Dark/light mode toggle
│   ├── theme-provider.tsx       # Theme context wrapper
│   │
│   └── study/                   # Study session components
│       ├── DragDropInput.tsx    # Drag & drop ordering
│       ├── ExpressionBuilderInput.tsx  # Math expression builder
│       ├── FillBlankInput.tsx   # Fill-in-the-blank
│       ├── GuidedStepSession.tsx  # Step-by-step guided learning
│       ├── MathRenderer.tsx     # KaTeX wrapper
│       ├── MultipleChoiceInput.tsx  # MCQ component
│       ├── NumericInput.tsx     # Numeric answer input
│       └── ToggleInput.tsx      # Toggle selection
│
├── lib/                         # Core libraries
│   ├── utils.ts                 # Utility functions (cn helper)
│   │
│   ├── adaptive-engine/         # 🧠 THE BRAIN - Adaptive Learning
│   │   ├── index.ts             # Engine exports
│   │   ├── engine.ts            # Main AdaptiveLearningEngine class
│   │   ├── irt.ts               # Item Response Theory models
│   │   ├── knowledge-tracing.ts # Bayesian Knowledge Tracing
│   │   ├── spaced-repetition.ts # SM-2 & FSRS algorithms
│   │   ├── parameters.ts        # Type definitions
│   │   └── use-adaptive.tsx     # React hooks for UI integration
│   │
│   └── data-model/              # Data type definitions
│       └── types.ts             # Shared TypeScript interfaces
│
├── types/                       # Additional type definitions
│   └── study.ts                 # Question type definitions
│
├── db/                          # Database schemas
│   └── schema.sql               # PostgreSQL schema
│
├── public/                      # Static assets
│   ├── images/                  # Image assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── docs/                        # Documentation
│   ├── platform_structure_analysis.md
│   └── infrastructure.md        # This document
│
├── package.json                 # Dependencies & scripts
├── package-lock.json
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── next.config.mjs              # Next.js configuration
├── eslint.config.mjs            # ESLint configuration
├── next-env.d.ts                # Next.js type declarations
├── README.md                    # Project readme
├── ADAPTIVE_ENGINE_LOGIC.md     # Adaptive engine documentation
└── .gitignore                   # Git ignore rules
```

---

## Application Flow

### User Journey Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER JOURNEY                                │
└──────────────────────────────────────────────────────────────────┘

     [Landing Page]
          │
          ├──► "Start Studying" ──► [Study Session]
          │                              │
          │                              ├──► Question Selection
          │                              │    (Adaptive Engine)
          │                              │
          │                              ├──► Answer Processing
          │                              │    ├── Grade API Call
          │                              │    ├── Mastery Update (BKT)
          │                              │    └── Scaffolding Decision
          │                              │
          │                              └──► Session Complete
          │                                   └──► Dashboard
          │
          ├──► "Log In" ──► [Login] ──► [Dashboard]
          │                              │
          │                              ├──► Academic Status
          │                              ├──► Course Health
          │                              ├──► Study Analytics
          │                              ├──► Next Actions
          │                              └──► Quick Actions
          │                                   ├──► Study
          │                                   ├──► Practice
          │                                   ├──► Flashcards
          │                                   └──► AI Tutor
          │
          └──► "Get Started" ──► [Register] ──► [Onboarding]
                                                  │
                                                  ├──► Select University
                                                  ├──► Select Course
                                                  ├──► Set Exam Date
                                                  └──► Choose Plan
```

### Study Session Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STUDY SESSION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

     [Session Start]
          │
          ▼
     ┌──────────────────────┐
     │ Load Question Bank   │
     └──────────────────────┘
          │
          ▼
     ┌──────────────────────┐
     │ Adaptive Engine:     │
     │ • Get Student State  │
     │ • Check Due Items    │
     │ • Calculate Scores   │
     │ • Select Question    │
     └──────────────────────┘
          │
          ▼
     ┌──────────────────────┐         ┌──────────────────────┐
     │ Render Question      │◄────────┤ Question Types:      │
     │ Component            │         │ • Multiple Choice    │
     └──────────────────────┘         │ • Numeric Input      │
          │                           │ • Fill Blank         │
          │                           │ • Drag & Drop        │
          │                           │ • Toggle             │
          │                           │ • Expression Builder │
          │                           │ • Guided Steps       │
          │                           └──────────────────────┘
          ▼
     ┌──────────────────────┐
     │ User Submits Answer  │
     └──────────────────────┘
          │
          ▼
     ┌──────────────────────┐
     │ Process Answer:      │
     │ • Validate Response  │
     │ • Update BKT Mastery │
     │ • Update IRT Ability │
     │ • Spaced Repetition  │
     │ • Check Scaffolding  │
     └──────────────────────┘
          │
          ├──── Correct ────► [Show Success] ──► Next Question
          │
          └──── Wrong ────► [Show Feedback]
                              │
                              ├──── Low Mastery ──► [Scaffold]
                              │                      └──► Simpler Steps
                              │
                              └──── Otherwise ──► [Retry/Next]
```

---

## Core Modules

### 1. Adaptive Learning Engine (`/lib/adaptive-engine/`)

The heart of Qmath - a sophisticated learning algorithm system.

#### Components:

| Module | File | Purpose |
|--------|------|---------|
| **Main Engine** | `engine.ts` | Orchestrates all algorithms, manages state |
| **IRT** | `irt.ts` | Item Response Theory - question difficulty matching |
| **BKT** | `knowledge-tracing.ts` | Bayesian Knowledge Tracing - mastery estimation |
| **Spaced Rep** | `spaced-repetition.ts` | SM-2 & FSRS - optimal review scheduling |
| **Parameters** | `parameters.ts` | TypeScript interfaces for all data structures |
| **React Hooks** | `use-adaptive.tsx` | UI integration hooks |

#### Key Classes:

```typescript
// Main orchestrator
class AdaptiveLearningEngine {
  selectNextQuestion()    // Select optimal next question
  processAnswer()         // Update all tracking systems
  startSession()          // Begin study session
  endSession()            // End and save session
  getRecommendations()    // Get personalized recommendations
  getStudentState()       // Get current student state
}

// Bayesian Knowledge Tracing
class BayesianKnowledgeTracing {
  updateMastery()         // Update P(mastered | response)
  predictCorrect()        // Predict P(correct) on next attempt
  isMastered()            // Check if skill is mastered
  practicesNeeded()       // Estimate practices to mastery
}

// Item Response Theory
class IRTModel {
  probabilityCorrect()    // 3PL probability calculation
  itemInformation()       // How informative is this question
  updateAbilityMLE()      // Maximum Likelihood Estimation
  updateAbilityEAP()      // Expected A Posteriori estimation
  selectNextItem()        // CAT item selection
}

// Spaced Repetition
class SpacedRepetitionManager {
  processReview()         // Update after review
  getDueItems()           // Get items due for review
  getNextReviewDate()     // When to review next
}
```

### 2. Study Components (`/components/study/`)

Interactive question type components following Brilliant.org-style design.

| Component | Purpose | Features |
|-----------|---------|----------|
| **GuidedStepSession** | Multi-step problem breakdown | Progressive disclosure, scaffolding |
| **MultipleChoiceInput** | Single/multi-select MCQ | Visual feedback, formulas |
| **NumericInput** | Number entry with validation | Tolerance, fractions, decimals |
| **FillBlankInput** | Text completion | Multiple correct answers |
| **DragDropInput** | Ordering/sorting | Touch-friendly drag |
| **ToggleInput** | True/false selection grid | Toggle groups |
| **ExpressionBuilderInput** | Build math expressions | Block-based building |
| **MathRenderer** | LaTeX rendering | KaTeX integration |

---

## Component Architecture

### Study Question Components

All study components follow a consistent pattern:

```typescript
interface QuestionComponentProps<T extends QuestionBase> {
  question: T;
  onAnswer: (answer: any, isCorrect: boolean) => void;
}
```

Example component structure:

```typescript
// MultipleChoiceInput Pattern
const MultipleChoiceInput = ({ question, onAnswer }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubmit = () => {
    const isCorrect = selected === question.correctOptionId;
    setSubmitted(true);
    setShowFeedback(true);
    
    setTimeout(() => {
      onAnswer(selected, isCorrect);
    }, 1200);
  };

  return (
    <motion.div>
      <QuestionDisplay question={question} />
      <OptionsGrid options={question.options} />
      <FeedbackDisplay visible={showFeedback} isCorrect={isCorrect} />
    </motion.div>
  );
};
```

### Shared Component Patterns

1. **Framer Motion Animations**: All transitions use Framer Motion
2. **Theme Awareness**: Components support dark/light modes
3. **Responsive Design**: Mobile-first with tablet/desktop adaptations
4. **Accessibility**: ARIA labels, keyboard navigation
5. **Feedback States**: Success/error visual feedback

---

## API Layer

### Current Endpoints

#### `POST /api/grade`

Processes student answers and returns adaptive feedback.

**Request:**
```typescript
{
  attempt: {
    question_id: string;
    is_correct: boolean;
    time_taken_ms: number;
  };
  currentMastery: number;  // 0-1 probability
}
```

**Response:**
```typescript
{
  success: boolean;
  new_mastery: number;       // Updated mastery probability
  predicted_success: number; // P(correct) on next attempt
  is_mastered: boolean;      // Mastery threshold reached
  action: "continue" | "scaffold" | "retry";
  feedback: string;          // User-facing message
}
```

**Algorithm Flow:**

```
Input ──► BKT Update ──► Action Decision ──► Success Prediction ──► Response
             │
             ├── Correct: Increase mastery
             │
             └── Wrong: Check mastery level
                         │
                         ├── Low (<0.4): Scaffold
                         │
                         └── Otherwise: Retry
```

### Planned Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/[...nextauth]` | ALL | Authentication |
| `/api/questions` | GET | Fetch question bank |
| `/api/progress` | GET/POST | Student progress |
| `/api/sessions` | GET/POST | Study sessions |
| `/api/recommendations` | GET | AI recommendations |

---

## Data Model & Database

### PostgreSQL Schema

```sql
-- Users (Students)
profiles
├── id (UUID, PK, references auth.users)
├── email (TEXT)
├── full_name (TEXT)
├── enrollment_year (INT)
├── university_program (TEXT)
├── target_gpa (DECIMAL)
└── created_at (TIMESTAMPTZ)

-- Topics (Knowledge Graph)
topics
├── id (UUID, PK)
├── slug (TEXT, UNIQUE)
├── title (TEXT)
├── description (TEXT)
├── prerequisites (JSONB) -- Array of topic_ids
├── base_difficulty (INT, 1-10)
└── created_at (TIMESTAMPTZ)

-- Questions
questions
├── id (UUID, PK)
├── topic_id (UUID, FK → topics)
├── content_markdown (TEXT) -- Contains LaTeX
├── question_type (TEXT: 'multiple_choice'|'numeric'|'proof_step')
├── correct_answer (TEXT)
├── options (JSONB) -- For MCQ
├── explanation_markdown (TEXT)
├── difficulty_tier (INT)
└── created_at (TIMESTAMPTZ)

-- User Mastery State (Adaptive Engine Memory)
user_mastery
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── topic_id (UUID, FK → topics)
├── mastery_probability (FLOAT, default 0.1)
├── last_practiced_at (TIMESTAMPTZ)
└── UNIQUE(user_id, topic_id)

-- Interaction Logs
attempt_logs
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── question_id (UUID, FK → questions)
├── is_correct (BOOLEAN)
├── time_taken_ms (INT)
└── timestamp (TIMESTAMPTZ)
```

### Entity Relationships

```
profiles ──1:N──► user_mastery ◄──N:1── topics
    │                                      │
    │                                      │
    └──1:N──► attempt_logs ◄──N:1──────────┘
                   │
                   └──N:1── questions
```

### TypeScript Interfaces (Key Types)

```typescript
// Student Learning State
interface StudentLearningState {
  userId: string;
  performance: PerformanceMetrics;
  temporal: TemporalMetrics;
  engagement: EngagementMetrics;
  knowledge: KnowledgeState;
  spacedRepetition: SpacedRepetitionState;
  lastUpdated: Date;
  examReadinessScore: number;        // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedFocusAreas: string[];
}

// Question Parameters
interface QuestionItem {
  id: string;
  topicId: string;
  content: string;
  type: 'multiple_choice' | 'numeric' | 'proof_step';
  options?: string[];
  correctAnswer: string;
  difficulty: number;           // 1-10
  characterCount: number;
  stepsRequired: number;
  prerequisites: string[];
  irtParams: IRTParameters;
  scaffoldQuestions?: QuestionItem[];
}

// IRT Parameters
interface IRTParameters {
  difficulty: number;       // b parameter (-3 to 3)
  discrimination: number;   // a parameter (0.5 to 2.5)
  guessing: number;         // c parameter (0 to 0.5)
}
```

---

## Adaptive Learning Engine

### Algorithm Deep Dive

#### 1. Bayesian Knowledge Tracing (BKT)

Models skill mastery as a hidden Markov model.

**Parameters:**
- `P(L0)` = Initial mastery probability (default: 0.1)
- `P(T)` = Learn probability per practice (default: 0.2)
- `P(G)` = Guess probability (default: 0.25)
- `P(S)` = Slip probability (default: 0.1)

**Update Equations:**

```
On Correct Answer:
P(L|Correct) = P(L) × P(Correct|L) / P(Correct)
             = P(L) × (1-P(S)) / [P(L)×(1-P(S)) + (1-P(L))×P(G)]

On Wrong Answer:
P(L|Wrong) = P(L) × P(S) / [P(L)×P(S) + (1-P(L))×(1-P(G))]

After Response:
P(L_next) = P(L|response) + (1 - P(L|response)) × P(T)
```

#### 2. Item Response Theory (IRT)

Models relationship between ability and item difficulty.

**3-Parameter Logistic (3PL):**

```
P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))

Where:
  θ = student ability
  a = discrimination
  b = difficulty
  c = guessing parameter
```

**Information Function:**

```
I(θ) = a² × (P(θ)-c)² × (1-P(θ)) / ((1-c)² × P(θ))
```

#### 3. Question Selection Algorithm

Multi-factor scoring system:

```typescript
calculateQuestionScore(question, ability, dueItems, targetTopic) {
  let score = 0;

  // 1. IRT Information (30% weight)
  score += itemInformation(ability, question.irtParams) * 30;

  // 2. Zone of Proximal Development (25% weight)
  const optimalDifficulty = ability + 0.3;
  const difficultyMatch = 1 - |question.difficulty - optimalDifficulty|;
  score += difficultyMatch * 25;

  // 3. Mastery-based (20% weight)
  const topicMastery = getTopicMastery(question.topicId);
  score += (1 - topicMastery) * 20;

  // 4. Spaced Repetition (15% weight)
  if (dueItems.includes(question.topicId)) {
    score += 15;
  }

  // 5. Target Topic Bonus (10% weight)
  if (targetTopic === question.topicId) {
    score += 10;
  }

  // 6. Prerequisite Penalty (-30)
  if (!checkPrerequisites(question)) {
    score -= 30;
  }

  return score;
}
```

#### 4. Spaced Repetition (SM-2 + FSRS)

Implements both SuperMemo 2 and Free Spaced Repetition Scheduler.

**SM-2 Core:**
```typescript
nextInterval(q, ef, rep) {
  if (q < 3) return 1;  // Reset on failure
  if (rep === 1) return 1;
  if (rep === 2) return 6;
  return prevInterval * ef;
}

newEF(ef, quality) {
  return ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
}
```

---

## Frontend Patterns

### Component Design Principles

1. **Client Components**: Study interactions use `'use client'`
2. **Server Components**: Static pages leverage SSR
3. **Dynamic Imports**: Heavy components (KaTeX) dynamically loaded
4. **Suspense Boundaries**: For async data loading

### Animation Patterns

```typescript
// Scroll-triggered animations
<ScrollSection>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
  >
    {content}
  </motion.div>
</ScrollSection>

// Page transitions
<AnimatePresence mode="wait">
  <motion.div
    key={uniqueKey}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
  >
    {content}
  </motion.div>
</AnimatePresence>
```

### Dark Mode Implementation

```typescript
// Theme Provider setup
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem={false}
  disableTransitionOnChange
>
  {children}
</ThemeProvider>

// Component usage
<div className="bg-white dark:bg-black text-zinc-900 dark:text-white">
  {content}
</div>
```

---

## Routing & Navigation

### App Router Structure

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing/Home | Public |
| `/login` | Authentication | Public |
| `/register` | Registration | Public |
| `/dashboard` | Student Dashboard | Auth Required |
| `/study` | Interactive Study | Auth Required |
| `/practice` | Practice Mode | Auth Required |
| `/exam` | Exam Simulation | Auth Required |
| `/flashcards` | Flashcard System | Auth Required |
| `/ai/chat` | AI Tutor | Auth Required |
| `/courses` | Course Catalog | Auth Required |
| `/profile` | User Profile | Auth Required |
| `/settings` | User Settings | Auth Required |
| `/pricing` | Pricing Plans | Public |
| `/features` | Features Overview | Public |
| `/about` | About Us | Public |

### Navigation Components

1. **Header** (`components/Header.tsx`): Public pages navigation
2. **Sidebar** (Dashboard embedded): Authenticated navigation
3. **SearchCommandPalette**: Ctrl+K quick navigation

---

## Styling System

### Tailwind Configuration

```typescript
// tailwind.config.ts
{
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
}
```

### Design Tokens (from CSS Variables)

```css
/* globals.css */
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

### Common Patterns

```typescript
// Utility function for conditional classes
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  "base-styles",
  isActive && "active-styles",
  variant === "primary" && "primary-styles"
)} />
```

---

## State Management

### Current Approach

The application uses **React's built-in state management**:

1. **`useState`**: Component-level state
2. **`useEffect`**: Side effects and subscriptions
3. **`useRef`**: Mutable references
4. **Props Drilling**: For simple parent-child communication

### Adaptive Engine State

```typescript
// Engine state persisted via JSON export/import
class AdaptiveLearningEngine {
  exportState(): string {
    return JSON.stringify(this.studentState);
  }

  importState(json: string): void {
    this.studentState = JSON.parse(json);
  }
}
```

### Future Considerations

For production, consider:
- **Zustand**: Lightweight global state
- **React Query**: Server state management
- **Supabase Client**: Real-time subscriptions

---

## Third-Party Integrations

### Current Integrations

| Library | Purpose | Usage |
|---------|---------|-------|
| **KaTeX** | Math rendering | LaTeX expressions |
| **Framer Motion** | Animations | Page transitions, micro-interactions |
| **Recharts** | Charts | Dashboard analytics |
| **Lucide** | Icons | UI iconography |
| **next-themes** | Theming | Dark/light mode |

### Planned Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Supabase** | Database + Auth | Schema ready |
| **Vercel** | Deployment | Compatible |
| **Analytics** | Usage tracking | Planned |
| **Stripe** | Payments | Planned |

---

## Build & Deployment

### NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",      // Development server
    "build": "next build",  // Production build
    "start": "next start",  // Production server
    "lint": "next lint"     // ESLint checks
  }
}
```

### Requirements

- **Node.js**: 18+
- **npm**: Package manager
- **Memory**: Sufficient for build (~2GB)

### Deployment Options

1. **Vercel** (Recommended)
   - Zero-config deployment
   - Automatic CI/CD
   - Edge functions support

2. **Docker**
   - Custom container deployment
   - Self-hosted options

3. **Static Export** (Limited)
   - For CDN hosting
   - Requires API adjustments

---

## Security Considerations

### Current Implementation

1. **Client-Side Validation**: Input sanitization in components
2. **Type Safety**: TypeScript prevents many runtime errors
3. **No Hardcoded Secrets**: Config via environment variables

### Future Requirements

| Area | Recommendation |
|------|----------------|
| **Authentication** | Implement NextAuth.js or Supabase Auth |
| **Authorization** | Row-Level Security in Supabase |
| **Rate Limiting** | API route protection |
| **CSRF Protection** | Token validation |
| **Input Validation** | Server-side validation layer |
| **CSP Headers** | Content Security Policy |

---

## Future Considerations

### Planned Features

1. **Real-time Collaboration**: Study groups
2. **AI Tutor Chat**: LLM-powered assistance
3. **Gamification**: Badges, leaderboards, XP system
4. **Mobile App**: React Native or PWA
5. **University Dashboard**: Instructor analytics
6. **Content Authoring**: Question creation tools

### Scalability Considerations

1. **Database**: PostgreSQL with read replicas
2. **Caching**: Redis for session data
3. **CDN**: Static asset delivery
4. **Serverless**: Edge functions for global performance

### Technical Debt

1. **Mock Data**: Replace with real database queries
2. **Authentication**: Implement proper auth flow
3. **Error Boundaries**: Add React error boundaries
4. **Testing**: Add unit/integration tests
5. **Accessibility**: WCAG 2.1 compliance audit

---

## Appendix

### File Size Summary

```
Total Project Size: ~250KB source (excluding node_modules)

Largest Files:
├── app/dashboard/page.tsx    (~61KB) - Dashboard UI
├── lib/adaptive-engine/engine.ts (~25KB) - Core engine
├── app/page.tsx (~18KB) - Landing page
├── app/study/page.tsx (~18KB) - Study session
├── lib/adaptive-engine/knowledge-tracing.ts (~12KB)
└── lib/adaptive-engine/spaced-repetition.ts (~13KB)
```

### Dependency Graph

```
Next.js 14
├── React 18
│   ├── framer-motion (animations)
│   ├── react-katex (math)
│   └── recharts (charts)
├── Tailwind CSS 3
│   ├── postcss
│   └── autoprefixer
└── TypeScript 5
    └── @types/*
```

---

*This infrastructure report provides a comprehensive overview of the Qmath platform architecture, designed to guide developers in understanding, maintaining, and extending the system.*
