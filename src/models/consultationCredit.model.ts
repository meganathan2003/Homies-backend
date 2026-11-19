import { Schema, model } from 'mongoose';

export interface IConsultationCredit {
    userId: string;
    remaining: number;
    source: string; // 'membership'
    expiresAt: Date;
    createdAt: Date;
}

const creditSchema = new Schema<IConsultationCredit>(
    {
        userId: { type: String, required: true, index: true },
        remaining: { type: Number, required: true, min: 0 },
        source: { type: String, default: 'membership' },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

export const ConsultationCredit = model<IConsultationCredit>('ConsultationCredit', creditSchema);