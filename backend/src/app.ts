import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import streamRoutes from './routes/streamRoutes';
import academyRoutes from './routes/academyRoutes';
import charityRoutes from './routes/charityRoutes';
import adminRoutes from './routes/adminRoutes';
import walletRoutes from './routes/walletRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import apiFootballRoutes from './routes/apiFootballRoutes';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
app.use(express.json());

// Serve local uploads (dev only)
if (!process.env.VERCEL) {
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/academies', academyRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/admin/api-football', apiFootballRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Academy SaaS API is running 🚀', env: process.env.NODE_ENV });
});

export default app;
