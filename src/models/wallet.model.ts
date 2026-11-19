import { Schema, model } from 'mongoose';

export interface IWallet {
    userId: string;
    balance: number; // paise (integer). Rs 1 = 100 paise
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
    {
        userId: { type: String, required: true, unique: true },
        balance: { type: Number, required: true, default: 0, min: 0 },
        currency: { type: String, default: 'INR' },
    },
    { timestamps: true },
);

export const Wallet = model<IWallet>('Wallet', walletSchema);