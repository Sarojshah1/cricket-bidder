import { body, param } from 'express-validator';

// Create Bid validation
export const createBidValidation = [
  body('auctionId').isMongoId().withMessage('auctionId must be a valid id'),
  body('teamId').isMongoId().withMessage('teamId must be a valid id'),
  body('playerId').isMongoId().withMessage('playerId must be a valid id'),
  body('amount').isNumeric().toFloat().isFloat({ gt: 0 }).withMessage('amount must be a positive number')
];

// Bid ID validation
export const bidIdValidation = [
  param('id').isMongoId().withMessage('id must be a valid id')
];

// Update Bid validation
export const updateBidValidation = [
  param('id').isMongoId().withMessage('id must be a valid id'),
  body('amount').optional().isNumeric().toFloat().isFloat({ gt: 0 }).withMessage('amount must be a positive number')
];

// Get bids by auction validation
export const getBidsByAuctionValidation = [
  param('auctionId').isMongoId().withMessage('auctionId must be a valid id')
];

// Get bids by team validation
export const getBidsByTeamValidation = [
  param('teamId').isMongoId().withMessage('teamId must be a valid id')
];
