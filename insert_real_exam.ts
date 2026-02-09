import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './db/drizzle';
import { exams, users } from './db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function insertRealExam() {
    try {
        console.log('Inserting TATA24 Exam 2024-03-14...');

        // Get admin user
        const adminUser = await db.query.users.findFirst({
            where: eq(users.email, 'admin@qmath.se'),
        });

        if (!adminUser) {
            console.error('Admin user not found.');
            process.exit(1);
        }

        const examFile = 'uploads/exams/TATA24/TEN1_2024-03-14.pdf';
        const solutionFile = 'uploads/exams/TATA24/TEN1_2024-03-14_solution.pdf';

        const examSize = fs.statSync(examFile).size;
        const solutionSize = fs.statSync(solutionFile).size;

        await db.insert(exams).values({
            courseCode: 'TATA24',
            courseName: 'Linjär Algebra',
            examDate: new Date('2024-03-14'),
            examType: 'TEN1',
            fileName: 'TEN1_2024-03-14.pdf',
            filePath: examFile,
            fileSize: examSize,
            hasSolution: true,
            solutionFileName: 'TEN1_2024-03-14_solution.pdf',
            solutionFilePath: solutionFile,
            solutionFileSize: solutionSize,
            uploadedBy: adminUser.id,
        });

        console.log('✅ Exam inserted successfully!');
    } catch (error) {
        console.error('Error inserting exam:', error);
        process.exit(1);
    }
}

insertRealExam();
