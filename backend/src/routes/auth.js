import express from 'express';
import { GoogleOAuth } from '../utils/googleOAuth.js';
import { AuthService } from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateQuery, oauthCallbackSchema } from '../middleware/validation.js';

const router = express.Router();

// Initiate Google OAuth
router.get("/google", (req, res) => {
  try {
    const authUrl = GoogleOAuth.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ error: "Failed to generate authentication URL" });
  }
});

// Google OAuth callback
router.get("/google/callback", validateQuery(oauthCallbackSchema), async (req, res) => {
  try {
    const { code } = req.query;

    console.log("Received OAuth code");

    // Exchange code for tokens
    const tokens = await GoogleOAuth.getTokens(code);
    console.log("Received tokens from Google");

    // Get user profile
    const profile = await GoogleOAuth.getUserProfile(tokens.access_token);
    console.log("Google profile data received");

    // Find or create user
    const user = await AuthService.findOrCreateUser(profile);

    // Generate JWT token
    const token = AuthService.generateToken(user);

    // Return JSON response instead of redirecting
    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      }
    });
  } catch (error) {
    console.error("Google OAuth error:", error.message);
    
    // Provide more user-friendly error messages
    let errorMessage = "Authentication failed. Please try again.";
    if (
      error.message.includes("MongoDB") ||
      error.message.includes("timed out")
    ) {
      errorMessage = "Database connection issue. Please try again in a moment.";
    }

    res.status(500).json({ 
      success: false,
      error: errorMessage 
    });
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
router.post("/logout", authenticateToken, async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;
