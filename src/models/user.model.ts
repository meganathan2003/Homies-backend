import { HydratedDocument, Schema, model } from 'mongoose';

export type Role = 'user' | 'expert' | 'admin';

export interface IUser {
    id: string;
    homieId: string;
    email: string;
    firebaseUid?: string;
    firstName: string;
    dob?: string;
    city?: string;
    state?: string;
    country?: string;
    mobileNumber?: string;
    profession?: string;
    workTiming?: string;
    typeOfWork?: string;
    profileImage?: string;
    helps: string[];
    interests: string[];
    role: Role;
    isImageVerified: boolean;
    isBlocked: boolean;
    lastPurpose?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        id: { type: String, required: true, unique: true },
        homieId: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        firebaseUid: { type: String, index: true, sparse: true },
        firstName: { type: String, required: true, trim: true },
        dob: String,
        city: String,
        state: String,
        country: String,
        mobileNumber: String,
        profession: String,
        workTiming: String,
        typeOfWork: String,
        profileImage: String,
        helps: { type: [String], default: [] },
        interests: { type: [String], default: [] },
        role: { type: String, enum: ['user', 'expert', 'admin'], default: 'user', index: true },
        isImageVerified: { type: Boolean, default: false },
        isBlocked: { type: Boolean, default: false },
        lastPurpose: String,
        lastLoginAt: Date,
    },
    { timestamps: true },
);

export type UserDoc = HydratedDocument<IUser>;
export const User = model<IUser>('User', userSchema);