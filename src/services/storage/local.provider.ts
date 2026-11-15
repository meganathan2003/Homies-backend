import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { env } from '../../config/env';
import type { StorageProvider, UploadedFile } from './storage.provider';

export class LocalStorageProvider implements StorageProvider {
    private readonly uploadDir: string;

    constructor() {
        this.uploadDir = path.resolve(env.UPLOAD_DIR);
    }

    async save(buffer: Buffer, originalName: string, mimetype: string): Promise<UploadedFile> {
        // Ensure upload directory exists
        await fs.mkdir(this.uploadDir, { recursive: true });

        const ext = path.extname(originalName) || this.extFromMime(mimetype);
        const filename = `${nanoid()}}${ext}`;
        const filePath = path.join(this.uploadDir, filename);

        await fs.writeFile(filePath, buffer);

        return {
            url: `${env.PUBLIC_BASE_URL}/uploads/${filename}`,
            mimetype,
            filename,
            size: buffer.length,
        };
    }

    private extFromMime(mime: string): string {
        const map: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'video/mp4': '.mp4',
            'video/quicktime': '.mov',
            'video/webm': '.webm',
        };
        return map[mime] ?? '';
    }
}
