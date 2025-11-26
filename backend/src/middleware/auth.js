import { AuthService } from '../services/authService.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const user = await AuthService.validateSession(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await AuthService.validateSession(token);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without user if auth fails
    next();
  }
};

// Admin middleware - checks if user is in the admin list
export const requireAdmin = (req, res, next) => {
  // Get admin emails from environment variable (comma-separated)
  const adminEmails = process.env.ADMIN_EMAILS ? 
    process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : 
    [];
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'You do not have permission to perform this action' 
    });
  }
  
  next();
};
