import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/db';

// Legacy bet placement - redirects to stream betting
export const placeBet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { streamId, matchId, selection, stake, useBonus, charityOptionId } = req.body;
    const targetStreamId = streamId || matchId;

    if (!targetStreamId) return res.status(400).json({ error: 'streamId is required' });
    if (stake <= 0) return res.status(400).json({ error: 'يجب أن يكون مبلغ الرهان أكبر من 0' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return res.status(403).json({ error: 'عذراً، حسابك موقوف مؤقتاً.' });

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('لم يتم العثور على المحفظة');

      if (useBonus) {
        if (wallet.bonusBalance < stake) throw new Error('رصيد البونص غير كافٍ');
      } else {
        if (wallet.balance < stake) throw new Error('الرصيد غير كافٍ');
      }

      const stream = await tx.stream.findUnique({
        where: { id: targetStreamId },
        include: { odds: { where: { isActive: true } } }
      });

      if (!stream) throw new Error('المباراة غير موجودة');
      if (stream.streamType !== 'MATCH') throw new Error('الرهان متاح فقط للمباريات');
      if (stream.status !== 'SCHEDULED') throw new Error('تم إغلاق الرهان لهذه المباراة');

      const currentOdds = stream.odds[0];
      if (!currentOdds) throw new Error('الاحتمالات غير متوفرة حالياً');

      let oddsAtBet = 0;
      if (selection === 'TEAM_1_WIN') oddsAtBet = currentOdds.team1Win;
      else if (selection === 'DRAW') oddsAtBet = currentOdds.draw;
      else if (selection === 'TEAM_2_WIN') oddsAtBet = currentOdds.team2Win;
      if (oddsAtBet <= 1) throw new Error('احتمالات غير صالحة');

      const potentialPayout = stake * oddsAtBet;

      if (useBonus) {
        await tx.wallet.update({ where: { userId }, data: { bonusBalance: { decrement: stake }, lockedBonusBalance: { increment: stake } } });
      } else {
        await tx.wallet.update({ where: { userId }, data: { balance: { decrement: stake }, lockedBalance: { increment: stake } } });
      }

      await tx.walletTransaction.create({
        data: { userId, type: 'BET_PLACED', amount: -stake, status: 'COMPLETED', details: `Bet placed on stream ${targetStreamId}` }
      });

      const bet = await tx.bet.create({
        data: { userId, streamId: targetStreamId, selection, stake, oddsAtBet, potentialPayout, isBonus: useBonus || false, status: 'PENDING', charityOptionId: charityOptionId || null }
      });

      return bet;
    });

    res.status(201).json({ message: 'Bet confirmed', bet: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Server error' });
  }
};

export const getUserBets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const bets = await prisma.bet.findMany({
      where: { userId },
      include: {
        stream: { select: { title: true, team1Name: true, team2Name: true, status: true, streamType: true } },
        charityVote: { include: { charity: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
