import fs from 'fs';
import path from 'path';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client } from '../config/aws';
import { env } from '../config/env';

/** Temp file ah permanent storage la save panni public URL return pannum. Temp file delete aagum. */
export async function saveFile(localPath: string, key: string, contentType: string): Promise<string> {
    if (env.storage.driver === 's3') {
        await new Upload({
            client: s3Client(),
            params: {
                Bucket: env.storage.bucket,
                Key: key,
                Body: fs.createReadStream(localPath),
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000, immutable',
            },
        }).done();
        await fs.promises.unlink(localPath).catch(() => undefined);
    } else {
        const dest = path.resolve(key);
        await fs.promises.mkdir(path.dirname(dest), { recursive: true });
        await fs.promises.copyFile(localPath, dest);
        await fs.promises.unlink(localPath).catch(() => undefined);
    }
    const base = env.storage.mediaBaseUrl || env.publicBaseUrl;
    return `${base}/${key}`;
}