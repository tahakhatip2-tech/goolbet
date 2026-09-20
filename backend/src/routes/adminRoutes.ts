import { Router } from 'express';
import { getStats, createMatch, updateMatch, deleteMatch, settleMatch, startMatch, updateLiveMatch, getPendingTransactions, getTransactionStats, getPendingTransactionsCount, processTransaction, getMatchBets, getUsers, toggleUserStatus, manageWallet, getAllBets, manageBonus, getLeagues, createLeague, deleteLeague, toggleStream } from '../controllers/adminController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

router.get('/stats', getStats);
router.post('/matches', upload.fields([{ name: 'team1Logo', maxCount: 1 }, { name: 'team2Logo', maxCount: 1 }]), createMatch);
router.put('/matches/:id', upload.fields([{ name: 'team1Logo', maxCount: 1 }, { name: 'team2Logo', maxCount: 1 }]), updateMatch);
router.delete('/matches/:id', deleteMatch);
router.put('/matches/:id/settle', settleMatch);
router.put('/matches/:id/start', startMatch);
router.put('/matches/:id/live-update', updateLiveMatch);
router.put('/matches/:id/stream', toggleStream);
router.get('/matches/:id/bets', getMatchBets);

router.get('/transactions', getPendingTransactions);
router.get('/transactions/pending-count', getPendingTransactionsCount);
router.get('/transactions/stats', getTransactionStats);
router.put('/transactions/:id/process', processTransaction);

router.get('/users', getUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.post('/users/:id/wallet', manageWallet);
router.post('/users/:id/bonus', manageBonus);
router.get('/bets', getAllBets);

// Leagues
router.get('/leagues', getLeagues);
router.post('/leagues', upload.single('logo'), createLeague);
router.delete('/leagues/:id', deleteLeague);

export default router;
