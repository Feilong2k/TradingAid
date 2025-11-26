<template>
  <div class="trading-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="app-title">📈 Trading Aid</h1>
        <nav class="navigation">
          <router-link to="/planning" class="nav-link active">Trade Planning</router-link>
          <router-link to="/active" class="nav-link">Active Trades</router-link>
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
          <h2 class="page-title">Trade Planning</h2>
          <p class="page-subtitle">Start new trading opportunities with emotional awareness and technical analysis</p>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button @click="showNewPlanModal = true" class="action-btn primary">
            <span class="action-icon">➕</span>
            Start New Trade Plan
          </button>
          <button @click="viewOpportunities" class="action-btn secondary">
            <span class="action-icon">🔍</span>
            View Opportunities
          </button>
        </div>

        <!-- New Trade Plan Modal -->
        <NewTradePlanModal 
          v-if="showNewPlanModal"
          @close="showNewPlanModal = false"
          @plan-created="handlePlanCreated"
        />

        <!-- Current Plans Section -->
        <div class="section">
          <h3 class="section-title">Current Plans</h3>
          <div class="plans-grid">
            <div v-if="currentPlans.length === 0" class="empty-state">
              <div class="empty-icon">📋</div>
              <h4>No active plans</h4>
              <p>Start by creating your first trade plan</p>
              <button @click="startNewPlan" class="empty-action-btn">
                Create Plan
              </button>
            </div>
            
            <div v-for="plan in currentPlans" :key="plan.id" class="plan-card">
              <div class="plan-header">
                <h4 class="plan-symbol">{{ plan.symbol }}</h4>
                <span class="plan-status" :class="plan.status">{{ plan.status }}</span>
              </div>
              <div class="plan-details">
                <div class="detail-item">
                  <span class="detail-label">Direction:</span>
                  <span class="detail-value" :class="{ long: plan.direction === 'long', short: plan.direction === 'short' }">
                    {{ plan.direction }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Probability:</span>
                  <span class="detail-value">{{ plan.probability }}%</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Created:</span>
                  <span class="detail-value">{{ formatDate(plan.createdAt) }}</span>
                </div>
              </div>
              <div class="plan-actions">
                <button @click="continuePlan(plan.id)" class="action-btn small">Continue</button>
                <button @click="deletePlan(plan.id)" class="action-btn small danger">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="section">
          <h3 class="section-title">Recent Activity</h3>
          <div class="activity-list">
            <div v-if="recentActivity.length === 0" class="empty-state">
              <div class="empty-icon">📊</div>
              <p>No recent activity</p>
            </div>
            
            <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
              <div class="activity-icon">{{ activity.icon }}</div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.text }}</p>
                <span class="activity-time">{{ activity.time }}</span>
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
import NewTradePlanModal from '../components/NewTradePlanModal.vue';

const authStore = useAuthStore();
const showNewPlanModal = ref(false);

// Mock data - will be replaced with actual API calls
const currentPlans = ref([
  {
    id: 1,
    symbol: 'BTC/USD',
    status: 'planning',
    direction: 'long',
    probability: 75,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 2,
    symbol: 'ETH/USD',
    status: 'analysis',
    direction: 'short',
    probability: 60,
    createdAt: new Date('2024-01-14')
  }
]);

const recentActivity = ref([
  {
    id: 1,
    icon: '📈',
    text: 'Started analysis on BTC/USD',
    time: '2 hours ago'
  },
  {
    id: 2,
    icon: '💭',
    text: 'Completed emotional check for ETH trade',
    time: '1 day ago'
  }
]);

const handlePlanCreated = (planId) => {
  showNewPlanModal.value = false;
  console.log('Trade plan created:', planId);
  // TODO: Refresh the current plans list
};

const startNewPlan = () => {
  showNewPlanModal.value = true;
};

const viewOpportunities = () => {
  // TODO: Navigate to opportunities view
  console.log('Viewing opportunities');
};

const continuePlan = (planId) => {
  // TODO: Continue with existing plan
  console.log('Continuing plan:', planId);
};

const deletePlan = (planId) => {
  // TODO: Delete plan
  console.log('Deleting plan:', planId);
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

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.action-btn.danger {
  background: #e74c3c;
  color: white;
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

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.plan-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.plan-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.plan-symbol {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.plan-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.plan-status.planning {
  background: #fff3cd;
  color: #856404;
}

.plan-status.analysis {
  background: #d1ecf1;
  color: #0c5460;
}

.plan-details {
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.detail-label {
  color: #6c757d;
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

.plan-actions {
  display: flex;
  gap: 0.5rem;
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
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-icon {
  font-size: 1.5rem;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #2c3e50;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.activity-time {
  color: #6c757d;
  font-size: 0.85rem;
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
  
  .quick-actions {
    flex-direction: column;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
