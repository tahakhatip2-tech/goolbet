import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// جلب كل الجمعيات الخيرية
export const getAllCharities = async (_req: Request, res: Response) => {
  try {
    const charities = await prisma.charity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, description: true, logo: true, totalReceived: true,
        _count: { select: { votes: true } }
      }
    });
    res.json(charities);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// جلب خيارات الجمعيات لبث معين
export const getStreamCharityPool = async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params as { streamId: string };

    const pool = await prisma.charityPool.findUnique({
      where: { streamId },
      include: {
        options: {
          include: {
            charity: { select: { id: true, name: true, logo: true, description: true } },
            _count: { select: { votes: true } }
          }
        }
      }
    });

    if (!pool) return res.status(404).json({ error: 'لا يوجد تجمع خيري لهذا البث' });
    res.json(pool);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// إنشاء جمعية خيرية (أدمن فقط)
export const createCharity = async (req: Request, res: Response) => {
  try {
    const { name, description, logo } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم الجمعية مطلوب' });

    const charity = await prisma.charity.create({
      data: { name, description: description || null, logo: logo || null }
    });
    res.status(201).json(charity);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// تحديث جمعية خيرية (أدمن)
export const updateCharity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, logo, isActive } = req.body;

    const charity = await prisma.charity.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(logo !== undefined && { logo }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });
    res.json(charity);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// حذف جمعية خيرية (أدمن)
export const deleteCharity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.charity.delete({ where: { id } });
    res.json({ message: 'تم حذف الجمعية' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// توزيع الأرباح على الجمعيات بعد انتهاء المباراة (يُستدعى داخلياً)
export const distributeCharityWinnings = async (streamId: string, winningBets: { betId: string, payout: number }[]) => {
  try {
    const pool = await prisma.charityPool.findUnique({
      where: { streamId },
      include: { votes: true }
    });
    if (!pool) return;

    const CHARITY_PERCENTAGE = 0.10; // 10% من الأرباح تذهب للجمعية

    for (const { betId, payout } of winningBets) {
      const vote = pool.votes.find(v => v.betId === betId);
      if (!vote) continue;

      const charityAmount = payout * CHARITY_PERCENTAGE;

      await prisma.$transaction([
        prisma.charityVote.update({
          where: { betId },
          data: { amount: charityAmount, isPaid: true }
        }),
        prisma.charityOption.update({
          where: { id: vote.charityOptionId },
          data: { totalVotes: { increment: charityAmount } }
        }),
        prisma.charity.update({
          where: { id: vote.charityId },
          data: { totalReceived: { increment: charityAmount } }
        }),
        prisma.charityPool.update({
          where: { id: pool.id },
          data: { totalPool: { increment: charityAmount } }
        })
      ]);
    }
  } catch (error) {
    console.error('Error distributing charity winnings:', error);
  }
};
