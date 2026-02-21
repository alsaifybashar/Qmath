import { db } from '../db/drizzle';
import { courses, exams, universities } from '../db/schema';
import fs from 'fs';
import path from 'path';

async function restore() {
    let liuId = "liu-id-fallback";
    // Tries to find Linköping
    const existing = await db.query.universities.findFirst({
        where: (u, { like }) => like(u.name, '%Linköping%')
    });
    if (existing) {
        liuId = existing.id;
    } else {
        const [inserted] = await db.insert(universities).values({
            name: 'Linköping University',
            country: 'Sweden'
        }).returning();
        liuId = inserted.id;
    }

    const baseDir = path.join(process.cwd(), 'uploads', 'exams');
    const courseDirs = fs.readdirSync(baseDir);

    for (const code of courseDirs) {
        if (!['TATA24', 'TATA41', 'TSRT19'].includes(code)) continue;

        const coursePath = path.join(baseDir, code);
        const stats = fs.statSync(coursePath);
        if (!stats.isDirectory()) continue;

        // Ensure course exists
        const existingCourse = await db.query.courses.findFirst({
            where: (c, { eq }) => eq(c.code, code)
        });

        if (!existingCourse) {
            await db.insert(courses).values({
                code: code,
                name: code + ' Recovered Course',
                universityId: liuId
            });
        }

        const files = fs.readdirSync(coursePath);
        for (const file of files) {
            if (!file.endsWith('.pdf')) continue;

            const filePath = `/uploads/exams/${code}/${file}`;

            // Check if exam exists
            const existingExam = await db.query.exams.findFirst({
                where: (e, { eq }) => eq(e.filePath, filePath)
            });

            if (!existingExam) {
                await db.insert(exams).values({
                    courseCode: code,
                    courseName: code + ' Recovered Course',
                    examDate: new Date(),
                    examType: 'TEN1',
                    fileName: file,
                    filePath: filePath,
                    fileSize: fs.statSync(path.join(coursePath, file)).size
                });
                console.log(`Restored exam: ${filePath}`);
            }
        }
    }
    console.log('Restoration complete.');
}

restore().catch(console.error);
