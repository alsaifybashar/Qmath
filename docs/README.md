# Tonande Lösningssteg Documentation

Welcome to the Fading Steps system documentation. This guide covers all aspects of the implementation, from student-facing guides to DevOps deployment.

## 📚 Documentation Structure

### For Students
- **[Fading Steps Guide (Swedish)](./student/fading-steps-guide.md)** — What are fading steps? How do they work? Why do steps disappear?
  - The 4 phases of learning
  - How mastery scores grow
  - Tips for effective learning
  - FAQ

### For Teachers/Admins
- **[Admin Guide: Creating Fading Steps Questions](./admin/fading-steps-admin.md)** — Step-by-step guide to creating and managing fading steps questions
  - How to create a `cas_steps` question
  - Best practices (step count, step quality, hints)
  - How mastery and fading work (non-technical)
  - Three complete examples (integral, derivative, algebraic simplification)
  - Testing a question before publishing

### For Developers

#### API & Integration
- **[API Reference: `/api/check-step`](./api/check-step.md)** — Complete OpenAPI 3.0 documentation
  - Request/response schemas with examples
  - Error codes (400, 401, 429, 500)
  - Rate limiting (20/min per user)
  - Authentication (JWT)
  - Security notes
  - cURL and TypeScript client examples

- **[Integration Guide: Frontend & Backend](./dev/integrating-fading-steps.md)** — How to integrate fading steps into your features
  - Core fade algorithm explanation
  - Server-side question fetching with revealed steps
  - Client-side state management
  - Rate limit handling
  - Testing with mocked mastery levels
  - Common pitfalls and fixes

#### System Design
- **[Architecture Deep Dive](./dev/architecture.md)** — System design, trade-offs, and scaling strategy
  - Component overview (pre-parser, CAS grader, BKT, fade logic)
  - Design decisions: Why math.js? Why BKT? Why Redis?
  - Detailed data flow diagram (12-step submission flow)
  - Scaling strategy: 100 → 1000 → 5000 students
  - Failure modes and recovery procedures

### For DevOps/Operations

#### Deployment
- **[Deployment & Operations Guide](./ops/deployment.md)** — Prerequisites, environment setup, database migrations, production checklist
  - Prerequisites (Node.js, PostgreSQL, Redis, SymPy)
  - Environment variables
  - Database migration steps
  - Building for production
  - Pre-deployment and post-deployment checklists
  - Scaling guidance (100 → 1000 → 5000 students)
  - Monitoring checklist and alert thresholds
  - Docker and Kubernetes examples

#### On-Call & Incident Response
- **[On-Call Runbook](./ops/runbook.md)** — Alert response procedures, debugging guides, manual testing
  - Alert 1: High latency (p95 > 300ms)
  - Alert 2: Rate limit spike (possible attack)
  - Alert 3: Redis connection failure
  - Alert 4: SymPy sidecar timeout
  - Debugging common issues
  - Manual testing procedures
  - Emergency procedures
  - Escalation path

## 🎯 Quick Start

### I'm a student using fading steps
Start here: **[Fading Steps Guide (Swedish)](./student/fading-steps-guide.md)**

### I'm a teacher creating questions
Start here: **[Admin Guide](./admin/fading-steps-admin.md)**

### I'm a developer integrating this feature
Start here: **[API Reference](./api/check-step.md)** → **[Integration Guide](./dev/integrating-fading-steps.md)**

### I'm deploying to production
Start here: **[Deployment Guide](./ops/deployment.md)** → **[Runbook](./ops/runbook.md)**

### I need to understand the system design
Start here: **[Architecture](./dev/architecture.md)**

## 🔑 Key Concepts

### What is Tonande Lösningssteg?

Fading Steps is a scaffolding technique that progressively removes hints and guidance as students demonstrate mastery:

| Phase | Mastery | Steps Shown | Example |
|-------|---------|-------------|---------|
| 1 | 0–35% | All | "See every step, read all hints" |
| 2 | 35–55% | ~66% | "Some steps hidden, hints reduced" |
| 3 | 55–75% | ~33% | "Most steps hidden, challenge mode" |
| 4 | 75%+ | 0 | "Solve independently, no support" |

**Pedagogical rationale:** Research shows this approach reduces cognitive load while forcing deeper processing. It mimics how good teachers gradually remove scaffolding.

### How Mastery Works

- **Starts at 0.1** (pessimistic: "you probably don't know this yet")
- **Increases with correct answers** (Bayesian Knowledge Tracing)
- **Decreases with incorrect answers**
- **Converges to 1.0** with consistent correct answers

### System Architecture (High Level)

```
Student Answer
       ↓
API (/api/check-step)
  • Validate input
  • Rate limit
  • Fetch step from DB
       ↓
CAS Grader (Two-Tier)
  • Tier 1: math.js (fast, <50ms)
  • Tier 2: SymPy (symbolic, ~200ms)
       ↓
BKT (Bayesian Knowledge Tracing)
  • Update mastery probability
       ↓
Fade Logic
  • Compute which steps to show
       ↓
API Response
  • isCorrect, newMastery, revealedSteps, feedback
```

## 📊 Key Metrics

Monitor these metrics in production:

| Metric | Target | Alert Threshold |
|--------|--------|---|
| API p95 latency | <150ms | >300ms |
| CAS grading p95 | <100ms (Tier 1) / <250ms (Tier 2) | >500ms |
| Rate limit accuracy | 99.99% | N/A |
| SymPy timeout rate | <0.1% | >1% |
| Error rate | <0.5% | >1% |

## 🗂️ File Structure

```
docs/
├── README.md (this file)
├── api/
│   └── check-step.md          (API documentation)
├── admin/
│   └── fading-steps-admin.md  (Admin guide)
├── student/
│   └── fading-steps-guide.md  (Swedish student guide)
├── dev/
│   ├── integrating-fading-steps.md  (Frontend/backend integration)
│   └── architecture.md              (System design)
└── ops/
    ├── deployment.md   (Prerequisites, setup, checklists)
    └── runbook.md      (Alert response, debugging)
```

## 🔗 Related Files in Codebase

### Implementation
- **API Endpoint:** `/app/api/check-step/route.ts`
- **Fade Logic:** `/lib/math/fade-logic.ts` (pure function, well-tested)
- **BKT (Mastery Update):** `/lib/adaptive-engine/knowledge-tracing.ts`
- **CAS Grader:** `/lib/math/cas-grader.ts` (two-tier)
- **Pre-Parser:** `/lib/math/pre-parser.ts` (input normalization)
- **Rate Limiter:** `/lib/rate-limit.ts` (in-memory, Redis-ready)

### Database
- **Schema:** `/db/schema.ts` (defines all tables)
- **Migration:** `/db/migrations/0004_lying_paladin.sql` (creates question_steps table)

### Tests
- **Fade Logic Tests:** `/__tests__/fade-logic.test.ts` (comprehensive coverage)

## ✅ Completeness Checks

- [x] All code examples are syntactically correct
- [x] All file paths are real (verified against repo structure)
- [x] All Swedish text is idiomatic
- [x] All diagrams render correctly (ASCII/Mermaid)
- [x] All internal links work
- [x] No sensitive data (passwords, tokens, API keys) in examples
- [x] API documentation includes error codes, rate limits, security notes
- [x] Admin guide includes 3 complete question examples
- [x] Architecture document includes scaling strategy (100→1000→5000 students)
- [x] Runbook includes 4 alert procedures with diagnosis and remediation

## 🚀 Getting Started

### For Local Development

```bash
# 1. Clone repository
git clone https://github.com/your-org/qmath.git
cd qmath

# 2. Install dependencies
npm install

# 3. Set up local database
npm run db:push

# 4. Start dev server
npm run dev

# 5. Test fading steps
curl -X POST http://localhost:3000/api/check-step \
  -H "Content-Type: application/json" \
  -d '{"stepId":"...","questionId":"...","topicId":"...","studentInput":"x^2"}'
```

### For Production Deployment

1. **Read:** [`/docs/ops/deployment.md`](./ops/deployment.md)
2. **Follow:** Pre-deployment checklist
3. **Deploy:** Docker or cloud platform
4. **Monitor:** Set up alerts from [`/docs/ops/runbook.md`](./ops/runbook.md)

## 📞 Support & Questions

### Documentation Issues
- Found a typo? Submit PR
- Unclear section? File issue with label `docs`

### Implementation Questions
- Check relevant documentation first
- Ask in Slack #qmath-dev channel
- For critical issues: page on-call engineer

### Production Issues
- Follow: [`/docs/ops/runbook.md`](./ops/runbook.md)
- Page: Senior engineer if not resolved in 15 min

## 📝 Version Info

- **System:** Tonande Lösningssteg (Fading Steps)
- **Implementation Status:** Production Ready (QA & Security passed)
- **Last Updated:** March 2026
- **Maintainers:** [Engineering Team]

---

**Questions?** Start with the relevant guide above. For urgent issues, consult the runbook.
