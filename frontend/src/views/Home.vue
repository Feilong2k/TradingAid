<template>
  <div class="container">
    <header class="header">
      <h1 class="title">🚀 Trading Aid</h1>
      <p class="subtitle">Your intelligent trading companion</p>
    </header>
    
    <main class="main-content">
      <!-- User Profile Section -->
      <UserProfile v-if="authStore.isAuthenticated" />

      <!-- Login Section -->
      <div v-else class="auth-section">
        <Login />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import Login from '../components/Login.vue'
import UserProfile from '../components/UserProfile.vue'

const authStore = useAuthStore()

// Handle OAuth callback if URL contains code parameter
const handleOAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    try {
      await authStore.handleOAuthCallback(code);
      // Remove code from URL
      window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
      console.error('OAuth callback failed:', error);
    }
  }
}

onMounted(async () => {
  // Initialize auth store
  await authStore.initializeAuth();

  // Handle OAuth callback if present
  await handleOAuthCallback();
})
</script>

<style scoped>
.container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 800px;
  width: 100%;
}

.header {
  background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.main-content {
  padding: 40px;
}

.auth-section {
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .container {
    margin: 10px;
  }
  
  .header {
    padding: 30px 20px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .main-content {
    padding: 20px;
  }
}
</style>