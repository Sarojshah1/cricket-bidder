import { body, param } from 'express-validator';

export const createUserValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'team_owner', 'viewer'])
    .withMessage('Role must be one of: admin, team_owner, viewer'),
  
  body('balance')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Balance must be a non-negative integer')
];

export const updateUserValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['admin', 'team_owner', 'viewer'])
    .withMessage('Role must be one of: admin, team_owner, viewer'),
  
  body('balance')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Balance must be a non-negative integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

export const userIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID')
];

export const updatePasswordValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
]; 