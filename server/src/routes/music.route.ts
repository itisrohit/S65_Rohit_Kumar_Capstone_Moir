import express from 'express';
import { searchMusic, streamMusic, getMusicHistory } from '../controllers/music.controller';
import { verifyJWT } from '../middlewares/auth.middleware';

const router = express.Router();

// Public routes
// Search for music tracks
router.get('/search', searchMusic);

// Stream music track by ID
router.get('/stream/:id', streamMusic);

// Protected routes
router.get('/history', verifyJWT, getMusicHistory);

export default router;