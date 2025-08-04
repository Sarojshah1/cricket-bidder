import { body, param } from 'express-validator';

export const createPlayerValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Player name must be between 2 and 50 characters')
    .trim(),
  
  body('age')
    .isInt({ min: 16, max: 50 })
    .withMessage('Age must be between 16 and 50'),
  
  body('nationality')
    .isLength({ min: 2, max: 30 })
    .withMessage('Nationality must be between 2 and 30 characters')
    .trim(),
  
  body('role')
    .isIn(['batsman', 'bowler', 'all-rounder', 'wicket-keeper'])
    .withMessage('Role must be one of: batsman, bowler, all-rounder, wicket-keeper'),
  
  body('battingStyle')
    .optional()
    .isIn(['right-handed', 'left-handed'])
    .withMessage('Batting style must be right-handed or left-handed'),
  
  body('bowlingStyle')
    .optional()
    .isIn(['fast', 'medium', 'spin', 'leg-spin', 'off-spin'])
    .withMessage('Bowling style must be one of: fast, medium, spin, leg-spin, off-spin'),
  
  body('basePrice')
    .isInt({ min: 100000 })
    .withMessage('Base price must be at least 100,000'),
  
  body('stats.matches')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Matches must be a non-negative integer'),
  
  body('stats.runs')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Runs must be a non-negative integer'),
  
  body('stats.wickets')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Wickets must be a non-negative integer'),
  
  body('stats.catches')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Catches must be a non-negative integer'),
  
  body('stats.stumpings')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stumpings must be a non-negative integer'),
  
  body('stats.average')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Average must be a non-negative number'),
  
  body('stats.economy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Economy must be a non-negative number')
];

export const updatePlayerValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid player ID'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Player name must be between 2 and 50 characters')
    .trim(),
  
  body('age')
    .optional()
    .isInt({ min: 16, max: 50 })
    .withMessage('Age must be between 16 and 50'),
  
  body('nationality')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('Nationality must be between 2 and 30 characters')
    .trim(),
  
  body('role')
    .optional()
    .isIn(['batsman', 'bowler', 'all-rounder', 'wicket-keeper'])
    .withMessage('Role must be one of: batsman, bowler, all-rounder, wicket-keeper'),
  
  body('basePrice')
    .optional()
    .isInt({ min: 100000 })
    .withMessage('Base price must be at least 100,000'),
  
  body('currentPrice')
    .optional()
    .isInt({ min: 100000 })
    .withMessage('Current price must be at least 100,000')
];

export const playerIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid player ID')
]; 