import mongoose, { Document, Schema } from 'mongoose';

export interface IBid extends Document {
  auctionId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  bidderId: mongoose.Types.ObjectId;
  amount: number;
  status: 'active' | 'outbid' | 'won' | 'cancelled';
  isWinningBid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new Schema<IBid>({
  auctionId: {
    type: Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  playerId: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: true
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
  amount: {
    type: Number,
    required: true,
    min: 100000
  },
  status: {
    type: String,
    enum: ['active', 'outbid', 'won', 'cancelled'],
    default: 'active'
  },
  isWinningBid: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
bidSchema.index({ auctionId: 1, playerId: 1, amount: -1 });
bidSchema.index({ teamId: 1, status: 1 });

export const Bid = mongoose.model<IBid>('Bid', bidSchema); 