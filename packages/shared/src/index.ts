// Shared types for the cricket bidder application
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'team_owner' | 'viewer';
  teamId?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: 'right-handed' | 'left-handed';
  bowlingStyle?: 'fast' | 'medium' | 'spin' | 'leg-spin' | 'off-spin';
  basePrice: number;
  currentPrice: number;
  isSold: boolean;
  soldTo?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  owner: string;
  budget: number;
  remainingBudget: number;
  players: string[];
  maxPlayers: number;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  players: string[];
  currentPlayer?: string;
  minBidIncrement: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  playerId: string;
  teamId: string;
  bidderId: string;
  amount: number;
  status: 'active' | 'outbid' | 'won' | 'cancelled';
  isWinningBid: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
}

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}; 