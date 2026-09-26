import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import {
  getMyAcademy, updateMyAcademy,
  getAllAcademies, getAcademyById,
  getMyStreams, createStream, updateStream, startStream, updateScore, endStream, deleteStream,
  getAcademyStats
} from '../controllers/academyController';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

// مسارات عامة (لا تحتاج تسجيل دخول)
router.get('/', getAllAcademies);
router.get('/:id', getAcademyById);

// مسارات الأكاديمية (تحتاج دور ACADEMY)
router.use(authenticate);
router.use(requireRole(['ACADEMY', 'ADMIN', 'SUPER_ADMIN']));

router.get('/my/profile', getMyAcademy);
router.get('/my/stats', getAcademyStats);
router.put('/my/profile', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), updateMyAcademy);

// إدارة البثوث
router.get('/my/streams', getMyStreams);
router.post('/my/streams', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'team1Logo', maxCount: 1 },
  { name: 'team2Logo', maxCount: 1 }
]), createStream);
router.put('/my/streams/:id', updateStream);
router.post('/my/streams/:id/start', startStream);
router.put('/my/streams/:id/score', updateScore);
router.post('/my/streams/:id/end', endStream);
router.delete('/my/streams/:id', deleteStream);

export default router;
