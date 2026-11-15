import type { StorageProvider } from './storage.provider';
import { LocalStorageProvider } from './local.provider';

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
    if (!instance) {
        // Adapter pattern: swap to S3Provider or R2Provider here later without touching any other file.
        instance = new LocalStorageProvider();
    }
    return instance;
}
