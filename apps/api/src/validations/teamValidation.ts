import { body, param } from 'express-validator';

export const createTeamValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Team name must be between 2 and 50 characters')
    .trim(),
  
  body('owner')
    .isMongoId()
    .withMessage('Invalid owner ID'),
  
  body('budget')
    .isInt({ min: 1000000 })
    .withMessage('Budget must be at least 1,000,000'),
  
  body('maxPlayers')
    .optional()
    .isInt({ min: 11, max: 30 })
    .withMessage('Max players must be between 11 and 30'),
  
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL')
];

export const updateTeamValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid team ID'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Team name must be between 2 and 50 characters')
    .trim(),
  
  body('budget')
    .optional()
    .isInt({ min: 1000000 })
    .withMessage('Budget must be at least 1,000,000'),
  
  body('maxPlayers')
    .optional()
    .isInt({ min: 11, max: 30 })
    .withMessage('Max players must be between 11 and 30'),
  
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL')
];

export const teamIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid team ID')
];

export const addPlayerToTeamValidation = [
  param('teamId')
    .isMongoId()
    .withMessage('Invalid team ID'),
  
  body('playerId')
    .isMongoId()
    .withMessage('Invalid player ID'),
  
  body('purchasePrice')
    .isInt({ min: 100000 })
    .withMessage('Purchase price must be at least 100,000')
]; 