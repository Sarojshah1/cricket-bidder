import express, { Router } from 'express';
import { Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { 
  createTeamValidation, 
  updateTeamValidation, 
  teamIdValidation,
  addPlayerToTeamValidation
} from '../validations';

const router: Router = express.Router();

// Get all teams
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Get all teams - to be implemented' });
});

// Get single team
router.get('/:id', teamIdValidation, (req: Request, res: Response) => {
  res.json({ message: 'Get single team - to be implemented' });
});

// Create team (Admin only)
router.post('/', createTeamValidation, authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
  res.json({ message: 'Create team - to be implemented' });
});

// Update team (Admin only)
router.put('/:id', updateTeamValidation, authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
  res.json({ message: 'Update team - to be implemented' });
});

// Delete team (Admin only)
router.delete('/:id', teamIdValidation, authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
  res.json({ message: 'Delete team - to be implemented' });
});

// Add player to team
router.post('/:teamId/players', addPlayerToTeamValidation, authMiddleware, (req: Request, res: Response) => {
  res.json({ message: 'Add player to team - to be implemented' });
});

export default router; 