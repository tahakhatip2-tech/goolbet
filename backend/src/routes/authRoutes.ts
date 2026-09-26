import { Router } from 'express';
import { register, login, getMe, telegramLogin, registerAcademy } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/register-academy', registerAcademy);
router.post('/login', login);
router.post('/telegram', telegramLogin);
router.get('/me', authenticate, getMe);

export default router;
