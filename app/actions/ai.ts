'use server';

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
// @ts-ignore
import PDFParser from 'pdf2json';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
});

interface ExamMeta {
    filePath: string;
    year: string;
    type: string;
}

function parsePdfBuffer(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = text content
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            // pdf2json returns URL-encoded text in older versions or specific structure
            // Using getRawTextContent() is safest if available, essentially we want formImage.Pages[].Texts[].R[].T
            // But let's check its output format.
            try {
                const text = pdfParser.getRawTextContent();
                resolve(text);
            } catch (e) {
                // Fallback manual extraction if method not available in this version
                let extractedText = "";
                if (pdfData && pdfData.Pages) {
                    for (const page of pdfData.Pages) {
                        for (const textItem of page.Texts) {
                            for (const R of textItem.R) {
                                extractedText += decodeURIComponent(R.T) + " ";
                            }
                        }
                    }
                }
                resolve(extractedText);
            }
        });
        pdfParser.parseBuffer(buffer);
    });
}

export async function generateStudyPlan(
    courseName: string,
    courseCode: string,
    topicsList: string[] = [],
    examData: ExamMeta[] = []
) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return getDummyPlan(courseCode);
    }

    try {
        // Extract text from exams
        let aggregatedExamContent = '';

        // Limit to 7 exams to manage latency and token usage
        const examsToProcess = examData.slice(0, 7);

        for (const exam of examsToProcess) {
            try {
                // Construct absolute path
                const absolutePath = path.join(process.cwd(), exam.filePath);

                // Check if file exists
                await fs.access(absolutePath);

                const dataBuffer = await fs.readFile(absolutePath);
                const text = await parsePdfBuffer(dataBuffer);

                // Clean text slightly
                const cleanText = text.replace(/\s+/g, ' ').slice(0, 15000);

                aggregatedExamContent += `\n\n--- EXAM CONTENT (${exam.year} - ${exam.type}) ---\n${cleanText}`;
            } catch (err) {
                console.warn(`Failed to read exam file: ${exam.filePath}`, err);
                // Continue to next exam
            }
        }

        const topicsContext = topicsList.length > 0
            ? `The course syllabus covers these topics: ${topicsList.join(', ')}.`
            : '';

        const contextMessage = aggregatedExamContent.length > 500
            ? `I have analyzed the following text extracted from past exams for this course:\n${aggregatedExamContent}`
            : `(No exam files were successfully read. Relying on course code and syllabus topics.)`;

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 3000,
            temperature: 0.4,
            system: "You are an expert university tutor. Your goal is to analyze real exam content to identify patterns, recurring question types, and critical topics to pass.",
            messages: [
                {
                    role: "user",
                    content: `Create a detailed study plan for the course ${courseCode} - ${courseName}.
${topicsContext}

${contextMessage}

Based strictly on the content provided (if available) and your general knowledge of this course:
1. Identify the most critical areas that appear frequently in the provided exams.
2. If exams are provided, cite specific examples (e.g. "Q1 is always about...").
3. Rank topics by importance (1-10) where 10 is "Review this or fail".

Provide the output as a strictly valid JSON object with the following structure:
{
  "areas": [
    { 
      "name": "Topic Name", 
      "importance": 10, 
      "reasoning": "Detailed explanation based on analysis. Cite specific exam questions if visible.",
      "recommended_focus": "High/Medium/Low"
    }
  ],
  "study_schedule": [
    {
      "week": 1,
      "focus": "Topic X",
      "activity": "Specific practice recommendations"
    }
  ],
  "strategy": "A comprehensive strategy paragraph explaining how to approach the exam based on the identified patterns."
}

Do not include markdown formatting. Just the raw JSON string.`
                }
            ]
        });

        const content = message.content[0].type === 'text' ? message.content[0].text : '';

        try {
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}') + 1;
            if (jsonStart !== -1 && jsonEnd !== -1) {
                return JSON.parse(content.slice(jsonStart, jsonEnd));
            }
            return JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse AI response JSON", content);
            return getDummyPlan(courseCode);
        }

    } catch (error) {
        console.error('AI Study Plan Error:', error);
        return getDummyPlan(courseCode);
    }
}

function getDummyPlan(courseCode: string) {
    return {
        areas: [
            { name: "Core Concepts", importance: 10, reasoning: "Fundamental for all questions (Simulated due to error)", recommended_focus: "High" },
            { name: "Advanced Applications", importance: 8, reasoning: "Differentiation from lower grades", recommended_focus: "Medium" },
            { name: "Theory & Definitions", importance: 6, reasoning: "Easy points if memorized", recommended_focus: "Low" }
        ],
        study_schedule: [
            { week: 1, focus: "Core Concepts", activity: "Review lectures 1-5" },
            { week: 2, focus: "Advanced Applications", activity: "Solve 2023 exam" }
        ],
        strategy: "Focus on understanding the basics before attempting complex problems."
    };
}
