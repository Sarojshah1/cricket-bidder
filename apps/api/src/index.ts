import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { SocketService, setSocketServiceInstance } from './services/socketService';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import playerRoutes from './routes/players';
import teamRoutes from './routes/teams';
import auctionRoutes from './routes/auctions';
import bidRoutes from './routes/bids';
import auctionRoomRoutes from './routes/auctionRooms';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5001;

// Validate required env variables
const requiredEnvs = ['MONGODB_URI', 'JWT_SECRET'];
const missing = requiredEnvs.filter((k) => !process.env[k]);
if (missing.length) {
  // Fail fast on misconfiguration
  // eslint-disable-next-line no-console
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// Initialize Socket.IO service
const socketService = new SocketService(server);
setSocketServiceInstance(socketService);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/auction-rooms', auctionRoomRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Cricket Bidder API is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server ready for real-time bidding`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 