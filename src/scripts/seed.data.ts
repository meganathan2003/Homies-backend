import type { CatalogType } from '../models/catalog-item.model';

/** Edit these lists freely, then run `npm run seed` again: only NEW items are added. Order = display order. */
export const CATALOG_SEED: Record<CatalogType, string[]> = {
    help: [
        'Career Stress',
        'Work-Life Balance',
        'Anxiety',
        'Loneliness',
        'Relationship Issues',
        'Family Pressure',
        'Financial Stress',
        'Sleep Problems',
        'Low Motivation',
        'Anger Management',
        'Self-Confidence',
    ],
    interest: ['Fitness', 'Tech', 'Music', 'Gaming', 'Reading', 'Travel', 'Cooking', 'Movies', 'Sports', 'Photography', 'Meditation', 'Finance'],
    hashtag: ['CareerStress', 'MentalHealth', 'Fitness', 'Routine', 'Growth', 'Anxiety', 'Motivation', 'WorkLifeBalance', 'Relationships', 'SelfCare', 'Sleep'],
};

/** Fake experts for local testing only. Never seeded in production. */
export const SAMPLE_EXPERTS = [
    { email: 'expert1@example.com', name: 'Dr. Siddharth Rao', bio: 'Clinical psychologist. Helps with work stress, anxiety and burnout.', specialization: 'Clinical Psychology' },
    { email: 'expert2@example.com', name: 'Dr. Arvind Kumar', bio: 'Counsellor for relationships, family pressure and loneliness.', specialization: 'Counselling' },
    { email: 'expert3@example.com', name: 'Dr. Karthik Raman', bio: 'Helps with sleep, routine building and low motivation.', specialization: 'Behavioural Therapy' },
];