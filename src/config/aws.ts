import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

let s3: S3Client | undefined;
let rekognition: RekognitionClient | undefined;

/** AWS S3 and Cloudflare R2 rendukkum work aagum (R2 ku S3_ENDPOINT set pannunga). */
export function s3Client(): S3Client {
    s3 ??= new S3Client({
        region: env.storage.region,
        endpoint: env.storage.endpoint || undefined,
        credentials: { accessKeyId: env.storage.accessKeyId, secretAccessKey: env.storage.secretAccessKey },
    });
    return s3;
}

export function rekognitionClient(): RekognitionClient {
    const { region, accessKeyId, secretAccessKey } = env.face;
    rekognition ??= new RekognitionClient({
        region,
        ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    return rekognition;
}