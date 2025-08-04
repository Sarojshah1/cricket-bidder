import express, { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { registerValidation, loginValidation } from '../validations';

const router: Router = express.Router();

// Register route
router.post('/register', registerValidation, register);

// Login route
router.post('/login', loginValidation, login);

// Get profile route (protected)
router.get('/profile', authMiddleware, getProfile);

export default router; 