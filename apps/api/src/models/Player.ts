import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  age: number;
  nationality: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: 'right-handed' | 'left-handed';
  bowlingStyle?: 'fast' | 'medium' | 'spin' | 'leg-spin' | 'off-spin';
  basePrice: number;
  currentPrice: number;
  isSold: boolean;
  soldTo?: mongoose.Types.ObjectId;
  soldPrice?: number;
  stats: {
    matches: number;
    runs?: number;
    wickets?: number;
    catches?: number;
    stumpings?: number;
    average?: number;
    economy?: number;
  };
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 16,
    max: 50
  },
  nationality: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper'],
    required: true
  },
  battingStyle: {
    type: String,
    enum: ['right-handed', 'left-handed']
  },
  bowlingStyle: {
    type: String,
    enum: ['fast', 'medium', 'spin', 'leg-spin', 'off-spin']
  },
  basePrice: {
    type: Number,
    required: true,
    min: 100000
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 100000
  },
  isSold: {
    type: Boolean,
    default: false
  },
  soldTo: {
    type: Schema.Types.ObjectId,
    ref: 'Team'
  },
  soldPrice: {
    type: Number,
    min: 100000
  },
  stats: {
    matches: {
      type: Number,
      default: 0
    },
    runs: {
      type: Number,
      default: 0
    },
    wickets: {
      type: Number,
      default: 0
    },
    catches: {
      type: Number,
      default: 0
    },
    stumpings: {
      type: Number,
      default: 0
    },
    average: {
      type: Number,
      default: 0
    },
    economy: {
      type: Number,
      default: 0
    }
  },
  imageUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Player = mongoose.model<IPlayer>('Player', playerSchema); 