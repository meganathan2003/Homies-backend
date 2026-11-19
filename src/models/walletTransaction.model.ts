import { Schema, model } from 'mongoose';

export type TxnType = 'credit' | 'debit';
export type TxnReason = 'topup' | 'story_purchase' | 'consultation' | 'subscription' | 'refund' | 'adjustment' | 'consultation_earning';

export interface IWalletTransaction {
    id: string;
    userId: string;
    type: TxnType;
    amount: number; // paise
    balanceAfter: number; // paise
    reason: TxnReason;
    refType?: string;
    refId?: string;
    description?: string;
    createdAt: Date;
}

const txnSchema = new Schema<IWalletTransaction>(
    {
        id: { type: String, required: true, unique: true },
        userId: { type: String, required: true, index: true },
        type: { type: String, enum: ['credit', 'debit'], required: true },
        amount: { type: Number, required: true },
        balanceAfter: { type: Number, required: true },
        reason: { type: String, required: true },
        refType: String,
        refId: String,
        description: String,
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);
txnSchema.index({ userId: 1, createdAt: -1 });

export const WalletTransaction = model<IWalletTransaction>('WalletTransaction', txnSchema);