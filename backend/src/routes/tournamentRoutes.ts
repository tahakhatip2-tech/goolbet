import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import {
  createTournament,
  updateTournament,
  getMyTournaments,
  getMyRegisteredTournaments,
  getPublicTournaments,
  getTournamentById,
  registerTeam,
  approveTeam,
  addPlayerToTeam,
  removePlayer,
  generateDraw,
  updateMatchResult,
  linkMatchToStream,
  deleteTournament,
} from '../controllers/tournamentController';

const router = Router();

// ─── مسارات عامة (لا تتطلب تسجيل دخول) ──────────────────────────────────────
router.get('/', getPublicTournaments);
router.get('/:id', getTournamentById);

// ─── مسارات المستخدمين المسجلين ───────────────────────────────────────────────
router.use(authenticate);

// ─── إدارة البطولات (المنظِّم) ───────────────────────────────────────────────
router.post('/', createTournament);
router.put('/:id', updateTournament);
router.delete('/:id', deleteTournament);
router.get('/my/organized', getMyTournaments);
router.get('/my/registered', getMyRegisteredTournaments);

// ─── إدارة الفرق ─────────────────────────────────────────────────────────────
router.post('/:id/teams', registerTeam);                           // تسجيل فريق
router.put('/:id/teams/:teamId/approve', approveTeam);             // قبول/رفض فريق
router.post('/teams/:teamId/players', addPlayerToTeam);            // إضافة لاعب
router.delete('/teams/:teamId/players/:playerId', removePlayer);   // حذف لاعب

// ─── إدارة الجدول والمباريات ──────────────────────────────────────────────────
router.post('/:id/generate-draw', generateDraw);                   // توليد القرعة
router.put('/:id/matches/:matchId/result', updateMatchResult);     // تحديث نتيجة
router.put('/:id/matches/:matchId/link-stream', linkMatchToStream); // ربط ببث

export default router;
