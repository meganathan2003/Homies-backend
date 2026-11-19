import Razorpay from 'razorpay';
import { env } from './env';

let client: Razorpay | undefined;

export function razorpayClient(): Razorpay {
    client ??= new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
    return client;
}