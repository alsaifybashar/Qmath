# AI Study Plan Feature

## Overview
The **AI Study Plan** feature analyzes uploaded course exams to provide students with a personalized study strategy. It uses Anthropic's Claude 3.5 Sonnet to process exam patterns and identify critical topics.

## Components
- **Server Action:** `app/actions/ai.ts` -> `generateStudyPlan`
- **Frontend Page:** `app/(dashboard)/courses/[code]/page.tsx`
- **Visualizations:** `components/dashboard/StudyPlan.tsx` using Recharts & Framer Motion.

## Implementation Details
1. **Trigger:** User visits a course page (e.g., `/courses/tata24`).
2. **Data Fetching:**
   - Previous exams are fetched from the database (`exams` table).
   - Course topics are retrieved.
3. **AI Generation:**
   - A structured prompt is sent to Claude via the Anthropic API.
   - The AI simulates an analysis (or uses provided metadata) to output JSON.
   - **Fallback:** If the API key is missing or fails, a "dummy plan" is returned to ensure UI stability.
4. **Security:**
   - Exam fetching is capped at 50 records to prevent scraping/DoS.
   - AI outputs are strictly parsed and sanitized before rendering.

## Usage Guide
1. Navigate to the **Dashboard**.
2. Click on any enrolled course card (e.g., "Linear Algebra").
3. The system will automatically analyze the course material.
4. Review the generated **Topic Importance Radar**, **Priority List**, and **Weekly Schedule**.

## Troubleshooting
- **Loader stuck?** The AI analysis simulates a minimum 4s processing time for UX.
- **"Failed to generate"?** Check server logs for API key issues. The system should fallback gracefully.
- **Wrong topics?** Ensure the course has topics seeded in the database.

## Future Improvements
- Implement real PDF parsing (currently simulated/metadata-based context).
- Allow users to customize the study duration (e.g., "2 weeks" vs "month").
