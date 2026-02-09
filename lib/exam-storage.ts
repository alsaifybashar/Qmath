import { mkdir, writeFile, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * PDF Storage Utility
 * 
 * Handles storage and retrieval of exam and solution PDFs.
 * Uses local filesystem with organized folder structure.
 * 
 * Storage structure:
 * /uploads/exams/
 *   ├── TATA24/
 *   │   ├── TEN1_2024-01-17.pdf
 *   │   └── TEN1_2024-01-17_solution.pdf
 *   └── SF1672/
 *       ├── TEN1_2023-08-15.pdf
 *       └── TEN1_2023-08-15_solution.pdf
 */

// Base upload directory - outside of public for security
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || './uploads/exams';

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['application/pdf'];

export interface UploadResult {
    success: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    error?: string;
}

export interface StorageStats {
    totalFiles: number;
    totalSize: number;
    courses: number;
}

/**
 * Generate a safe filename from exam metadata
 */
export function generateExamFileName(
    courseCode: string,
    examType: string,
    examDate: Date,
    isSolution: boolean = false
): string {
    const dateStr = examDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitizedCourse = courseCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const sanitizedType = examType.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const suffix = isSolution ? '_solution' : '';
    return `${sanitizedType}_${dateStr}${suffix}.pdf`;
}

/**
 * Get the directory path for a course
 */
export function getCourseDir(courseCode: string): string {
    const sanitizedCourse = courseCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return path.join(UPLOAD_BASE_DIR, sanitizedCourse);
}

/**
 * Ensure the course directory exists
 */
async function ensureCourseDir(courseCode: string): Promise<string> {
    const courseDir = getCourseDir(courseCode);
    if (!existsSync(courseDir)) {
        await mkdir(courseDir, { recursive: true });
    }
    return courseDir;
}

/**
 * Validate a PDF file
 */
function validatePDFFile(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return { valid: false, error: 'Only PDF files are allowed' };
    }

    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
        return { valid: false, error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    // Check PDF magic bytes (%PDF-)
    const pdfHeader = buffer.slice(0, 5).toString('ascii');
    if (!pdfHeader.startsWith('%PDF-')) {
        return { valid: false, error: 'Invalid PDF file format' };
    }

    return { valid: true };
}

/**
 * Generate a hash of the file for deduplication
 */
function generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
}

/**
 * Upload an exam PDF
 */
export async function uploadExamPDF(
    buffer: Buffer,
    mimeType: string,
    courseCode: string,
    examType: string,
    examDate: Date
): Promise<UploadResult> {
    try {
        // Validate
        const validation = validatePDFFile(buffer, mimeType);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // Ensure directory exists
        const courseDir = await ensureCourseDir(courseCode);

        // Generate filename
        const fileName = generateExamFileName(courseCode, examType, examDate, false);
        const filePath = path.join(courseDir, fileName);

        // Write file
        await writeFile(filePath, buffer);

        return {
            success: true,
            filePath,
            fileName,
            fileSize: buffer.length,
        };
    } catch (error) {
        console.error('Upload exam PDF error:', error);
        return { success: false, error: 'Failed to upload exam PDF' };
    }
}

/**
 * Upload a solution PDF
 */
export async function uploadSolutionPDF(
    buffer: Buffer,
    mimeType: string,
    courseCode: string,
    examType: string,
    examDate: Date
): Promise<UploadResult> {
    try {
        // Validate
        const validation = validatePDFFile(buffer, mimeType);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // Ensure directory exists
        const courseDir = await ensureCourseDir(courseCode);

        // Generate filename with solution suffix
        const fileName = generateExamFileName(courseCode, examType, examDate, true);
        const filePath = path.join(courseDir, fileName);

        // Write file
        await writeFile(filePath, buffer);

        return {
            success: true,
            filePath,
            fileName,
            fileSize: buffer.length,
        };
    } catch (error) {
        console.error('Upload solution PDF error:', error);
        return { success: false, error: 'Failed to upload solution PDF' };
    }
}

/**
 * Delete an exam file
 */
export async function deleteExamFile(filePath: string): Promise<boolean> {
    try {
        if (existsSync(filePath)) {
            await unlink(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Delete file error:', error);
        return false;
    }
}

/**
 * Get file info
 */
export async function getFileInfo(filePath: string): Promise<{ exists: boolean; size?: number }> {
    try {
        if (!existsSync(filePath)) {
            return { exists: false };
        }
        const stats = await stat(filePath);
        return { exists: true, size: stats.size };
    } catch (error) {
        return { exists: false };
    }
}

/**
 * Get the public URL for a file (for serving)
 */
export function getExamFileUrl(examId: string, type: 'exam' | 'solution'): string {
    return `/api/exams/file/${examId}?type=${type}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
