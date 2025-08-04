import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  budget: number;
  remainingBudget: number;
  players: mongoose.Types.ObjectId[];
  maxPlayers: number;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  budget: {
    type: Number,
    required: true,
    default: 10000000, // 10 million budget
    min: 0
  },
  remainingBudget: {
    type: Number,
    required: true,
    default: 10000000,
    min: 0
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Player'
  }],
  maxPlayers: {
    type: Number,
    default: 25,
    min: 11,
    max: 30
  },
  logoUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Team = mongoose.model<ITeam>('Team', teamSchema); 