# Qmath Platform Structure Analysis & User Flow Expectations

## Executive Summary

This document validates the proposed platform structure and defines expected user flows for five primary user personas: **Discovery Phase**, **Active Learner**, **Exploring Features**, **Teacher/Admin**, and **Returning User**.

---

## 1. Current vs. Proposed Implementation Status

### Currently Implemented Routes

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ Exists | Landing Page |
| `/login` | ✅ Exists | Authentication |
| `/dashboard` | ✅ Exists | Main authenticated area |
| `/profile` | ✅ Exists | User profile |
| `/study` | ✅ Exists | Learning area |
| `/exam` | ✅ Exists | Single exam view |
| `/exams` | ✅ Exists | Exams overview |
| `/why-qmath` | ✅ Exists | Marketing page |

### Proposed Structure Validation

> [!IMPORTANT]
> The proposed structure is **comprehensive and well-organized**. See breakdown below.

---

## 2. Structure Validation by Category

### ✅ PUBLIC PAGES - Well Designed

| Route | Priority | Status |
|-------|----------|--------|
| `/` Landing | 🔴 Critical | ✅ Exists |
| `/features` | 🟡 High | ❌ Needed |
| `/pricing` | 🟡 High | ❌ Needed |
| `/about` | 🟢 Medium | ❌ Needed |
| `/blog/[slug]` | 🟢 Medium | ❌ Needed |
| `/demo` | 🟡 High | ❌ Needed |
| `/universities`, `/teachers` | 🟡 High | ❌ Needed |

> [!TIP]
> Consider adding `/case-studies` for B2B sales and `/testimonials` for social proof.

---

### ✅ AUTHENTICATION - Standard & Complete

| Route | Status |
|-------|--------|
| `/login` | ✅ Exists |
| `/register` | ❌ Needed |
| `/forgot-password` | ❌ Needed |
| `/reset-password/[token]` | ❌ Needed |
| `/verify-email/[token]` | ❌ Needed |
| `/auth/sso/[university]` | ❌ Needed (B2B) |

---

### ✅ ONBOARDING - Critical for Retention

```
Welcome → University → Program → Courses → Goals → Exams → Diagnostic → Complete
```

> [!WARNING]
> Onboarding abandonment is a major risk. Consider:
> - Allow skipping to dashboard at any step
> - Save progress automatically
> - Show "X of 7 steps" progress indicator

---

### ✅ LEARNING - Core Feature Set

```
/courses
  └── /courses/[courseId]
        └── /courses/[courseId]/topics/[topicId]

/practice
  ├── /practice/adaptive          ← AI-driven
  ├── /practice/topic/[topicId]   ← Focused
  └── /practice/weak-areas        ← Remedial
```

---

## 3. User Flow Expectations by Persona

### 👤 Persona 1: Discovery Phase User

**Profile:** First-time visitors exploring if Qmath fits their needs

**Expected Flow:**
```
Landing (/) → Features → Demo → Pricing → Register
                 ↓
         Universities/Teachers (B2B path)
                 ↓
              Register
```

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Landing → Features | >40% |
| Landing → Demo | >20% |
| Demo → Register | >15% |
| Pricing → Register | >10% |

**Critical Pages:** Landing, Demo, Features, Pricing

---

### 👤 Persona 2: Active Learner

**Profile:** Student actively using platform for exam prep

**Expected Flow:**
```
Login → Dashboard → Practice (Adaptive) → Questions → Progress
            ↓              ↑                  ↓
     Flashcard Review ←────┴──── Explanations
            ↓
    Exam Simulation → Results → Weak Areas Practice
```

**Session Patterns:**
| Type | Duration | Primary Pages |
|------|----------|---------------|
| Quick Review | 10-15 min | Dashboard → Flashcards |
| Study Session | 30-60 min | Dashboard → Practice → Questions |
| Exam Prep | 60-120 min | Exam → Simulation → Results |

**Critical Pages:** Dashboard, Practice, Question View, Flashcards

---

### 👤 Persona 3: Exploring Features User

**Profile:** New/trial user discovering capabilities

**Expected Flow:**
```
Onboarding Complete → Dashboard
                         ↓
    ┌────────────────────┼────────────────────┐
    ↓                    ↓                    ↓
 Courses            AI Chat              Flashcards
    ↓                    ↓                    ↓
 Topics          AI Recommendations      Create Deck
    ↓                    ↓                    ↓
 Practice ───────→ Progress ←───────── Stats
                         ↓
               Achievements → Subscription
```

**Critical Pages:** Dashboard, AI Chat, Courses, Progress

---

### 👤 Persona 4: Teacher/Admin

**Profile:** Educators managing content and students

**Teacher Flow:**
```
Login → Teacher Dashboard → Student Progress → Student Detail
              ↓
        Question Bank → Create/Edit Questions
              ↓
           Analytics
```

**Admin Flow:**
```
Login → Admin Dashboard → User Management
              ↓
        Content Management → University Management
              ↓
        System Analytics → Settings
```

**Critical Pages:** Portal Dashboards, Student Progress, Question Bank

---

### 👤 Persona 5: Returning User

**Profile:** User returning after 1+ week absence

**Expected Flow:**
```
Login → Dashboard (sees notifications)
            ↓
   ┌────────┼────────┐
   ↓        ↓        ↓
Overdue   Upcoming  Knowledge
Flashcards  Exams    Decay
   ↓        ↓        ↓
Review  Exam Detail  Weak Areas
Session              Practice
   ↓        ↓        ↓
   └────────┼────────┘
            ↓
      Study Planner (reset schedule)
```

**Re-engagement Triggers:**
| Trigger | Response | Action |
|---------|----------|--------|
| Overdue flashcards | "47 cards due" | Start Review |
| Upcoming exam | "5 days until exam" | Open Exam |
| Knowledge decay | "Calculus dropped 15%" | Practice Weak Areas |

**Critical Pages:** Dashboard, Flashcard Review, Knowledge Map

---

## 4. Cross-Persona Page Priority Matrix

| Page | Discovery | Active | Exploring | Teacher | Returning |
|------|-----------|--------|-----------|---------|-----------|
| Landing `/` | 🔴 | ⚪ | ⚪ | ⚪ | ⚪ |
| Dashboard | ⚪ | 🔴 | 🔴 | ⚪ | 🔴 |
| Practice | ⚪ | 🔴 | 🟡 | ⚪ | 🟡 |
| Flashcards | ⚪ | 🟡 | 🟡 | ⚪ | 🔴 |
| Exams | ⚪ | 🔴 | 🟡 | ⚪ | 🟡 |
| AI Chat | ⚪ | 🟢 | 🔴 | ⚪ | 🟢 |
| Teacher Portal | ⚪ | ⚪ | ⚪ | 🔴 | ⚪ |
| Demo | 🔴 | ⚪ | ⚪ | ⚪ | ⚪ |

**Legend:** 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ N/A

---

## 5. Recommendations

### Structure Improvements

1. **Add Quick Navigation** - Global command palette (Cmd+K)
2. **Consolidate Routes** - `/exam` and `/exams` should unify
3. **Clarify Distinction** - `/study` vs `/learn` vs `/practice`
4. **Missing Pages** - Consider `/search`, `/notifications`, `/history`

### User Flow Optimization

1. **Discovery → Conversion** - Add "Try Demo" CTA on all public pages
2. **Active Learner** - One-click resume, persistent session progress
3. **Re-engagement** - Implement "catch-up mode" for returning users

---

## 6. Implementation Priority

### Phase 1 - Core (Weeks 1-4)
- [ ] Complete authentication flow
- [ ] Implement onboarding sequence
- [ ] Build practice/question core loop

### Phase 2 - Engagement (Weeks 5-8)
- [ ] Flashcard SRS system
- [ ] Progress analytics dashboard
- [ ] AI chat integration

### Phase 3 - B2B (Weeks 9-12)
- [ ] Teacher portal
- [ ] Admin portal
- [ ] University SSO

### Phase 4 - Polish (Weeks 13-16)
- [ ] Study tools
- [ ] Help center
- [ ] Advanced analytics
