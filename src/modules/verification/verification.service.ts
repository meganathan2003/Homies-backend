import { UserModel, type UserDoc } from '../../models/user.model';
import { getFaceProvider } from '../../services/face';
import type { FaceAnalysis } from '../../services/face/face.provider';
import { AppError, badRequest, forbidden, unavailable } from '../../utils/errors';
import { logger } from '../../utils/logger';

/** Homies is a men-only community. These are the rules a selfie must pass (same as the Android app). */
export const FACE_RULES = {
    requiredFaces: 1,
    minConfidence: 0.75, // must be ABOVE this, exactly 0.75 is not enough
    allowedGender: 'male',
} as const;

const normalizeGender = (g: string | null) => g?.trim().toLowerCase() ?? null;

/** Pure function (no DB, no network), so the rules are easy to read and to test. */
export function judge(a: FaceAnalysis): { verified: boolean; message: string | null } {
    if (a.facesDetected !== FACE_RULES.requiredFaces) {
        return { verified: false, message: `Expected ${FACE_RULES.requiredFaces} face, but detected ${a.facesDetected}.` };
    }
    if (a.confidence <= FACE_RULES.minConfidence) {
        return { verified: false, message: `Low confidence score (${Math.round(a.confidence * 100)}%). Please try again.` };
    }
    // Anything that is not clearly "male" (female, unknown, empty, missing) is rejected.
    if (normalizeGender(a.gender) !== FACE_RULES.allowedGender) {
        return { verified: false, message: 'Only male users are permitted.' };
    }
    return { verified: true, message: null };
}

export async function verifyFace(user: UserDoc, image: Buffer) {
    const provider = getFaceProvider();

    let analysis: FaceAnalysis;
    try {
        analysis = await provider.analyze(image); // the picture exists only in memory, it is never saved or logged
    } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error('Face provider failed', { reason: err instanceof Error ? err.message : String(err) });
        throw unavailable('Face verification is temporarily unavailable. Please try again.');
    }

    const { verified, message } = judge(analysis);
    // The SERVER decides and records the result. A failed retry never removes an earlier success.
    if (verified && !user.isImageVerified) {

        const result = await UserModel.updateOne({ _id: user.id }, { $set: { isImageVerified: true } });

        if (result.matchedCount === 0) {
            throw new Error('User not found during verification update');
        }
    }

    return {
        faces_detected: analysis.facesDetected, // snake_case: that is the key the app reads
        confidence: Math.round(analysis.confidence * 100) / 100,
        gender: analysis.gender ?? 'unknown',
        verified,
        message,
    };
}
