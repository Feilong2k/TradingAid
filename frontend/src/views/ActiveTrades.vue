<template>
    <div class="trading-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <h1 class="app-title">📈 Trading Aid</h1>
          <nav class="navigation">
            <router-link to="/planning" class="nav-link">Trade Planning</router-link>
            <router-link to="/active" class="nav-link active">Active Trades</router-link>
            <router-link to="/history" class="nav-link">Trade History</router-link>
          </nav>
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
      <main class="page-content">
        <div class="container">
          <!-- Page Header -->
          <div class="page-header-section">
            <h2 class="page-title">Active Trades</h2>
            <p class="page-subtitle">Monitor your open positions and trading opportunities</p>
          </div>
  
          <!-- Active Positions -->
          <div class="section">
            <h3 class="section-title">Open Positions</h3>
            <div class="positions-grid">
              <div v-if="activePositions.length === 0" class="empty-state">
                <div class="empty-icon">📊</div>
                <h4>No active positions</h4>
                <p>Start by creating a trade plan</p>
                <router-link to="/planning" class="empty-action-btn">
                  Go to Planning
                </router-link>
              </div>
              
              <div v-for="position in activePositions" :key="position.id" class="position-card">
                <div class="position-header">
                  <h4 class="position-symbol">{{ position.symbol }}</h4>
                  <span class="position-pnl" :class="{ positive: position.pnl > 0, negative: position.pnl < 0 }">
                    {{ position.pnl > 0 ? '+' : '' }}{{ position.pnl }}%
                  </span>
                </div>
                <div class="position-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">Direction:</span>
                      <span class="detail-value" :class="{ long: position.direction === 'long', short: position.direction === 'short' }">
                        {{ position.direction }}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Size:</span>
                      <span class="detail-value">{{ position.size }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">Entry:</span>
                      <span class="detail-value">{{ position.entryPrice }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Current:</span>
                      <span class="detail-value">{{ position.currentPrice }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">Stop Loss:</span>
                      <span class="detail-value">{{ position.stopLoss }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Target:</span>
                      <span class="detail-value">{{ position.target }}</span>
                    </div>
                  </div>
                </div>
                <div class="position-actions">
                  <button @click="managePosition(position.id)" class="action-btn small">Manage</button>
                  <button @click="closePosition(position.id)" class="action-btn small danger">Close</button>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Monitoring Opportunities -->
          <div class="section">
            <h3 class="section-title">Monitoring Opportunities</h3>
            <div class="opportunities-grid">
              <div v-if="opportunities.length === 0" class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>No opportunities being monitored</p>
              </div>
              
              <div v-for="opportunity in opportunities" :key="opportunity.id" class="opportunity-card">
                <div class="opportunity-header">
                  <h4 class="opportunity-symbol">{{ opportunity.symbol }}</h4>
                  <span class="opportunity-probability">{{ opportunity.probability }}%</span>
                </div>
                <div class="opportunity-details">
                  <div class="detail-item">
                    <span class="detail-label">Setup:</span>
                    <span class="detail-value">{{ opportunity.setup }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Timeframe:</span>
                    <span class="detail-value">{{ opportunity.timeframe }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Last Updated:</span>
                    <span class="detail-value">{{ opportunity.lastUpdated }}</span>
                  </div>
                </div>
                <div class="opportunity-actions">
                  <button @click="analyzeOpportunity(opportunity.id)" class="action-btn small">Analyze</button>
                  <button @click="enterPosition(opportunity.id)" class="action-btn small primary">Enter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useAuthStore } from '../stores/auth.js';
  import axios from 'axios';
  
  const authStore = useAuthStore();
  
  // Real data from API
  const activePositions = ref([]);
  const opportunities = ref([]);
  const isLoading = ref(false);
  
  const managePosition = (positionId) => {
    console.log('Managing position:', positionId);
  };
  
  const closePosition = (positionId) => {
    console.log('Closing position:', positionId);
  };
  
  const analyzeOpportunity = (opportunityId) => {
    console.log('Analyzing opportunity:', opportunityId);
  };
  
  const enterPosition = (opportunityId) => {
    console.log('Entering position for opportunity:', opportunityId);
  };
  
  const handleLogout = async () => {
    try {
      await authStore.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const loadActiveTradePlans = async () => {
    isLoading.value = true;
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await axios.get(`${apiBaseUrl}/api/trade-plans/active`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      console.log('Active trade plans response:', response.data);
      
      // Transform trade plan data to match the expected structure
      activePositions.value = response.data.openPositions.map(plan => ({
        id: plan._id,
        symbol: plan.asset,
        direction: plan.direction,
        size: '1.0', // Default size for now
        entryPrice: 'N/A', // Will be set when trade is entered
        currentPrice: 'N/A', // Will be updated with real data
        stopLoss: 'N/A', // Will be set in technical analysis
        target: 'N/A', // Will be set in technical analysis
        pnl: 0 // Will be calculated when trade is active
      }));
      
      opportunities.value = response.data.monitoringOpportunities.map(plan => ({
        id: plan._id,
        symbol: plan.asset,
        probability: 75, // Default probability for now
        setup: `${plan.direction} ${plan.timeframe}`,
        timeframe: plan.timeframe,
        lastUpdated: formatDate(plan.createdAt)
      }));
      
    } catch (error) {
      console.error('Error loading active trade plans:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };
  
  onMounted(() => {
    loadActiveTradePlans();
  });
  </script>
  
  <style scoped>
  .trading-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
  }
  
  .page-header {
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
    gap: 2rem;
  }
  
  .app-title {
    color: #2c3e50;
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0;
  }
  
  .navigation {
    display: flex;
    gap: 2rem;
    flex: 1;
    justify-content: center;
  }
  
  .nav-link {
    color: #6c757d;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  .nav-link:hover,
  .nav-link.active {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
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
  
  .page-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .page-header-section {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .page-title {
    color: #2c3e50;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .page-subtitle {
    color: #6c757d;
    font-size: 1.2rem;
    line-height: 1.6;
  }
  
  .section {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  .section-title {
    color: #2c3e50;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }
  
  .positions-grid,
  .opportunities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .position-card,
  .opportunity-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    border: 2px solid #e9ecef;
    transition: all 0.3s ease;
  }
  
  .position-card:hover,
  .opportunity-card:hover {
    border-color: #667eea;
    transform: translateY(-2px);
  }
  
  .position-header,
  .opportunity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .position-symbol,
  .opportunity-symbol {
    color: #2c3e50;
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
  }
  
  .position-pnl {
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  .position-pnl.positive {
    color: #28a745;
  }
  
  .position-pnl.negative {
    color: #dc3545;
  }
  
  .opportunity-probability {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .detail-label {
    color: #6c757d;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .detail-value {
    color: #2c3e50;
    font-weight: 600;
  }
  
  .detail-value.long {
    color: #28a745;
  }
  
  .detail-value.short {
    color: #dc3545;
  }
  
  .position-actions,
  .opportunity-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    text-decoration: none;
  }
  
  .action-btn.small {
    background: #667eea;
    color: white;
  }
  
  .action-btn.small.primary {
    background: #667eea;
    color: white;
  }
  
  .action-btn.small.danger {
    background: #e74c3c;
    color: white;
  }
  
  .action-btn.small:hover {
    transform: translateY(-1px);
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #6c757d;
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .empty-state h4 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }
  
  .empty-action-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 1rem;
    text-decoration: none;
    display: inline-block;
  }
  
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      padding: 0 1rem;
    }
    
    .navigation {
      order: 3;
      width: 100%;
      justify-content: space-around;
    }
    
    .page-content {
      padding: 1rem;
    }
    
    .positions-grid,
    .opportunities-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>
