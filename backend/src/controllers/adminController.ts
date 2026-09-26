import { Request, Response } from 'express';
import prisma from '../config/db';
import { uploadFile } from '../utils/supabaseStorage';
import fs from 'fs';
import { notifyUser } from '../utils/notificationUtils';
import { distributeCharityWinnings } from './charityController';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getStats = async (_req: Request, res: Response) => {
  try {
    const [usersCount, academiesCount, betsCount, liveStreams, pendingAcademies] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.academy.count({ where: { isVerified: true } }),
      prisma.bet.count(),
      prisma.stream.count({ where: { status: 'LIVE' } }),
      prisma.academy.count({ where: { isVerified: false } })
    ]);
    res.json({ usersCount, academiesCount, betsCount, liveStreams, pendingAcademies });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Academy Management ───────────────────────────────────────────────────────

export const getAcademies = async (_req: Request, res: Response) => {
  try {
    const academies = await prisma.academy.findMany({
      include: {
        user: { select: { id: true, email: true, username: true, isActive: true, createdAt: true } },
        _count: { select: { streams: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(academies);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyAcademy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { isVerified } = req.body;

    const academy = await prisma.academy.update({
      where: { id },
      data: { isVerified: Boolean(isVerified) }
    });

    await notifyUser(
      academy.userId,
      isVerified ? '✅ تم التحقق من أكاديميتك!' : '❌ تم رفض طلب التحقق',
      isVerified
        ? 'يمكنك الآن إنشاء البثوث وإضافة مبارياتك'
        : 'يرجى التواصل مع الإدارة لمعرفة السبب',
      'SYSTEM',
      '/academy/dashboard'
    );

    res.json({ message: `Academy ${isVerified ? 'verified' : 'unverified'}`, academy });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const toggleAcademyStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const academy = await prisma.academy.findUnique({ where: { id } });
    if (!academy) return res.status(404).json({ error: 'Academy not found' });

    const updated = await prisma.academy.update({
      where: { id },
      data: { isActive: !academy.isActive }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Streams Management (Admin) ───────────────────────────────────────────────

export const adminCreateStream = async (req: Request, res: Response) => {
  try {
    const { team1Name, team2Name, league, matchDate, status, odds, streamUrl, isStreamActive } = req.body;

    if (!team1Name || !team2Name || !matchDate) {
      return res.status(400).json({ error: 'الفريق الأول والثاني والتاريخ مطلوبون' });
    }

    // ── Find or create the "GoolBet Platform" system academy ──
    let academy = await prisma.academy.findFirst({ where: { name: 'GoolBet Platform' } });

    if (!academy) {
      // Try to get or create a system user for admin matches
      let systemUser = await prisma.user.findFirst({ where: { email: 'platform@goolbet.app' } });
      if (!systemUser) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('platform_system_2024!', 10);
        systemUser = await prisma.user.create({
          data: {
            email: 'platform@goolbet.app',
            username: 'goolbet_platform',
            firstName: 'GoolBet',
            lastName: 'Platform',
            passwordHash: hash,
            role: 'ACADEMY',
            wallet: { create: { balance: 0, lockedBalance: 0 } }
          }
        });
      }
      academy = await prisma.academy.create({
        data: {
          userId: systemUser.id,
          name: 'GoolBet Platform',
          description: 'مباريات المنصة الرسمية',
          isVerified: true,
          isActive: true,
        }
      });
    }

    let team1Logo: string | null = null;
    let team2Logo: string | null = null;

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files['team1Logo']?.[0]) {
        const f = files['team1Logo'][0];
        team1Logo = await uploadFile(f.path, f.originalname, f.mimetype);
        fs.unlink(f.path, () => {});
      }
      if (files['team2Logo']?.[0]) {
        const f = files['team2Logo'][0];
        team2Logo = await uploadFile(f.path, f.originalname, f.mimetype);
        fs.unlink(f.path, () => {});
      }
    }

    let parsedOdds = { team1Win: 1.5, draw: 3.0, team2Win: 2.5 };
    try { if (odds) parsedOdds = JSON.parse(odds); } catch {}

    // Map frontend status values to valid StreamStatus enum values
    const validStatuses = ['DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'];
    const mappedStatus = (status === 'UPCOMING' || !validStatuses.includes(status)) ? 'SCHEDULED' : status;

    const stream = await prisma.stream.create({
      data: {
        academyId: academy.id,
        title: `${team1Name} vs ${team2Name}`,
        streamType: 'MATCH',
        status: mappedStatus as any,
        scheduledAt: new Date(matchDate),
        team1Name,
        team1Logo,
        team1Score: 0,
        team2Name,
        team2Logo,
        team2Score: 0,
        streamUrl: streamUrl || null,
        isStreamActive: isStreamActive === 'true',
        isAdminMatch: true,  // ← علامة مباراة الإدارة
        odds: { create: { team1Win: parsedOdds.team1Win, draw: parsedOdds.draw, team2Win: parsedOdds.team2Win } }
      },
      include: { odds: true, academy: { select: { id: true, name: true } } }
    });

    res.status(201).json(stream);
  } catch (error: any) {
    console.error('adminCreateStream error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const getAllStreams = async (_req: Request, res: Response) => {
  try {
    const streams = await prisma.stream.findMany({
      include: {
        academy: { select: { id: true, name: true, logo: true } },
        _count: { select: { bets: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(streams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getStreamBets = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const bets = await prisma.bet.findMany({
      where: { streamId: id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, username: true } },
        settlement: true,
        charityVote: { include: { charity: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// تسوية المباراة وتوزيع الأرباح
export const settleStream = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const stream = await prisma.stream.findUnique({
      where: { id },
      include: { bets: { where: { status: 'PENDING' } } }
    });

    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    if (stream.streamType !== 'MATCH') return res.status(400).json({ error: 'التسوية متاحة فقط للمباريات' });
    if (stream.status === 'ENDED' && stream.result) return res.status(400).json({ error: 'المباراة تمت تسويتها بالفعل' });

    const t1 = stream.team1Score;
    const t2 = stream.team2Score;

    let resultAt90: 'TEAM_1_WIN' | 'DRAW' | 'TEAM_2_WIN';
    if (t1 > t2) resultAt90 = 'TEAM_1_WIN';
    else if (t2 > t1) resultAt90 = 'TEAM_2_WIN';
    else resultAt90 = 'DRAW';

    let finalResult: 'TEAM_1_WIN' | 'DRAW' | 'TEAM_2_WIN' = resultAt90;

    if (stream.isKnockout && resultAt90 === 'DRAW') {
      const et1 = stream.team1Score + stream.extraTimeTeam1;
      const et2 = stream.team2Score + stream.extraTimeTeam2;
      if (et1 > et2) finalResult = 'TEAM_1_WIN';
      else if (et2 > et1) finalResult = 'TEAM_2_WIN';
      else {
        const p1 = stream.penaltiesTeam1, p2 = stream.penaltiesTeam2;
        if (p1 > p2) finalResult = 'TEAM_1_WIN';
        else if (p2 > p1) finalResult = 'TEAM_2_WIN';
      }
    }

    const getBetResult = (selection: string): boolean => {
      if (!stream.isKnockout) return selection === resultAt90;
      if (selection === 'DRAW') return resultAt90 === 'DRAW' && finalResult === 'DRAW';
      return selection === finalResult;
    };

    const winningBets: { userId: string; payout: number; betId: string }[] = [];

    await prisma.$transaction(async (tx) => {
      await tx.stream.update({
        where: { id },
        data: { status: 'ENDED', result: finalResult, resultAt90, endedAt: new Date(), liveUpdate: 'انتهت المباراة! 🏁', isStreamActive: false }
      });

      for (const bet of stream.bets) {
        const isWin = getBetResult(bet.selection);

        if (isWin) {
          const profit = Math.max(bet.potentialPayout - bet.stake, 0);
          let payoutToReal = 0;
          let walletUpdate: any = {};

          if (bet.isBonus) {
            payoutToReal = profit;
            walletUpdate = { balance: { increment: payoutToReal }, lockedBonusBalance: { decrement: bet.stake } };
          } else {
            payoutToReal = bet.potentialPayout;
            walletUpdate = { balance: { increment: payoutToReal }, lockedBalance: { decrement: bet.stake } };
          }

          winningBets.push({ userId: bet.userId, payout: payoutToReal, betId: bet.id });
          await tx.bet.update({ where: { id: bet.id }, data: { status: 'WON' } });
          await tx.settlement.create({ data: { streamId: id, betId: bet.id, amount: payoutToReal, isWin: true } });
          await tx.wallet.update({ where: { userId: bet.userId }, data: walletUpdate });
          await tx.walletTransaction.create({
            data: { userId: bet.userId, type: 'BET_WON', amount: payoutToReal, details: `ربح رهان: ${stream.title}` }
          });
        } else {
          const walletUpdate = bet.isBonus
            ? { lockedBonusBalance: { decrement: bet.stake } }
            : { lockedBalance: { decrement: bet.stake } };
          await tx.wallet.update({ where: { userId: bet.userId }, data: walletUpdate });
          await tx.bet.update({ where: { id: bet.id }, data: { status: 'LOST' } });
          await tx.settlement.create({ data: { streamId: id, betId: bet.id, amount: 0, isWin: false } });
        }
      }
    });

    // توزيع الأرباح على الجمعيات الخيرية
    await distributeCharityWinnings(id, winningBets.map(w => ({ betId: w.betId, payout: w.payout })));

    // إشعار الفائزين
    for (const win of winningBets) {
      await notifyUser(win.userId, '🎉 لقد فزت!', `ربحت $${win.payout.toFixed(2)} في: ${stream.title}`, 'BET', '/profile');
    }

    res.json({ message: 'تمت التسوية بنجاح', resultAt90, finalResult, winnersCount: winningBets.length });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// ─── Users Management ─────────────────────────────────────────────────────────

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, firstName: true, lastName: true, email: true, username: true,
        role: true, isActive: true, createdAt: true,
        wallet: { select: { balance: true, lockedBalance: true, bonusBalance: true } },
        academy: { select: { id: true, name: true, isVerified: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const manageWallet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { amount, type, note } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'المبلغ يجب أن يكون أكبر من 0' });

    const wallet = await prisma.wallet.findUnique({ where: { userId: id } });
    if (!wallet) return res.status(404).json({ error: 'المحفظة غير موجودة' });
    if (type === 'WITHDRAW' && wallet.balance < amount) return res.status(400).json({ error: 'الرصيد غير كافٍ' });

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { userId: id },
        data: { balance: type === 'DEPOSIT' ? { increment: Number(amount) } : { decrement: Number(amount) } }
      });
      await tx.walletTransaction.create({
        data: {
          userId: id,
          type: type === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAWAL',
          amount: type === 'DEPOSIT' ? Number(amount) : -Number(amount),
          status: 'COMPLETED',
          details: note ? `تعديل يدوي: ${note}` : 'تعديل يدوي بواسطة الأدمن'
        }
      });
      return updated;
    });

    res.json({ message: 'تم تحديث الرصيد', wallet: updatedWallet });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const manageBonus = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params as { id: string };
    const { action, amount } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'المبلغ يجب أن يكون أكبر من 0' });

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return res.status(404).json({ error: 'المحفظة غير موجودة' });
    if (action === 'DEDUCT' && wallet.bonusBalance < amount) return res.status(400).json({ error: 'رصيد البونص غير كافٍ' });

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: { bonusBalance: action === 'ADD' ? { increment: amount } : { decrement: amount } }
      });
      await tx.walletTransaction.create({
        data: { userId, type: 'ADJUSTMENT', amount: action === 'ADD' ? amount : -amount, status: 'COMPLETED', details: `بونص ${action === 'ADD' ? 'مُضاف' : 'محذوف'} بواسطة الأدمن` }
      });
    });

    res.json({ message: `تم ${action === 'ADD' ? 'إضافة' : 'حذف'} البونص` });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const getPendingTransactions = async (_req: Request, res: Response) => {
  try {
    const transactions = await prisma.walletTransaction.findMany({
      where: { type: { in: ['DEPOSIT', 'WITHDRAWAL'] } },
      include: { user: { select: { email: true, firstName: true, lastName: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTransactionStats = async (_req: Request, res: Response) => {
  try {
    const [totalTransactions, depositCount, withdrawCount, depositAgg, withdrawAgg] = await Promise.all([
      prisma.walletTransaction.count(),
      prisma.walletTransaction.count({ where: { type: 'DEPOSIT' } }),
      prisma.walletTransaction.count({ where: { type: 'WITHDRAWAL' } }),
      prisma.walletTransaction.aggregate({ _sum: { amount: true }, where: { type: 'DEPOSIT', status: 'COMPLETED' } }),
      prisma.walletTransaction.aggregate({ _sum: { amount: true }, where: { type: 'WITHDRAWAL', status: 'COMPLETED' } })
    ]);

    res.json({
      totalCount: totalTransactions,
      depositCount,
      withdrawCount,
      totalAmount: (depositAgg._sum.amount || 0) + Math.abs(withdrawAgg._sum.amount || 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPendingTransactionsCount = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.walletTransaction.count({ where: { status: 'PENDING' } });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const processTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { action } = req.body;

    const transaction = await prisma.walletTransaction.findUnique({ where: { id } });
    if (!transaction || transaction.status !== 'PENDING') {
      return res.status(404).json({ error: 'المعاملة غير موجودة أو تمت معالجتها' });
    }

    await prisma.$transaction(async (tx) => {
      if (action === 'APPROVE') {
        await tx.walletTransaction.update({ where: { id }, data: { status: 'COMPLETED' } });
        if (transaction.type === 'DEPOSIT') {
          await tx.wallet.update({ where: { userId: transaction.userId }, data: { balance: { increment: transaction.amount } } });
        } else if (transaction.type === 'WITHDRAWAL') {
          await tx.wallet.update({ where: { userId: transaction.userId }, data: { lockedBalance: { decrement: transaction.amount } } });
        }
      } else if (action === 'REJECT') {
        await tx.walletTransaction.update({ where: { id }, data: { status: 'FAILED' } });
        if (transaction.type === 'WITHDRAWAL') {
          await tx.wallet.update({ where: { userId: transaction.userId }, data: { lockedBalance: { decrement: transaction.amount }, balance: { increment: transaction.amount } } });
        }
      }
    });

    const isDeposit = transaction.type === 'DEPOSIT';
    await notifyUser(
      transaction.userId,
      `تحديث ${isDeposit ? 'الإيداع' : 'السحب'}`,
      `${action === 'APPROVE' ? 'تمت الموافقة على' : 'تم رفض'} طلب $${transaction.amount}`,
      'TRANSACTION', '/wallet'
    );

    res.json({ message: `Transaction ${action.toLowerCase()}d` });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const getSetting = async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) {
      if (key === 'DEPOSIT_METHODS') return res.json({ key, value: JSON.stringify([]) });
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateSetting = async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const { value } = req.body;
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Leagues (kept for backward compat) ──────────────────────────────────────

export const getLeagues = async (_req: Request, res: Response) => {
  try {
    const leagues = await prisma.league.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leagues);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createLeague = async (req: Request, res: Response) => {
  try {
    const { name, country } = req.body;
    let logo = req.body.logo;
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      logo = `${baseUrl}/uploads/${req.file.filename}`;
    }
    if (!name) return res.status(400).json({ error: 'League name is required' });
    const existing = await prisma.league.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'League already exists' });
    const league = await prisma.league.create({ data: { name, logo, country } });
    res.status(201).json(league);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteLeague = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.league.delete({ where: { id } });
    res.json({ message: 'League deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Bets ──────────────────────────────────────────────────────────────────────

export const getAllBets = async (_req: Request, res: Response) => {
  try {
    const bets = await prisma.bet.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, username: true } },
        stream: { select: { title: true, team1Name: true, team2Name: true, streamType: true } },
        charityVote: { include: { charity: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Stream direct controls (for Admin) ──────────────────────────────────────

export const adminUpdateStream = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { team1Score, team2Score, matchPhase, liveUpdate, isKnockout, extraTimeTeam1, extraTimeTeam2, penaltiesTeam1, penaltiesTeam2, status, streamUrl, isStreamActive } = req.body;

    const updateData: any = {};
    if (team1Score !== undefined) updateData.team1Score = parseInt(team1Score);
    if (team2Score !== undefined) updateData.team2Score = parseInt(team2Score);
    if (matchPhase !== undefined) updateData.matchPhase = matchPhase;
    if (liveUpdate !== undefined) updateData.liveUpdate = liveUpdate;
    if (isKnockout !== undefined) updateData.isKnockout = Boolean(isKnockout);
    if (extraTimeTeam1 !== undefined) updateData.extraTimeTeam1 = parseInt(extraTimeTeam1);
    if (extraTimeTeam2 !== undefined) updateData.extraTimeTeam2 = parseInt(extraTimeTeam2);
    if (penaltiesTeam1 !== undefined) updateData.penaltiesTeam1 = parseInt(penaltiesTeam1);
    if (penaltiesTeam2 !== undefined) updateData.penaltiesTeam2 = parseInt(penaltiesTeam2);
    if (status !== undefined) updateData.status = status;
    if (streamUrl !== undefined) updateData.streamUrl = streamUrl;
    if (isStreamActive !== undefined) updateData.isStreamActive = Boolean(isStreamActive);

    const updated = await prisma.stream.update({ where: { id }, data: updateData });
    res.json({ message: 'تم تحديث البث', stream: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const adminDeleteStream = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.stream.delete({ where: { id } });
    res.json({ message: 'تم حذف البث' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
