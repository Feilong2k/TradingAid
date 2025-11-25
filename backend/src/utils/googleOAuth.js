import { authConfig } from '../config/auth.js';

export class GoogleOAuth {
  static getAuthUrl() {
    const params = new URLSearchParams({
      client_id: authConfig.google.clientId,
      redirect_uri: authConfig.google.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  static async getTokens(code) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: authConfig.google.clientId,
        client_secret: authConfig.google.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: authConfig.google.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get tokens from Google');
    }

    return await response.json();
  }

  static async getUserProfile(accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile from Google');
    }

    return await response.json();
  }
}