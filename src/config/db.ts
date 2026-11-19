import mongoose from 'mongoose';
import { env } from './env';

export async function connectDb(): Promise<void> {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');
}