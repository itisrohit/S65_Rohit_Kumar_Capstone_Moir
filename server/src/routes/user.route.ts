import express from 'express';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getUserProfile, 
  refreshAccessToken, 
  getAllUsers,
  updateUserInfo,
  updateUserPassword
} from '../controllers/User.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
import { uploadProfileImage } from '../middlewares/cloudinary.middleware';

const router = express.Router();

// Authentication routes (public)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes - require authentication
router.use(verifyJWT);

// User management
router.post('/logout', logoutUser);
router.get('/profile', getUserProfile);
router.get('/access-token', refreshAccessToken);
router.get('/all-users', getAllUsers);

// Updating user
router.put('/update', uploadProfileImage.single('image'), updateUserInfo);
router.put('/update-password', updateUserPassword);

export default router;