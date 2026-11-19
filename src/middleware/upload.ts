import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { HttpError } from '../utils/httpError';

export const ALLOWED_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
};

const TMP_DIR = path.resolve('uploads', '.tmp');

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        fs.mkdirSync(TMP_DIR, { recursive: true });
        cb(null, TMP_DIR);
    },
    // Filename user kudukkura name ah use panna maatom, mime la irundhu extension edukkurom
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}.${ALLOWED_MIME[file.mimetype]}`),
});

export const uploadMedia = multer({
    storage,
    limits: { files: 5, fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME[file.mimetype]) return cb(null, true);
        cb(new HttpError(400, 'Only JPEG, PNG, WebP images and MP4 videos are allowed'));
    },
}).array('files', 5);