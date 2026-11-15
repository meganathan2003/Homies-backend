import { z } from 'zod';

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];
const startsWith = (buf: Buffer, magic: number[]) => magic.every((b, i) => buf[i] === b);

// "data:image/jpeg;base64,AAAA..." -> "AAAA...", and tolerate line breaks.
const cleanBase64 = (s: string) => s.replace(/^data:image\/[a-z+.-]+;base64,/i, '').replace(/\s/g, '');

export const verifyImageSchema = z.object({
    image: z
        .string()
        .max(8_000_000, 'image is too large') // about 6 MB of picture
        .transform(cleanBase64)
        .refine((s) => s.length >= 1000 && /^[A-Za-z0-9+/]+={0,2}$/.test(s), 'image must be a base64 encoded picture')
        .transform((s) => Buffer.from(s, 'base64'))
        // Check the first bytes: a text file or a PDF renamed as a selfie is rejected before any analysis.
        .refine((b) => startsWith(b, JPEG) || startsWith(b, PNG), 'image must be a JPEG or PNG'),
});

