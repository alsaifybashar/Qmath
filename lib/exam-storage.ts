import { del, get, head, put } from '@vercel/blob';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || './uploads/exams';
export const MAX_EXAM_FILE_SIZE = 50 * 1024 * 1024;
const PDF_CONTENT_TYPE = 'application/pdf';

export interface UploadResult {
    success: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    error?: string;
}

export interface OpenedExamFile {
    body: BodyInit;
    size: number;
    contentType: string;
}

export function isVercelBlobUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname.endsWith('.blob.vercel-storage.com');
    } catch {
        return false;
    }
}

export function resolveStoredExamPath(filePath: string): string {
    if (isVercelBlobUrl(filePath)) throw new Error('A Blob URL is not a local file path');
    const storageRoot = path.resolve(UPLOAD_BASE_DIR);
    const candidate = path.resolve(filePath);
    if (candidate !== storageRoot && !candidate.startsWith(`${storageRoot}${path.sep}`)) {
        throw new Error('Stored exam path escapes the configured storage root');
    }
    return candidate;
}

export function generateExamFileName(
    _courseCode: string,
    examType: string,
    examDate: Date,
    isSolution = false,
): string {
    const dateStr = examDate.toISOString().split('T')[0];
    const sanitizedType = examType.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `${sanitizedType}_${dateStr}${isSolution ? '_solution' : ''}.pdf`;
}

export function getCourseDir(courseCode: string): string {
    const sanitizedCourse = courseCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return path.join(UPLOAD_BASE_DIR, sanitizedCourse);
}

function validatePDFFile(buffer: Buffer, mimeType: string): string | null {
    if (mimeType !== PDF_CONTENT_TYPE) return 'Only PDF files are allowed';
    if (buffer.length > MAX_EXAM_FILE_SIZE) return 'File size exceeds maximum of 50MB';
    if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') return 'Invalid PDF file format';
    return null;
}

async function uploadPDF(
    buffer: Buffer,
    mimeType: string,
    courseCode: string,
    examType: string,
    examDate: Date,
    isSolution: boolean,
): Promise<UploadResult> {
    const error = validatePDFFile(buffer, mimeType);
    if (error) return { success: false, error };

    const fileName = generateExamFileName(courseCode, examType, examDate, isSolution);
    try {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            const safeCourse = courseCode.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
            const blob = await put(`exams/${safeCourse}/${fileName}`, buffer, {
                access: 'private',
                addRandomSuffix: true,
                contentType: PDF_CONTENT_TYPE,
            });
            return { success: true, filePath: blob.url, fileName, fileSize: buffer.length };
        }
        if (process.env.NODE_ENV === 'production') {
            return { success: false, error: 'Vercel Blob is not configured' };
        }
        const courseDir = getCourseDir(courseCode);
        await mkdir(courseDir, { recursive: true });
        const filePath = path.join(courseDir, fileName);
        await writeFile(filePath, buffer);
        return { success: true, filePath, fileName, fileSize: buffer.length };
    } catch (uploadError) {
        console.error('PDF storage error:', uploadError);
        return { success: false, error: 'Failed to store PDF' };
    }
}

export function uploadExamPDF(buffer: Buffer, mimeType: string, courseCode: string, examType: string, examDate: Date) {
    return uploadPDF(buffer, mimeType, courseCode, examType, examDate, false);
}

export function uploadSolutionPDF(buffer: Buffer, mimeType: string, courseCode: string, examType: string, examDate: Date) {
    return uploadPDF(buffer, mimeType, courseCode, examType, examDate, true);
}

/** Verify a client-uploaded private Blob before persisting its URL. */
export async function validateUploadedExamBlob(url: string): Promise<{ fileName: string; size: number }> {
    if (!isVercelBlobUrl(url)) throw new Error('Invalid Blob URL');
    const metadata = await head(url);
    if (!metadata.pathname.startsWith('exams/')) throw new Error('Blob is outside the exams namespace');
    if (metadata.contentType !== PDF_CONTENT_TYPE) throw new Error('Blob is not a PDF');
    if (metadata.size <= 0 || metadata.size > MAX_EXAM_FILE_SIZE) throw new Error('Blob size is invalid');

    const opened = await get(url, {
        access: 'private',
        useCache: false,
        headers: { Range: 'bytes=0-4' },
    });
    if (!opened || opened.statusCode !== 200 || !opened.stream) throw new Error('Blob cannot be read');
    const reader = opened.stream.getReader();
    const first = await reader.read();
    await reader.cancel();
    if (!first.value || Buffer.from(first.value).subarray(0, 5).toString('ascii') !== '%PDF-') {
        throw new Error('Blob does not contain a PDF signature');
    }
    return { fileName: path.posix.basename(metadata.pathname), size: metadata.size };
}

export async function openExamFile(filePath: string): Promise<OpenedExamFile | null> {
    if (isVercelBlobUrl(filePath)) {
        const result = await get(filePath, { access: 'private' });
        if (!result || result.statusCode !== 200 || !result.stream) return null;
        return { body: result.stream, size: result.blob.size, contentType: result.blob.contentType };
    }
    const resolved = resolveStoredExamPath(filePath);
    if (!existsSync(resolved)) return null;
    const [body, info] = await Promise.all([readFile(resolved), stat(resolved)]);
    const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
    return { body: arrayBuffer, size: info.size, contentType: PDF_CONTENT_TYPE };
}

export async function readExamFile(filePath: string): Promise<Buffer> {
    const opened = await openExamFile(filePath);
    if (!opened) throw new Error('Exam file not found');
    return Buffer.from(await new Response(opened.body).arrayBuffer());
}

export async function deleteExamFile(filePath: string): Promise<boolean> {
    try {
        if (isVercelBlobUrl(filePath)) {
            await del(filePath);
            return true;
        }
        const resolved = resolveStoredExamPath(filePath);
        if (!existsSync(resolved)) return false;
        await unlink(resolved);
        return true;
    } catch (error) {
        console.error('Delete file error:', error);
        return false;
    }
}

export async function getFileInfo(filePath: string): Promise<{ exists: boolean; size?: number }> {
    try {
        if (isVercelBlobUrl(filePath)) {
            const metadata = await head(filePath);
            return { exists: true, size: metadata.size };
        }
        const resolved = resolveStoredExamPath(filePath);
        if (!existsSync(resolved)) return { exists: false };
        return { exists: true, size: (await stat(resolved)).size };
    } catch {
        return { exists: false };
    }
}

export function getExamFileUrl(examId: string, type: 'exam' | 'solution'): string {
    return `/api/exams/file/${examId}?type=${type}`;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
