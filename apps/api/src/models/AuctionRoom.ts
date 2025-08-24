import mongoose, { Document, Schema } from 'mongoose';

export interface IAuctionRoom extends Document {
  name: string;
  description: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  currentPlayer?: mongoose.Types.ObjectId;
  players: mongoose.Types.ObjectId[];
  teams: mongoose.Types.ObjectId[];
  maxTeams: number;
  minBidIncrement: number;
  timePerBid: number; // in seconds
  currentBid?: {
    amount: number;
    teamId: mongoose.Types.ObjectId;
    bidderId: mongoose.Types.ObjectId;
    timestamp: Date;
  };
  bidHistory: Array<{
    playerId: mongoose.Types.ObjectId;
    amount: number;
    teamId: mongoose.Types.ObjectId;
    bidderId: mongoose.Types.ObjectId;
    timestamp: Date;
  }>;
  startTime: Date;
  endTime?: Date;
  winner?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const auctionRoomSchema = new Schema<IAuctionRoom>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting'
  },
  currentPlayer: {
    type: Schema.Types.ObjectId,
    ref: 'Player'
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Player'
  }],
  teams: [{
    type: Schema.Types.ObjectId,
    ref: 'Team'
  }],
  maxTeams: {
    type: Number,
    default: 8,
    min: 2,
    max: 16
  },
  minBidIncrement: {
    type: Number,
    default: 50000,
    min: 10000
  },
  timePerBid: {
    type: Number,
    default: 30, // 30 seconds per bid
    min: 10,
    max: 120
  },
  currentBid: {
    amount: {
      type: Number,
      min: 100000
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    bidderId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  bidHistory: [{
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 100000
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    bidderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'Team'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual relation: per-auction player state lives in AuctionPlayer, not in Player
// Allows reusing the same global Player pool across multiple auctions
auctionRoomSchema.virtual('auctionPlayers', {
  ref: 'AuctionPlayer',
  localField: '_id',
  foreignField: 'auctionRoomId',
  justOne: false
});

// Index for efficient queries
auctionRoomSchema.index({ status: 1, isActive: 1 });
auctionRoomSchema.index({ teams: 1 });

export const AuctionRoom = mongoose.model<IAuctionRoom>('AuctionRoom', auctionRoomSchema); 