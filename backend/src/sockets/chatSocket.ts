import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

// Track viewers per match room: matchId → Set of userIds
const roomViewers = new Map<string, Set<string>>();

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
  firstName?: string;
}

export function setupChatSocket(io: Server) {
  // Auth middleware - verify JWT on connection
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow anonymous viewing (but no chat)
      socket.userId = undefined;
      return next();
    }
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      socket.userId = undefined;
      next();
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    // Fetch user info if authenticated
    if (socket.userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: socket.userId },
          select: { firstName: true, username: true }
        });
        socket.firstName = user?.firstName || user?.username || 'مستخدم';
      } catch {}
    }

    // Join a match room
    socket.on('join-room', (matchId: string) => {
      socket.join(matchId);

      if (!roomViewers.has(matchId)) {
        roomViewers.set(matchId, new Set());
      }

      const viewerId = socket.userId || socket.id;
      roomViewers.get(matchId)!.add(viewerId);

      // Broadcast updated viewer count
      io.to(matchId).emit('viewer-count', roomViewers.get(matchId)!.size);
    });

    // Send a chat message
    socket.on('send-message', async ({ matchId, message }: { matchId: string; message: string }) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'يجب تسجيل الدخول للمشاركة في الدردشة' });
        return;
      }

      const trimmed = message?.trim();
      if (!trimmed || trimmed.length > 200) return;

      try {
        // Save to DB
        const comment = await prisma.matchComment.create({
          data: {
            matchId,
            userId: socket.userId,
            message: trimmed
          }
        });

        // Broadcast to all in room
        io.to(matchId).emit('new-message', {
          id: comment.id,
          userId: socket.userId,
          username: socket.firstName,
          message: trimmed,
          createdAt: comment.createdAt
        });
      } catch (err) {
        console.error('Error saving chat message:', err);
      }
    });

    // Send a reaction emoji
    socket.on('reaction', ({ matchId, emoji }: { matchId: string; emoji: string }) => {
      const allowed = ['⚽', '🔥', '❤️', '😱', '👏', '😂'];
      if (!allowed.includes(emoji)) return;
      io.to(matchId).emit('reaction', { emoji, userId: socket.userId || socket.id });
    });

    // Leave room
    socket.on('leave-room', (matchId: string) => {
      socket.leave(matchId);
      const viewerId = socket.userId || socket.id;
      roomViewers.get(matchId)?.delete(viewerId);
      io.to(matchId).emit('viewer-count', roomViewers.get(matchId)?.size || 0);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      roomViewers.forEach((viewers, matchId) => {
        const viewerId = socket.userId || socket.id;
        if (viewers.has(viewerId)) {
          viewers.delete(viewerId);
          io.to(matchId).emit('viewer-count', viewers.size);
        }
      });
    });
  });
}
