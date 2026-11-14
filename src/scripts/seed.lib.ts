import { CatalogItemModel, CATALOG_TYPES } from '../models/catalog-item.model';
import { UserModel } from '../models/user.model';
import { generateAnonymousAlias, generateHomieId } from '../utils/ids';
import { duplicateKeyFields } from '../utils/mongoErrors';
import { CATALOG_SEED, SAMPLE_EXPERTS } from './seed.data';

/** Adds missing catalog items. Safe to run any number of times (existing items are skipped). */
export async function seedCatalogs() {
    let created = 0;
    let skipped = 0;
    for (const type of CATALOG_TYPES) {
        const names = CATALOG_SEED[type];
        for (const [index, name] of names.entries()) {
            try {
                await CatalogItemModel.create({ type, name, order: index + 1 });
                created++;
            } catch (err) {
                if (!duplicateKeyFields(err)) throw err;
                skipped++; // already there
            }
        }
    }
    return { created, skipped };
}

type StaffInput = {
    email: string;
    name: string;
    role: 'admin' | 'expert';
    expertProfile?: { bio: string; specialization: string };
};

/**
 * Creates a staff account WITHOUT a Firebase uid. The person claims it on their first login
 * (same verified email), see bindProvisionedStaff in auth.service.
 */
async function createStaff(input: StaffInput): Promise<'created' | 'exists'> {
    const email = input.email.trim().toLowerCase();
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await UserModel.create({
                email,
                role: input.role,
                name: input.name,
                expertProfile: input.expertProfile,
                homiesId: generateHomieId(),
            });
            return 'created';
        } catch (err) {
            const fields = duplicateKeyFields(err);
            if (!fields) throw err;
            if (fields.includes('email')) return 'exists';
            // homieId / alias collided: loop and try with fresh ones
        }
    }
    throw new Error(`Could not create ${email}: ID collisions`);
}

export async function seedStaff(opts: { adminEmail?: string; sampleExperts: boolean }) {
    const results: Array<{ email: string; role: string; result: 'created' | 'exists' }> = [];

    if (opts.adminEmail) {
        const result = await createStaff({ email: opts.adminEmail, name: 'Homies Admin', role: 'admin' });
        results.push({ email: opts.adminEmail.toLowerCase(), role: 'admin', result });
    }
    if (opts.sampleExperts) {
        for (const e of SAMPLE_EXPERTS) {
            const result = await createStaff({
                email: e.email,
                name: e.name,
                role: 'expert',
                expertProfile: { bio: e.bio, specialization: e.specialization },
            });
            results.push({ email: e.email, role: 'expert', result });
        }
    }
    return results;
}