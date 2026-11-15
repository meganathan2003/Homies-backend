import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth';
import { uploadMultipleFiles } from './upload.controller';
import { env } from '../../config/env';
import { rateLimit } from 'express-rate-limit';

// Memory storage: files are held as buffers and passed to the storage adapter.
// The adapter writes them to disk (local) or streams them to S3/R2 — no temp files left behind.
const multerUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 5,
        fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    },
});

/** Stricter rate limit for uploads: 20 uploads per 15 minutes per user. */
const uploadLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Too many upload requests, please try again later.' },
});

export const uploadRouter = Router();

uploadRouter.post(
    '/upload/multiple',
    requireAuth,
    uploadLimiter,
    multerUpload.array('files', 5),
    uploadMultipleFiles,
);
