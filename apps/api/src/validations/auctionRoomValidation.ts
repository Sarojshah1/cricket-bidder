import { body, param } from 'express-validator';

export const createAuctionRoomValidation = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Auction room name must be between 3 and 100 characters')
    .trim(),
  
  body('description')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
    .trim(),
  
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      const startDate = new Date(value);
      const now = new Date();
      if (startDate <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  
  body('maxTeams')
    .optional()
    .isInt({ min: 2, max: 16 })
    .withMessage('Maximum teams must be between 2 and 16'),
  
  body('minBidIncrement')
    .optional()
    .isInt({ min: 10000 })
    .withMessage('Minimum bid increment must be at least 10,000'),
  
  body('timePerBid')
    .optional()
    .isInt({ min: 10, max: 120 })
    .withMessage('Time per bid must be between 10 and 120 seconds')
];

export const auctionRoomIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid auction room ID')
];

export const roomIdValidation = [
  param('roomId')
    .isMongoId()
    .withMessage('Invalid auction room ID')
];

export const addTeamsToRoomValidation = [
  param('roomId')
    .isMongoId()
    .withMessage('Invalid auction room ID'),
  
  body('teamIds')
    .isArray({ min: 1 })
    .withMessage('At least one team ID is required'),
  
  body('teamIds.*')
    .isMongoId()
    .withMessage('Invalid team ID in array')
];

export const addPlayersToRoomValidation = [
  param('roomId')
    .isMongoId()
    .withMessage('Invalid auction room ID'),
  
  body('playerIds')
    .isArray({ min: 1 })
    .withMessage('At least one player ID is required'),
  
  body('playerIds.*')
    .isMongoId()
    .withMessage('Invalid player ID in array')
];

export const startAuctionValidation = [
  param('roomId')
    .isMongoId()
    .withMessage('Invalid auction room ID')
];

export const cancelAuctionValidation = [
  param('roomId')
    .isMongoId()
    .withMessage('Invalid auction room ID')
]; 