import { z } from 'zod';

const flag = z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true');

const schema = z
    .object({
        NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
        PORT: z.coerce.number().int().min(1).max(65535).default(4000),
        PUBLIC_BASE_URL: z.url().default('http://localhost:4000'),
        CORS_ORIGINS: z.string().default(''),

        MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/homies'),

        JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
        JWT_EXPIRES_IN: z.string().min(1).default('7d'),
        // GOOGLE_WEB_CLIENT_ID: z.string().default(''),
        FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
        FIREBASE_SERVICE_ACCOUNT_PATH: z.string().default(''),
        ALLOW_UNVERIFIED_GOOGLE_LOGIN: flag,

        FACE_PROVIDER: z.enum(['mock', 'aws']).default('mock'),
        // Only used by the mock provider (development): which result it pretends to get.
        MOCK_FACE_SCENARIO: z.enum(['pass', 'no_face', 'two_faces', 'low_confidence', 'female']).default('pass'),

        UPLOAD_DIR: z.string().min(1).default('./uploads'),
        MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(500).default(50),

        CONVERSATION_AUTO_COMPLETE_HOURS: z.coerce.number().int().min(1).max(720).default(24),
    })
    .superRefine((e, ctx) => {
        if (e.NODE_ENV !== 'production') return;
        if (e.ALLOW_UNVERIFIED_GOOGLE_LOGIN) {
            ctx.addIssue({
                code: 'custom',
                path: ['ALLOW_UNVERIFIED_GOOGLE_LOGIN'],
                message: 'must be false in production (it allows email impersonation)',
            });
        }
        if (e.FACE_PROVIDER === 'mock') {
            ctx.addIssue({
                code: 'custom',
                path: ['FACE_PROVIDER'],
                message: 'mock provider is not allowed in production',
            });
        }
        if (!e.FIREBASE_PROJECT_ID) {
            ctx.addIssue({
                code: 'custom',
                path: ['FIREBASE_PROJECT_ID'],
                message: 'is required in production',
            });
        }
    });

export type Env = Omit<z.infer<typeof schema>, 'CORS_ORIGINS'> & { CORS_ORIGINS: string[] };

export class EnvError extends Error {
    constructor(public readonly problems: string[]) {
        super(`Invalid environment configuration:\n - ${problems.join('\n - ')}`);
        this.name = 'EnvError';
    }
}

/** Pure parser, no side effects, so it can be unit tested. */
export function loadEnv(source: Record<string, string | undefined>): Env {
    const result = schema.safeParse(source);
    if (!result.success) {
        throw new EnvError(
            result.error.issues.map((i) => `${i.path.join('.') || 'env'}: ${i.message}`),
        );
    }
    const data = result.data;
    return {
        ...data,
        CORS_ORIGINS: data.CORS_ORIGINS.split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    };
}