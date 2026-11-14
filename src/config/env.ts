import 'dotenv/config';
import { EnvError, loadEnv } from './env.schema';

function load() {
    try {
        return loadEnv(process.env);
    } catch (err) {
        if (err instanceof EnvError) {
            console.error(`\n${err.message}\n\nFix your .env (see .env.example) and start again.\n`);
            process.exit(1);
        }
        throw err;
    }
}

export const env = load();
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';