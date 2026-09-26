import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import {
  getStats,
  getUsers, toggleUserStatus, manageWallet, manageBonus,
  getAcademies, verifyAcademy, toggleAcademyStatus,
  adminCreateStream, getAllStreams, getStreamBets, settleStream, adminUpdateStream, adminDeleteStream,
  getAllBets,
  getPendingTransactions, getTransactionStats, getPendingTransactionsCount, processTransaction,
  getSetting, updateSetting,
  getLeagues, createLeague, deleteLeague,
} from '../controllers/adminController';

const router = Router();
const adminAuth = [authenticate, requireRole(['ADMIN', 'SUPER_ADMIN'])];

// Dashboard
router.get('/stats', ...adminAuth, getStats);

// Academies
router.get('/academies', ...adminAuth, getAcademies);
router.put('/academies/:id/verify', ...adminAuth, verifyAcademy);
router.put('/academies/:id/toggle', ...adminAuth, toggleAcademyStatus);

// Streams / Matches
router.get('/streams', ...adminAuth, getAllStreams);
router.get('/matches', ...adminAuth, getAllStreams);
router.post('/matches', ...adminAuth, upload.fields([{ name: 'team1Logo', maxCount: 1 }, { name: 'team2Logo', maxCount: 1 }]), adminCreateStream);
router.get('/streams/:id/bets', ...adminAuth, getStreamBets);
router.post('/streams/:id/settle', ...adminAuth, settleStream);
router.put('/streams/:id', ...adminAuth, adminUpdateStream);
router.put('/matches/:id', ...adminAuth, upload.fields([{ name: 'team1Logo', maxCount: 1 }, { name: 'team2Logo', maxCount: 1 }]), adminUpdateStream);
router.delete('/streams/:id', ...adminAuth, adminDeleteStream);
router.delete('/matches/:id', ...adminAuth, adminDeleteStream);

// Bets
router.get('/bets', ...adminAuth, getAllBets);

// Users
router.get('/users', ...adminAuth, getUsers);
router.put('/users/:id/toggle', ...adminAuth, toggleUserStatus);
router.put('/users/:id/wallet', ...adminAuth, manageWallet);
router.put('/users/:id/bonus', ...adminAuth, manageBonus);

// Transactions
router.get('/transactions', ...adminAuth, getPendingTransactions);
router.get('/transactions/stats', ...adminAuth, getTransactionStats);
router.get('/transactions/pending-count', ...adminAuth, getPendingTransactionsCount);
router.put('/transactions/:id/process', ...adminAuth, processTransaction);

// Settings
router.get('/settings/:key', ...adminAuth, getSetting);
router.put('/settings/:key', ...adminAuth, updateSetting);

// Leagues
router.get('/leagues', ...adminAuth, getLeagues);
router.post('/leagues', ...adminAuth, upload.single('logo'), createLeague);
router.delete('/leagues/:id', ...adminAuth, deleteLeague);

export default router;
