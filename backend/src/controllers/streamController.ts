import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// جلب كل البثوث (للمستخدمين)
export const getAllStreams = async (req: Request, res: Response) => {
  try {
    const { type, status, academyId } = req.query;

    const where: any = {};
    if (type) where.streamType = type;
    if (academyId) where.academyId = academyId;

    if (status) {
      where.status = status;
    } else {
      // افتراضياً: اعرض المجدولة والمباشرة والمنتهية
      where.status = { in: ['SCHEDULED', 'LIVE', 'ENDED'] };
    }

    const streams = await prisma.stream.findMany({
      where,
      include: {
        academy: {
          select: { id: true, name: true, logo: true, isVerified: true }
        },
        odds: { where: { isActive: true } },
        charityPool: {
          include: {
            options: { include: { charity: { select: { id: true, name: true, logo: true } } } }
          }
        },
        _count: { select: { bets: true, comments: true } }
      },
      orderBy: [
        { status: 'asc' },  // LIVE أولاً
        { scheduledAt: 'asc' }
      ]
    });

    res.json(streams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// جلب بث واحد بالتفصيل
export const getStreamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const stream = await prisma.stream.findUnique({
      where: { id },
      include: {
        academy: {
          select: { id: true, name: true, logo: true, city: true, country: true, isVerified: true }
        },
        odds: { where: { isActive: true } },
        charityPool: {
          include: {
            options: {
              include: {
                charity: { select: { id: true, name: true, logo: true, description: true } },
                _count: { select: { votes: true } }
              }
            }
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { id: true, firstName: true, username: true } } }
        },
        _count: { select: { bets: true } }
      }
    });

    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    res.json(stream);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// جلب البثوث الحية الآن
export const getLiveStreams = async (_req: Request, res: Response) => {
  try {
    const streams = await prisma.stream.findMany({
      where: { status: 'LIVE' },
      include: {
        academy: { select: { id: true, name: true, logo: true } },
        odds: { where: { isActive: true } },
        _count: { select: { comments: true, bets: true } }
      },
      orderBy: { startedAt: 'desc' }
    });
    res.json(streams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// رهان المستخدم على بث
export const placeBetOnStream = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { streamId, selection, stake, useBonus, charityOptionId } = req.body;

    if (!stake || stake <= 0) return res.status(400).json({ error: 'مبلغ الرهان غير صالح' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return res.status(403).json({ error: 'الحساب موقوف' });

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('المحفظة غير موجودة');

      if (useBonus) {
        if (wallet.bonusBalance < stake) throw new Error('رصيد البونص غير كافٍ');
      } else {
        if (wallet.balance < stake) throw new Error('الرصيد غير كافٍ');
      }

      const stream = await tx.stream.findUnique({
        where: { id: streamId },
        include: { odds: { where: { isActive: true } } }
      });

      if (!stream) throw new Error('البث غير موجود');
      if (stream.streamType !== 'MATCH') throw new Error('الرهان متاح فقط للمباريات');
      if (stream.status !== 'SCHEDULED') throw new Error('الرهان مغلق لهذا البث');

      const currentOdds = stream.odds[0];
      if (!currentOdds) throw new Error('الاحتمالات غير متوفرة');

      let oddsAtBet = 0;
      if (selection === 'TEAM_1_WIN') oddsAtBet = currentOdds.team1Win;
      else if (selection === 'DRAW') oddsAtBet = currentOdds.draw;
      else if (selection === 'TEAM_2_WIN') oddsAtBet = currentOdds.team2Win;

      if (oddsAtBet <= 1) throw new Error('احتمالات غير صالحة');

      const potentialPayout = stake * oddsAtBet;

      // خصم الرصيد
      if (useBonus) {
        await tx.wallet.update({ where: { userId }, data: { bonusBalance: { decrement: stake }, lockedBonusBalance: { increment: stake } } });
      } else {
        await tx.wallet.update({ where: { userId }, data: { balance: { decrement: stake }, lockedBalance: { increment: stake } } });
      }

      await tx.walletTransaction.create({
        data: { userId, type: 'BET_PLACED', amount: -stake, status: 'COMPLETED', details: `رهان على: ${stream.title}` }
      });

      const bet = await tx.bet.create({
        data: { userId, streamId, selection, stake, oddsAtBet, potentialPayout, isBonus: useBonus || false, status: 'PENDING', charityOptionId: charityOptionId || null }
      });

      // تسجيل التصويت الخيري
      if (charityOptionId) {
        const charityOption = await tx.charityOption.findFirst({
          where: { id: charityOptionId },
          include: { pool: true }
        });
        if (charityOption) {
          await tx.charityVote.create({
            data: {
              poolId: charityOption.poolId,
              userId,
              charityId: charityOption.charityId,
              charityOptionId,
              betId: bet.id,
              amount: 0 // سيُحدَّث عند الفوز
            }
          });
        }
      }

      return bet;
    });

    res.status(201).json({ message: 'تم تأكيد الرهان ✅', bet: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Server error' });
  }
};

// رهانات المستخدم
export const getMyBets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const bets = await prisma.bet.findMany({
      where: { userId },
      include: {
        stream: {
          select: { id: true, title: true, streamType: true, status: true, team1Name: true, team2Name: true, academy: { select: { name: true } } }
        },
        charityVote: { include: { charity: { select: { name: true, logo: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
