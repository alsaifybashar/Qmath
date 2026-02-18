The Core Principle: AI as the Platform's Nervous System
The student should never think "let me ask the AI." Instead, they should just feel that the platform is unusually smart, responsive, and personal. AI acts invisibly in four layers:

Layer 1 — AI Inside the Problem Itself
When a student is solving a problem, AI is embedded directly into the exercise UI, not as a chatbot but as behavior:
Progressive hints that unlock only when the student has been stuck for a set amount of time (e.g., 45 seconds of inactivity). The hint doesn't appear as "AI says...", it just appears as a subtle nudge — a small highlighted formula, or "Have you considered what eigenvalue means geometrically here?" The student never clicked "ask AI."
Real-time error diagnosis when they submit a wrong answer. Instead of just "Incorrect", the platform silently classifies what type of mistake it was — conceptual, computational, or notation — and adjusts the follow-up question accordingly. From the TATA24 exams you shared, eigenvalue problems, orthogonal projections, and determinant calculations appear across nearly every exam, so error taxonomy here is especially valuable.
Faded worked examples where AI fills in some steps and leaves others blank, calibrated to the student's current BKT mastery level. The student just sees a partially completed solution to fill in — they don't know the AI decided exactly which steps to hide based on their history.

Layer 2 — AI Inside the Dashboard (Silent Recommendations)
The dashboard never shows a recommendation widget labeled "AI suggests...". Instead it simply shows the right thing when the student arrives:
The first card they see is their weakest topic from the current week, with a practice button. The second card shows a problem type that appeared on 4 of the last 5 real exams (like orthogonal projection or system of ODEs from your uploaded exams) with a note like "High exam frequency." These are AI-driven selections but they feel like clean, data-driven design.
An Exam Readiness Bar at the top of the dashboard — a single percentage — updates silently after every session. Under it, three specific topics are listed as gaps. No explanation of the algorithm. Just the insight.

Layer 3 — AI Inside the Exam Simulation Flow
When a student starts a timed exam simulation, AI is working in the background to build the paper. It pulls from the real exam taxonomy you've extracted from the five TATA24 exams — ensuring Part A covers short answer (geometry, planes, system solving), Part B covers transformations and eigenvalues, and Part C includes a proof-based challenge.
After the simulation, instead of a chatbot debriefing, the student sees an automatic post-exam breakdown page — a visual that shows topic-by-topic performance, highlights which problems match real exam patterns, and surfaces the two or three areas that, if improved, would most likely push their grade up. This entire page is AI-generated based on their attempt, but it looks and feels like a designed analytics screen.

Layer 4 — AI Inside Spaced Repetition Notifications
The push notifications and email reminders the student receives are written dynamically by AI based on their actual data — not generic "Time to study!" messages. Instead: "You haven't practiced determinants in 8 days. It appeared on 3 of your last 5 practice exams." The notification is written by AI, personalized to their history, but the student just reads it as a smart reminder from the platform.

What to Build First (Practical Priority)
Given you're solo and need maximum impact quickly, I'd sequence it like this:
First: Embed the progressive hint system into your existing problem UI. This is the single highest-value AI integration because it's visible during the moment of struggle — the exact moment students need help — without requiring any navigation away.
Second: Build the post-attempt error classification. When a student gets a wrong answer, Claude silently categorizes it and selects the next question accordingly. Students notice the platform "gets smarter" without understanding why.
Third: Build the AI-generated exam simulation breakdown page. This is what will make students share the platform with each other — a beautiful, personalized post-exam report feels like something a private tutor would produce.
The chat interface is the last thing to add, if ever. By the time you've built layers 1–3, students will rarely need to ask a free-form question because the platform has already anticipated their needs. That's the real goal.