# Qmath Redesign Plan
## Centered Study Experience with Contextual AI

---

## Executive Summary

This document outlines a complete redesign of Qmath's user experience, focusing on three core principles:

1. **Study-First Architecture**: Questions and practice are the heart of the platform
2. **Progressive Help System**: Layered support that guides without giving answers away
3. **Contextual AI Integration**: AI assistant embedded in context, not isolated

---

## Part 1: Current Problems Identified

### Navigation Issues
```
CURRENT STATE (Too Many Entry Points)
┌─────────────────────────────────────────────────────────┐
│  Landing Page                                           │
│  ├── Start Studying → Study Session                     │
│  ├── Log In → Dashboard                                 │
│  │              ├── Study (again?)                      │
│  │              ├── Practice (what's the difference?)   │
│  │              ├── Flashcards                          │
│  │              ├── AI Tutor (separate page)            │
│  │              └── Exam Mode                           │
│  └── Get Started → Register → Onboarding → ???         │
└─────────────────────────────────────────────────────────┘

PROBLEMS:
1. Too many "modes" (Study, Practice, Exam, Flashcards) - confusing
2. AI Tutor is isolated at /ai/chat - disconnected from learning
3. Dashboard is information-heavy but action-poor
4. No clear "what should I do next?" guidance
5. Help/explanations are afterthoughts, not integrated
```

### Help System Issues
```
CURRENT: Help is reactive and disconnected
- User gets question wrong → Generic "scaffold" message
- No progressive revelation of hints
- Explanations exist but aren't contextually surfaced
- AI chat requires navigating away from the question
```

---

## Part 2: New Architecture - "Study Hub" Model

### Core Philosophy
> **Everything flows from and returns to the Study Experience**

```
NEW ARCHITECTURE
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      ┌─────────────────┐                        │
│                      │   STUDY HUB     │                        │
│                      │  (Central Page) │                        │
│                      └────────┬────────┘                        │
│                               │                                 │
│         ┌─────────────────────┼─────────────────────┐           │
│         │                     │                     │           │
│         ▼                     ▼                     ▼           │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │  Question   │      │  Progress   │      │  Review     │      │
│  │  Practice   │      │  Tracking   │      │  (Spaced    │      │
│  │  (Main)     │      │  (Sidebar)  │      │  Repetition)│      │
│  └──────┬──────┘      └─────────────┘      └─────────────┘      │
│         │                                                       │
│         │ Need Help?                                            │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PROGRESSIVE HELP LAYERS                    │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐│    │
│  │  │ Hint 1  │→ │ Hint 2  │→ │ Worked  │→ │ AI Chat     ││    │
│  │  │ (Nudge) │  │ (Guide) │  │ Example │  │ (Contextual)││    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Simplified User Flow

### New Route Structure

```
BEFORE (Complex)                    AFTER (Simple)
/                                   /
/login                              /login
/register                           /register
/dashboard         ──MERGE──►       /study (THE hub)
/study                              /study/[topic-slug]
/practice                           /study/review
/exam                               /study/exam-mode
/flashcards                         /progress
/flashcards/review                  /settings
/ai/chat           ──REMOVE──►      (AI is everywhere, not a page)
/courses                            /courses (discovery only)
/profile                            /profile
/settings                           /settings
```

### New Page Purposes

| Route | Purpose | Key Components |
|-------|---------|----------------|
| `/study` | **THE MAIN PAGE** - Daily study session | Question area, Progress sidebar, AI panel |
| `/study/[topic]` | Focused study on specific topic | Same layout, filtered questions |
| `/study/review` | Spaced repetition review | Due items only |
| `/study/exam-mode` | Timed exam simulation | Timer, no helps, exam conditions |
| `/progress` | Analytics & insights (old dashboard) | Charts, statistics, recommendations |
| `/courses` | Course discovery & enrollment | Course cards, prerequisites |

---

## Part 4: The New Study Hub Layout

### Desktop Layout (Primary)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Header: Logo | [Course: Calculus I ▼] | Progress: 65% | [👤] [⚙️]     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────┐  │
│  │                                     │  │   CONTEXTUAL PANEL      │  │
│  │         QUESTION AREA               │  │                         │  │
│  │                                     │  │  ┌───────────────────┐  │  │
│  │  ┌─────────────────────────────┐    │  │  │ Topic: Derivatives│  │  │
│  │  │                             │    │  │  │ Mastery: 42%      │  │  │
│  │  │  Question Content           │    │  │  │ Questions: 3/10   │  │  │
│  │  │  (LaTeX rendered)           │    │  │  └───────────────────┘  │  │
│  │  │                             │    │  │                         │  │
│  │  │  Find d/dx of f(x) = x²+3x  │    │  │  📚 QUICK REFERENCE     │  │
│  │  │                             │    │  │  • Power Rule           │  │
│  │  └─────────────────────────────┘    │  │  • Sum Rule             │  │
│  │                                     │  │  [View all formulas]    │  │
│  │  ┌─────────────────────────────┐    │  │                         │  │
│  │  │ Your Answer                 │    │  │  ─────────────────────  │  │
│  │  │ [________________] [Check]  │    │  │                         │  │
│  │  └─────────────────────────────┘    │  │  🤖 AI ASSISTANT        │  │
│  │                                     │  │  ┌───────────────────┐  │  │
│  │  ┌─────────────────────────────┐    │  │  │ How can I help    │  │  │
│  │  │ 💡 HELP OPTIONS             │    │  │  │ with this         │  │  │
│  │  │                             │    │  │  │ derivative?       │  │  │
│  │  │ [Get Hint] [Show Steps]     │    │  │  │                   │  │  │
│  │  │ [See Example] [Ask AI]      │    │  │  │ [Ask a question]  │  │  │
│  │  └─────────────────────────────┘    │  │  └───────────────────┘  │  │
│  │                                     │  │                         │  │
│  └─────────────────────────────────────┘  └─────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Progress: ●●●●●○○○○○  Question 5/10  |  [Skip] [Previous] [Next]│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────┐
│ ☰ Calculus I    65%  👤 │
├─────────────────────────┤
│                         │
│  Question 5/10          │
│  ──────────────────     │
│                         │
│  Find d/dx of           │
│  f(x) = x² + 3x         │
│                         │
│  ┌───────────────────┐  │
│  │ Your answer:      │  │
│  │ [______________]  │  │
│  │      [Check]      │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Need help?        │  │
│  │ [💡 Hint] [📖 Ex] │  │
│  │ [🤖 Ask AI]       │  │
│  └───────────────────┘  │
│                         │
├─────────────────────────┤
│ ●●●●●○○○○○              │
│ [← Prev]    [Next →]    │
└─────────────────────────┘

AI Panel (Slides up from bottom when activated)
┌─────────────────────────┐
│ 🤖 AI Assistant    [×]  │
├─────────────────────────┤
│                         │
│ Context: Derivatives    │
│ Question: Find d/dx...  │
│                         │
│ ─────────────────────── │
│                         │
│ Chat history here...    │
│                         │
│ ┌───────────────────┐   │
│ │ Ask about this... │   │
│ └───────────────────┘   │
│         [Send]          │
└─────────────────────────┘
```

---

## Part 5: Progressive Help System

### Help Layer Architecture

```
PROGRESSIVE HELP LAYERS (User can access any level)

Level 0: NO HELP
├── User attempts question on their own
├── Correct → Celebrate, move on
└── Incorrect → Unlock Level 1

Level 1: NUDGE HINT (Free, always available)
├── Brief, non-revealing hint
├── Example: "Think about which differentiation rule applies here"
└── Still stuck → Level 2

Level 2: GUIDED HINT (Free)
├── More specific guidance
├── Example: "This function has two terms. Can you apply the sum rule?"
├── May show formula reference
└── Still stuck → Level 3

Level 3: STEP BREAKDOWN (May cost "help credits" or free)
├── Break question into sub-questions
├── Example: "Let's break this down:
│            Step 1: What is d/dx of x²?
│            Step 2: What is d/dx of 3x?
│            Step 3: How do you combine them?"
└── Still stuck → Level 4

Level 4: WORKED EXAMPLE (Free)
├── Show similar problem fully solved
├── Different numbers but same technique
├── Example: "Here's how to solve d/dx of x³ + 2x: ..."
└── Still stuck → Level 5

Level 5: AI CONVERSATION (Contextual)
├── Full chat interface
├── AI has access to:
│   • Current question
│   • User's wrong attempts
│   • Topic context
│   • User's mastery level
│   • Related formulas/laws
└── AI guides without giving direct answer
```

### Data Structure for Help Content

```typescript
interface QuestionWithHelp extends QuestionItem {
  // Existing fields...
  
  // NEW: Help layers
  helps: {
    nudgeHint: string;           // "Think about the power rule"
    guidedHint: string;          // "For x^n, the derivative is nx^(n-1)"
    
    stepBreakdown?: {
      intro: string;
      steps: Array<{
        prompt: string;          // "What is d/dx of x²?"
        correctAnswer: string;   // "2x"
        hint?: string;
      }>;
      conclusion: string;
    };
    
    workedExample?: {
      similarQuestion: string;   // "Find d/dx of x³ + 2x"
      solution: Array<{
        step: number;
        action: string;          // "Apply power rule to x³"
        result: string;          // "3x²"
        explanation?: string;
      }>;
    };
    
    relatedFormulas: Array<{
      name: string;              // "Power Rule"
      latex: string;             // "\\frac{d}{dx}x^n = nx^{n-1}"
      explanation?: string;
    }>;
    
    relatedTopics: string[];     // ["power-rule", "sum-rule"]
  };
  
  // AI Context (sent to AI when user asks for help)
  aiContext: {
    conceptsTested: string[];
    commonMistakes: string[];
    prerequisiteTopics: string[];
    teachingApproach?: string;   // "Guide through power rule first"
  };
}
```

---

## Part 6: Contextual AI Integration

### Design Principles

1. **AI is PRESENT, not a destination** - No separate /ai/chat page
2. **AI sees what user sees** - Full context of current question/page
3. **AI guides, doesn't solve** - Socratic method by default
4. **AI is optional** - Never forced, always available

### AI Panel States

```
STATE 1: COLLAPSED (Default)
┌─────────────────────┐
│ 🤖 Need help? [+]   │
└─────────────────────┘

STATE 2: MINIMIZED (After first use)
┌─────────────────────┐
│ 🤖 AI Assistant     │
│ Last: "Try the p... │
│ [Expand]            │
└─────────────────────┘

STATE 3: EXPANDED (Active chat)
┌─────────────────────────────────┐
│ 🤖 AI Assistant            [−] │
├─────────────────────────────────┤
│ Context: Derivatives Q5        │
│ ─────────────────────────────  │
│                                │
│ 👤 I don't understand how to   │
│    start this problem          │
│                                │
│ 🤖 Let's break it down! You    │
│    have f(x) = x² + 3x. This   │
│    is actually two terms       │
│    added together.             │
│                                │
│    What rule do we use when    │
│    we need to differentiate    │
│    a sum of terms?             │
│                                │
│ ┌─────────────────────────┐    │
│ │ The sum rule?           │    │
│ └─────────────────────────┘    │
│              [Send]            │
└─────────────────────────────────┘
```

### AI Context Injection

```typescript
// What the AI receives when user asks for help

interface AIContext {
  // Page context
  currentPage: 'study' | 'review' | 'exam' | 'progress';
  
  // Question context (when on study page)
  question?: {
    id: string;
    content: string;              // The actual question
    topic: string;                // "derivatives"
    difficulty: number;
    correctAnswer: string;        // AI should NOT reveal this
    hints: string[];              // Available hints
    relatedFormulas: Formula[];
  };
  
  // User's attempt context
  attempts?: {
    count: number;
    lastAnswer?: string;          // What they tried
    timeSpent: number;
    hintsUsed: string[];
  };
  
  // User's learning context
  student: {
    masteryLevel: number;         // 0-1 for this topic
    recentPerformance: 'struggling' | 'learning' | 'proficient';
    preferredExplanationStyle?: 'visual' | 'algebraic' | 'intuitive';
  };
  
  // Behavioral instructions for AI
  instructions: {
    mode: 'guide' | 'explain' | 'practice';
    canRevealAnswer: boolean;     // Usually false
    focusAreas: string[];         // Topics to emphasize
  };
}

// Example AI system prompt construction
function buildAISystemPrompt(context: AIContext): string {
  return `
You are a helpful math tutor assisting a student with ${context.question?.topic}.

CURRENT QUESTION:
${context.question?.content}

STUDENT CONTEXT:
- Mastery level: ${context.student.masteryLevel * 100}%
- Performance: ${context.student.recentPerformance}
- Attempts on this question: ${context.attempts?.count || 0}
- Last attempt: ${context.attempts?.lastAnswer || 'None yet'}

AVAILABLE FORMULAS:
${context.question?.relatedFormulas.map(f => `• ${f.name}: ${f.latex}`).join('\n')}

INSTRUCTIONS:
- Guide the student using the Socratic method
- Ask questions to help them discover the answer
- DO NOT directly reveal the answer: ${context.question?.correctAnswer}
- If they're stuck after 3+ attempts, you may give more direct hints
- Reference the formulas above when helpful
- Keep responses concise and encouraging
`;
}
```

### AI Integration Points (Where AI appears)

| Page | AI Context | AI Behavior |
|------|------------|-------------|
| `/study` | Current question, attempts, topic mastery | Guide through problem |
| `/study/[topic]` | Topic overview, weak areas | Explain concepts |
| `/study/review` | Spaced repetition item, memory state | Quick refresher mode |
| `/progress` | Overall performance, weak topics | Recommendations |
| `/courses` | Course prerequisites, user background | Course advice |

---

## Part 7: Technical Implementation

### New Component Architecture

```
components/
├── layout/
│   ├── StudyLayout.tsx          # Main study page layout
│   ├── Header.tsx               # Simplified header
│   └── ContextPanel.tsx         # Right sidebar
│
├── study/
│   ├── QuestionArea.tsx         # Question display + answer input
│   ├── HelpSystem/
│   │   ├── HelpPanel.tsx        # Container for all help options
│   │   ├── HintDisplay.tsx      # Shows hints progressively
│   │   ├── StepBreakdown.tsx    # Sub-question breakdown
│   │   ├── WorkedExample.tsx    # Similar solved problem
│   │   └── FormulaReference.tsx # Quick formula lookup
│   │
│   ├── inputs/                  # (existing question type components)
│   │   ├── MultipleChoiceInput.tsx
│   │   ├── NumericInput.tsx
│   │   └── ...
│   │
│   └── feedback/
│       ├── CorrectFeedback.tsx
│       ├── IncorrectFeedback.tsx
│       └── ProgressCelebration.tsx
│
├── ai/
│   ├── AIPanel.tsx              # The floating/docked AI chat
│   ├── AIContext.tsx            # Context provider for AI
│   ├── AIMessage.tsx            # Chat message component
│   └── useAIChat.tsx            # Hook for AI interactions
│
└── progress/
    ├── MasteryIndicator.tsx
    ├── SessionProgress.tsx
    └── TopicBreakdown.tsx
```

### New API Routes

```
app/api/
├── grade/
│   └── route.ts                 # (existing) Grade answers
│
├── ai/
│   └── chat/
│       └── route.ts             # AI chat endpoint (streaming)
│
├── help/
│   ├── hint/
│   │   └── route.ts             # Get next hint for question
│   ├── example/
│   │   └── route.ts             # Get worked example
│   └── breakdown/
│       └── route.ts             # Get step breakdown
│
└── progress/
    ├── session/
    │   └── route.ts             # Session tracking
    └── mastery/
        └── route.ts             # Mastery updates
```

### AI Chat API Implementation

```typescript
// app/api/ai/chat/route.ts

import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { message, context } = await request.json();
  
  const systemPrompt = buildAISystemPrompt(context);
  
  // Use streaming for better UX
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      // Include conversation history
      ...context.conversationHistory,
      { role: 'user', content: message }
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 500,
  });
  
  // Return streaming response
  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

### State Management for Study Session

```typescript
// lib/hooks/useStudySession.tsx

interface StudySessionState {
  // Current question
  currentQuestion: QuestionWithHelp | null;
  questionIndex: number;
  totalQuestions: number;
  
  // User's attempt on current question
  currentAttempt: {
    answer: string | null;
    attempts: number;
    hintsUsed: number;
    startTime: Date;
  };
  
  // Help state
  helpState: {
    currentLevel: 0 | 1 | 2 | 3 | 4 | 5;
    hintsRevealed: string[];
    stepBreakdownActive: boolean;
    workedExampleShown: boolean;
  };
  
  // AI state
  aiState: {
    isOpen: boolean;
    messages: AIMessage[];
    isLoading: boolean;
  };
  
  // Session progress
  sessionProgress: {
    correct: number;
    incorrect: number;
    skipped: number;
    xpEarned: number;
  };
}

export function useStudySession(topicId?: string) {
  const [state, dispatch] = useReducer(studySessionReducer, initialState);
  
  // Load questions based on adaptive engine
  useEffect(() => {
    loadNextQuestion();
  }, [topicId]);
  
  const submitAnswer = async (answer: string) => {
    // Grade the answer
    const result = await gradeAnswer(state.currentQuestion, answer);
    
    // Update mastery via BKT
    await updateMastery(result);
    
    // Show feedback
    dispatch({ type: 'SHOW_FEEDBACK', payload: result });
    
    // If incorrect and low mastery, suggest help
    if (!result.correct && result.newMastery < 0.4) {
      dispatch({ type: 'SUGGEST_HELP' });
    }
  };
  
  const requestHint = (level: number) => {
    dispatch({ type: 'REVEAL_HINT', payload: level });
    // Track hint usage for adaptive engine
    trackHelpUsage('hint', level);
  };
  
  const openAI = () => {
    dispatch({ type: 'OPEN_AI' });
    // Prepare context for AI
    prepareAIContext();
  };
  
  return {
    state,
    submitAnswer,
    requestHint,
    openAI,
    nextQuestion,
    previousQuestion,
    skipQuestion,
  };
}
```

---

## Part 8: User Flow Diagrams

### New User (First Time)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Landing    │────►│  Register   │────►│  Onboarding │
│  Page       │     │  (Quick)    │     │  (2 steps)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
        ┌──────────────────────────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│ Select Course   │────►│ Diagnostic Quiz │ (5 questions to gauge level)
│ (University/    │     │ (Optional)      │
│  Self-study)    │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                    ┌─────────────────────┐
                    │     STUDY HUB       │
                    │  "Let's start with  │
                    │   Derivatives!"     │
                    └─────────────────────┘
```

### Returning User (Daily Flow)

```
┌─────────────┐     ┌─────────────────────────────────────────┐
│   Login     │────►│              STUDY HUB                  │
│             │     │                                         │
└─────────────┘     │  "Welcome back, Bashar!"                │
                    │  ┌─────────────────────────────────────┐│
                    │  │ 📊 You have:                        ││
                    │  │ • 5 items due for review            ││
                    │  │ • Continue: Integration by Parts    ││
                    │  │ • Weak area: U-substitution         ││
                    │  └─────────────────────────────────────┘│
                    │                                         │
                    │  [▶ Start Today's Session]              │
                    │  [📖 Review Due Items]                  │
                    │  [🎯 Focus on Weak Areas]               │
                    └─────────────────────────────────────────┘
```

### During Study (Getting Help)

```
USER STUCK ON QUESTION
         │
         ▼
┌─────────────────┐
│ Wrong answer    │
│ "Not quite..."  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ What would you like to do?                  │
│                                             │
│ [💡 Get a Hint]                             │──► Shows nudge hint
│ [📐 See Related Formula]                    │──► Shows formula reference
│ [🔢 Break into Steps]                       │──► Activates step mode
│ [📝 See Similar Example]                    │──► Shows worked example
│ [🤖 Ask AI Tutor]                           │──► Opens AI panel
│                                             │
│ [↺ Try Again] [→ Skip for Now]              │
└─────────────────────────────────────────────┘
```

---

## Part 9: Implementation Roadmap

### Phase 1: Core Study Hub (2-3 weeks)
- [ ] Create new `/study` page layout
- [ ] Implement collapsible context panel
- [ ] Migrate existing question components
- [ ] Add progress indicator bar
- [ ] Simplify navigation to just: Study | Progress | Settings

### Phase 2: Help System (2 weeks)
- [ ] Design help content data structure
- [ ] Build HelpPanel component
- [ ] Implement hint progression logic
- [ ] Create StepBreakdown component
- [ ] Build WorkedExample viewer
- [ ] Add formula reference quick-view

### Phase 3: Contextual AI (2 weeks)
- [ ] Build AIPanel component
- [ ] Implement AI context provider
- [ ] Create AI chat API with streaming
- [ ] Design AI system prompts per page type
- [ ] Add conversation memory within session
- [ ] Implement "don't give away answer" guardrails

### Phase 4: Polish & Integration (1-2 weeks)
- [ ] Mobile-responsive layouts
- [ ] Animations and transitions
- [ ] Loading states
- [ ] Error handling
- [ ] Analytics integration
- [ ] A/B testing setup

---

## Part 10: Key Design Decisions

### 1. Merge Practice/Study/Exam
**Decision**: Single `/study` route with modes
- Default: Adaptive study (mixed topics based on algorithm)
- `/study/[topic]`: Focused study on one topic
- `/study/review`: Spaced repetition items only
- `/study/exam-mode`: Timed, no helps, exam conditions

### 2. Dashboard Becomes "Progress"
**Decision**: Dashboard is now analytics-only
- No action items that duplicate Study Hub
- Focus: Charts, insights, recommendations
- Quick action: "Start studying" always visible

### 3. AI is NOT a Page
**Decision**: AI is an overlay/panel on every page
- Context-aware based on current page
- Can be minimized but stays available
- Conversation persists within session

### 4. Help is ALWAYS Available
**Decision**: Help options visible before attempting
- Users shouldn't feel "trapped" 
- Some hints can be pre-viewed (formulas)
- More detailed help unlocks after first attempt

### 5. Mobile-First for Study
**Decision**: Study experience optimized for phone
- Students often study on commute
- AI panel becomes bottom sheet on mobile
- Swipe gestures for navigation

---

## Appendix: Component Specifications

### AIPanel Props
```typescript
interface AIPanelProps {
  // Position and visibility
  isOpen: boolean;
  onToggle: () => void;
  position: 'sidebar' | 'floating' | 'bottom-sheet';
  
  // Context injection
  context: AIContext;
  
  // Behavior
  mode: 'guide' | 'explain' | 'general';
  canRevealAnswers: boolean;
  
  // Callbacks
  onMessage: (message: string) => void;
  onClose: () => void;
}
```

### HelpSystem Props
```typescript
interface HelpSystemProps {
  question: QuestionWithHelp;
  currentAttempts: number;
  
  // What's been revealed
  hintsRevealed: number[];
  stepBreakdownActive: boolean;
  exampleShown: boolean;
  
  // Actions
  onRequestHint: (level: number) => void;
  onRequestSteps: () => void;
  onRequestExample: () => void;
  onOpenAI: () => void;
}
```

---

*This redesign plan prioritizes the studying experience while making AI assistance contextual and helpful without being intrusive. The progressive help system ensures students build understanding rather than just getting answers.*
