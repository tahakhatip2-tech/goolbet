import { Router } from 'express';
import { getMatchComments, deleteComment } from '../controllers/chatController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Public: get comments for a match
router.get('/matches/:id/comments', getMatchComments);

// Admin: delete a comment
router.delete('/comments/:commentId', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteComment);

export default router;
