import express, { Router } from 'express';

const router: Router = express.Router();

// Placeholder route
router.get('/', (req, res) => {
  res.json({ message: 'Auctions route - to be implemented' });
});

export default router; 