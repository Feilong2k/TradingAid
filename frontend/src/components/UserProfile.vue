<template>
  <div class="user-profile">
    <div class="user-info">
      <img 
        :src="authStore.user?.picture" 
        :alt="authStore.user?.name"
        class="user-avatar"
      />
      <div class="user-details">
        <h3 class="user-name">{{ authStore.user?.name }}</h3>
        <p class="user-email">{{ authStore.user?.email }}</p>
      </div>
    </div>
    
    <button 
      @click="handleLogout" 
      class="logout-btn"
      :disabled="authStore.isLoading"
    >
      {{ authStore.isLoading ? 'Logging out...' : 'Logout' }}
    </button>
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
.user-profile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e9ecef;
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #667eea;
}

.user-details {
  text-align: left;
}

.user-name {
  color: #2c3e50;
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.user-email {
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
}

.logout-btn {
  background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
  color: white;
  border: none;
  padding: 10px 20px;
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

@media (max-width: 768px) {
  .user-profile {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .user-info {
    flex-direction: column;
    text-align: center;
  }
  
  .user-details {
    text-align: center;
  }
}
</style>