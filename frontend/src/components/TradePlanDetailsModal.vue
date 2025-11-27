<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <h2 class="modal-title">{{ formattedTitle }}</h2>
          <div class="trade-info">
            <span class="trade-asset">{{ tradePlan.asset }}</span>
            <span class="trade-direction" :class="tradePlan.direction">{{ tradePlan.direction }}</span>
            <span class="trade-timeframe">{{ tradePlan.timeframe }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="status-dropdown-container">
            <label class="status-label">Status:</label>
            <select 
              v-model="selectedStatus" 
              @change="updateStatus"
              class="status-dropdown"
              :class="selectedStatus"
            >
              <option value="open">Open</option>
              <option value="emotional_check">Emotional Check</option>
              <option value="technical_analysis">Technical Analysis</option>
              <option value="planning">Planning</option>
              <option value="monitoring">Monitoring</option>
              <option value="entered">Entered</option>
              <option value="completed">Completed</option>
              <option value="passed_over">Passed Over</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
      </div>

      <!-- Modal Content -->
      <div class="modal-content" v-if="tradePlan">
        <div class="details-layout" ref="detailsLayout">
          <!-- Left Column: Chat Conversation -->
          <div class="chat-column">
            <h3 class="column-title">Conversation with Aria</h3>
            <div class="chat-messages" ref="chatMessages">
              <div 
                v-for="(message, index) in tradePlan.conversation" 
                :key="index"
                :class="['message', message.role]"
              >
                <div class="message-avatar">
                  <span v-if="message.role === 'user'">👤</span>
                  <span v-else>👩‍💼</span>
                </div>
                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-time">
                    {{ formatMessageTime(message.timestamp) }}
                  </div>
                </div>
              </div>
              
              <div v-if="tradePlan.conversation.length === 0" class="no-messages">
                <div class="no-messages-icon">💬</div>
                <p>No conversation yet</p>
                <p class="no-messages-subtitle">Start chatting with Aria to begin your emotional check</p>
              </div>
            </div>
          </div>

          <!-- Right Column: Trade Plan Details -->
          <div class="details-column">
            <h3 class="column-title">Trade Plan Information</h3>
            
            <!-- Basic Trade Info -->
            <div class="details-section">
              <div class="section-header" @click="toggleSection('tradeSetup')">
                <h4 class="section-title">Trade Setup</h4>
                <span class="collapse-icon" :class="{ expanded: expandedSections.tradeSetup }">▼</span>
              </div>
              <div class="section-content" v-if="expandedSections.tradeSetup">
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Asset:</span>
                    <span class="detail-value">{{ tradePlan.asset }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Direction:</span>
                    <span 
                      class="detail-value" 
                      :class="{ long: tradePlan.direction === 'long', short: tradePlan.direction === 'short' }"
                    >
                      {{ tradePlan.direction }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Timeframe:</span>
                    <span class="detail-value">{{ tradePlan.timeframe }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status" :class="tradePlan.status">
                      {{ formatStatus(tradePlan.status) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">{{ formatDateTime(tradePlan.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Emotional State -->
            <div class="details-section" v-if="hasEmotionalStateData">
              <div class="section-header" @click="toggleSection('emotionalState')">
                <h4 class="section-title">Emotional State</h4>
                <span class="collapse-icon" :class="{ expanded: expandedSections.emotionalState }">▼</span>
              </div>
              <div class="section-content" v-if="expandedSections.emotionalState">
                <div class="emotional-state">
                  <div class="emotion-display" v-if="tradePlan.emotionalState.state">
                    <span class="emotion-label">Current Emotion:</span>
                    <span class="emotion-value">{{ tradePlan.emotionalState.state }}</span>
                  </div>
                  
                  <div class="body-signals" v-if="tradePlan.emotionalState.bodySignals && tradePlan.emotionalState.bodySignals.length > 0">
                    <h5 class="subsection-title">Body Signals</h5>
                    <div class="signal-list">
                      <div 
                        v-for="(signal, index) in tradePlan.emotionalState.bodySignals" 
                        :key="index"
                        class="signal-item"
                      >
                        <span class="signal-text">{{ signal.signal }}</span>
                        <span class="signal-intensity">Intensity: {{ signal.intensity }}/10</span>
                      </div>
                    </div>
                  </div>

                  <div class="emotional-notes" v-if="tradePlan.emotionalState.notes">
                    <h5 class="subsection-title">Notes</h5>
                    <p class="notes-text">{{ tradePlan.emotionalState.notes }}</p>
                  </div>

                  <div class="ai-analysis" v-if="tradePlan.emotionalState.aiAnalysis">
                    <h5 class="subsection-title">Aria's Analysis</h5>
                    <p class="analysis-text">{{ tradePlan.emotionalState.aiAnalysis }}</p>
                  </div>

                  <div v-if="!hasEmotionalStateContent" class="no-emotional-data">
                    <p class="no-data-text">No emotional check data available yet</p>
                    <p class="no-data-subtitle">Complete an emotional check to see your data here</p>
                  </div>
                </div>
              </div>
            </div>


            <!-- Actions -->
            <div class="details-section">
              <div class="section-header" @click="toggleSection('actions')">
                <h4 class="section-title">Actions</h4>
                <span class="collapse-icon" :class="{ expanded: expandedSections.actions }">▼</span>
              </div>
              <div class="section-content" v-if="expandedSections.actions">
                <div class="action-buttons">
                  <button 
                    @click="continuePlan" 
                    class="action-btn primary"
                    :disabled="!canContinue"
                  >
                    Continue Plan
                  </button>
                  <button 
                    @click="deletePlan" 
                    class="action-btn danger"
                  >
                    Delete Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="modal-content loading" v-else>
        <div class="loading-spinner">⏳</div>
        <p>Loading trade plan details...</p>
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
          <button @click="showDeleteConfirmation = false" class="confirmation-btn cancel">
            Cancel
          </button>
          <button @click="confirmDelete" class="confirmation-btn confirm">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const props = defineProps({
  tradePlanId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'plan-deleted', 'plan-continued']);

const tradePlan = ref(null);
const isLoading = ref(true);
const showDeleteConfirmation = ref(false);
const selectedStatus = ref('');
const expandedSections = ref({
  tradeSetup: true,
  emotionalState: true,
  actions: true
});

const loadTradePlanDetails = async () => {
  isLoading.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const response = await axios.get(`${apiBaseUrl}/api/trade-plans/${props.tradePlanId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    
    tradePlan.value = response.data;
  } catch (error) {
    console.error('Error loading trade plan details:', error);
    alert('Failed to load trade plan details');
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  emit('close');
};

const continuePlan = () => {
  emit('plan-continued', tradePlan.value);
  closeModal();
};

const deletePlan = () => {
  showDeleteConfirmation.value = true;
};

const confirmDelete = async () => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    await axios.delete(`${apiBaseUrl}/api/trade-plans/${props.tradePlanId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    
    emit('plan-deleted', props.tradePlanId);
    showDeleteConfirmation.value = false;
    closeModal();
  } catch (error) {
    console.error('Error deleting trade plan:', error);
    alert('Failed to delete trade plan');
    showDeleteConfirmation.value = false;
  }
};

const formatMessageTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString();
};

const formatStatus = (status) => {
  const statusMap = {
    'open': 'Open',
    'emotional_check': 'Emotional Check',
    'technical_analysis': 'Technical Analysis',
    'planning': 'Planning',
    'monitoring': 'Monitoring',
    'entered': 'Entered',
    'completed': 'Completed',
    'passed_over': 'Passed Over',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
};

const formatDecision = (decision) => {
  const decisionMap = {
    'proceed': 'Proceed',
    'proceed_caution': 'Proceed with Caution',
    'take_break': 'Take a Break',
    'reconsider': 'Reconsider',
    'passed': 'Passed'
  };
  return decisionMap[decision] || decision;
};

// Computed property to determine if plan can be continued
const canContinue = () => {
  if (!tradePlan.value) return false;
  
  const continuableStatuses = ['open', 'emotional_check', 'technical_analysis', 'planning', 'monitoring'];
  return continuableStatuses.includes(tradePlan.value.status);
};

// Computed properties for emotional state data
const hasEmotionalStateData = computed(() => {
  return tradePlan.value && tradePlan.value.emotionalState;
});

const hasEmotionalStateContent = computed(() => {
  if (!tradePlan.value || !tradePlan.value.emotionalState) return false;
  
  const emotionalState = tradePlan.value.emotionalState;
  return emotionalState.state || 
         (emotionalState.bodySignals && emotionalState.bodySignals.length > 0) ||
         emotionalState.notes ||
         emotionalState.aiAnalysis;
});

// Computed property for formatted title
const formattedTitle = computed(() => {
  if (!tradePlan.value) return 'Trade Plan Details';
  
  const asset = tradePlan.value.asset || '';
  const direction = tradePlan.value.direction || '';
  const timeframe = tradePlan.value.timeframe || '';
  const createdAt = tradePlan.value.createdAt ? new Date(tradePlan.value.createdAt).toLocaleString() : '';
  
  return `${asset} ${timeframe} ${direction} signal - ${createdAt}`;
});

// Method to update status
const updateStatus = async () => {
  if (!tradePlan.value || !selectedStatus.value) return;
  
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    await axios.patch(`${apiBaseUrl}/api/trade-plans/${props.tradePlanId}`, {
      status: selectedStatus.value
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    
    // Update local trade plan data
    tradePlan.value.status = selectedStatus.value;
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status');
    // Revert selected status to original value
    selectedStatus.value = tradePlan.value.status;
  }
};

// Method to toggle section expansion
const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section];
};

// Watch for tradePlan changes to update selectedStatus
import { watch } from 'vue';
watch(tradePlan, (newTradePlan) => {
  if (newTradePlan) {
    selectedStatus.value = newTradePlan.status;
  }
}, { immediate: true });

onMounted(() => {
  loadTradePlanDetails();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90vw;
  max-width: 1200px;
  max-height: 90vh;
  min-width: 800px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  resize: both;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  gap: 2rem;
}

.header-left {
  flex: 1;
}

.modal-title {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.trade-info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.trade-asset {
  color: #2c3e50;
  font-weight: 600;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.trade-direction {
  color: #2c3e50;
  font-weight: 500;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.trade-direction.long {
  background: #d4edda;
  color: #155724;
}

.trade-direction.short {
  background: #f8d7da;
  color: #721c24;
}

.trade-timeframe {
  color: #6c757d;
  font-weight: 500;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.header-right {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.status-dropdown-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-label {
  color: #6c757d;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
}

.status-dropdown {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  min-width: 150px;
  transition: all 0.3s ease;
}

.status-dropdown:hover {
  border-color: #667eea;
}

.status-dropdown:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.25);
}

/* Status-specific dropdown colors */
.status-dropdown.open {
  background: #d1ecf1;
  color: #0c5460;
}

.status-dropdown.emotional_check {
  background: #fff3cd;
  color: #856404;
}

.status-dropdown.technical_analysis {
  background: #d1ecf1;
  color: #0c5460;
}

.status-dropdown.planning {
  background: #d4edda;
  color: #155724;
}

.status-dropdown.monitoring {
  background: #d1ecf1;
  color: #0c5460;
}

.status-dropdown.entered {
  background: #d1ecf1;
  color: #0c5460;
}

.status-dropdown.completed {
  background: #d4edda;
  color: #155724;
}

.status-dropdown.passed_over {
  background: #e2e3e5;
  color: #383d41;
}

.status-dropdown.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #e9ecef;
  color: #2c3e50;
}

.modal-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.modal-content.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.loading-spinner {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.details-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
  max-height: calc(90vh - 80px);
}

.column-title {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

/* Chat Column Styles */
.chat-column {
  border-right: 1px solid #e9ecef;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.message {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #28a745;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 55px);
}

.message-text {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  color: #2c3e50;
  line-height: 1.5;
  word-wrap: break-word;
}

.message.user .message-text {
  background: #667eea;
  color: white;
}

.message-time {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
  padding-left: 0.5rem;
}

.message.user .message-time {
  text-align: right;
  padding-left: 0;
  padding-right: 0.5rem;
}

.no-messages {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.no-messages-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-messages-subtitle {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* Details Column Styles */
.details-column {
  padding: 1.5rem;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 0;
  margin: -0.5rem 0 0 -0.5rem;
  transition: background-color 0.2s ease;
  border-radius: 6px;
}

.section-header:hover {
  background: rgba(0, 0, 0, 0.03);
}

.section-title {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.collapse-icon {
  font-size: 0.8rem;
  color: #6c757d;
  transition: transform 0.3s ease;
  margin-left: 0.5rem;
}

.collapse-icon.expanded {
  transform: rotate(180deg);
}

.section-content {
  margin-top: 1rem;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #6c757d;
  font-weight: 500;
  font-size: 0.9rem;
}

.detail-value {
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.9rem;
}

.detail-value.long {
  color: #28a745;
}

.detail-value.short {
  color: #dc3545;
}

.detail-value.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.detail-value.status.open {
  background: #d1ecf1;
  color: #0c5460;
}

.detail-value.status.emotional_check {
  background: #fff3cd;
  color: #856404;
}

.detail-value.status.technical_analysis {
  background: #d1ecf1;
  color: #0c5460;
}

.detail-value.status.planning {
  background: #d4edda;
  color: #155724;
}

.detail-value.status.entered {
  background: #d1ecf1;
  color: #0c5460;
}

.detail-value.status.completed {
  background: #d4edda;
  color: #155724;
}

.detail-value.not-set {
  color: #6c757d;
  font-style: italic;
}

.plan-id {
  font-family: monospace;
  font-size: 0.8rem;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* Emotional State Styles */
.emotional-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.emotion-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.emotion-label {
  color: #6c757d;
  font-weight: 500;
}

.emotion-value {
  color: #2c3e50;
  font-weight: 600;
  text-transform: capitalize;
}

.subsection-title {
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.signal-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.signal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.signal-text {
  color: #2c3e50;
  font-weight: 500;
}

.signal-intensity {
  color: #6c757d;
  font-size: 0.8rem;
}

.notes-text,
.analysis-text {
  color: #2c3e50;
  line-height: 1.5;
  margin: 0;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.action-btn.primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-btn.danger {
  background: #e74c3c;
  color: white;
}

.action-btn.danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
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

/* Ensure scroll bars are visible */
.chat-messages::-webkit-scrollbar,
.details-column::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track,
.details-column::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb,
.details-column::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover,
.details-column::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-container {
    width: 95vw;
    height: 95vh;
  }
  
  .details-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
  
  .chat-column {
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
