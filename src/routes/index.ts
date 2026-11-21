import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import commentRoutes from './comment.routes';
import consultationRoutes from './consultation.routes';
import expertRoutes from './expert.routes';
import mediaRoutes from './media.routes';
import notificationRoutes from './notification.routes';
import paymentRoutes from './payment.routes';
import postRoutes from './post.routes';
import verificationRoutes from './verification.routes';
import walletRoutes from './wallet.routes';
import * as catalog from '../controllers/catalog.controller';
import { requireAuth, requireVerified } from '../middleware/auth';

const router = Router();

// Public catalog (onboarding la login ku munnadi kooda venum)
router.get('/helps', catalog.helps);
router.get('/interests', catalog.interests);
router.get('/hashtags', catalog.hashtags);

// Login + face verify venaam: auth (login, register, me, purpose), face verification, Razorpay webhook
router.use('/auth', authRoutes);
router.use('/verification', verificationRoutes);
router.use('/payments', paymentRoutes);

// Face verify aana piragu thaan app features
const gate = [requireAuth, requireVerified];
router.use('/upload', gate, mediaRoutes);
router.use('/wallet', gate, walletRoutes);
router.use('/experts', gate, expertRoutes);
router.use('/consultations', gate, consultationRoutes);
router.use('/chats', gate, chatRoutes);
router.use('/posts', gate, postRoutes);
router.use('/comments', gate, commentRoutes);
router.use('/notifications', gate, notificationRoutes);

router.use('/admin', adminRoutes);
export default router;