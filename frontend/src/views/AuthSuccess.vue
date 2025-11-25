<template>
  <div class="auth-success">
    <div class="loading-container">
      <div class="spinner"></div>
      <h2>Completing Login...</h2>
      <p>Please wait while we set up your session</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');

    if (token && userData) {
      // Store the token
      authStore.token = token;
      localStorage.setItem('auth_token', token);
      
      // Parse and store user data
      authStore.user = JSON.parse(userData);
      
      // Start activity tracking
      authStore.startActivityTracking();
      
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      throw new Error('Missing authentication data');
    }
  } catch (error) {
    console.error('Auth success handling failed:', error);
    router.push('/?error=auth_failed');
  }
});
</script>

<style scoped>
.auth-success {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
}

.loading-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e9ecef;
  border-left: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.loading-container p {
  color: #6c757d;
  margin: 0;
}
</style>