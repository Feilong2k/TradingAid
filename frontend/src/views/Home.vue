<template>
  <div class="container">
    <header class="header">
      <h1 class="title">🚀 Trading Aid</h1>
      <p class="subtitle">Your intelligent trading companion</p>
    </header>
    
    <main class="main-content">
      <div class="status-card">
        <div class="status-header">
          <h2>System Status</h2>
          <div class="status-indicator" :class="{ online: backendOnline, offline: !backendOnline }">
            {{ backendOnline ? 'Online' : 'Offline' }}
          </div>
        </div>
        
        <div class="connection-test">
          <button 
            @click="testBackendConnection" 
            :disabled="testing"
            class="test-button"
            :class="{ loading: testing }"
          >
            {{ testing ? 'Testing...' : 'Test Backend Connection' }}
          </button>
          
          <div v-if="testResult" class="test-result" :class="{ success: testResult.success, error: !testResult.success }">
            {{ testResult.message }}
          </div>
        </div>
      </div>
      
      <div class="features">
        <h3>Features</h3>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h4>Market Analysis</h4>
            <p>Real-time market data and analytics</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h4>Fast Execution</h4>
            <p>Quick and reliable trade execution</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🛡️</div>
            <h4>Risk Management</h4>
            <p>Advanced risk assessment tools</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const backendOnline = ref(false)
const testing = ref(false)
const testResult = ref(null)

const testBackendConnection = async () => {
  testing.value = true
  testResult.value = null
  
  try {
    const response = await axios.get('http://localhost:3000/')
    backendOnline.value = true
    testResult.value = {
      success: true,
      message: `✅ Backend connected successfully! ${response.data.message}`
    }
  } catch (error) {
    backendOnline.value = false
    testResult.value = {
      success: false,
      message: '❌ Backend connection failed. Make sure the server is running on port 3000.'
    }
  } finally {
    testing.value = false
  }
}
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.status-card {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  border: 2px solid #e9ecef;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-header h2 {
  color: #2c3e50;
  font-size: 1.5rem;
}

.status-indicator {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-indicator.online {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-indicator.offline {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.test-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.test-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.test-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.test-button.loading {
  background: linear-gradient(135deg, #a8a8a8 0%, #7a7a7a 100%);
}

.test-result {
  margin-top: 15px;
  padding: 15px;
  border-radius: 10px;
  font-weight: 500;
  text-align: center;
}

.test-result.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.test-result.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.features h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.feature-card {
  background: white;
  padding: 25px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.feature-card h4 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.feature-card p {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
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
  
  .status-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>