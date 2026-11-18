import { readFileSync } from 'node:fs';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from '../config/env';


/** Created on first use (lazy), so the server can start even before Firebase is needed. */
function getFirebaseApp(): App {
    const existing = getApps()[0];
    if (existing) return existing;


    if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccount = JSON.parse(readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
        return initializeApp({ credential: cert(serviceAccount), projectId: env.FIREBASE_PROJECT_ID });

    }

    return initializeApp({ projectId: env.FIREBASE_PROJECT_ID });

};


// check the expired token 
export function verifyFirebaseIdToken(idToken: string) {
    return getAuth(getFirebaseApp()).verifyIdToken(idToken);
}