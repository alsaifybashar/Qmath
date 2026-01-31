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
                courseCode: 'SF1672',
                courseName: 'Linear Algebra',
                examDate: new Date('2024-01-15'),
                examType: 'Final',
                fileName: '2024-01-15-final.pdf',
                filePath: 'uploads/exams/SF1672/2024-01-15-final.pdf',
                fileSize: 245760, // ~240 KB
                hasSolution: true,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'SF1672',
                courseName: 'Linear Algebra',
                examDate: new Date('2023-08-25'),
                examType: 'Retake',
                fileName: '2023-08-25-retake.pdf',
                filePath: 'uploads/exams/SF1672/2023-08-25-retake.pdf',
                fileSize: 189440,
                hasSolution: false,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'TATA24',
                courseName: 'Linjär algebra',
                examDate: new Date('2024-01-17'),
                examType: 'Final',
                fileName: '2024-01-17-final.pdf',
                filePath: 'uploads/exams/TATA24/2024-01-17-final.pdf',
                fileSize: 312320,
                hasSolution: true,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'TATA24',
                courseName: 'Linjär algebra',
                examDate: new Date('2023-06-15'),
                examType: 'Midterm',
                fileName: '2023-06-15-midterm.pdf',
                filePath: 'uploads/exams/TATA24/2023-06-15-midterm.pdf',
                fileSize: 156160,
                hasSolution: true,
                uploadedBy: adminUser.id,
            },
            {
                courseCode: 'SF1625',
                courseName: 'Calculus I',
                examDate: new Date('2023-12-15'),
                examType: 'Final',
                fileName: '2023-12-15-final.pdf',
                filePath: 'uploads/exams/SF1625/2023-12-15-final.pdf',
                fileSize: 278528,
                hasSolution: true,
                uploadedBy: adminUser.id,
            },
        ];

        for (const exam of sampleExams) {
            await db.insert(exams).values(exam);
            console.log(`   ✓ Added ${exam.courseCode} - ${exam.examType} (${exam.examDate.toLocaleDateString()})`);
        }

        console.log(`\n✨ Seeded ${sampleExams.length} sample exams!\n`);
    } catch (error) {
        console.error('❌ Error seeding exams:', error);
        process.exit(1);
    }
}

seedExams();
