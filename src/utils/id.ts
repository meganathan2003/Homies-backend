import crypto from 'crypto';

export const newId = (prefix: string): string =>
    `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 18)}`;
export const newHomieCode = (): string => `HOM-${crypto.randomInt(10000, 99999)}`;