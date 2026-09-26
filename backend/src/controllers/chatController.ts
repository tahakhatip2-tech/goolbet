import { Request, Response } from 'express';
import prisma from '../config/db';

// Get comments for a stream
export const getMatchComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const comments = await prisma.streamComment.findMany({
      where: { streamId: id },
      include: { user: { select: { firstName: true, username: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a comment (admin)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params as { commentId: string };
    await prisma.streamComment.delete({ where: { id: commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
