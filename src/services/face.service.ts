import { DetectFacesCommand } from '@aws-sdk/client-rekognition';
import { rekognitionClient } from '../config/aws';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';


export type FaceResult = {
  faces_detected: number;
  confidence: number;
  gender: string;
  verified: boolean;
  message: string | null;
};

function decodeImage(image: string): Buffer {
  const b64 = image.replace(/^data:image\/\w+;base64,/, '');
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 1000 || buf.length > 5 * 1024 * 1024) throw new HttpError(400, 'Image must be between 1 KB and 5 MB');
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  if (!isJpeg && !isPng) throw new HttpError(400, 'Image must be JPEG or PNG');
  return buf;
}

function judge(facesDetected: number, confidence: number, gender: string): FaceResult {
  let message: string | null = null;
  if (facesDetected !== 1) message = `Expected 1 face, but detected ${facesDetected}.`;
  else if (!(confidence > env.face.minConfidence)) message = 'Low confidence score. Please try again.';
  else if (env.face.requireMale && gender !== 'male') message = 'Only male users are permitted.';
  return { faces_detected: facesDetected, confidence, gender, verified: message === null, message };
}

/** Selfie memory la mattum process aagum, store panna maatom. */
export async function analyze(image: string): Promise<FaceResult> {
  // Dev only stub: "dev:male", "dev:female", "dev:2faces", "dev:noface"
  if (env.devAuthBypass && !env.isProd && image.startsWith('dev:')) {
    const mode = image.slice(4);
    if (mode === 'male') return judge(1, 0.96, 'male');
    if (mode === 'female') return judge(1, 0.96, 'female');
    if (mode === '2faces') return judge(2, 0.96, 'male');
    return judge(0, 0, 'unknown');
  }

  const bytes = decodeImage(image);
  try {
    const out = await rekognitionClient().send(new DetectFacesCommand({ Image: { Bytes: bytes }, Attributes: ['ALL'] }));
    const faces = out.FaceDetails ?? [];
    const first = faces[0];
    return judge(faces.length, (first?.Confidence ?? 0) / 100, (first?.Gender?.Value ?? 'unknown').toLowerCase());
  } catch (err) {
    if ((err as Error).name === 'InvalidImageFormatException') throw new HttpError(400, 'Invalid image');
    console.error('Face provider error:', (err as Error).name);
    throw new HttpError(503, 'Face verification is temporarily unavailable');
  }
}


