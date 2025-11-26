<template>
    <div class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <!-- Step 1: Trade Setup -->
        <div v-if="currentStep === 1" class="step-container">
          <div class="modal-header">
            <h2>Start New Trade Plan</h2>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
          
          <div class="step-content">
            <h3>Trade Setup</h3>
            <p class="step-description">Select the asset, direction, and timeframe for your trade</p>
            
            <div class="form-group">
              <label>Asset</label>
              <div class="asset-selector">
                <select v-model="tradeSetup.asset" class="form-select">
                  <option value="">Select Asset</option>
                  <option v-for="asset in availableAssets" :key="asset" :value="asset">
                    {{ asset }}
                  </option>
                </select>
                <button class="add-asset-btn" @click="showAddAsset = true">+ Add</button>
              </div>
            </div>
  
            <div class="form-group">
              <label>Direction</label>
              <div class="direction-buttons">
                <button 
                  class="direction-btn long" 
                  :class="{ active: tradeSetup.direction === 'long' }"
                  @click="tradeSetup.direction = 'long'"
                >
                  📈 Long
                </button>
                <button 
                  class="direction-btn short" 
                  :class="{ active: tradeSetup.direction === 'short' }"
                  @click="tradeSetup.direction = 'short'"
                >
                  📉 Short
                </button>
              </div>
            </div>
  
            <div class="form-group">
              <label>Timeframe</label>
              <select v-model="tradeSetup.timeframe" class="form-select">
                <option value="">Select Timeframe</option>
                <option v-for="tf in timeframes" :key="tf" :value="tf">
                  {{ tf }}
                </option>
              </select>
            </div>
  
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeModal">Cancel</button>
              <button 
                class="btn-primary" 
                @click="proceedToEmotionalCheck"
                :disabled="!isTradeSetupValid"
              >
                Continue to Emotional Check
              </button>
            </div>
          </div>
        </div>
  
        <!-- Step 2: Emotional Check -->
        <div v-if="currentStep === 2" class="step-container">
          <div class="modal-header">
            <h2>Emotional Check</h2>
            <div class="step-indicator">Step 2 of 3</div>
          </div>
          
          <div class="step-content">
            <div class="ai-analysis" v-if="aiAnalysis">
              <div class="ai-header">
                <span class="ai-icon">🤖</span>
                <h4>AI Analysis</h4>
              </div>
              <div class="ai-content">
                <p>{{ aiAnalysis }}</p>
              </div>
            </div>
  
            <h3>How are you feeling right now?</h3>
            <p class="step-description">Select your current emotional state</p>
            
            <div class="emotional-states">
              <div 
                v-for="emotion in emotionalStates" 
                :key="emotion.value"
                class="emotion-card"
                :class="{ 
                  positive: emotion.type === 'positive', 
                  negative: emotion.type === 'negative',
                  selected: emotionalState.state === emotion.value 
                }"
                @click="selectEmotion(emotion)"
              >
                <span class="emotion-icon">{{ emotion.icon }}</span>
                <span class="emotion-label">{{ emotion.label }}</span>
              </div>
            </div>
  
            <!-- Body Signals (only for negative emotions) -->
            <div v-if="emotionalState.state && currentEmotion?.type === 'negative'" class="body-signals">
              <h4>Body Signals</h4>
              <p class="step-description">Describe any physical sensations you're experiencing</p>
              
              <div class="signal-inputs">
                <div v-for="(signal, index) in emotionalState.bodySignals" :key="index" class="signal-row">
                  <select v-model="signal.signal" class="form-select small">
                    <option value="">Select Signal</option>
                    <option v-for="bodySignal in bodySignals" :key="bodySignal" :value="bodySignal">
                      {{ bodySignal }}
                    </option>
                  </select>
                  <div class="intensity-slider">
                    <span>Intensity:</span>
                    <input 
                      type="range" 
                      v-model="signal.intensity" 
                      min="1" 
                      max="10" 
                      class="slider"
                    >
                    <span class="intensity-value">{{ signal.intensity }}/10</span>
                  </div>
                  <button 
                    class="remove-btn" 
                    @click="removeBodySignal(index)"
                    v-if="emotionalState.bodySignals.length > 1"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <button class="add-signal-btn" @click="addBodySignal">
                + Add Body Signal
              </button>
            </div>
  
            <div class="modal-actions">
              <button class="btn-secondary" @click="currentStep = 1">Back</button>
              
              <!-- Positive State Actions -->
              <div v-if="currentEmotion?.type === 'positive'" class="positive-actions">
                <button class="btn-primary" @click="proceedToTechnicalAnalysis">
                  ✅ Proceed Confidently
                </button>
              </div>
              
              <!-- Negative State Actions -->
              <div v-if="currentEmotion?.type === 'negative'" class="negative-actions">
                <button class="btn-caution" @click="proceedWithCaution">
                  ⚠️ Proceed with Extra Caution
                </button>
                <button class="btn-break" @click="takeBreak">
                  ⏸️ Take 5 Minute Break
                </button>
                <button class="btn-reconsider" @click="reconsiderTrade">
                  🔄 Reconsider This Trade
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Add Asset Modal -->
        <div v-if="showAddAsset" class="modal-overlay inner" @click="showAddAsset = false">
          <div class="modal-content small" @click.stop>
            <div class="modal-header">
              <h3>Add New Asset</h3>
              <button class="close-btn" @click="showAddAsset = false">×</button>
            </div>
            <div class="form-group">
              <input 
                v-model="newAsset" 
                type="text" 
                placeholder="Enter asset symbol (e.g., BTC/USD)"
                class="form-input"
                @keyup.enter="addNewAsset"
              >
            </div>
            <div class="modal-actions">
              <button class="btn-secondary" @click="showAddAsset = false">Cancel</button>
              <button class="btn-primary" @click="addNewAsset" :disabled="!newAsset">
                Add Asset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import axios from 'axios';
  
  const emit = defineEmits(['close', 'plan-created']);
  
  const currentStep = ref(1);
  const showAddAsset = ref(false);
  const newAsset = ref('');
  const aiAnalysis = ref('');
  const isLoading = ref(false);
  
  // Available data (you can provide your lists)
  const availableAssets = ref([
    'BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'SPY', 'QQQ',
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'
  ]);
  
  const timeframes = ref(['1m', '5m', '15m', '1h', '4h', '1d', '1w']);
  
  const emotionalStates = ref([
    { value: 'calm', label: 'Calm & Focused', icon: '😌', type: 'positive' },
    { value: 'confident', label: 'Confident', icon: '💪', type: 'positive' },
    { value: 'disciplined', label: 'Disciplined', icon: '🎯', type: 'positive' },
    { value: 'anxious', label: 'Anxious', icon: '😰', type: 'negative' },
    { value: 'fearful', label: 'Fearful', icon: '😨', type: 'negative' },
    { value: 'greedy', label: 'Greedy', icon: '💰', type: 'negative' },
    { value: 'frustrated', label: 'Frustrated', icon: '😠', type: 'negative' },
    { value: 'impatient', label: 'Impatient', icon: '⏰', type: 'negative' }
  ]);
  
  const bodySignals = ref([
    'Tense shoulders', 'Racing heart', 'Shallow breathing', 'Sweaty palms',
    'Butterflies in stomach', 'Jaw clenching', 'Restless legs', 'Headache'
  ]);
  
  const tradeSetup = ref({
    asset: '',
    direction: '',
    timeframe: ''
  });
  
  const emotionalState = ref({
    state: '',
    bodySignals: [{ signal: '', intensity: 5 }],
    notes: ''
  });
  
  const currentTradePlanId = ref(null);
  
  const currentEmotion = computed(() => {
    return emotionalStates.value.find(e => e.value === emotionalState.value.state);
  });
  
  const isTradeSetupValid = computed(() => {
    return tradeSetup.value.asset && tradeSetup.value.direction && tradeSetup.value.timeframe;
  });
  
  const closeModal = () => {
    emit('close');
  };
  
  const addNewAsset = () => {
    if (newAsset.value && !availableAssets.value.includes(newAsset.value)) {
      availableAssets.value.push(newAsset.value);
      tradeSetup.value.asset = newAsset.value;
    }
    showAddAsset.value = false;
    newAsset.value = '';
  };
  
  const addBodySignal = () => {
    emotionalState.value.bodySignals.push({ signal: '', intensity: 5 });
  };
  
  const removeBodySignal = (index) => {
    emotionalState.value.bodySignals.splice(index, 1);
  };
  
  const selectEmotion = (emotion) => {
    emotionalState.value.state = emotion.value;
    // Reset body signals when switching emotions
    if (emotion.type === 'positive') {
      emotionalState.value.bodySignals = [];
    } else if (emotionalState.value.bodySignals.length === 0) {
      emotionalState.value.bodySignals = [{ signal: '', intensity: 5 }];
    }
  };
  
  const proceedToEmotionalCheck = async () => {
    try {
      isLoading.value = true;
      
      // Create trade plan
      const response = await axios.post('/api/trade-plans', tradeSetup.value, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      currentTradePlanId.value = response.data._id;
      
      // Get today's trades for AI analysis
      const todayTradesResponse = await axios.get('/api/trade-plans/today-trades', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      // Get AI analysis
      const aiResponse = await axios.post(`/api/trade-plans/${currentTradePlanId.value}/analyze-emotions`, {
        emotionalData: emotionalState.value,
        todayTrades: todayTradesResponse.data
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      aiAnalysis.value = aiResponse.data.aiAnalysis;
      currentStep.value = 2;
      
    } catch (error) {
      console.error('Error proceeding to emotional check:', error);
      alert('Failed to create trade plan. Please try again.');
    } finally {
      isLoading.value = false;
    }
  };
  
  const proceedToTechnicalAnalysis = async () => {
    await updateEmotionalState();
    emit('plan-created', currentTradePlanId.value);
    closeModal();
  };
  
  const proceedWithCaution = async () => {
    await updateDecision('proceed_caution');
    emit('plan-created', currentTradePlanId.value);
    closeModal();
  };
  
  const takeBreak = async () => {
    await updateDecision('take_break');
    closeModal();
  };
  
  const reconsiderTrade = async () => {
    await updateDecision('passed');
    closeModal();
  };
  
  const updateEmotionalState = async () => {
    try {
      await axios.patch(`/api/trade-plans/${currentTradePlanId.value}/emotional-state`, {
        emotionalState: emotionalState.value
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
    } catch (error) {
      console.error('Error updating emotional state:', error);
    }
  };
  
  const updateDecision = async (decision) => {
    try {
      await axios.patch(`/api/trade-plans/${currentTradePlanId.value}/decision`, {
        decision
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
    } catch (error) {
      console.error('Error updating decision:', error);
    }
  };
  
  onMounted(() => {
    // Initialize with one body signal
    emotionalState.value.bodySignals = [{ signal: '', intensity: 5 }];
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
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-overlay.inner {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .modal-content {
    background: white;
    border-radius: 16px;
    padding: 0;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-content.small {
    max-width: 400px;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e9ecef;
  }
  
  .modal-header h2 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.5rem;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-btn:hover {
    color: #2c3e50;
  }
  
  .step-content {
    padding: 2rem;
  }
  
  .step-indicator {
    color: #6c757d;
    font-size: 0.9rem;
  }
  
  .step-description {
    color: #6c757d;
    margin-bottom: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #2c3e50;
  }
  
  .form-select, .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 1rem;
  }
  
  .form-select.small {
    width: 200px;
  }
  
  .asset-selector {
    display: flex;
    gap: 0.5rem;
  }
  
  .add-asset-btn {
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 0.75rem;
    cursor: pointer;
    white-space: nowrap;
  }
  
  .direction-buttons {
    display: flex;
    gap: 1rem;
  }
  
  .direction-btn {
    flex: 1;
    padding: 1rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
  }
  
  .direction-btn.long.active {
    background: #d4edda;
    border-color: #28a745;
    color: #155724;
  }
  
  .direction-btn.short.active {
    background: #f8d7da;
    border-color: #dc3545;
    color: #721c24;
  }
  
  .emotional-states {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .emotion-card {
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .emotion-card.positive.selected {
    background: #d4edda;
    border-color: #28a745;
  }
  
  .emotion-card.negative.selected {
    background: #f8d7da;
    border-color: #dc3545;
  }
  
  .emotion-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
  }
  
  .emotion-label {
    font-weight: 500;
  }
  
  .body-signals {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
  }
  
  .signal-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .intensity-slider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.slider {
  flex: 1;
}

.intensity-value {
  min-width: 40px;
  text-align: center;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.add-signal-btn {
  background: #f8f9fa;
  border: 2px dashed #e9ecef;
  border-radius: 8px;
  padding: 0.75rem;
  width: 100%;
  cursor: pointer;
  color: #6c757d;
}

.ai-analysis {
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.ai-icon {
  font-size: 1.5rem;
}

.ai-header h4 {
  margin: 0;
  color: #2c3e50;
}

.ai-content p {
  margin: 0;
  color: #2c3e50;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.positive-actions,
.negative-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary,
.btn-secondary,
.btn-caution,
.btn-break,
.btn-reconsider {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #28a745;
  color: white;
}

.btn-primary:hover {
  background: #218838;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-caution {
  background: #ffc107;
  color: #212529;
}

.btn-caution:hover {
  background: #e0a800;
}

.btn-break {
  background: #17a2b8;
  color: white;
}

.btn-break:hover {
  background: #138496;
}

.btn-reconsider {
  background: #dc3545;
  color: white;
}

.btn-reconsider:hover {
  background: #c82333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .emotional-states {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .signal-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .form-select.small {
    width: 100%;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .positive-actions,
  .negative-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .positive-actions button,
  .negative-actions button {
    width: 100%;
  }
}
</style>