import { Schema, model } from 'mongoose';

export type PaymentStatus = 'created' | 'paid' | 'failed';
export type PaymentPurpose = 'wallet_topup' | 'consultation' | 'story_unlock';

export interface IPayment {
    id: string;
    userId: string;
    purpose: PaymentPurpose;
    refId?: string; // consultation na expert user id, story_unlock na post id
    amount: number; // paise
    currency: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: PaymentStatus;
    failureReason?: string;
    paidAt?: Date;
    fulfillStartedAt?: Date; // panam vandhadhukku apuram velai (wallet credit / chat open) start aana neram
    fulfilledAt?: Date; // velai mudinjuduchu
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        id: { type: String, required: true, unique: true },
        userId: { type: String, required: true, index: true },
        purpose: { type: String, enum: ['wallet_topup', 'consultation', 'story_unlock'], required: true },
        refId: String,
        amount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        razorpayOrderId: { type: String, required: true, unique: true },
        razorpayPaymentId: String,
        razorpaySignature: String,
        status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },
        failureReason: String,
        paidAt: Date,
        fulfillStartedAt: Date,
        fulfilledAt: Date,
    },
    { timestamps: true },
);

export const Payment = model<IPayment>('Payment', paymentSchema);