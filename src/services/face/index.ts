import { env } from '../../config/env';
import { unavailable } from '../../utils/errors';
import type { FaceProvider } from './face.provider';
import { createMockFaceProvider } from './mock.provider';

/** The one place that decides which face-analysis backend is used. */
export function getFaceProvider(): FaceProvider {
    if (env.FACE_PROVIDER === 'mock') return createMockFaceProvider(env.MOCK_FACE_SCENARIO);
    // 'aws' adapter comes later. Until then verification is switched off (fails closed, never "passes").
    throw unavailable('Face verification is not available right now');
}