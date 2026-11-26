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

## API endpoints

All REST endpoints use the `/api` prefix. Unless marked **Public**, send `Authorization: Bearer <token>`. Routes under `/upload`, `/wallet`, `/experts`, `/consultations`, `/chats`, `/posts`, `/comments`, and `/notifications` require a face-verified account (admins bypass face verification). Admin endpoints require the `admin` role. JSON request bodies are validated with Zod; media uploads use multipart form data.

### Public catalogs

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/helps` | Get onboarding help options. |
| `GET` | `/api/interests` | Get onboarding interests. |
| `GET` | `/api/hashtags` | Get available hashtags. |

### Authentication and profile

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register using a verified Google/Firebase ID token. |
| `POST` | `/api/auth/login` | Public | Sign in and receive an API JWT. |
| `POST` | `/api/auth/purpose` | Authenticated | Save the user's login purpose. |
| `GET` | `/api/auth/me` | Authenticated | Get the current user's profile. |
| `PUT` | `/api/auth/update-profile` | Authenticated | Update profile information. |
| `PATCH` | `/api/auth/verification` | Authenticated | Update verification details. |
| `POST` | `/api/verification/image` | Authenticated | Submit an image for face verification. |

### Media

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/upload/multiple` | Verified | Upload multiple media files. |


### Experts and consultations

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/experts` | Verified | List experts. |
| `GET` | `/api/experts/:id` | Verified | Get an expert by ID. |
| `GET` | `/api/experts/me/profile` | Expert | Get the signed-in expert's profile. |
| `PUT` | `/api/experts/me/profile` | Expert | Update the signed-in expert's profile. |
| `PATCH` | `/api/experts/me/status` | Expert | Update expert availability. |
| `POST` | `/api/consultations` | Verified | Start a consultation using wallet funds or a free credit. |
| `POST` | `/api/consultations/order` | Verified | Create an external payment order for a consultation. |
| `POST` | `/api/consultations/verify` | Verified | Verify consultation payment. |
| `GET` | `/api/consultations` | Verified | List the current user's consultations. |
| `POST` | `/api/consultations/:id/complete` | Expert | Complete a consultation. |

### Chat

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/chats/conversations` | Verified | List conversations. |
| `GET` | `/api/chats/conversations/:id/messages` | Verified | List messages in a conversation. |
| `POST` | `/api/chats/conversations/:id/messages` | Verified | Send a message. |

### Posts and comments

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/posts` | Verified | List posts. |
| `POST` | `/api/posts` | Verified | Create a post. |
| `GET` | `/api/posts/:id` | Verified | Get a post by ID. |
| `DELETE` | `/api/posts/:id` | Verified | Delete a post. |
| `POST` | `/api/posts/:id/toggle-like` | Verified | Toggle the current user's like on a post. |
| `POST` | `/api/posts/:id/unlock` | Verified | Unlock paid content using wallet funds. |
| `POST` | `/api/posts/:id/unlock/order` | Verified | Create an external payment order to unlock content. |
| `POST` | `/api/posts/:id/unlock/verify` | Verified | Verify payment for a content unlock. |
| `GET` | `/api/comments` | Verified | List comments. |
| `POST` | `/api/comments` | Verified | Create a comment. |
| `DELETE` | `/api/comments/:id` | Verified | Delete a comment. |
| `POST` | `/api/comments/:id/toggle-like` | Verified | Toggle the current user's like on a comment. |


### Wallet and payments

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/wallet` | Verified | Get wallet balance. |
| `GET` | `/api/wallet/transactions` | Verified | List wallet transactions. |
| `POST` | `/api/wallet/topup/order` | Verified | Create a wallet top-up payment order. |
| `POST` | `/api/wallet/topup/verify` | Verified | Verify a completed top-up payment. |
| `POST` | `/api/wallet/topup/failure` | Verified | Report a failed top-up payment. |
| `POST` | `/api/payments/webhook` | **Public** (Razorpay signature) | Receive Razorpay webhook events. |
| `POST` | `/api/payments/failure` | Verified | Report a failed payment. |


### Notifications

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/notifications` | Verified | List notifications. |
| `POST` | `/api/notifications/read` | Verified | Mark notifications as read. |

### Admin

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/admin/experts` | Admin | Create an expert. |
| `GET` | `/api/admin/experts` | Admin | List experts for administration. |
| `PATCH` | `/api/admin/experts/:id/status` | Admin | Change an expert's approval status. |

### Health check

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | **Public** | Service and MongoDB readiness (`200` when connected, otherwise `503`). |

Socket.IO shares the HTTP server. Authenticate the socket with `auth: { token: "<JWT>" }` (or an `Authorization: Bearer` header). Chat events and payloads are defined in `src/sockets/chat.socket.ts`; experts are marked online while connected and offline after their last socket disconnects.

## Development seed accounts

Run `npm run seed` after configuring MongoDB and enabling `DEV_AUTH_BYPASS`. The seed creates `admin@test.com`, `user1@test.com`, `user2@test.com`, and expert accounts `dr.ravi@test.com`, `dr.priya@test.com`, and `dr.kumar@test.com`, along with sample posts, wallet funds, credits, and expert profiles. Authenticate in development with an `idToken` such as `dev:user1@test.com`. The reset script removes these seeded accounts and related data; it does not reset the entire database.

## Production notes

Production startup requires a MongoDB URI, a sufficiently long JWT secret, real Razorpay configuration, S3 storage configuration, and `DEV_AUTH_BYPASS=false`. Configure `CORS_ORIGINS` narrowly and provide valid Google sign-in/Firebase credentials and AWS Rekognition access for the features that depend on them.
