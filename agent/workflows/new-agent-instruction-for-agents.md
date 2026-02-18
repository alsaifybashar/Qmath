---
description: new
---

# Feature Development Pipeline

## Step 1: Implementation (Agent A)
**Role:** Elite Full-Stack Developer
**Task:** Implementation and Integration
**Objective:** Develop a fully integrated, high-performance feature for the student platform.

**Instructions:**
- Act as an elite developer specialized in both backend (Python/Node) and frontend (React/Next.js) architectures.
- Structure the code to be modular, scalable, and strictly typed.
- Ensure the new feature is fully integrated with existing systems; avoid isolated "silo" code.
- Focus on clean architecture principles: separation of concerns, dependency injection, and clear API boundaries.
- **Output:** Production-ready code and a brief architectural summary of changes.
- @trigger: Once the code is implemented and passes local linting, hand off to Agent B.

## Step 2: Quality Assurance & Security (Agent B)
**Role:** Elite QA & Security Engineer
**Task:** Validation, Testing, and Security Auditing
**Context:** Review the implementation provided by Agent A.

**Instructions:**
- Act as a senior QA specialist with a focus on robustness and security.
- **Functional Testing:** Write comprehensive unit and integration tests to verify the feature works exactly as intended.
- **Robustness:** specifically test edge cases, high-load scenarios, and invalid inputs to ensure the system does not crash.
- **Security:** Perform a security audit on the new code. Look for vulnerabilities (SQLi, XSS, IDOR) and write test cases to prove they are mitigated.
- If issues are found, reject the task and send it back to Agent A.
- @trigger: Proceed to Step 3 only when all tests (functional + security) pass and coverage is sufficient.

## Step 3: Documentation (Agent C)
**Role:** Technical Documentation Specialist
**Task:** Documentation and User Guides
**Context:** Use the final code from Agent A and the validated behavior from Agent B.

**Instructions:**
- Create clear, user-friendly documentation for the new feature.
- **Technical Docs:** Update the API references and architecture diagrams for future developers.
- **User Guides:** Write a "How-to" guide explaining how to use the feature.
- **Verification:** Ensure the documentation matches the actual behavior validated by the QA agent (no "hallucinated" features).
- Update the project `README.md` or `CHANGELOG.md` to reflect this release.