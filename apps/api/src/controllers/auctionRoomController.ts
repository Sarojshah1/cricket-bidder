import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuctionRoom } from '../models/AuctionRoom';
import { getSocketServiceInstance } from '../services/socketService';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { TeamComparison } from '../models/TeamComparison';
import { createError } from '../middleware/errorHandler';

// Create new auction room
export const createAuctionRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: { message: errors.array()[0].msg } 
      });
    }

    const { name, description, startTime, maxTeams, minBidIncrement, timePerBid } = req.body;

    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can create auction rooms' }
      });
    }

    // Load all active players to prefill the room
    const allPlayers = await Player.find({ isActive: true }).select('_id');
    const playerIds = allPlayers.map(p => p._id);

    const auctionRoom = new AuctionRoom({
      name,
      description,
      startTime: new Date(startTime),
      maxTeams: maxTeams || 8,
      minBidIncrement: minBidIncrement || 50000,
      timePerBid: timePerBid || 30,
      status: 'waiting',
      players: playerIds,
      teams: []
    });

    await auctionRoom.save();

    res.status(201).json({
      success: true,
      data: { auctionRoom }
    });
  } catch (error) {
    next(error);
  }
};

// Join auction room as the current user (user becomes a team entry)
export const joinAuctionRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.userId as any;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    const auctionRoom = await AuctionRoom.findById(roomId);
    if (!auctionRoom) {
      return res.status(404).json({
        success: false,
        error: { message: 'Auction room not found' }
      });
    }

    if (auctionRoom.status === 'cancelled' || auctionRoom.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot join a cancelled or completed auction' }
      });
    }

    // Ensure a Team exists for this user; create if needed
    const user = await User.findById(userId).select('username');
    const username = user?.username || 'User';
    let team = await Team.findOne({ owner: userId });
    if (!team) {
      // If username is taken due to unique constraint, append suffix
      let name = username;
      const exists = await Team.findOne({ name });
      if (exists) {
        name = `${username}-${String(userId).slice(-4)}`;
      }
      team = await Team.create({
        name,
        owner: userId,
        budget: 1000000000, // 100 cr
        remainingBudget: 1000000000,
        players: []
      });
    }

    const teamId = String(team._id);
    const alreadyJoined = auctionRoom.teams.some(t => t.toString() === teamId);
    if (!alreadyJoined) {
      if (auctionRoom.teams.length >= auctionRoom.maxTeams) {
        return res.status(400).json({
          success: false,
          error: { message: `Maximum ${auctionRoom.maxTeams} teams already joined` }
        });
      }
      auctionRoom.teams.push(team._id as any);
      await auctionRoom.save();
    }

    const populated = await AuctionRoom.findById(auctionRoom._id)
      .populate('teams', 'name owner budget remainingBudget')
      .populate('currentPlayer', 'name role basePrice stats')
      .populate('players', 'name role basePrice stats isSold soldTo soldPrice')
      .populate('winner', 'name');

    res.json({
      success: true,
      data: { auctionRoom: populated }
    });
  } catch (error) {
    next(error);
  }
};

// Get all auction rooms
export const getAuctionRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query: any = { isActive: true };
    if (status) {
      query.status = status;
    }

    const auctionRooms = await AuctionRoom.find(query)
      .populate('teams', 'name owner budget remainingBudget')
      .populate('currentPlayer', 'name role basePrice')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await AuctionRoom.countDocuments(query);

    res.json({
      success: true,
      data: {
        auctionRooms,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single auction room
export const getAuctionRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const auctionRoom = await AuctionRoom.findById(id)
      .populate('teams', 'name owner budget remainingBudget')
      .populate('currentPlayer', 'name role basePrice currentPrice stats age nationality battingStyle bowlingStyle imageUrl isSold soldTo soldPrice')
      .populate('players', 'name role basePrice stats isSold soldTo soldPrice')
      .populate('winner', 'name');

    if (!auctionRoom) {
      return res.status(404).json({
        success: false,
        error: { message: 'Auction room not found' }
      });
    }

    res.json({
      success: true,
      data: { auctionRoom }
    });
  } catch (error) {
    next(error);
  }
};

// Add teams to auction room
export const addTeamsToRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { teamIds } = req.body;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can add teams to auction rooms' }
      });
    }

    const auctionRoom = await AuctionRoom.findById(roomId);
    if (!auctionRoom) {
      return res.status(404).json({
        success: false,
        error: { message: 'Auction room not found' }
      });
    }

    if (auctionRoom.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot add teams to active or completed auction' }
      });
    }

    // Validate team IDs
    const teams = await Team.find({ _id: { $in: teamIds } });
    if (teams.length !== teamIds.length) {
      return res.status(400).json({
        success: false,
        error: { message: 'Some teams not found' }
      });
    }

    // Check if teams are already in the room
    const existingTeams = auctionRoom.teams.map(t => t.toString());
    const newTeams = teamIds.filter((id: string) => !existingTeams.includes(id));

    if (auctionRoom.teams.length + newTeams.length > auctionRoom.maxTeams) {
      return res.status(400).json({
        success: false,
        error: { message: `Maximum ${auctionRoom.maxTeams} teams allowed` }
      });
    }

    auctionRoom.teams.push(...newTeams);
    await auctionRoom.save();

    res.json({
      success: true,
      data: { auctionRoom }
    });
  } catch (error) {
    next(error);
  }
};

// Add players to auction room
export const addPlayersToRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { playerIds } = req.body;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can add players to auction rooms' }
      });
    }

    const auctionRoom = await AuctionRoom.findById(roomId);
    if (!auctionRoom) {
      return res.status(404).json({
        success: false,
        error: { message: 'Auction room not found' }
      });
    }

    if (auctionRoom.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot add players to active or completed auction' }
      });
    }

    // Validate player IDs
    const players = await Player.find({ _id: { $in: playerIds } });
    if (players.length !== playerIds.length) {
      return res.status(400).json({
        success: false,
        error: { message: 'Some players not found' }
      });
    }

    // Check if players are already in the room
    const existingPlayers = auctionRoom.players.map(p => p.toString());
    const newPlayers = playerIds.filter((id: string) => !existingPlayers.includes(id));

    auctionRoom.players.push(...newPlayers);
    await auctionRoom.save();

    res.json({
      success: true,
      data: { auctionRoom }
    });
  } catch (error) {
    next(error);
  }
};

// Start auction
export const startAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can start auctions' }
      });
    }

    const auctionRoom = await AuctionRoom.findById(roomId);
    if (!auctionRoom) {
      return res.status(404).json({
        success: false,
        error: { message: 'Auction room not found' }
      });
    }

    if (auctionRoom.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        error: { message: 'Auction is not in waiting status' }
      });
    }

    // Ensure at least 2 participants. If only one team has joined and admin wants to start,
    // auto-add the admin's team as a participant so admin can also play.
    if (auctionRoom.teams.length < 2) {
      const adminId = req.user?.userId as any;
      if (req.user?.role === 'admin' && adminId) {
        let adminTeam = await Team.findOne({ owner: adminId }).select('_id name');
        if (!adminTeam) {
          const adminUser = await User.findById(adminId).select('username');
          const baseName = adminUser?.username || 'Admin';
          let name = baseName as string;
          const taken = await Team.findOne({ name });
          if (taken) name = `${baseName}-${String(adminId).slice(-4)}`;
          adminTeam = await Team.create({ name, owner: adminId, budget: 1000000000, remainingBudget: 1000000000, players: [] });
        }
        const already = auctionRoom.teams.some(t => t.toString() === String(adminTeam!._id));
        if (!already) auctionRoom.teams.push(adminTeam._id as any);
      }
      if (auctionRoom.teams.length < 2) {
        return res.status(400).json({
          success: false,
          error: { message: 'At least 2 participants required (admin counts if joined)' }
        });
      }
    }

    if (auctionRoom.players.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No players added to auction' }
      });
    }

    auctionRoom.status = 'active';
    auctionRoom.currentPlayer = auctionRoom.players[0];
    await auctionRoom.save();

    // Also notify via socket and start timer when started via REST
    const sock = getSocketServiceInstance();
    if (sock) {
      // Fire and forget; no need to await
      sock.startAuctionFlow(String(auctionRoom._id));
    }

    res.json({
      success: true,
      data: { auctionRoom }
    });
  } catch (error) {
    next(error);
  }
};

// Get team rankings for auction room
export const getTeamRankings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;

    const rankings = await TeamComparison.find({ 
      auctionRoomId: roomId,
      isActive: true 
    })
    .populate('teamId', 'name owner')
    .sort({ ranking: 1 });

    res.json({
      success: true,
      data: { rankings }
    });
  } catch (error) {
    next(error);
  }
};

// Get bid history for auction room
export const getBidHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;

    const auctionRoom = await AuctionRoom.findById(roomId)
      .populate('bidHistory.playerId', 'name role')
      .populate('bidHistory.teamId', 'name')
      .populate('bidHistory.bidderId', 'username');

    if (!auctionRoom) {
      return res.status(404).json({
        success: false,
        error: { message: 'Auction room not found' }
      });
    }

    res.json({
      success: true,
      data: { bidHistory: auctionRoom.bidHistory }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel auction room
export const cancelAuctionRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only admins can cancel auction rooms' }
      });
    }

    const auctionRoom = await AuctionRoom.findById(roomId);
    if (!auctionRoom) {
      return res.status(404).json({
        success: false,
        error: { message: 'Auction room not found' }
      });
    }

    if (auctionRoom.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot cancel completed auction' }
      });
    }

    auctionRoom.status = 'cancelled';
    await auctionRoom.save();

    res.json({
      success: true,
      data: { auctionRoom }
    });
  } catch (error) {
    next(error);
  }
}; 