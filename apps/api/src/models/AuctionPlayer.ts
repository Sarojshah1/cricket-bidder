import { Schema, model, Document, Types } from 'mongoose';

export interface IAuctionPlayer extends Document {
  auctionRoomId: Types.ObjectId;
  playerId: Types.ObjectId;
  basePrice: number;
  currentPrice: number;
  isSold: boolean;
  soldTo?: Types.ObjectId;
  soldPrice?: number;
  bidHistory: Array<{
    amount: number;
    teamId: Types.ObjectId;
    bidderId: Types.ObjectId;
    timestamp: Date;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const auctionPlayerSchema = new Schema<IAuctionPlayer>({
  auctionRoomId: { type: Schema.Types.ObjectId, ref: 'AuctionRoom', required: true, index: true },
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
  basePrice: { type: Number, required: true, min: 100000 },
  currentPrice: { type: Number, required: true, min: 100000 },
  isSold: { type: Boolean, default: false },
  soldTo: { type: Schema.Types.ObjectId, ref: 'Team' },
  soldPrice: { type: Number, min: 100000 },
  bidHistory: [{
    amount: { type: Number, required: true, min: 100000 },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    bidderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

auctionPlayerSchema.index({ auctionRoomId: 1, playerId: 1 }, { unique: true });

export const AuctionPlayer = model<IAuctionPlayer>('AuctionPlayer', auctionPlayerSchema);
