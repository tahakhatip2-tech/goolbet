import { Request, Response } from 'express';
import prisma from '../config/db';

// Get last 100 comments for a match
export const getMatchComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const comments = await prisma.matchComment.findMany({
      where: { matchId: id },
      include: {
        user: { select: { firstName: true, username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    // Return in chronological order (oldest first for chat display)
    res.json(comments.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching comments' });
  }
};

// Admin: Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params as { commentId: string };
    await prisma.matchComment.delete({ where: { id: commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting comment' });
  }
};
