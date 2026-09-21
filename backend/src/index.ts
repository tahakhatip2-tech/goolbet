import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupChatSocket } from './sockets/chatSocket';
import { syncLiveMatches } from './cron/liveSync';

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupChatSocket(io);

// Start live sync every minute
setInterval(() => {
  syncLiveMatches(io);
}, 60000); // 60,000 ms = 1 minute

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
