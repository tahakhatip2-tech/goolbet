import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/db';
import { notifyAdmins } from '../utils/notificationUtils';
import { uploadFileToSupabase } from '../utils/supabaseStorage';
import fs from 'fs';

export const getDepositMethods = async (req: Request, res: Response) => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'DEPOSIT_METHODS' } });
    if (!setting || !setting.value) {
      return res.json([]);
    }
    
    // Parse the JSON string from DB
    let methods = JSON.parse(setting.value);
    
    // Only return active methods to users
    methods = methods.filter((m: any) => m.isActive);
    
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching deposit methods' });
  }
};

export const requestDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { amount, method } = req.body;

    if (!amount || !req.file) {
      return res.status(400).json({ error: 'Amount and receipt image are required' });
    }

    // Upload receipt to Supabase Storage so it's accessible from any device/network
    let receiptUrl: string | undefined;
    let receiptImage: string | undefined;
    const localPath = req.file.path;
    const filename = req.file.filename;
    const mimetype = req.file.mimetype;

    try {
      receiptUrl = await uploadFileToSupabase(
        localPath,
        `receipts/${filename}`,
        mimetype
      );
      // Clean up local temp file after successful Supabase upload
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    } catch (uploadErr) {
      // Supabase upload failed — keep the local file as fallback
      console.warn('Supabase upload failed, keeping local file:', uploadErr);
      receiptImage = filename; // store filename for local /uploads serving
    }

    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount: Number(amount),
        status: 'PENDING',
        details: JSON.stringify({ method, receiptUrl, receiptImage })
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    await notifyAdmins(
      'طلب إيداع جديد',
      `قام ${user?.firstName} بطلب إيداع بمبلغ $${amount}`,
      'TRANSACTION',
      '/admin/transactions'
    );

    res.status(201).json({ message: 'Deposit request submitted', transaction });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { amount, address, method } = req.body;

    if (!amount || !address) {
      return res.status(400).json({ error: 'Amount and wallet address are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'عذراً، حسابك موقوف مؤقتاً. يرجى التواصل مع الدعم.' });
    }

    // Check balance
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create pending withdrawal transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Deduct from main balance and lock it
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: Number(amount) },
          lockedBalance: { increment: Number(amount) }
        }
      });

      return await tx.walletTransaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: Number(amount),
          status: 'PENDING',
          details: JSON.stringify({ method, address })
        }
      });
    });

    await notifyAdmins(
      'طلب سحب جديد',
      `قام ${user.firstName} بطلب سحب بمبلغ $${amount}`,
      'TRANSACTION',
      '/admin/transactions'
    );

    res.status(201).json({ message: 'Withdrawal request submitted', transaction });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Wallet and Transactions
export const getWalletBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const transactions = await prisma.walletTransaction.findMany({ 
      where: { userId }, 
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Calculate dynamic stats from user's transactions
    const depositAgg = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: 'DEPOSIT', status: 'COMPLETED' }
    });
    
    const withdrawAgg = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: 'WITHDRAWAL', status: 'COMPLETED' }
    });

    const totalDeposited = depositAgg._sum.amount || 0;
    const totalWithdrawn = Math.abs(withdrawAgg._sum.amount || 0);

    res.json({ 
      wallet: {
        ...wallet,
        totalDeposited,
        totalWithdrawn
      }, 
      transactions 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
