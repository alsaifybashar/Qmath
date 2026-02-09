import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../drizzle';
import { exams, users } from '../schema';
import { eq } from 'drizzle-orm';

async function seedExams() {
    try {
        console.log('📚 Seeding sample exams...');

        // Get admin user to set as uploader
        const adminUser = await db.query.users.findFirst({
            where: eq(users.email, 'admin@qmath.se'),
        });

        if (!adminUser) {
            console.error('❌ Admin user not found. Run db:seed:admin first.');
            process.exit(1);
        }

        const sampleExams = [
            {
                courseCode: 'TATA24',
                courseName: 'Linjär Algebra',
                examDate: new Date('2026-01-17'),
                examType: 'TEN1',
                fileName: 'TEN1_2026-01-17.pdf',
                filePath: 'uploads/exams/TATA24/TEN1_2026-01-17.pdf',
                fileSize: 312320,
                hasSolution: true,
                solutionFileName: 'TEN1_2026-01-17_solution.pdf',
                solutionFilePath: 'uploads/exams/TATA24/TEN1_2026-01-17_solution.pdf',
                solutionFileSize: 425000,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'TATA24',
                courseName: 'Linjär Algebra',
                examDate: new Date('2025-08-20'),
                examType: 'TEN1',
                fileName: 'TEN1_2025-08-20.pdf',
                filePath: 'uploads/exams/TATA24/TEN1_2025-08-20.pdf',
                fileSize: 289000,
                hasSolution: true,
                solutionFileName: 'TEN1_2025-08-20_solution.pdf',
                solutionFilePath: 'uploads/exams/TATA24/TEN1_2025-08-20_solution.pdf',
                solutionFileSize: 380000,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'TATA24',
                courseName: 'Linjär Algebra',
                examDate: new Date('2025-01-15'),
                examType: 'TEN1',
                fileName: 'TEN1_2025-01-15.pdf',
                filePath: 'uploads/exams/TATA24/TEN1_2025-01-15.pdf',
                fileSize: 305000,
                hasSolution: false,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'TATA24',
                courseName: 'Linjär Algebra',
                examDate: new Date('2024-06-10'),
                examType: 'TEN1',
                fileName: 'TEN1_2024-06-10.pdf',
                filePath: 'uploads/exams/TATA24/TEN1_2024-06-10.pdf',
                fileSize: 295000,
                hasSolution: true,
                solutionFileName: 'TEN1_2024-06-10_solution.pdf',
                solutionFilePath: 'uploads/exams/TATA24/TEN1_2024-06-10_solution.pdf',
                solutionFileSize: 420000,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'SF1672',
                courseName: 'Linear Algebra',
                examDate: new Date('2024-01-15'),
                examType: 'TEN1',
                fileName: 'TEN1_2024-01-15.pdf',
                filePath: 'uploads/exams/SF1672/TEN1_2024-01-15.pdf',
                fileSize: 245760,
                hasSolution: true,
                solutionFileName: 'TEN1_2024-01-15_solution.pdf',
                solutionFilePath: 'uploads/exams/SF1672/TEN1_2024-01-15_solution.pdf',
                solutionFileSize: 320000,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'SF1672',
                courseName: 'Linear Algebra',
                examDate: new Date('2023-08-25'),
                examType: 'TEN1',
                fileName: 'TEN1_2023-08-25.pdf',
                filePath: 'uploads/exams/SF1672/TEN1_2023-08-25.pdf',
                fileSize: 189440,
                hasSolution: false,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'SF1625',
                courseName: 'Calculus I',
                examDate: new Date('2023-12-15'),
                examType: 'TEN1',
                fileName: 'TEN1_2023-12-15.pdf',
                filePath: 'uploads/exams/SF1625/TEN1_2023-12-15.pdf',
                fileSize: 278528,
                hasSolution: true,
                solutionFileName: 'TEN1_2023-12-15_solution.pdf',
                solutionFilePath: 'uploads/exams/SF1625/TEN1_2023-12-15_solution.pdf',
                solutionFileSize: 350000,
                uploadedBy: adminUser.id,
            },
        ];

        for (const exam of sampleExams) {
            await db.insert(exams).values(exam);
            console.log(`   ✓ Added ${exam.courseCode} - ${exam.examType} (${exam.examDate.toLocaleDateString()})${exam.hasSolution ? ' [with solution]' : ''}`);
        }

        console.log(`\n✨ Seeded ${sampleExams.length} sample exams!\n`);
    } catch (error) {
        console.error('❌ Error seeding exams:', error);
        process.exit(1);
    }
}

seedExams();
