import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('auth_token'));
  const isLoading = ref(false);
  const lastActivity = ref(Date.now());

  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value;
  });

  // Initialize auth state
  const initializeAuth = async () => {
    if (token.value) {
      try {
        await validateSession();
        startActivityTracking();
      } catch (error) {
        logout();
      }
    }
  };

  // Update last activity timestamp
  const updateActivity = () => {
    lastActivity.value = Date.now();
  };

  // Start activity tracking for auto-logout
  const startActivityTracking = () => {
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check for inactivity every minute
    setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity.value;
      
      if (timeSinceLastActivity > 30 * 60 * 1000) { // 30 minutes
        autoLogout();
      }
    }, 60000); // Check every minute
  };

  const autoLogout = () => {
    logout();
    alert('You have been automatically logged out due to inactivity.');
  };

  // Initiate Google OAuth
  const loginWithGoogle = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/google`);
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Google OAuth initiation failed:', error);
      throw error;
    }
  };

  // Handle OAuth callback
  const handleOAuthCallback = async (code) => {
    try {
      isLoading.value = true;
      const response = await axios.get(`${API_BASE_URL}/auth/google/callback?code=${code}`);
      
      if (response.data.success) {
        token.value = response.data.token;
        user.value = response.data.user;
        
        // Store token in localStorage
        localStorage.setItem('auth_token', response.data.token);
        
        // Start activity tracking
        startActivityTracking();
        
        return true;
      }
    } catch (error) {
      console.error('OAuth callback failed:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // Validate session
  const validateSession = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/validate`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      });
      
      if (response.data.valid) {
        user.value = response.data.user;
        updateActivity();
        return true;
      }
    } catch (error) {
      throw new Error('Session validation failed');
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (token.value) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      user.value = null;
      token.value = null;
      localStorage.removeItem('auth_token');
      
      // Remove activity listeners
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    initializeAuth,
    loginWithGoogle,
    handleOAuthCallback,
    validateSession,
    logout,
    updateActivity
  };
});