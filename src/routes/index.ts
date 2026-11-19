import { Router } from 'express';
import authRoutes from './auth.routes';
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

export default router;