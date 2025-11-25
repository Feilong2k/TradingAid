<template>
  <div class="dashboard">
    <!-- Header with Logout Button -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="app-title">🚀 Trading Aid</h1>
        <div class="user-controls">
          <div class="user-info">
            <img 
              :src="authStore.user?.picture" 
              :alt="authStore.user?.name"
              class="user-avatar"
            />
            <span class="user-name">{{ authStore.user?.name }}</span>
          </div>
          <button 
            @click="handleLogout" 
            class="logout-btn"
            :disabled="authStore.isLoading"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="dashboard-content">
      <div class="welcome-section">
        <div class="welcome-card">
          <h2 class="welcome-title">Welcome to Trading Aid! 🎉</h2>
          <p class="welcome-message">
            Hello <strong>{{ authStore.user?.name }}</strong>! You have successfully logged in to your Trading Aid account.
          </p>
          <p class="welcome-subtitle">
            Your trading dashboard is ready. We'll automatically log you out after 30 minutes of inactivity.
          </p>
          
          <div class="status-info">
            <div class="status-item">
              <span class="status-icon">✅</span>
              <span>Logged in as: {{ authStore.user?.email }}</span>
            </div>
            <div class="status-item">
              <span class="status-icon">⏰</span>
              <span>Auto-logout: 30 minutes of inactivity</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth.js';

const authStore = useAuthStore();

const handleLogout = async () => {
  try {
    await authStore.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
}

.dashboard-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}

.user-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #667eea;
}

.user-name {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.95rem;
}

.logout-btn {
  background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.logout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
}

.welcome-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.welcome-title {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.welcome-message {
  color: #6c757d;
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.welcome-subtitle {
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 2rem;
}

.status-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e9ecef;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #2c3e50;
  font-size: 0.95rem;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-icon {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .dashboard-content {
    padding: 1rem;
  }
  
  .welcome-card {
    padding: 2rem 1.5rem;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .user-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>