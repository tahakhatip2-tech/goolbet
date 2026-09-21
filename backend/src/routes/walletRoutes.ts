import { Router } from 'express';
import { requestDeposit, requestWithdrawal, getWalletBalance, getDepositMethods } from '../controllers/walletController';
import { authenticate } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getWalletBalance);
router.get('/deposit-methods', getDepositMethods);
router.post('/deposit', upload.single('receipt'), requestDeposit);
router.post('/withdraw', requestWithdrawal);

export default router;
