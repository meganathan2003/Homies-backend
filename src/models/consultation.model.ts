import { Schema, model } from 'mongoose';

export interface IConsultation {
    id: string;
    userId: string;
    expertId: string; // expert oda user id
    conversationId: string;
    feePaise: number;
    paidBy: 'wallet' | 'credit';
    expertSharePaise: number;
    platformSharePaise: number;
    status: 'active' | 'completed';
    settled: boolean;
    startedAt: Date;
    completedAt?: Date;
}

const consultationSchema = new Schema<IConsultation>(
    {
        id: { type: String, required: true, unique: true },
        userId: { type: String, required: true, index: true },
        expertId: { type: String, required: true, index: true },
        conversationId: { type: String, required: true },
        feePaise: { type: Number, required: true },
        paidBy: { type: String, enum: ['wallet', 'credit'], required: true },
        expertSharePaise: { type: Number, default: 0 },
        platformSharePaise: { type: Number, default: 0 },
        status: { type: String, enum: ['active', 'completed'], default: 'active' },
        settled: { type: Boolean, default: false },
        startedAt: { type: Date, default: Date.now },
        completedAt: Date,
    },
    { timestamps: false },
);
// Oru user + oru expert ku oru neramathula oru active consultation mattum
consultationSchema.index({ userId: 1, expertId: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

export const Consultation = model<IConsultation>('Consultation', consultationSchema);