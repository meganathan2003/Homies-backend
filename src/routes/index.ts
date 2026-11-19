import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import consultationRoutes from './consultation.routes';
import expertRoutes from './expert.routes';
import mediaRoutes from './media.routes';
import paymentRoutes from './payment.routes';
import verificationRoutes from './verification.routes';
import walletRoutes from './wallet.routes';

const router = Router();


router.use('/auth', authRoutes);
router.use('/verification', verificationRoutes);
router.use('/upload', mediaRoutes);
router.use('/wallet', walletRoutes);
router.use('/payments', paymentRoutes);
router.use('/experts', expertRoutes);
router.use('/consultations', consultationRoutes);
router.use('/chats', chatRoutes);
router.use('/admin', adminRoutes);



// Ovvoru step la inga route add aagum
export default router;