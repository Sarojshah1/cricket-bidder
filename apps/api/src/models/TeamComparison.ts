import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamComparison extends Document {
  auctionRoomId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  totalSpent: number;
  remainingBudget: number;
  players: Array<{
    playerId: mongoose.Types.ObjectId;
    purchasePrice: number;
    playerStats: {
      matches: number;
      runs?: number;
      wickets?: number;
      catches?: number;
      stumpings?: number;
      average?: number;
      economy?: number;
    };
  }>;
  teamScore: {
    battingScore: number;
    bowlingScore: number;
    fieldingScore: number;
    balanceScore: number;
    totalScore: number;
  };
  teamComposition: {
    batsmen: number;
    bowlers: number;
    allRounders: number;
    wicketKeepers: number;
  };
  ranking: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const teamComparisonSchema = new Schema<ITeamComparison>({
  auctionRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'AuctionRoom',
    required: true
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBudget: {
    type: Number,
    default: 10000000,
    min: 0
  },
  players: [{
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 100000
    },
    playerStats: {
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
    }
  }],
  teamScore: {
    battingScore: {
      type: Number,
      default: 0
    },
    bowlingScore: {
      type: Number,
      default: 0
    },
    fieldingScore: {
      type: Number,
      default: 0
    },
    balanceScore: {
      type: Number,
      default: 0
    },
    totalScore: {
      type: Number,
      default: 0
    }
  },
  teamComposition: {
    batsmen: {
      type: Number,
      default: 0
    },
    bowlers: {
      type: Number,
      default: 0
    },
    allRounders: {
      type: Number,
      default: 0
    },
    wicketKeepers: {
      type: Number,
      default: 0
    }
  },
  ranking: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
teamComparisonSchema.index({ auctionRoomId: 1, teamId: 1 });
teamComparisonSchema.index({ auctionRoomId: 1, ranking: 1 });

export const TeamComparison = mongoose.model<ITeamComparison>('TeamComparison', teamComparisonSchema); 