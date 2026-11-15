import type { FaceAnalysis, FaceProvider } from './face.provider';

export type MockScenario = 'pass' | 'no_face' | 'two_faces' | 'low_confidence' | 'female';

const RESULTS: Record<MockScenario, FaceAnalysis> = {
  pass: { facesDetected: 1, confidence: 0.96, gender: 'male' },
  no_face: { facesDetected: 0, confidence: 0, gender: null },
  two_faces: { facesDetected: 2, confidence: 0.95, gender: 'male' },
  low_confidence: { facesDetected: 1, confidence: 0.6, gender: 'male' },
  female: { facesDetected: 1, confidence: 0.97, gender: 'female' },
};

/**
 * LOCAL DEVELOPMENT ONLY. It does NOT look at the image: it just returns the scenario you chose
 * with MOCK_FACE_SCENARIO. Production refuses to start with FACE_PROVIDER=mock.
 */
export function createMockFaceProvider(scenario: MockScenario): FaceProvider {
  return { analyze: async () => RESULTS[scenario] };
} 