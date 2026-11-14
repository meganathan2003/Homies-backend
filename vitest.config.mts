import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        env: {
            NODE_ENV: 'test',
            JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
            MONGODB_URI: 'mongodb://127.0.0.1:27017/homies-test',
            CORS_ORIGINS: 'http://localhost:3000',
        },
    },
});