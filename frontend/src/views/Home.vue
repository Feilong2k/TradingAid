<template>
  <div class="container">
    <header class="header">
      <h1 class="title">🚀 Trading Aid</h1>
      <p class="subtitle">Your intelligent trading companion</p>
    </header>
    
    <main class="main-content">
      <!-- Login Section -->
      <div class="auth-section">
        <Login />
      </div>

      <!-- Quick Navigation (visible when authenticated) -->
      <div v-if="authStore.isAuthenticated" class="quick-nav">
        <h3>Quick Access</h3>
        <div class="nav-buttons">
          <router-link to="/planning" class="nav-btn primary">
            <span class="nav-icon">📋</span>
            Trade Planning
          </router-link>
          <router-link to="/active" class="nav-btn secondary">
            <span class="nav-icon">📊</span>
            Active Trades
          </router-link>
          <router-link to="/history" class="nav-btn secondary">
            <span class="nav-icon">📈</span>
            Trade History
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import Login from '../components/Login.vue'

const authStore = useAuthStore()
const router = useRouter()

// Handle OAuth callback if URL contains code parameter
const handleOAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    try {
      await authStore.handleOAuthCallback(code);
      // Remove code from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Redirect to trade planning
      router.push('/planning');
  } catch (error) {
      console.error('OAuth callback failed:', error);
    }
  }
}

onMounted(async () => {
  // Initialize auth store
  await authStore.initializeAuth();

  // If already authenticated, redirect to trade planning
  if (authStore.isAuthenticated) {
    router.push('/planning');
  }

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

.quick-nav {
  text-align: center;
  padding: 2rem 0;
  }
  
.quick-nav h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  }
  
.nav-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
  }
  
.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  }

.nav-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-btn.secondary {
  background: white;
  color: #667eea;
  border-color: #667eea;
}

.nav-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.nav-icon {
  font-size: 2rem;
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

  .nav-buttons {
    grid-template-columns: 1fr;
  }
}
</style>