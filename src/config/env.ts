import "dotenv/config";

const str = (key: string, fallback = ''): string => (process.env[key] ?? fallback).trim();
const bool = (key: string, fallback = false): boolean =>
    process.env[key] ? process.env[key]!.trim().toLowerCase() === 'true' : fallback;

const nodeEnv = str('NODE_ENV', 'development');
const port = Number(str('PORT', '4000'));

export const env = {
    nodeEnv,
    isProd: nodeEnv === 'production',
    port,
    trustProxy: bool('TRUST_PROXY'),
    publicBaseUrl: str('PUBLIC_BASE_URL', `http://localhost:${port}`).replace(/\/$/, ''),
    corsOrigins: str('CORS_ORIGINS', '*').split(',').map((s) => s.trim()).filter(Boolean),
    mongoUri: str('MONGODB_URI'),
    jwtSecret: str('JWT_SECRET'),
    jwtExpiresIn: str('JWT_EXPIRES_IN', '7d'),
    adminEmails: str('ADMIN_EMAILS').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
    devAuthBypass: bool('DEV_AUTH_BYPASS'),
    firebase: {
        projectId: str('FIREBASE_PROJECT_ID'),
        clientEmail: str('FIREBASE_CLIENT_EMAIL'),
        privateKey: str('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    },
    razorpay: {
        keyId: str('RAZORPAY_KEY_ID'),
        keySecret: str('RAZORPAY_KEY_SECRET'),
        webhookSecret: str('RAZORPAY_WEBHOOK_SECRET'),
        mode: (str('RAZORPAY_MODE', 'live') === 'mock' ? 'mock' : 'live') as 'mock' | 'live',
    },
    storage: {
        driver: (str('STORAGE_DRIVER', 'local') === 's3' ? 's3' : 'local') as 'local' | 's3',
        bucket: str('S3_BUCKET'),
        region: str('S3_REGION', 'auto'),
        endpoint: str('S3_ENDPOINT'),
        accessKeyId: str('S3_ACCESS_KEY_ID'),
        secretAccessKey: str('S3_SECRET_ACCESS_KEY'),
        mediaBaseUrl: str('MEDIA_BASE_URL').replace(/\/$/, ''),
    },
    face: {
        region: str('AWS_REGION', 'ap-south-1'),
        accessKeyId: str('AWS_ACCESS_KEY_ID'),
        secretAccessKey: str('AWS_SECRET_ACCESS_KEY'),
        minConfidence: Number(str('FACE_MIN_CONFIDENCE', '0.75')),
        requireMale: bool('FACE_REQUIRE_MALE', true),
    },
};

export function validateEnv(): void {
    if (!env.mongoUri) throw new Error('MONGODB_URI is required');
    if (env.jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters'); 4

    if (env.isProd) {
        const rz = env.razorpay;
        if (rz.mode === 'mock') throw new Error('RAZORPAY_MODE=mock is not allowed in production');
        if (!(rz.keyId && rz.keySecret && rz.webhookSecret)) {
            throw new Error('RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET are required in production');
        }
    }
    if (env.isProd && env.devAuthBypass) throw new Error('DEV_AUTH_BYPASS must be false in production');
    if (env.isProd && env.storage.driver !== 's3') throw new Error('STORAGE_DRIVER must be s3 in production');
    const st = env.storage;
    if (st.driver === 's3' && !(st.bucket && st.accessKeyId && st.secretAccessKey && st.mediaBaseUrl)) {
        throw new Error('S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and MEDIA_BASE_URL are required for s3 storage');
    }
}