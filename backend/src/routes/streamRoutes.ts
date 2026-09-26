import { Router } from 'express';
import { getAllStreams, getStreamById, getLiveStreams, placeBetOnStream, getMyBets } from '../controllers/streamController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// عام
router.get('/', getAllStreams);
router.get('/live', getLiveStreams);
router.get('/:id', getStreamById);

// يحتاج تسجيل دخول
router.post('/:id/bet', authenticate, placeBetOnStream);
router.get('/my/bets', authenticate, getMyBets);

export default router;
