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
              <div class="asset-autocomplete">
                <div class="autocomplete-container">
                  <input 
                    type="text"
                    v-model="assetSearch"
                    @input="filterAssets"
                    @focus="handleAssetInputFocus"
                    @keydown="handleAssetKeydown"
                    @blur="hideSuggestions"
                    placeholder="Type to search assets..."
                    class="form-input autocomplete-input"
                  />
                  <div v-if="showAssetSuggestions && filteredAssets.length > 0" class="autocomplete-suggestions">
                    <div 
                      v-for="asset in filteredAssets" 
                      :key="asset"
                      class="suggestion-item"
                      @mousedown="selectAsset(asset)"
                      :class="{ highlighted: highlightedAssetIndex === filteredAssets.indexOf(asset) }"
                    >
                      {{ asset }}
                    </div>
                  </div>
                </div>
                <button class="add-asset-btn" @click="showAddAsset = true">+ Add</button>
              </div>
              <div v-if="tradeSetup.asset" class="selected-asset">
                <small>Selected: <strong>{{ tradeSetup.asset }}</strong></small>
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
              <label>Timeframe Collection</label>
              <select v-model="tradeSetup.timeframe" class="form-select">
                <option value="">Select Timeframe Collection</option>
                <option v-for="tf in timeframes" :key="tf.label" :value="tf.label">
                  {{ tf.label }} - {{ tf.description }}
                </option>
              </select>
              <div v-if="tradeSetup.timeframe" class="timeframe-details">
                <small>Selected timeframes: {{ getSelectedTimeframes(tradeSetup.timeframe) }}</small>
              </div>
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

        <!-- Step 2: Emotional Check - Chat Style -->
        <div v-if="currentStep === 2" class="step-container">
          <div class="modal-header">
            <h2>Emotional Check with Aria</h2>
            <div class="step-indicator">Step 2 of 3</div>
          </div>
          
          <div class="emotional-check-container">
            <!-- Left Column: Chat with Aria -->
            <div class="chat-column">
              <div class="chat-header">
                <div class="aria-avatar">
                  <span class="avatar-icon">👩‍💼</span>
                  <span class="avatar-name">Aria</span>
                </div>
                <div class="chat-status">
                  <span v-if="ariaTyping" class="typing-indicator">Aria is typing...</span>
                </div>
              </div>
              
              <div class="chat-messages" ref="chatMessages">
                <div 
                  v-for="message in conversation" 
                  :key="message.id"
                  :class="['message', message.role]"
                >
                  <div class="message-avatar">
                    <span v-if="message.role === 'assistant'">👩‍💼</span>
                    <span v-else>👤</span>
                  </div>
                  <div class="message-content">
                    <div class="message-text">{{ message.content }}</div>
                    <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>
                
                <!-- Typing indicator -->
                <div v-if="ariaTyping" class="message assistant typing">
                  <div class="message-avatar">👩‍💼</div>
                  <div class="message-content">
                    <div class="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="chat-input-container">
                <input 
                  v-model="userMessage" 
                  @keyup.enter="sendUserMessage"
                  placeholder="Type your response to Aria..."
                  class="chat-input"
                  :disabled="ariaTyping"
                />
                <button 
                  @click="sendUserMessage" 
                  class="send-btn"
                  :disabled="!userMessage.trim() || ariaTyping"
                >
                  Send
                </button>
              </div>
            </div>

            <!-- Right Column: Emotional State Selection -->
            <div class="emotion-column">
              <div class="emotion-section">
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
  import { ref, computed, onMounted, nextTick } from 'vue';
  import axios from 'axios';

  const emit = defineEmits(['close', 'plan-created']);

  const currentStep = ref(1);
  const showAddAsset = ref(false);
  const newAsset = ref('');
  const isLoading = ref(false);
  const ariaTyping = ref(false);
  const userMessage = ref('');
  const chatMessages = ref(null);

  // Configuration data from API
  const availableAssets = ref([]);
  const timeframes = ref([]);
  const emotionalStates = ref([]);
  const bodySignals = ref([]);

  // Autocomplete functionality
  const assetSearch = ref('');
  const filteredAssets = ref([]);
  const showAssetSuggestions = ref(false);
  const highlightedAssetIndex = ref(-1);

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
  
  // Chat conversation
  const conversation = ref([]);
  let messageIdCounter = 0;

  const currentEmotion = computed(() => {
    return emotionalStates.value.find(e => e.value === emotionalState.value.state);
  });

  const isTradeSetupValid = computed(() => {
    return tradeSetup.value.asset && tradeSetup.value.direction && tradeSetup.value.timeframe;
  });

  const closeModal = () => {
    emit('close');
  };

  const addNewAsset = async () => {
    if (!newAsset.value) return;
    
    // Check if asset already exists in local state
    if (availableAssets.value.includes(newAsset.value)) {
      alert('This asset already exists!');
      return;
    }
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await axios.post(`${apiBaseUrl}/api/config/assets`, {
        asset: newAsset.value
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      if (response.data.success) {
        // Update local state with the new asset
        availableAssets.value = response.data.assets;
        tradeSetup.value.asset = newAsset.value;
        console.log('✅ Asset added successfully:', newAsset.value);
      }
    } catch (error) {
      console.error('❌ Error adding asset:', error);
      if (error.response && error.response.status === 409) {
        alert('This asset already exists in the database!');
      } else {
        alert('Failed to add asset. Please try again.');
      }
      return;
    } finally {
      showAddAsset.value = false;
      newAsset.value = '';
    }
  };

  const addBodySignal = () => {
    emotionalState.value.bodySignals.push({ signal: '', intensity: 5 });
  };

  const removeBodySignal = (index) => {
    emotionalState.value.bodySignals.splice(index, 1);
  };

  const selectEmotion = async (emotion) => {
    emotionalState.value.state = emotion.value;
    // Reset body signals when switching emotions
    if (emotion.type === 'positive') {
      emotionalState.value.bodySignals = [];
    } else if (emotionalState.value.bodySignals.length === 0) {
      emotionalState.value.bodySignals = [{ signal: '', intensity: 5 }];
    }
    
    // Add emotion selection to chat
    addUserMessage(`I'm feeling ${emotion.label.toLowerCase()}`);
    
    // Trigger AI response to emotion selection
    await triggerAriaEmotionResponse(emotion);
  };

  const triggerAriaEmotionResponse = async (emotion) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await axios.post(`${apiBaseUrl}/api/trade-plans/${currentTradePlanId.value}/chat`, {
        message: `I just selected ${emotion.label.toLowerCase()} as my emotional state`,
        emotionalState: emotionalState.value
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      await addAriaMessage(response.data.aiResponse);
    } catch (error) {
      console.error('Error triggering AI response for emotion:', error);
      await addAriaMessage("I notice you've selected an emotional state. Let's explore this feeling together.");
    }
  };

  const scrollToBottom = () => {
    nextTick(() => {
      if (chatMessages.value) {
        chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
      }
    });
  };

  const addUserMessage = (content) => {
    conversation.value.push({
      id: messageIdCounter++,
      role: 'user',
      content: content,
      timestamp: new Date()
    });
    scrollToBottom();
  };

  const addAriaMessage = async (content) => {
    ariaTyping.value = true;
    
    // Simulate typing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    conversation.value.push({
      id: messageIdCounter++,
      role: 'assistant',
      content: content,
      timestamp: new Date()
    });
    
    ariaTyping.value = false;
    scrollToBottom();
  };

  const sendUserMessage = async () => {
    if (!userMessage.value.trim() || ariaTyping.value) return;
    
    const message = userMessage.value.trim();
    userMessage.value = '';
    addUserMessage(message);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await axios.post(`${apiBaseUrl}/api/trade-plans/${currentTradePlanId.value}/chat`, {
        message: message,
        emotionalState: emotionalState.value
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      await addAriaMessage(response.data.aiResponse);
    } catch (error) {
      console.error('Error sending message:', error);
      await addAriaMessage("I'm having trouble processing your message right now. Let's continue with our emotional check.");
    }
  };

  const proceedToEmotionalCheck = async () => {
    try {
      isLoading.value = true;
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      // Create trade plan (normalize timeframe collection to a valid backend enum)
      let timeframeNormalized = tradeSetup.value.timeframe;
      const selectedCollection = timeframes.value.find(tf => tf.label === tradeSetup.value.timeframe);
      if (selectedCollection && Array.isArray(selectedCollection.timeframes) && selectedCollection.timeframes.length > 0) {
        // Take the first timeframe from the selected collection, e.g., 'H1' or 'M15'
        const token = selectedCollection.timeframes[0];
        const match = token.match(/^([MH])(\d+)$/i);
        if (match) {
          const unit = match[1].toUpperCase() === 'M' ? 'm' : 'h';
          timeframeNormalized = `${match[2]}${unit}`; // e.g., '15m' or '1h'
        }
      } else if (/^[MH]\d+$/i.test(timeframeNormalized)) {
        // If somehow the v-model captured a single token like 'M15' or 'H1', normalize it
        const match = timeframeNormalized.match(/^([MH])(\d+)$/i);
        const unit = match[1].toUpperCase() === 'M' ? 'm' : 'h';
        timeframeNormalized = `${match[2]}${unit}`;
      }
      const payload = {
        asset: tradeSetup.value.asset,
        direction: tradeSetup.value.direction,
        timeframe: timeframeNormalized
      };
      const response = await axios.post(`${apiBaseUrl}/api/trade-plans`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      currentTradePlanId.value = response.data._id;
      
      // Get today's trades for AI analysis
      const todayTradesResponse = await axios.get(`${apiBaseUrl}/api/trade-plans/today-trades`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      // Get initial AI message
      const aiResponse = await axios.post(`${apiBaseUrl}/api/trade-plans/${currentTradePlanId.value}/analyze-emotions`, {
        emotionalData: emotionalState.value,
        todayTrades: todayTradesResponse.data
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      currentStep.value = 2;
      
      // Add initial AI message to chat after a brief delay
      setTimeout(() => {
        addAriaMessage(aiResponse.data.aiAnalysis);
      }, 500);
      
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
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      await axios.patch(`${apiBaseUrl}/api/trade-plans/${currentTradePlanId.value}/emotional-state`, {
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
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      await axios.patch(`${apiBaseUrl}/api/trade-plans/${currentTradePlanId.value}/decision`, {
        decision
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
    } catch (error) {
      console.error('Error updating decision:', error);
    }
  };

  // Helper functions
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Autocomplete methods
  const filterAssets = () => {
    if (!assetSearch.value) {
      filteredAssets.value = availableAssets.value;
    } else {
      const searchTerm = assetSearch.value.toLowerCase();
      filteredAssets.value = availableAssets.value.filter(asset => 
        asset.toLowerCase().includes(searchTerm)
      );
    }
    highlightedAssetIndex.value = filteredAssets.value.length > 0 ? 0 : -1;
  };

  const handleAssetInputFocus = () => {
    showAssetSuggestions.value = true;
    filterAssets();
  };

  const handleAssetKeydown = (event) => {
    if (!showAssetSuggestions.value || filteredAssets.value.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        highlightedAssetIndex.value = (highlightedAssetIndex.value + 1) % filteredAssets.value.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        highlightedAssetIndex.value = highlightedAssetIndex.value <= 0 
          ? filteredAssets.value.length - 1 
          : highlightedAssetIndex.value - 1;
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedAssetIndex.value >= 0) {
          selectAsset(filteredAssets.value[highlightedAssetIndex.value]);
        }
        break;
      case 'Escape':
        showAssetSuggestions.value = false;
        break;
    }
  };

  const selectAsset = (asset) => {
    tradeSetup.value.asset = asset;
    assetSearch.value = asset;
    showAssetSuggestions.value = false;
    highlightedAssetIndex.value = -1;
  };

  const hideSuggestions = () => {
    setTimeout(() => {
      showAssetSuggestions.value = false;
    }, 200);
  };
  
  // Load configurations from API
  const loadConfigurations = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const configUrl = apiBaseUrl ? `${apiBaseUrl}/api/config` : '/api/config';
      
      console.log('🚀 Starting configuration loading...');
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
      console.log('API URL:', configUrl);
      
      // Remove auth headers since we made the API public
      const response = await axios.get(configUrl);
      
      console.log('✅ Configuration API response received:', response.data);
      console.log('Response keys:', Object.keys(response.data));
      
      const config = response.data;
      
      // Debug each config type
      console.log('assets in config:', config.assets);
      console.log('timeframes in config:', config.timeframes);
      console.log('emotions in config:', config.emotions);
      console.log('body_signals in config:', config.body_signals);
      
      // Set assets and timeframes
      availableAssets.value = config.assets || [];
      timeframes.value = config.timeframes || [];
      emotionalStates.value = config.emotions || [];
      bodySignals.value = (config.body_signals || []).map(item => item.signal);
      
      console.log('📊 Final loaded data:');
      console.log('Available assets:', availableAssets.value);
      console.log('Available timeframes:', timeframes.value);
      console.log('Emotional states count:', emotionalStates.value.length);
      console.log('Body signals count:', bodySignals.value.length);
      
      // Check if dropdowns should have options
      console.log('Asset dropdown will show options:', availableAssets.value.length > 0);
      console.log('Timeframe dropdown will show options:', timeframes.value.length > 0);
      
    } catch (error) {
      console.error('❌ Error loading configurations:', error);
      console.log('Using fallback configuration data');
      
      // Fallback to default values if API fails
      availableAssets.value = ['BTC', 'NQ', 'GBPUSD', 'USDJPY', 'GOLD', 'JP225'];
      timeframes.value = ['M15', 'M5', 'M1', 'H1', 'M3', 'H4'];
      emotionalStates.value = [
        { value: 'calm', label: 'Calm', type: 'positive', icon: '😌' },
        { value: 'focused', label: 'Focused', type: 'positive', icon: '🎯' },
        { value: 'confident', label: 'Confident', type: 'positive', icon: '💪' },
        { value: 'anxious', label: 'Anxious', type: 'negative', icon: '😰' },
        { value: 'rushed', label: 'Rushed', type: 'negative', icon: '⏱️' },
        { value: 'fearful', label: 'Fearful', type: 'negative', icon: '😨' }
      ];
      bodySignals.value = ['Tight shoulders, neck jaw', 'Clenched fists or teeth'];
      
      console.log('Fallback assets:', availableAssets.value);
      console.log('Fallback timeframes:', timeframes.value);
    }
  };

  // Helper function to get selected timeframes
  const getSelectedTimeframes = (selectedLabel) => {
    const selectedCollection = timeframes.value.find(tf => tf.label === selectedLabel);
    return selectedCollection ? selectedCollection.timeframes.join(', ') : '';
  };

  onMounted(() => {
    // Initialize with one body signal
    emotionalState.value.bodySignals = [{ signal: '', intensity: 5 }];
    // Load configurations from API
    loadConfigurations();
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
    max-width: 95vw;
    width: 1100px;
    max-height: 90vh;
    height: 650px;
    overflow: auto;
    resize: both;
    position: relative;
    min-width: 800px;
    min-height: 500px;
  }

  /* Resize handle styling */
  .modal-content::after {
    content: '';
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 15px;
    height: 15px;
    background: linear-gradient(135deg, transparent 50%, #6c757d 50%);
    cursor: se-resize;
    opacity: 0.5;
    transition: opacity 0.2s ease;
  }

  .modal-content:hover::after {
    opacity: 1;
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

  .asset-autocomplete {
    display: flex;
    gap: 0.5rem;
  }

  .autocomplete-container {
    position: relative;
    flex: 1;
  }

  .autocomplete-input {
    position: relative;
    z-index: 1;
  }

  .autocomplete-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 2px solid #e9ecef;
    border-top: none;
    border-radius: 0 0 8px 8px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .suggestion-item {
    padding: 0.75rem;
    cursor: pointer;
    border-bottom: 1px solid #f8f9fa;
    transition: background-color 0.2s ease;
  }

  .suggestion-item:hover,
  .suggestion-item.highlighted {
    background-color: #f8f9fa;
  }

  .suggestion-item:last-child {
    border-bottom: none;
  }

  .selected-asset {
    margin-top: 0.5rem;
    color: #28a745;
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

  /* Emotional Check Container - Two Column Layout */
  .emotional-check-container {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 0;
    height: 650px;
  }

  /* Left Column: Chat */
  .chat-column {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e9ecef;
    background: #f8f9fa;
  }

  .chat-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e9ecef;
    background: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .aria-avatar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .avatar-icon {
    font-size: 1.5rem;
  }

  .avatar-name {
    font-weight: 600;
    color: #2c3e50;
  }

  .typing-indicator {
    color: #6c757d;
    font-size: 0.9rem;
    font-style: italic;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .message {
    display: flex;
    gap: 0.75rem;
    max-width: 85%;
  }

  .message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .message.assistant {
    align-self: flex-start;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .message.user .message-avatar {
    background: #007bff;
    color: white;
  }

  .message.assistant .message-avatar {
    background: #6f42c1;
    color: white;
  }

  .message-content {
    background: white;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .message.user .message-content {
    background: #007bff;
    color: white;
  }

  .message-text {
    line-height: 1.4;
    margin-bottom: 0.25rem;
  }

  .message-time {
    font-size: 0.75rem;
    color: #6c757d;
    opacity: 0.7;
  }

  .message.user .message-time {
    color: rgba(255, 255, 255, 0.7);
  }

  /* Typing animation */
  .typing-dots {
    display: flex;
    gap: 4px;
  }

  .typing-dots span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6c757d;
    animation: typing 1.4s infinite ease-in-out;
  }

  .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
  .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }

  .chat-input-container {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e9ecef;
    background: white;
    display: flex;
    gap: 0.5rem;
  }

  .chat-input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .send-btn {
    padding: 0.75rem 1.5rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .send-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  /* Right Column: Emotions */
  .emotion-column {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    background: white;
    overflow-y: auto;
  }

  .emotion-section {
    flex: 1;
  }

  .emotional-states {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .emotion-card {
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 1rem 0.75rem;
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
    font-size: 1.5rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .emotion-label {
    font-weight: 500;
    font-size: 0.9rem;
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

  .modal-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e9ecef;
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

    .emotional-check-container {
      grid-template-columns: 1fr;
      height: auto;
    }

    .chat-column {
      border-right: none;
      border-bottom: 1px solid #e9ecef;
      height: 400px;
    }

    .emotional-states {
      grid-template-columns: repeat(3, 1fr);
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
