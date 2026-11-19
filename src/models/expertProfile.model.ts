import { Schema, model } from 'mongoose';

export type ExpertStatus = 'pending' | 'approved' | 'suspended';
export type Availability = 'online' | 'offline';

export interface IExpertProfile {
    userId: string;
    photo?: string;
    qualifications: string[];
    experience?: string;
    bio?: string;
    feePaise: number; // consultation fee, paise
    status: ExpertStatus;
    includedInMembership: boolean;
    availability: Availability;
    createdAt: Date;
    updatedAt: Date;
}

const expertSchema = new Schema<IExpertProfile>(
    {
        userId: { type: String, required: true, unique: true },
        photo: String,
        qualifications: { type: [String], default: [] },
        experience: String,
        bio: String,
        feePaise: { type: Number, default: 0, min: 0 },
        status: { type: String, enum: ['pending', 'approved', 'suspended'], default: 'pending' },
        includedInMembership: { type: Boolean, default: false },
        availability: { type: String, enum: ['online', 'offline'], default: 'offline' },
    },
    { timestamps: true },
);
expertSchema.index({ status: 1, availability: 1 });

export const ExpertProfile = model<IExpertProfile>('ExpertProfile', expertSchema);