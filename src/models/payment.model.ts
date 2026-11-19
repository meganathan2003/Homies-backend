import { Schema, model } from 'mongoose';

export type PaymentStatus = 'created' | 'paid' | 'failed';

export interface IPayment {
    id: string;
    userId: string;
    purpose: 'wallet_topup';
    amount: number; // paise
    currency: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: PaymentStatus;
    failureReason?: string;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        id: { type: String, required: true, unique: true },
        userId: { type: String, required: true, index: true },
        purpose: { type: String, enum: ['wallet_topup'], required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        razorpayOrderId: { type: String, required: true, unique: true },
        razorpayPaymentId: String,
        razorpaySignature: String,
        status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },
        failureReason: String,
        paidAt: Date,
    },
    { timestamps: true },
);

export const Payment = model<IPayment>('Payment', paymentSchema);