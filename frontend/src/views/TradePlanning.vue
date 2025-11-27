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

        <!-- Trade Plan Details Modal -->
        <TradePlanDetailsModal
          v-if="showDetailsModal"
          :trade-plan-id="selectedPlanId"
          @close="showDetailsModal = false"
          @plan-deleted="handlePlanDeleted"
          @plan-continued="handlePlanContinued"
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
            
            <div 
              v-for="plan in currentPlans" 
              :key="plan.id" 
              class="plan-card"
              @click="openPlanDetails(plan.id)"
            >
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
              <div class="plan-actions" @click.stop>
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

      <!-- Delete Confirmation Popup -->
      <div v-if="showDeleteConfirmation" class="confirmation-overlay">
        <div class="confirmation-popup">
          <div class="confirmation-header">
            <h3 class="confirmation-title">Confirm Deletion</h3>
          </div>
          <div class="confirmation-content">
            <p>Are you sure you want to delete this trade plan?</p>
            <p class="confirmation-warning">This action cannot be undone.</p>
          </div>
          <div class="confirmation-actions">
            <button @click="cancelDelete" class="confirmation-btn cancel">
              Cancel
            </button>
            <button @click="confirmDelete" class="confirmation-btn confirm">
              Delete
            </button>
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
import TradePlanDetailsModal from '../components/TradePlanDetailsModal.vue';
import axios from 'axios';

const authStore = useAuthStore();
const showNewPlanModal = ref(false);
const showDetailsModal = ref(false);
const selectedPlanId = ref(null);
const showDeleteConfirmation = ref(false);
const planToDelete = ref(null);

// Real data from API
const currentPlans = ref([]);
const recentActivity = ref([]);
const isLoading = ref(false);

const loadOpenTradePlans = async () => {
  isLoading.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const response = await axios.get(`${apiBaseUrl}/api/trade-plans/open`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    
    console.log('Open trade plans response:', response.data);
    
    // Transform trade plan data to match the expected structure
    currentPlans.value = response.data.map(plan => ({
      id: plan._id,
      symbol: plan.asset,
      status: plan.status,
      direction: plan.direction,
      probability: 75, // Default probability for now
      createdAt: plan.createdAt
    }));
    
    // Generate recent activity from trade plans
    recentActivity.value = response.data.slice(0, 3).map(plan => ({
      id: plan._id,
      icon: '📈',
      text: `Started ${plan.direction} plan for ${plan.asset}`,
      time: formatRelativeTime(plan.createdAt)
    }));
    
  } catch (error) {
    console.error('Error loading open trade plans:', error);
  } finally {
    isLoading.value = false;
  }
};

const handlePlanCreated = (planId) => {
  showNewPlanModal.value = false;
  console.log('Trade plan created:', planId);
  // Refresh the current plans list
  loadOpenTradePlans();
};

const startNewPlan = () => {
  showNewPlanModal.value = true;
};

const viewOpportunities = () => {
  // TODO: Navigate to opportunities view
  console.log('Viewing opportunities');
};

const openPlanDetails = (planId) => {
  selectedPlanId.value = planId;
  showDetailsModal.value = true;
};

const continuePlan = (planId) => {
  selectedPlanId.value = planId;
  showDetailsModal.value = true;
};

const handlePlanDeleted = (planId) => {
  // Remove from current plans immediately
  currentPlans.value = currentPlans.value.filter(plan => plan.id !== planId);
  
  // Also remove from recent activity if present
  recentActivity.value = recentActivity.value.filter(activity => activity.id !== planId);
  
  console.log('Trade plan deleted from details modal:', planId);
};

const handlePlanContinued = (tradePlan) => {
  console.log('Continuing trade plan from details modal:', tradePlan);
  // TODO: Implement continue functionality - open NewTradePlanModal in edit mode
  // For now, just close the modal and show a message
  alert('Continue functionality will be implemented in the next phase');
};

const deletePlan = (planId) => {
  planToDelete.value = planId;
  showDeleteConfirmation.value = true;
};

const confirmDelete = async () => {
  if (!planToDelete.value) return;

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    await axios.delete(`${apiBaseUrl}/api/trade-plans/${planToDelete.value}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    
    // Remove from current plans immediately
    currentPlans.value = currentPlans.value.filter(plan => plan.id !== planToDelete.value);
    
    // Also remove from recent activity if present
    recentActivity.value = recentActivity.value.filter(activity => activity.id !== planToDelete.value);
    
    console.log('Trade plan deleted successfully');
    showDeleteConfirmation.value = false;
    planToDelete.value = null;
  } catch (error) {
    console.error('Error deleting trade plan:', error);
    alert('Failed to delete trade plan. Please try again.');
    showDeleteConfirmation.value = false;
    planToDelete.value = null;
  }
};

const cancelDelete = () => {
  showDeleteConfirmation.value = false;
  planToDelete.value = null;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const formatRelativeTime = (dateString) => {
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

const handleLogout = async () => {
  try {
    await authStore.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

onMounted(() => {
  loadOpenTradePlans();
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

/* Delete Confirmation Popup Styles */
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.confirmation-popup {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.confirmation-header {
  background: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.confirmation-title {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.confirmation-content {
  padding: 1.5rem;
  text-align: center;
}

.confirmation-content p {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
}

.confirmation-warning {
  color: #e74c3c !important;
  font-weight: 500;
  font-size: 0.9rem;
}

.confirmation-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem;
}

.confirmation-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.confirmation-btn.cancel {
  background: #6c757d;
  color: white;
}

.confirmation-btn.cancel:hover {
  background: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.confirmation-btn.confirm {
  background: #e74c3c;
  color: white;
}

.confirmation-btn.confirm:hover {
  background: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
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
