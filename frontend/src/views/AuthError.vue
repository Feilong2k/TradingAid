<template>
  <div class="auth-error">
    <div class="error-container">
      <div class="error-icon">❌</div>
      <h2>Authentication Failed</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <button @click="goHome" class="retry-btn">
        Try Again
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const errorMessage = ref('An unexpected error occurred during authentication.');

const goHome = () => {
  router.push('/');
};

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  
  if (error) {
    errorMessage.value = decodeURIComponent(error);
  }
});
</script>

<style scoped>
.auth-error {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
  padding: 20px;
}

.error-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.error-container h2 {
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.error-message {
  color: #6c757d;
  margin-bottom: 2rem;
  line-height: 1.5;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #dc3545;
}

.retry-btn {
  background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .error-container {
    padding: 2rem 1.5rem;
  }
  
  .error-icon {
    font-size: 3rem;
  }
  
  .error-container h2 {
    font-size: 1.5rem;
  }
}
</style>