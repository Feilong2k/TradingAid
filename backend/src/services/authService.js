import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authConfig } from '../config/auth.js';

export class AuthService {
  static generateToken(user) {
    return jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.expiresIn }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, authConfig.jwt.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async findOrCreateUser(profile) {
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0].value
      });
      await user.save();
    }

    // Update last activity
    await user.updateLastActivity();
    
    return user;
  }

  static async validateSession(token) {
    const decoded = this.verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if session is expired based on last activity
    const lastActivity = new Date(user.lastActivity);
    const now = new Date();
    const timeDiff = now - lastActivity;
    
    if (timeDiff > authConfig.session.maxAge) {
      throw new Error('Session expired');
    }

    // Update last activity
    await user.updateLastActivity();
    
    return user;
  }
}