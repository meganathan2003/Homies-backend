import http from 'http';
import { app } from './app';
import { env, validateEnv } from './config/env';
import { connectDb } from './config/db';
import { initSockets } from './sockets';

async function main() {
    validateEnv();
    await connectDb();
    const server = http.createServer(app);
    initSockets(server);
    server.listen(env.port, () => console.log(`Homies API listening on :${env.port}`));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});