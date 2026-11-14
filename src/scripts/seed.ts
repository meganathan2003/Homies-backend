import { env, isProd } from '../config/env';
import { connectDb, disconnectDb } from '../config/db';
import { seedCatalogs, seedStaff } from './seed.lib';

// Usage:  npm run seed                          (catalogs + sample experts in development)
//         npm run seed -- --admin you@gmail.com (also creates YOUR admin account)
function readAdminEmail(): string | undefined {
    const i = process.argv.indexOf('--admin');
    const value = i >= 0 ? process.argv[i + 1] : undefined;
    if (i >= 0 && (!value || !value.includes('@'))) {
        console.error('--admin needs an email, e.g. npm run seed -- --admin you@gmail.com');
        process.exit(1);
    }
    return value;
}

async function main() {
    const adminEmail = readAdminEmail();
    await connectDb(env.MONGODB_URI);
    try {
        const catalogs = await seedCatalogs();
        console.log(`Catalogs: ${catalogs.created} added, ${catalogs.skipped} already existed`);

        // Fake experts must never reach production.
        const staff = await seedStaff({ adminEmail, sampleExperts: !isProd });
        for (const s of staff) console.log(`${s.role.padEnd(6)} ${s.email}: ${s.result}`);
        if (isProd) console.log('Production: sample experts skipped.');
        if (!adminEmail) console.log('Tip: add your own admin with  npm run seed -- --admin you@gmail.com');
    } finally {
        await disconnectDb();
    }
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});