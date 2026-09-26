import { Request, Response } from 'express';
import prisma from '../config/db';

// Legacy endpoints - now redirected to streams
export const getMatches = async (_req: Request, res: Response) => {
  try {
    const streams = await prisma.stream.findMany({
      where: { streamType: 'MATCH', status: { in: ['SCHEDULED', 'LIVE'] } },
      include: { odds: { where: { isActive: true } }, academy: { select: { name: true, logo: true } } },
      orderBy: { scheduledAt: 'asc' }
    });
    res.json(streams);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const getMatchById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const stream = await prisma.stream.findUnique({
      where: { id },
      include: { odds: { where: { isActive: true } }, academy: { select: { name: true, logo: true } } }
    });
    if (!stream) return res.status(404).json({ error: 'Not found' });
    res.json(stream);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
