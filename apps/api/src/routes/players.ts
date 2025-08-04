import express, { Router } from 'express';
import { Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { 
  createPlayerValidation, 
  updatePlayerValidation, 
  playerIdValidation 
} from '../validations';

const router: Router = express.Router();

// Get all players
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Get all players - to be implemented' });
});

// Get single player
router.get('/:id', playerIdValidation, (req: Request, res: Response) => {
  res.json({ message: 'Get single player - to be implemented' });
});

// Create player (Admin only)
router.post('/', createPlayerValidation, authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
  res.json({ message: 'Create player - to be implemented' });
});

// Update player (Admin only)
router.put('/:id', updatePlayerValidation, authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
  res.json({ message: 'Update player - to be implemented' });
});

// Delete player (Admin only)
router.delete('/:id', playerIdValidation, authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
  res.json({ message: 'Delete player - to be implemented' });
});

export default router; 