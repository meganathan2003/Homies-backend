import { badRequest } from '../../utils/errors';
import { env } from '../../config/env';
import { getStorageProvider } from '../../services/storage';
import { MediaModel } from '../../models/media.model';
import type { UploadedFile } from '../../services/storage/storage.provider';

const MIN_FILES = 1;
const MAX_FILES = 5;

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm',
]);

export interface IncomingFile {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size: number; // bytes
}

export async function uploadMultiple(
    files: IncomingFile[],
    uploadedBy: string,
): Promise<UploadedFile[]> {
    // --- validation ---
    if (!files || files.length < MIN_FILES) {
        throw badRequest(`At least ${MIN_FILES} file is required.`);
    }
    if (files.length > MAX_FILES) {
        throw badRequest(`You can upload at most ${MAX_FILES} files at once.`);
    }

    const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

    for (const file of files) {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw badRequest(
                `Unsupported file type "${file.mimetype}". Allowed: images (jpeg, png, gif, webp) and videos (mp4, mov, webm).`,
            );
        }
        if (file.size > maxBytes) {
            throw badRequest(
                `File "${file.originalname}" exceeds the ${env.MAX_UPLOAD_MB} MB limit.`,
            );
        }
    }

    // --- save each file through the storage adapter ---
    const provider = getStorageProvider();
    const results: UploadedFile[] = [];

    for (const file of files) {
        const saved = await provider.save(file.buffer, file.originalname, file.mimetype);
        results.push(saved);

        // Persist record in DB for future admin/cleanup use
        await MediaModel.create({
            uploadedBy,
            url: saved.url,
            filename: saved.filename,
            mimetype: saved.mimetype,
            size: saved.size,
        });
    }

    return results;
}
