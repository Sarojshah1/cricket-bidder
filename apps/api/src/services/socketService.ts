import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { AuctionRoom } from '../models/AuctionRoom';
import { Player } from '../models/Player';
import { User } from '../models/User';
import { Team } from '../models/Team';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket {
  userId: string;
  teamId?: string;
  username: string;
  role: string;
}

interface BidData {
  roomId: string;
  playerId: string;
  amount: number;
}

interface JoinRoomData {
  roomId: string;
}

export class SocketService {
  private io: SocketIOServer;
  private activeRooms: Map<string, {
    timer: NodeJS.Timeout;
    countdownInterval: NodeJS.Timeout;
    currentPlayer: string;
    timeLeft: number;
  }> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
          return next(new Error('Server misconfiguration'));
        }
        const decoded = jwt.verify(token, secret) as any;
        const user = await User.findById(decoded.userId)
          .select('_id username role teamId') as import('../models/User').IUser | null;
        
        if (!user) {
          return next(new Error('User not found'));
        }

        (socket as any).user = {
          userId: user._id.toString(),
          teamId: user.teamId?.toString(),
          username: user.username,
          role: user.role
        };

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = (socket as any).user as AuthenticatedSocket;
      console.log(`User ${user.username} connected`);

      // Chat message event
      socket.on('chat-message', async (data: { roomId: string; message: string }) => {
        try {
          const { roomId, message } = data;
          if (!roomId || !message) return;
          // Save message to DB
          const chatMsg = await (await import('../models/ChatMessage')).ChatMessage.create({
            roomId,
            senderId: user.userId,
            senderName: user.username,
            message,
            createdAt: new Date()
          });
          // Broadcast to room
          this.io.to(roomId).emit('chat-message', {
            _id: chatMsg._id,
            roomId,
            senderId: user.userId,
            senderName: user.username,
            username: user.username,
            message,
            createdAt: chatMsg.createdAt
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to send chat message' });
        }
      });

      // Join auction room
      socket.on('join-room', async (data: JoinRoomData) => {
        try {
          if (!data?.roomId) {
            socket.emit('error', { message: 'roomId is required' });
            return;
          }
          const room = await AuctionRoom.findById(data.roomId)
            .populate('currentPlayer', 'name role basePrice stats')
            .populate('players', 'name role basePrice stats') as import("../models/AuctionRoom").IAuctionRoom;

          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }
          // Allow socket to join for read-only even if not yet a member; REST join controls membership
          socket.join(data.roomId);
          socket.emit('room-joined', {
            room,
            user: {
              userId: user.userId,
              teamId: undefined,
              username: user.username,
              role: user.role
            }
          });

          // Notify others in the room
          socket.to(data.roomId).emit('user-joined', {
            username: user.username,
            teamId: user.userId
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Place bid
      socket.on('place-bid', async (data: BidData) => {
        try {
          if (!data?.roomId || !data?.playerId || typeof data?.amount !== 'number') {
            socket.emit('error', { message: 'Invalid bid payload' });
            return;
          }
          const room = await AuctionRoom.findById(data.roomId) as import("../models/AuctionRoom").IAuctionRoom | null;
          if (!room || room.status !== 'active') {
            socket.emit('error', { message: 'Auction not active' });
            return;
          }
          // Resolve the bidder's Team in this room (owner = user.userId, team _id within room.teams)
          const team = await Team.findOne({ _id: { $in: room.teams as any }, owner: user.userId }).select('_id name');
          if (!team) {
            socket.emit('error', { message: 'You must join this room to bid' });
            return;
          }

          // Validate bid amount
          // Avoid reading basePrice from room.players as they may be ObjectIds (unpopulated)
          const playerForBid = await Player.findById(data.playerId).select('basePrice');
          const currentBid = room.currentBid?.amount ?? playerForBid?.basePrice ?? 100000;
          if (data.amount <= currentBid) {
            socket.emit('error', { message: 'Bid must be higher than current bid' });
            return;
          }

          if (data.amount < currentBid + room.minBidIncrement) {
            socket.emit('error', { message: `Bid must be at least ${room.minBidIncrement} more than current bid` });
            return;
          }

          // Ensure bidding is for the current player in this room
          if (!room.currentPlayer || room.currentPlayer.toString() !== data.playerId) {
            socket.emit('error', { message: 'You can only bid on the current active player' });
            return;
          }

          // Optimistic concurrency control: use version match (__v)
          const version = (room as any).__v as number | undefined;
          const update = await AuctionRoom.findOneAndUpdate(
            { _id: room._id, __v: version },
            {
              $set: {
                currentBid: {
                  amount: data.amount,
                  teamId: team._id as any,
                  bidderId: user.userId as any,
                  timestamp: new Date()
                }
              },
              $inc: { __v: 1 },
              $push: {
                bidHistory: {
                  playerId: data.playerId as any,
                  amount: data.amount,
                  teamId: team._id as any,
                  bidderId: user.userId as any,
                  timestamp: new Date()
                }
              }
            },
            { new: true }
          );

          if (!update) {
            socket.emit('error', { message: 'Bid rejected due to a concurrent update. Try again.' });
            return;
          }

          // Reset timer
          this.resetBidTimer(data.roomId, room.timePerBid);

          // Broadcast new bid to all users in the room (include roomId)
          this.io.to(data.roomId).emit('new-bid', {
            roomId: data.roomId,
            playerId: data.playerId,
            amount: data.amount,
            teamId: String(team._id),
            bidderName: user.username,
            timestamp: new Date()
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to place bid' });
        }
      });

      // Start auction
      socket.on('start-auction', async (data: { roomId: string }) => {
        try {
          if (user.role !== 'admin') {
            socket.emit('error', { message: 'Only admins can start auctions' });
            return;
          }

          const room = await AuctionRoom.findById(data.roomId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          if (room.status !== 'waiting') {
            socket.emit('error', { message: 'Auction is not in waiting status' });
            return;
          }

          // Ensure at least 2 participants. If only one team has joined and admin wants to start,
          // auto-add the admin's team as a participant so admin can also play.
          if (!Array.isArray(room.teams)) {
            room.teams = [] as any;
          }
          if (room.teams.length < 2) {
            // find or create admin team
            let adminTeam = await Team.findOne({ owner: user.userId }).select('_id name');
            if (!adminTeam) {
              const baseName = user.username || 'Admin';
              let name = baseName;
              const taken = await Team.findOne({ name });
              if (taken) name = `${baseName}-${String(user.userId).slice(-4)}`;
              adminTeam = await Team.create({ name, owner: user.userId, budget: 1000000000, remainingBudget: 1000000000, players: [] });
            }
            const already = room.teams.some(t => t.toString() === String(adminTeam!._id));
            if (!already) room.teams.push(adminTeam._id as any);
            if (room.teams.length < 2) {
              socket.emit('error', { message: 'At least 2 participants required (admin counts if joined)' });
              return;
            }
          }

          if (!Array.isArray(room.players) || room.players.length === 0) {
            socket.emit('error', { message: 'No players available to start the auction' });
            return;
          }

          room.status = 'active';
          room.currentPlayer = room.players[0];
          await room.populate('currentPlayer', 'name role basePrice stats');
          await room.save();

          this.io.to(data.roomId).emit('auction-started', {
            roomId: data.roomId,
            room,
            currentPlayer: room.currentPlayer
          });

          // Start bid timer for first player
          this.startBidTimer(data.roomId, room.timePerBid);

        } catch (error) {
          socket.emit('error', { message: 'Failed to start auction' });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`User ${user.username} disconnected`);
      });
    });
  }

  private startBidTimer(roomId: string, duration: number) {
    // Clear existing timer
    const existing = this.activeRooms.get(roomId);
    if (existing) {
      clearTimeout(existing.timer);
      clearInterval(existing.countdownInterval);
    }

    const timer = setTimeout(async () => {
      await this.endBiddingForPlayer(roomId);
    }, duration * 1000);

    const countdownInterval = setInterval(() => {
      const room = this.activeRooms.get(roomId);
      if (room) {
        room.timeLeft--;
        this.io.to(roomId).emit('bid-timer', { timeLeft: room.timeLeft });
        if (room.timeLeft <= 0) {
          clearInterval(room.countdownInterval);
        }
      }
    }, 1000);

    this.activeRooms.set(roomId, {
      timer,
      countdownInterval,
      currentPlayer: '',
      timeLeft: duration
    });
  }

  private resetBidTimer(roomId: string, duration: number) {
    const existing = this.activeRooms.get(roomId);
    if (existing) {
      clearTimeout(existing.timer);
      existing.timeLeft = duration;
      
      const timer = setTimeout(async () => {
        await this.endBiddingForPlayer(roomId);
      }, duration * 1000);
      
      existing.timer = timer;
    }
  }

  private async endBiddingForPlayer(roomId: string) {
    try {
      const room = await AuctionRoom.findById(roomId) as import("../models/AuctionRoom").IAuctionRoom;
      if (!room || room.status !== 'active') return;

      // Award player to highest bidder
      if (room.currentBid) {
        const player = await Player.findById(room.currentPlayer);
        if (player) {
          player.isSold = true;
          player.soldTo = room.currentBid.teamId;
          player.soldPrice = room.currentBid.amount;
          await player.save();
        }
      }

      // Move to next player
      const currentPlayerIndex = room.players.findIndex(p => p.toString() === room.currentPlayer?.toString());
      const nextPlayerIndex = currentPlayerIndex + 1;

      if (currentPlayerIndex === -1) {
        // If current player is not set correctly, move to the first player
        room.currentPlayer = room.players[0];
        room.currentBid = undefined;
        await room.save();
        this.startBidTimer(roomId, room.timePerBid);
        return;
      }

      if (nextPlayerIndex < room.players.length) {
        room.currentPlayer = room.players[nextPlayerIndex];
        // Cache sold info before clearing bid to avoid TypeScript narrowing issues
        const lastSoldTo = room.currentBid?.teamId;
        const lastSoldPrice = room.currentBid?.amount;
        room.currentBid = undefined;
        await room.save();

        this.io.to(roomId).emit('player-sold', {
          roomId,
          prevPlayerId: room.players[currentPlayerIndex],
          soldTo: lastSoldTo,
          soldPrice: lastSoldPrice,
          nextPlayerId: room.players[nextPlayerIndex]
        });

        // Start timer for next player
        this.startBidTimer(roomId, room.timePerBid);
      } else {
        // Auction completed
        room.status = 'completed';
        room.endTime = new Date();
        await room.save();

        this.io.to(roomId).emit('auction-completed', {
          roomId,
          message: 'Auction completed! Calculating team rankings...'
        });

        // Calculate team rankings
        await this.calculateTeamRankings(roomId);

        // Clear timers and cleanup
        this.clearRoomTimers(roomId);
      }

    } catch (error) {
      console.error('Error ending bidding for player:', error);
    }
  }

  private async calculateTeamRankings(roomId: string) {
    try {
      const room = await AuctionRoom.findById(roomId);
      if (!room) return;

      // Users-as-teams: emit a simple ranking based on join order for now.
      const rankings = (room.teams || []).map((userId: any, idx: number) => ({
        teamId: userId,
        ranking: idx + 1,
        totalScore: 0,
        totalSpent: 0,
        remainingBudget: 0
      }));

      room.winner = rankings[0]?.teamId;
      await room.save();

      this.io.to(roomId).emit('team-rankings', {
        rankings,
        winner: room.winner
      });

    } catch (error) {
      console.error('Error calculating team rankings:', error);
    }
  }

  private calculateTeamScores(team: any) {
    let battingScore = 0;
    let bowlingScore = 0;
    let fieldingScore = 0;
    let balanceScore = 0;

    for (const player of team.players) {
      const stats = player.stats;
      
      // Batting score
      if (player.role === 'batsman' || player.role === 'all-rounder') {
        battingScore += (stats.runs || 0) * 0.1 + (stats.average || 0) * 10;
      }

      // Bowling score
      if (player.role === 'bowler' || player.role === 'all-rounder') {
        bowlingScore += (stats.wickets || 0) * 20 + (stats.economy || 0) * 5;
      }

      // Fielding score
      fieldingScore += (stats.catches || 0) * 10 + (stats.stumpings || 0) * 15;
    }

    // Balance score (bonus for well-rounded team)
    const composition = this.calculateTeamComposition(team.players);
    if (composition.batsmen >= 3 && composition.bowlers >= 3 && composition.allRounders >= 1) {
      balanceScore = 100;
    }

    return {
      battingScore: Math.round(battingScore),
      bowlingScore: Math.round(bowlingScore),
      fieldingScore: Math.round(fieldingScore),
      balanceScore,
      totalScore: Math.round(battingScore + bowlingScore + fieldingScore + balanceScore)
    };
  }

  private calculateTeamComposition(players: any[]) {
    return {
      batsmen: players.filter(p => p.role === 'batsman').length,
      bowlers: players.filter(p => p.role === 'bowler').length,
      allRounders: players.filter(p => p.role === 'all-rounder').length,
      wicketKeepers: players.filter(p => p.role === 'wicket-keeper').length
    };
  }

  public getIO() {
    return this.io;
  }

  // Public method to start auction flow when initiated via REST
  public async startAuctionFlow(roomId: string) {
    try {
      const room = await AuctionRoom.findById(roomId)
        .populate('currentPlayer', 'name role basePrice stats') as any;
      if (!room) return;
      // Broadcast start and kick off timer
      this.io.to(roomId).emit('auction-started', {
        room,
        currentPlayer: room.currentPlayer
      });
      this.startBidTimer(roomId, room.timePerBid);
    } catch (error) {
      console.error('Failed to start auction flow via REST:', error);
    }
  }

  private clearRoomTimers(roomId: string) {
    const existing = this.activeRooms.get(roomId);
    if (existing) {
      clearTimeout(existing.timer);
      clearInterval(existing.countdownInterval);
      this.activeRooms.delete(roomId);
    }
  }
}

// Singleton accessors to use SocketService from controllers (REST)
let socketServiceInstance: SocketService | null = null;
export function setSocketServiceInstance(inst: SocketService) {
  socketServiceInstance = inst;
}
export function getSocketServiceInstance(): SocketService | null {
  return socketServiceInstance;
}