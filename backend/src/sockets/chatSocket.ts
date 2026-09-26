import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

// Track viewers per stream room: streamId → Set of userIds/socketIds
const roomViewers = new Map<string, Set<string>>();

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
  firstName?: string;
  role?: string;
}

export function setupChatSocket(io: Server) {
  // Auth middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.userId = undefined;
      return next();
    }
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      socket.userId = decoded.id;
      socket.role = decoded.role;
      next();
    } catch {
      socket.userId = undefined;
      next();
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    // Fetch user info
    if (socket.userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: socket.userId },
          select: { firstName: true, username: true, role: true }
        });
        socket.firstName = user?.firstName || user?.username || 'مستخدم';
        socket.role = user?.role || 'USER';
      } catch {}
    }

    // Join a stream room
    socket.on('join-room', (streamId: string) => {
      socket.join(streamId);

      if (!roomViewers.has(streamId)) {
        roomViewers.set(streamId, new Set());
      }

      const viewerId = socket.userId || socket.id;
      roomViewers.get(streamId)!.add(viewerId);
      io.to(streamId).emit('viewer-count', roomViewers.get(streamId)!.size);
    });

    // Chat message
    socket.on('send-message', async ({ streamId, message }: { streamId: string; message: string }) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'يجب تسجيل الدخول للمشاركة في الدردشة' });
        return;
      }

      const trimmed = message?.trim();
      if (!trimmed || trimmed.length > 300) return;

      try {
        const comment = await prisma.streamComment.create({
          data: { streamId, userId: socket.userId, message: trimmed }
        });

        io.to(streamId).emit('new-message', {
          id: comment.id,
          userId: socket.userId,
          username: socket.firstName,
          role: socket.role,
          message: trimmed,
          createdAt: comment.createdAt
        });
      } catch (err) {
        console.error('Error saving chat message:', err);
      }
    });

    // Reaction emoji
    socket.on('reaction', ({ streamId, emoji }: { streamId: string; emoji: string }) => {
      const allowed = ['⚽', '🔥', '❤️', '😱', '👏', '😂', '🎯', '🏆'];
      if (!allowed.includes(emoji)) return;
      io.to(streamId).emit('reaction', { emoji, userId: socket.userId || socket.id });
    });

    // Live score update (أكاديمية/أدمن فقط يرسل، الجميع يستقبل)
    socket.on('score-update', (data: { streamId: string; team1Score: number; team2Score: number; matchPhase?: string; liveUpdate?: string }) => {
      if (!['ACADEMY', 'ADMIN', 'SUPER_ADMIN'].includes(socket.role || '')) return;
      io.to(data.streamId).emit('score-update', data);
    });

    // Stream status change
    socket.on('stream-status', (data: { streamId: string; status: string; streamUrl?: string }) => {
      if (!['ACADEMY', 'ADMIN', 'SUPER_ADMIN'].includes(socket.role || '')) return;
      io.to(data.streamId).emit('stream-status', data);
    });

    // Question in podcast/training
    socket.on('ask-question', async ({ streamId, question }: { streamId: string; question: string }) => {
      if (!socket.userId) return;
      const trimmed = question?.trim();
      if (!trimmed || trimmed.length > 300) return;

      io.to(streamId).emit('new-question', {
        userId: socket.userId,
        username: socket.firstName,
        question: trimmed,
        createdAt: new Date()
      });
    });

    // Leave room
    socket.on('leave-room', (streamId: string) => {
      socket.leave(streamId);
      const viewerId = socket.userId || socket.id;
      roomViewers.get(streamId)?.delete(viewerId);
      io.to(streamId).emit('viewer-count', roomViewers.get(streamId)?.size || 0);
    });

    // Disconnect
    socket.on('disconnect', () => {
      roomViewers.forEach((viewers, streamId) => {
        const viewerId = socket.userId || socket.id;
        if (viewers.has(viewerId)) {
          viewers.delete(viewerId);
          io.to(streamId).emit('viewer-count', viewers.size);
        }
      });
    });
  });
}
