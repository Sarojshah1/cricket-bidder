import express, { Router } from 'express';
import { 
  createAuctionRoom,
  getAuctionRooms,
  getAuctionRoom,
  addTeamsToRoom,
  addPlayersToRoom,
  startAuction,
  getTeamRankings,
  getBidHistory,
  cancelAuctionRoom,
  joinAuctionRoom
} from '../controllers/auctionRoomController';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  createAuctionRoomValidation,
  auctionRoomIdValidation,
  addTeamsToRoomValidation,
  addPlayersToRoomValidation,
  startAuctionValidation,
  cancelAuctionValidation
} from '../validations';

const router: Router = express.Router();

// Create auction room (Admin only)
router.post('/', createAuctionRoomValidation, authMiddleware, requireRole(['admin']), createAuctionRoom);

// Get all auction rooms
router.get('/', getAuctionRooms);

// Get single auction room
router.get('/:id', auctionRoomIdValidation, getAuctionRoom);

// Add teams to auction room (Admin only)
router.post('/:roomId/teams', addTeamsToRoomValidation, authMiddleware, requireRole(['admin']), addTeamsToRoom);

// Add players to auction room (Admin only)
router.post('/:roomId/players', addPlayersToRoomValidation, authMiddleware, requireRole(['admin']), addPlayersToRoom);

// Start auction (Admin only)
router.post('/:roomId/start', startAuctionValidation, authMiddleware, requireRole(['admin']), startAuction);

// Join auction room (any authenticated user)
router.post('/:roomId/join', auctionRoomIdValidation, authMiddleware, joinAuctionRoom);

// Get team rankings for auction room
router.get('/:roomId/rankings', auctionRoomIdValidation, getTeamRankings);

// Get bid history for auction room
router.get('/:roomId/bid-history', auctionRoomIdValidation, getBidHistory);

// Cancel auction room (Admin only)
router.post('/:roomId/cancel', cancelAuctionValidation, authMiddleware, requireRole(['admin']), cancelAuctionRoom);

export default router; 