import { Schema, model } from 'mongoose';

export interface IStoryPurchase {
    id: string;
    userId: string;
    postId: string;
    pricePaise: number; // Homies ku vandha revenue
    paidBy: 'wallet' | 'razorpay';
    paymentId?: string;
    createdAt: Date;
}

const purchaseSchema = new Schema<IStoryPurchase>(
    {
        id: { type: String, required: true, unique: true },
        userId: { type: String, required: true },
        postId: { type: String, required: true },
        pricePaise: { type: Number, required: true },
        paidBy: { type: String, enum: ['wallet', 'razorpay'], default: 'wallet' },
        paymentId: String,
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);
purchaseSchema.index({ userId: 1, postId: 1 }, { unique: true });
purchaseSchema.index({ paymentId: 1 }, { unique: true, sparse: true });

export const StoryPurchase = model<IStoryPurchase>('StoryPurchase', purchaseSchema);