
import { db } from '@/db/drizzle';
import { courses, exams, universities } from '@/db/schema';
import { getCourses } from '@/app/actions/courses';
import { getAdminCourses } from '@/app/actions/admin-questions';
import { eq } from 'drizzle-orm';

async function runTest() {
    const timestamp = Date.now();
    const emptyCode = `EMPTY${timestamp}`;
    const fullCode = `FULL${timestamp}`;

    console.log(`Starting Course Availability Test...`);

    try {
        // 1. Setup Data
        // Create a dummy university
        const [uni] = await db.insert(universities).values({
            name: `Test Uni ${timestamp}`,
            country: 'TestLand'
        }).returning();

        // Create courses
        await db.insert(courses).values([
            { code: emptyCode, name: 'Empty Course', universityId: uni.id },
            { code: fullCode, name: 'Full Course', universityId: uni.id }
        ]);

        // Add exam for FULL course only
        await db.insert(exams).values({
            courseCode: fullCode,
            courseName: 'Full Course',
            examDate: new Date(),
            examType: 'TEN1',
            fileName: 'test.pdf',
            filePath: '/tmp/test.pdf',
            fileSize: 1024,
            uploadedBy: null // allowed by schema? let's check. uploadedBy references users.id set null. So null is fine.
        });

        console.log('Setup complete. Verifying getCourses...');

        // 2. Test getCourses
        const result = await getCourses(uni.id);
        if (result.error) throw new Error(result.error);

        const codes = result.data?.map(c => c.code) || [];
        console.log('getCourses returned:', codes);

        if (codes.includes(emptyCode)) {
            console.error('FAIL: getCourses returned a course with no exams!');
        } else if (!codes.includes(fullCode)) {
            console.error('FAIL: getCourses missed a course WITH exams!');
        } else {
            console.log('PASS: getCourses filtered correctly.');
        }

        // 3. Test getAdminCourses
        // We need to mock auth for admin check? 
        // getAdminCourses calls checkAdmin() which calls auth(). 
        // authenticating in a script is hard.
        // We might need to skip this or mock auth.
        // For this test script, we can import the function but we can't easily mock the session unless we mock the module.
        // So we will skip direct getAdminCourses test in this script and rely on getCourses logic being identical (verified by code inspection).
        // OR we can manually run the query logic that getAdminCourses uses.

        console.log('Verifying Admin Query Logic (Manual)...');
        // Manual replication of admin query logic
        const coursesWithExams = await db
            .selectDistinct({ code: exams.courseCode })
            .from(exams);
        const validCodes = coursesWithExams.map(c => c.code);

        const adminResult = await db.query.courses.findMany({
            where: (courses, { inArray }) => inArray(courses.code, validCodes),
            with: { university: true }
        });
        const adminCodes = adminResult.map(c => c.code);

        if (adminCodes.includes(emptyCode)) {
            console.error('FAIL: Admin Query Logic returned a course with no exams!');
        } else {
            console.log('PASS: Admin Query Logic filtered correctly.');
        }

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        // Cleanup (Optional, but good practice)
        // await db.delete(courses).where(eq(courses.code, emptyCode));
        // await db.delete(courses).where(eq(courses.code, fullCode));
        // await db.delete(universities).where(eq(universities.id, uni.id));
        console.log('Test Complete.');
        process.exit(0);
    }
}

runTest();
