import dotenv from 'dotenv';

dotenv.config();

export const authConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: '30m' // 30 minutes
  },
  session: {
    maxAge: 30 * 60 * 1000 // 30 minutes in milliseconds
  }
};