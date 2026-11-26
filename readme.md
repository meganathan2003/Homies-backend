# Homies Backend

REST API and Socket.IO server for Homies, a community and expert-support application. The service uses Express, TypeScript, MongoDB, Firebase Authentication, Razorpay, and local or S3-compatible media storage.

## Requirements

- Node.js 20 or newer
- MongoDB
- Firebase project configured for Google sign-in (unless using the development auth bypass)
- AWS credentials for face verification, and Razorpay credentials for live payments

## Getting started

```bash
npm install
cp .env.example .env # if supplied; otherwise create .env using the variables below
npm run dev
```

The server listens on port `4000` by default. It validates its environment, connects to MongoDB, then starts HTTP and Socket.IO. The health endpoint is `GET /health`; it returns `200` when MongoDB is connected and `503` otherwise.

## Configuration

Create a `.env` file in the project root. At minimum, set `MONGODB_URI` and a `JWT_SECRET` of at least 32 characters.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Set to `production` for production checks. |
| `PORT` | `4000` | HTTP port. |
| `MONGODB_URI` | — | MongoDB connection string; required. |
| `JWT_SECRET` | — | Secret used to sign API tokens; 32+ characters, required. |
| `JWT_EXPIRES_IN` | `7d` | API token lifetime. |
| `PUBLIC_BASE_URL` | `http://localhost:<PORT>` | Public server URL used when creating media URLs. |
| `CORS_ORIGINS` | `*` | Comma-separated allowed browser origins, or `*`. |
| `TRUST_PROXY` | `false` | Set `true` when deployed behind one trusted proxy. |
| `ADMIN_EMAILS` | — | Comma-separated Google account emails allowed admin access. |
| `DEV_AUTH_BYPASS` | `false` | Development-only Firebase bypass for seeded/test accounts. Never enable in production. |
| `FIREBASE_PROJECT_ID` | — | Firebase Admin project ID. |
| `FIREBASE_CLIENT_EMAIL` | — | Firebase service account email. |
| `FIREBASE_PRIVATE_KEY` | — | Firebase service account private key; encode newlines as `\\n` in `.env`. |
| `RAZORPAY_MODE` | `live` | Use `mock` for development; mock mode is rejected in production. |
| `RAZORPAY_KEY_ID` | — | Razorpay key ID. Required in production. |
| `RAZORPAY_KEY_SECRET` | — | Razorpay key secret. Required in production. |
| `RAZORPAY_WEBHOOK_SECRET` | — | Webhook signing secret. Required in production. |
| `STORAGE_DRIVER` | `local` | `local` or `s3`; production requires `s3`. |
| `S3_BUCKET` | — | S3 bucket name. |
| `S3_REGION` | `auto` | S3 region. |
| `S3_ENDPOINT` | — | Optional S3-compatible endpoint. |
| `S3_ACCESS_KEY_ID` | — | S3 access key. |
| `S3_SECRET_ACCESS_KEY` | — | S3 secret key. |
| `MEDIA_BASE_URL` | — | Public base URL for uploaded S3 objects. Required for S3. |
| `AWS_REGION` | `ap-south-1` | AWS region used for face verification. |
| `AWS_ACCESS_KEY_ID` | — | AWS access key for Rekognition. |
| `AWS_SECRET_ACCESS_KEY` | — | AWS secret key for Rekognition. |
| `FACE_MIN_CONFIDENCE` | `0.75` | Minimum face-match confidence. |
| `FACE_REQUIRE_MALE` | `true` | Face verification configuration flag. |
| `EXPERT_SHARE_PERCENT` | `60` | Expert share of consultation revenue, from 0 to 100. |

Firebase credentials are needed for real Google sign-in. With `DEV_AUTH_BYPASS=true` in non-production, send `idToken` values like `dev:user1@test.com` to login/register; the seed command creates ready-to-use test users. Use actual AWS and Razorpay credentials when exercising those integrations. Never commit secrets.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the server with `tsx` watch mode. |
| `npm run build` | Compile TypeScript into `dist/`. |
| `npm start` | Run the compiled server. |
| `npm run typecheck` | Type-check without emitting files. |
| `npm run seed` | Create or update development test data (blocked in production). |
| `npm run seed:reset` | Delete the seeded users and their associated test data (blocked in production). |

## API overview

All REST routes use the `/api` prefix. Most request and response bodies are JSON; media uploads use multipart form data. Inputs are validated with Zod. Authenticated requests use `Authorization: Bearer <token>`. Application features require a signed-in, face-verified account; admins bypass face verification. Admin routes also require the `admin` role.

| Prefix | Routes / capabilities |
| --- | --- |
| `/auth` | Register, login, set login purpose, get current user, update profile and verification details. |
| `/verification` | Submit an image for face verification. |
| `/payments` | Razorpay webhook and payment-failure reporting. |
| `/upload` | Upload multiple media files. |
| `/wallet` | Get balance and transactions; create and verify top-up orders. |
| `/experts` | Browse experts; get/update expert profile and availability. |
| `/consultations` | Start consultations, create/verify payment orders, list consultations, and complete as an expert. |
| `/chats` | List conversations, read messages, and send messages. |
| `/posts` | List/create/read/delete posts, like posts, and unlock paid content. |
| `/comments` | List/create/delete comments and toggle likes. |
| `/notifications` | List notifications and mark them read. |
| `/admin` | Create/list experts and update expert status. |
| `/helps`, `/interests`, `/hashtags` | Public onboarding catalogs. |

Socket.IO shares the HTTP server. Authenticate the socket with `auth: { token: "<JWT>" }` (or an `Authorization: Bearer` header). Chat events and payloads are defined in `src/sockets/chat.socket.ts`; experts are marked online while connected and offline after their last socket disconnects.

## Development seed accounts

Run `npm run seed` after configuring MongoDB and enabling `DEV_AUTH_BYPASS`. The seed creates `admin@test.com`, `user1@test.com`, `user2@test.com`, and expert accounts `dr.ravi@test.com`, `dr.priya@test.com`, and `dr.kumar@test.com`, along with sample posts, wallet funds, credits, and expert profiles. Authenticate in development with an `idToken` such as `dev:user1@test.com`. The reset script removes these seeded accounts and related data; it does not reset the entire database.

## Production notes

Production startup requires a MongoDB URI, a sufficiently long JWT secret, real Razorpay configuration, S3 storage configuration, and `DEV_AUTH_BYPASS=false`. Configure `CORS_ORIGINS` narrowly and provide valid Google sign-in/Firebase credentials and AWS Rekognition access for the features that depend on them.
