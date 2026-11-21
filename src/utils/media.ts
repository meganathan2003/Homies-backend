import { env } from '../config/env';

/** Namma upload API la vandha URL mattum accept pannum (vera site link, malicious link thadukka). */
export function isOwnedMediaUrl(uri: string): boolean {
    const base = (env.storage.mediaBaseUrl || env.publicBaseUrl) + '/uploads/';
    return uri.startsWith(base);
}