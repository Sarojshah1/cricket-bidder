import mongoose, { Document, Schema } from 'mongoose';

export interface IAuction extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  players: mongoose.Types.ObjectId[];
  currentPlayer?: mongoose.Types.ObjectId;
  minBidIncrement: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const auctionSchema = new Schema<IAuction>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Player'
  }],
  currentPlayer: {
    type: Schema.Types.ObjectId,
    ref: 'Player'
  },
  minBidIncrement: {
    type: Number,
    default: 50000, // 50k minimum bid increment
    min: 10000
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Auction = mongoose.model<IAuction>('Auction', auctionSchema); 