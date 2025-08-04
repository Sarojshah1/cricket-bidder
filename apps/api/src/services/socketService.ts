import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { AuctionRoom } from '../models/AuctionRoom';
import { TeamComparison } from '../models/TeamComparison';
import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { User } from '../models/User';
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
    currentPlayer: string;
    timeLeft: number;
  }> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        const user = await User.findById(decoded.userId).select('username role teamId');
        
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

      // Join auction room
      socket.on('join-room', async (data: JoinRoomData) => {
        try {
          const room = await AuctionRoom.findById(data.roomId)
            .populate('teams', 'name owner')
            .populate('currentPlayer', 'name role basePrice stats')
            .populate('players', 'name role basePrice stats');

          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          // Check if user's team is in the room
          if (user.teamId && !room.teams.some(team => team._id.toString() === user.teamId)) {
            socket.emit('error', { message: 'Your team is not in this auction room' });
            return;
          }

          socket.join(data.roomId);
          socket.emit('room-joined', {
            room,
            user: {
              userId: user.userId,
              teamId: user.teamId,
              username: user.username,
              role: user.role
            }
          });

          // Notify others in the room
          socket.to(data.roomId).emit('user-joined', {
            username: user.username,
            teamId: user.teamId
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Place bid
      socket.on('place-bid', async (data: BidData) => {
        try {
          const room = await AuctionRoom.findById(data.roomId);
          if (!room || room.status !== 'active') {
            socket.emit('error', { message: 'Auction not active' });
            return;
          }

          if (!user.teamId) {
            socket.emit('error', { message: 'You must be a team owner to bid' });
            return;
          }

          // Validate bid amount
          const currentBid = room.currentBid?.amount || room.players.find(p => p.toString() === data.playerId)?.basePrice || 100000;
          if (data.amount <= currentBid) {
            socket.emit('error', { message: 'Bid must be higher than current bid' });
            return;
          }

          if (data.amount < currentBid + room.minBidIncrement) {
            socket.emit('error', { message: `Bid must be at least ${room.minBidIncrement} more than current bid` });
            return;
          }

          // Check team budget
          const team = await Team.findById(user.teamId);
          if (!team || team.remainingBudget < data.amount) {
            socket.emit('error', { message: 'Insufficient budget' });
            return;
          }

          // Update current bid
          room.currentBid = {
            amount: data.amount,
            teamId: user.teamId as any,
            bidderId: user.userId as any,
            timestamp: new Date()
          };

          // Add to bid history
          room.bidHistory.push({
            playerId: data.playerId as any,
            amount: data.amount,
            teamId: user.teamId as any,
            bidderId: user.userId as any,
            timestamp: new Date()
          });

          await room.save();

          // Reset timer
          this.resetBidTimer(data.roomId, room.timePerBid);

          // Broadcast new bid to all users in the room
          this.io.to(data.roomId).emit('new-bid', {
            playerId: data.playerId,
            amount: data.amount,
            teamId: user.teamId,
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

          room.status = 'active';
          room.currentPlayer = room.players[0];
          await room.save();

          this.io.to(data.roomId).emit('auction-started', {
            room,
            currentPlayer: room.players[0]
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
    }

    const timer = setTimeout(async () => {
      await this.endBiddingForPlayer(roomId);
    }, duration * 1000);

    this.activeRooms.set(roomId, {
      timer,
      currentPlayer: '',
      timeLeft: duration
    });

    // Send countdown updates
    const countdownInterval = setInterval(() => {
      const room = this.activeRooms.get(roomId);
      if (room) {
        room.timeLeft--;
        this.io.to(roomId).emit('bid-timer', { timeLeft: room.timeLeft });
        
        if (room.timeLeft <= 0) {
          clearInterval(countdownInterval);
        }
      }
    }, 1000);
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
      const room = await AuctionRoom.findById(roomId);
      if (!room || room.status !== 'active') return;

      // Award player to highest bidder
      if (room.currentBid) {
        const player = await Player.findById(room.currentPlayer);
        if (player) {
          player.isSold = true;
          player.soldTo = room.currentBid.teamId;
          player.soldPrice = room.currentBid.amount;
          await player.save();

          // Update team budget
          const team = await Team.findById(room.currentBid.teamId);
          if (team) {
            team.remainingBudget -= room.currentBid.amount;
            team.players.push(room.currentPlayer!);
            await team.save();
          }
        }
      }

      // Move to next player
      const currentPlayerIndex = room.players.findIndex(p => p.toString() === room.currentPlayer?.toString());
      const nextPlayerIndex = currentPlayerIndex + 1;

      if (nextPlayerIndex < room.players.length) {
        room.currentPlayer = room.players[nextPlayerIndex];
        room.currentBid = undefined;
        await room.save();

        this.io.to(roomId).emit('player-sold', {
          playerId: room.players[currentPlayerIndex],
          soldTo: room.currentBid?.teamId,
          soldPrice: room.currentBid?.amount,
          nextPlayer: room.players[nextPlayerIndex]
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
      }

    } catch (error) {
      console.error('Error ending bidding for player:', error);
    }
  }

  private async calculateTeamRankings(roomId: string) {
    try {
      const room = await AuctionRoom.findById(roomId).populate('teams');
      if (!room) return;

      const teamComparisons = [];

      for (const team of room.teams) {
        const teamData = await Team.findById(team._id).populate('players');
        if (!teamData) continue;

        // Calculate team scores
        const scores = this.calculateTeamScores(teamData);
        
        const comparison = new TeamComparison({
          auctionRoomId: roomId,
          teamId: team._id,
          totalSpent: 10000000 - teamData.remainingBudget,
          remainingBudget: teamData.remainingBudget,
          players: teamData.players.map(player => ({
            playerId: player._id,
            purchasePrice: player.soldPrice || 0,
            playerStats: player.stats
          })),
          teamScore: scores,
          teamComposition: this.calculateTeamComposition(teamData.players),
          ranking: 0
        });

        await comparison.save();
        teamComparisons.push(comparison);
      }

      // Sort by total score and assign rankings
      teamComparisons.sort((a, b) => b.teamScore.totalScore - a.teamScore.totalScore);
      
      for (let i = 0; i < teamComparisons.length; i++) {
        teamComparisons[i].ranking = i + 1;
        await teamComparisons[i].save();
      }

      // Determine winner
      const winner = teamComparisons[0];
      room.winner = winner.teamId;
      await room.save();

      // Broadcast rankings
      this.io.to(roomId).emit('team-rankings', {
        rankings: teamComparisons.map(tc => ({
          teamId: tc.teamId,
          ranking: tc.ranking,
          totalScore: tc.teamScore.totalScore,
          totalSpent: tc.totalSpent,
          remainingBudget: tc.remainingBudget
        })),
        winner: winner.teamId
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
} 