import express from 'express';
import { GoogleOAuth } from '../utils/googleOAuth.js';
import { AuthService } from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initiate Google OAuth
router.get('/google', (req, res) => {
  const authUrl = GoogleOAuth.getAuthUrl();
  res.json({ authUrl });
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for tokens
    const tokens = await GoogleOAuth.getTokens(code);
    
    // Get user profile
    const profile = await GoogleOAuth.getUserProfile(tokens.access_token);
    
    // Find or create user
    const user = await AuthService.findOrCreateUser(profile);
    
    // Generate JWT token
    const token = AuthService.generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Validate session
router.get('/validate', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      picture: req.user.picture
    }
  });
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  // In a real implementation, you might want to blacklist the token
  // For now, we'll just return success and let the client remove the token
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;