import { db } from '../db/drizzle';
import { courses, exams, universities } from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Known course names for LiU courses
const COURSE_NAMES: Record<string, string> = {
    'TATA24': 'Linjär algebra',
    'TATA41': 'Envariabelanalys 1',
    'TSRT19': 'Reglerteknik',
};

async function restore() {
    // 1. Clear all stale exam entries
    await db.delete(exams);
    console.log('Cleared old exam entries.');

    // 2. Ensure Linköping University exists
    let liuId = 'liu-id-fallback';
    const existingUni = await db.query.universities.findFirst({
        where: (u, { like }) => like(u.name, '%Linköping%'),
    });
    if (existingUni) {
        liuId = existingUni.id;
    } else {
        const [inserted] = await db.insert(universities).values({
            name: 'Linköping University',
            country: 'Sweden',
        }).returning();
        liuId = inserted.id;
        console.log('Created Linköping University entry.');
    }

    const baseDir = path.join(process.cwd(), 'uploads', 'exams');

    if (!fs.existsSync(baseDir)) {
        console.error(`Upload directory not found: ${baseDir}`);
        process.exit(1);
    }

    const courseDirs = fs.readdirSync(baseDir);
    let total = 0;

    for (const code of courseDirs) {
        const coursePath = path.join(baseDir, code);
        if (!fs.statSync(coursePath).isDirectory()) continue;

        const courseName = COURSE_NAMES[code] ?? code;

        // 3. Ensure course entry exists
        const existingCourse = await db.query.courses.findFirst({
            where: (c, { eq }) => eq(c.code, code),
        });
        if (!existingCourse) {
            await db.insert(courses).values({
                code,
                name: courseName,
                universityId: liuId,
            });
            console.log(`  Created course: ${code} (${courseName})`);
        }

        // 4. Get all PDF files and pair exams with solutions
        const allFiles = fs.readdirSync(coursePath).filter(f => f.endsWith('.pdf'));

        // Only process main exam files (not solution files)
        const examFiles = allFiles.filter(f => !f.endsWith('_solution.pdf'));

        for (const file of examFiles) {
            // Parse filename: TEN1_2022-03-15.pdf
            const match = file.match(/^([A-Z0-9]+)_(\d{4}-\d{2}-\d{2})\.pdf$/);
            if (!match) {
                console.warn(`  Skipping unrecognized filename: ${code}/${file}`);
                continue;
            }

            const [, examType, dateStr] = match;
            // Use noon UTC to avoid timezone edge cases
            const examDate = new Date(`${dateStr}T12:00:00Z`);

            // Check for paired solution file
            const solutionFileName = `${examType}_${dateStr}_solution.pdf`;
            const hasSolution = allFiles.includes(solutionFileName);

            // Use relative paths (no leading slash) — this is what existsSync() expects at CWD
            const examRelPath = path.join('uploads', 'exams', code, file);
            const solutionRelPath = hasSolution
                ? path.join('uploads', 'exams', code, solutionFileName)
                : null;

            await db.insert(exams).values({
                courseCode: code,
                courseName,
                examDate,
                examType,
                fileName: file,
                filePath: examRelPath,
                fileSize: fs.statSync(path.join(coursePath, file)).size,
                hasSolution,
                solutionFileName: hasSolution ? solutionFileName : null,
                solutionFilePath: solutionRelPath,
                solutionFileSize:
                    hasSolution && solutionRelPath
                        ? fs.statSync(path.join(coursePath, solutionFileName)).size
                        : null,
            });

            const label = `${code} ${examType} ${dateStr}${hasSolution ? ' + lösning' : ''}`;
            console.log(`  ✓ ${label}`);
            total++;
        }
    }

    console.log(`\nRestoration complete! Imported ${total} exams.`);
}

restore().catch(err => {
    console.error('Restore failed:', err);
    process.exit(1);
});
