import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
}

interface UseMatchChatOptions {
  matchId: string;
  token?: string | null;
  initialMessages?: ChatMessage[];
}

export function useMatchChat({ matchId, token, initialMessages = [] }: UseMatchChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [viewerCount, setViewerCount] = useState(0);
  const [reactions, setReactions] = useState<{ emoji: string; id: string }[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token: token || undefined },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', matchId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('viewer-count', (count: number) => {
      setViewerCount(count);
    });

    socket.on('reaction', ({ emoji, userId }: { emoji: string; userId: string }) => {
      const id = `${Date.now()}-${userId}`;
      setReactions(prev => [...prev, { emoji, id }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 2500);
    });

    socket.on('error', (err: { message: string }) => {
      console.error('Socket error:', err.message);
    });

    return () => {
      socket.emit('leave-room', matchId);
      socket.disconnect();
    };
  }, [matchId, token]);

  const sendMessage = (message: string) => {
    socketRef.current?.emit('send-message', { matchId, message });
  };

  const sendReaction = (emoji: string) => {
    socketRef.current?.emit('reaction', { matchId, emoji });
  };

  return { messages, viewerCount, reactions, connected, sendMessage, sendReaction };
}
