<template>
  <div class="trading-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="app-title">📈 Trading Aid</h1>
        <nav class="navigation">
          <router-link to="/planning" class="nav-link">Trade Planning</router-link>
          <router-link to="/active" class="nav-link">Active Trades</router-link>
          <router-link to="/history" class="nav-link active">Trade History</router-link>
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
          <h2 class="page-title">Trade History</h2>
          <p class="page-subtitle">Review completed trades and learn from your performance</p>
        </div>

        <!-- Performance Summary -->
        <div class="section">
          <h3 class="section-title">Performance Summary</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ performanceStats.winRate }}%</div>
              <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ performanceStats.totalTrades }}</div>
              <div class="stat-label">Total Trades</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" :class="{ positive: performanceStats.netPnl > 0, negative: performanceStats.netPnl < 0 }">
                {{ performanceStats.netPnl > 0 ? '+' : '' }}{{ performanceStats.netPnl }}%
              </div>
              <div class="stat-label">Net P&L</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ performanceStats.avgWin }}/{{ performanceStats.avgLoss }}</div>
              <div class="stat-label">Avg Win/Loss</div>
            </div>
          </div>
        </div>

        <!-- Trade History -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">Recent Trades</h3>
            <div class="filters">
              <select v-model="timeFilter" class="filter-select">
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
          <div class="trades-table">
            <div class="table-header">
              <div class="table-cell">Symbol</div>
              <div class="table-cell">Direction</div>
              <div class="table-cell">Entry/Exit</div>
              <div class="table-cell">P&L</div>
              <div class="table-cell">Date</div>
              <div class="table-cell">Actions</div>
            </div>
            <div v-if="tradeHistory.length === 0" class="empty-table">
              <div class="empty-icon">📊</div>
              <p>No trade history yet</p>
            </div>
            <div v-for="trade in tradeHistory" :key="trade.id" class="table-row">
              <div class="table-cell symbol">{{ trade.symbol }}</div>
              <div class="table-cell">
                <span class="direction" :class="trade.direction">{{ trade.direction }}</span>
              </div>
              <div class="table-cell">{{ trade.entry }} → {{ trade.exit }}</div>
              <div class="table-cell">
                <span class="pnl" :class="{ positive: trade.pnl > 0, negative: trade.pnl < 0 }">
                  {{ trade.pnl > 0 ? '+' : '' }}{{ trade.pnl }}%
                </span>
              </div>
              <div class="table-cell">{{ formatDate(trade.date) }}</div>
              <div class="table-cell">
                <button @click="reviewTrade(trade.id)" class="action-btn small">Review</button>
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

const authStore = useAuthStore();

const timeFilter = ref('all');
const performanceStats = ref({
  winRate: 65,
  totalTrades: 24,
  netPnl: 12.5,
  avgWin: 2.1,
  avgLoss: -1.2
});

const tradeHistory = ref([
  {
    id: 1,
    symbol: 'BTC/USD',
    direction: 'long',
    entry: '$42,100',
    exit: '$43,500',
    pnl: 3.32,
    date: new Date('2024-01-10')
  },
  {
    id: 2,
    symbol: 'ETH/USD',
    direction: 'short',
    entry: '$2,450',
    exit: '$2,380',
    pnl: 2.86,
    date: new Date('2024-01-08')
  },
  {
    id: 3,
    symbol: 'AAPL',
    direction: 'long',
    entry: '$185.20',
    exit: '$182.50',
    pnl: -1.46,
    date: new Date('2024-01-05')
  }
]);

const reviewTrade = (tradeId) => {
  console.log('Reviewing trade:', tradeId);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const handleLogout = async () => {
  try {
    await authStore.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

onMounted(() => {
  // TODO: Load actual data from API
});
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-value.positive {
  color: #28a745;
}

.stat-value.negative {
  color: #dc3545;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #2c3e50;
}

.trades-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  background: #f8f9fa;
  padding: 1rem;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
}

.table-row:hover {
  background: #f8f9fa;
}

.table-cell {
  padding: 0.5rem;
}

.symbol {
  font-weight: 600;
  color: #2c3e50;
}

.direction {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.direction.long {
  background: #d4edda;
  color: #155724;
}

.direction.short {
  background: #f8d7da;
  color: #721c24;
}

.pnl {
  font-weight: 600;
}

.pnl.positive {
  color: #28a745;
}

.pnl.negative {
  color: #dc3545;
}

.empty-table {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Reuse other styles from TradePlanning.vue */
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

.action-btn.small:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
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
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
}
</style>