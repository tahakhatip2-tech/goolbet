import { Router } from 'express';
import { getAllCharities, getStreamCharityPool, createCharity, updateCharity, deleteCharity } from '../controllers/charityController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// عام
router.get('/', getAllCharities);
router.get('/pool/:streamId', getStreamCharityPool);

// أدمن فقط
router.post('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), createCharity);
router.put('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), updateCharity);
router.delete('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteCharity);

export default router;
