/**
 * DEV TEST DATA. Postman test ku ready ah users, experts, wallet, credits, posts, comments create pannum.
 *   npm run seed          -> data create / update (thirumba run pannaalum safe)
 *   npm run seed:reset    -> indha seed users oda data ellam delete
 * Production la run aagaadhu.
 */
import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { env, validateEnv } from '../config/env';
import { Consultation } from '../models/consultation.model';
import { ConsultationCredit } from '../models/consultationCredit.model';
import { Comment } from '../models/comment.model';
import { Conversation } from '../models/conversation.model';
import { ExpertProfile, ExpertStatus } from '../models/expertProfile.model';
import { Like } from '../models/like.model';
import { Message } from '../models/message.model';
import { Notification } from '../models/notification.model';
import { Payment } from '../models/payment.model';
import { Post } from '../models/post.model';
import { StoryPurchase } from '../models/storyPurchase.model';
import { Role, User } from '../models/user.model';
import { Wallet } from '../models/wallet.model';
import { WalletTransaction } from '../models/walletTransaction.model';
import * as walletService from '../services/wallet.service';
import { newHomieCode } from '../utils/id';

type SeedUser = {
    key: string;
    email: string;
    firstName: string;
    role: Role;
    walletRupees?: number;
    credits?: number;
    expert?: { status: ExpertStatus; feeRupees: number; includedInMembership: boolean; qualifications: string[]; experience: string; bio: string };
};

const SEEDS: SeedUser[] = [
    { key: 'admin', email: 'admin@test.com', firstName: 'Admin', role: 'admin' },
    {
        key: 'drravi', email: 'dr.ravi@test.com', firstName: 'Dr Ravi', role: 'expert',
        expert: { status: 'approved', feeRupees: 500, includedInMembership: false, qualifications: ['MBBS', 'MD Psychiatry'], experience: '8 years', bio: 'Stress and relationships' },
    },
    {
        key: 'drpriya', email: 'dr.priya@test.com', firstName: 'Dr Priya', role: 'expert',
        expert: { status: 'approved', feeRupees: 300, includedInMembership: true, qualifications: ['M.Sc Psychology'], experience: '5 years', bio: 'Loneliness and anxiety' },
    },
    {
        key: 'drkumar', email: 'dr.kumar@test.com', firstName: 'Dr Kumar', role: 'expert',
        expert: { status: 'pending', feeRupees: 0, includedInMembership: false, qualifications: [], experience: '', bio: '' },
    },
    { key: 'user1', email: 'user1@test.com', firstName: 'Arun', role: 'user', walletRupees: 1000, credits: 4 },
    { key: 'user2', email: 'user2@test.com', firstName: 'Karthik', role: 'user', walletRupees: 0 },
];

async function uniqueHomieId(): Promise<string> {
    let code = newHomieCode();
    while (await User.exists({ homieId: code })) code = newHomieCode();
    return code;
}

const LONG_STORY =
    'After twelve years of marriage, the divorce papers arrived on an ordinary Tuesday. I did not cry that day. I went to work, came home, and sat in a silent house for hours. ' +
    'What follows is how I slowly rebuilt my routine, my friendships and my sense of self, one small decision at a time. This part is only visible after you unlock the story.';

async function seedContent(ids: Record<string, string>) {
    const posts = [
        { id: 'post_seed_story_free', userId: ids.admin, type: 'STORIES' as const, title: 'A walk that changed my week', content: 'A short free story about taking a 20 minute walk every evening without a phone, and what it did for my mood.', hashtags: ['Routine', 'Growth'] },
        { id: 'post_seed_story_paid', userId: ids.admin, type: 'STORIES' as const, title: 'Rebuilding after divorce', content: LONG_STORY, isPaid: true, pricePaise: 4900, hashtags: ['Support'] },
        { id: 'post_seed_social_1', userId: ids.user1, type: 'SOCIAL' as const, content: 'Morning 5K done before work. Feeling great!', hashtags: ['Fitness', 'Routine'], totalComments: 0 },
        { id: 'post_seed_help_1', userId: ids.user2, type: 'HELP' as const, content: 'I moved to a new city and feel very lonely. How do you make friends as an adult?', hashtags: ['Support'], isAnonymous: true, totalComments: 2 },
        { id: 'post_seed_help_2', userId: ids.user1, type: 'HELP' as const, content: 'How do you decompress after a 10-hour work sprint?', hashtags: ['CareerStress'], totalComments: 0 },
    ];
    for (const p of posts) {
        await Post.findOneAndUpdate({ id: p.id }, { $set: { isDeleted: false, ...p } }, { upsert: true, returnDocument: 'after' });
    }
    const comments = [
        { id: 'cmt_seed_1', postId: 'post_seed_help_1', userId: ids.user1, content: 'You are not alone. Try joining a local group around something you enjoy.', parentCommentId: null, repliesCount: 1, isAnonymous: false },
        { id: 'cmt_seed_2', postId: 'post_seed_help_1', userId: ids.user2, content: 'Thank you, I will try that this weekend.', parentCommentId: 'cmt_seed_1', repliesCount: 0, isAnonymous: true },
    ];
    for (const c of comments) {
        await Comment.findOneAndUpdate({ id: c.id }, { $set: { isDeleted: false, ...c } }, { upsert: true, returnDocument: 'after' });
    }
}

async function seed() {
    const rows: Array<Record<string, string>> = [];
    const idByKey: Record<string, string> = {};
    for (const s of SEEDS) {
        let user = await User.findOne({ email: s.email });
        if (!user) user = new User({ id: `usr_seed_${s.key}`, homieId: await uniqueHomieId(), email: s.email });
        user.firstName = s.firstName;
        user.role = s.role;
        user.isBlocked = false;
        user.isImageVerified = true;
        user.city = 'Chennai';
        user.state = 'Tamil Nadu';
        user.country = 'India';
        user.mobileNumber = '9876500000';
        user.profession = 'Tester';
        user.typeOfWork = 'Testing';
        await user.save();
        idByKey[s.key] = user.id;

        if (s.expert) {
            await ExpertProfile.findOneAndUpdate(
                { userId: user.id },
                {
                    $set: {
                        status: s.expert.status,
                        feePaise: s.expert.feeRupees * 100,
                        includedInMembership: s.expert.includedInMembership,
                        qualifications: s.expert.qualifications,
                        experience: s.expert.experience,
                        bio: s.expert.bio,
                        availability: 'offline',
                    },
                },
                { upsert: true, returnDocument: 'after' },
            );
        }

        if (s.walletRupees) {
            // refType + refId same na thirumba run pannaalum double credit aagaadhu
            await walletService.credit(user.id, s.walletRupees * 100, {
                reason: 'adjustment', refType: 'seed', refId: `seed_wallet_${user.id}`, description: 'Seed test balance',
            });
        }
        if (s.credits && !(await ConsultationCredit.exists({ userId: user.id, source: 'seed' }))) {
            await ConsultationCredit.create({
                userId: user.id, remaining: s.credits, source: 'seed', expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000),
            });
        }

        rows.push({
            email: s.email, role: s.role, id: user.id,
            extra: s.expert ? `${s.expert.status}, fee Rs ${s.expert.feeRupees}${s.expert.includedInMembership ? ', in membership' : ''}` :
                s.role === 'user' ? `wallet Rs ${s.walletRupees ?? 0}${s.credits ? `, ${s.credits} free credits` : ''}` : '',
        });
    }
    await seedContent(idByKey);
    console.log('\nSeed ready. Login (Postman) with DEV_AUTH_BYPASS: { "idToken": "dev:<email>" }\n');
    console.table(rows);
}

async function reset() {
    const users = await User.find({ email: { $in: SEEDS.map((s) => s.email) } });
    const ids = users.map((u) => u.id);
    const convs = await Conversation.find({ $or: [{ userId: { $in: ids } }, { expertId: { $in: ids } }] });
    await Promise.all([
        Message.deleteMany({ conversationId: { $in: convs.map((c) => c.id) } }),
        Conversation.deleteMany({ id: { $in: convs.map((c) => c.id) } }),
        Consultation.deleteMany({ $or: [{ userId: { $in: ids } }, { expertId: { $in: ids } }] }),
        Wallet.deleteMany({ userId: { $in: ids } }),
        WalletTransaction.deleteMany({ userId: { $in: ids } }),
        Payment.deleteMany({ userId: { $in: ids } }),
        ConsultationCredit.deleteMany({ userId: { $in: ids } }),
        ExpertProfile.deleteMany({ userId: { $in: ids } }),
        Post.deleteMany({ $or: [{ id: /^post_seed_/ }, { userId: { $in: ids } }] }),
        Comment.deleteMany({ $or: [{ id: /^cmt_seed_/ }, { userId: { $in: ids } }] }),
        Like.deleteMany({ userId: { $in: ids } }),
        StoryPurchase.deleteMany({ userId: { $in: ids } }),
        Notification.deleteMany({ userId: { $in: ids } }),
    ]);
    const del = await User.deleteMany({ email: { $in: SEEDS.map((s) => s.email) } });
    console.log(`Seed data removed (${del.deletedCount} users and their wallet, chats, consultations).`);
}

async function main() {
    if (env.isProd) throw new Error('Seeding is blocked in production');
    validateEnv();
    await connectDb();
    if (process.argv.includes('--reset')) await reset();
    else await seed();
    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});