import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import './db/database.js'; // initialize DB + seed

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import channelRoutes from './routes/channels.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import { registerSocketHandlers } from './socket/handlers.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`AI classification: ${process.env.ANTHROPIC_API_KEY ? 'Claude API' : 'keyword fallback'}`);
});
