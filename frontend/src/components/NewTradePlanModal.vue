<template>
  <div class="modal-overlay">
    <div class="modal-content">
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
          <button class="close-btn" @click="closeModal">×</button>
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
                <span v-if="isThinking" class="typing-indicator">Aria is thinking: {{ currentThinkingStep }}</span>
                <span v-else-if="ariaTyping" class="typing-indicator">Aria is typing...</span>
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
                  <span v-else-if="message.role === 'system'">ℹ️</span>
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

              <!-- Submit Emotional Check Button -->
              <div v-if="emotionalState.state" class="submit-emotional-check">
                <button class="btn-primary submit-btn" @click="submitEmotionalCheck">
                  📤 Submit Emotional Check
                </button>
                <p class="submit-description">Send your selected emotion and body signals to Aria for analysis</p>
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
import { ref, computed, onMounted, nextTick, reactive } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close', 'plan-created']);

const currentStep = ref(1);
const showAddAsset = ref(false);
const newAsset = ref('');
const isLoading = ref(false);
const ariaTyping = ref(false);
const userMessage = ref('');
const chatMessages = ref(null);

// Optional debug flag for development logging
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dlog = (...args) => { if (DEBUG) console.log(...args); };

// Thinking indicator state
const isThinking = ref(false);
const thinkingSteps = ref([
  'Reviewing your emotional state…',
  "Checking today's trading context…",
  'Formulating a supportive response…'
]);
const currentThinkingStep = ref('');

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
const emotionalSaved = ref(false);
const todayTrades = ref([]);

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
      dlog('Asset added successfully:', newAsset.value);
    }
  } catch (error) {
    console.error('Error adding asset:', error);
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

const selectEmotion = (emotion) => {
  emotionalState.value.state = emotion.value;
  // Reset body signals when switching emotions
  if (emotion.type === 'positive') {
    emotionalState.value.bodySignals = [];
  } else if (emotionalState.value.bodySignals.length === 0) {
    emotionalState.value.bodySignals = [{ signal: '', intensity: 5 }];
  }
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

const addAriaMessage = (content) => {
  // Immediately add assistant message without simulated typing
  const messageId = messageIdCounter++;
  conversation.value.push({
    id: messageId,
    role: 'assistant',
    content,
    timestamp: new Date()
  });
  isThinking.value = false;
  ariaTyping.value = false;
  scrollToBottom();
};

const addSystemMessage = (content) => {
  const messageId = messageIdCounter++;
  conversation.value.push({
    id: messageId,
    role: 'system',
    content,
    timestamp: new Date()
  });
  scrollToBottom();
};

// Stream chat using SSE over fetch; server persists only on [DONE]
const streamChat = async (messageText) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${apiBaseUrl}/api/trade-plans/${currentTradePlanId.value}/chat/stream`;
  
  // Create an assistant placeholder message we will fill with streamed tokens
  const assistantMessageId = messageIdCounter++;
  const assistantMessage = reactive({
    id: assistantMessageId,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
  });
  conversation.value.push(assistantMessage);
  scrollToBottom();

  // Thinking indicator until first token arrives
  isThinking.value = true;
  ariaTyping.value = false;
  let firstTokenReceived = false;

  // Abort + timeout for fail-safe
  const controller = new AbortController();
  const timeoutMs = 10000;
  const firstTokenTimer = setTimeout(() => {
    if (!firstTokenReceived) {
      controller.abort();
    }
  }, timeoutMs);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ 
        message: messageText, 
        emotionalState: emotionalState.value,
        todayTrades: todayTrades.value
      }),
      signal: controller.signal
    });

    if (!resp.ok || !resp.body) {
      clearTimeout(firstTokenTimer);
      await fallbackBundledReply(messageText, assistantMessage);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE frames separated by blank line
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';

      for (const frame of frames) {
        const dataLine = frame.split('\n').find(l => l.startsWith('data:'));
        if (!dataLine) continue;
        
        const payload = dataLine.slice('data:'.length).trim();

        if (payload === '[DONE]') {
          clearTimeout(firstTokenTimer);
          isThinking.value = false;
          ariaTyping.value = false;

          if (assistantMessage.content.length < 80) {
            assistantMessage.content += " Let's continue exploring this together. What else are you noticing?";
          }
          scrollToBottom();
          return;
        }

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.delta ?? '';
          if (delta) {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              clearTimeout(firstTokenTimer);
              isThinking.value = false;
              ariaTyping.value = true;
            }
            // Type token text character-by-character for smooth UX
            await typeCharacters(delta, assistantMessage);
          }
        } catch {
          // ignore malformed lines/keepalives
        }
      }
    }

    // Ended but no [DONE]; finalize UI
    clearTimeout(firstTokenTimer);
    isThinking.value = false;
    ariaTyping.value = false;
    if (!firstTokenReceived) {
      await fallbackBundledReply(messageText, assistantMessage);
    }
  } catch (err) {
    clearTimeout(firstTokenTimer);
    await fallbackBundledReply(messageText, assistantMessage);
  }
};

const fallbackBundledReply = async (messageText, assistantMessage) => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const resp = await axios.post(`${apiBaseUrl}/api/trade-plans/${currentTradePlanId.value}/chat`, {
      message: messageText,
      emotionalState: emotionalState.value,
      todayTrades: todayTrades.value
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    assistantMessage.content = resp.data.aiResponse || 'Thanks for sharing. Let’s continue exploring your emotional state.';
  } catch {
    assistantMessage.content = "I'm having trouble right now, but let's continue. How are you feeling at this moment?";
  } finally {
    isThinking.value = false;
    ariaTyping.value = false;
    scrollToBottom();
  }
};

const submitEmotionalCheck = async () => {
  if (!emotionalState.value.state) {
    alert('Please select an emotion first');
    return;
  }

  const currentEmotion = emotionalStates.value.find(e => e.value === emotionalState.value.state);
  
  // Build message with emotion and body signals
  let message = `I'm feeling ${currentEmotion.label.toLowerCase()}`;
  
  // Add body signals if they exist and are filled
  const filledBodySignals = emotionalState.value.bodySignals.filter(signal => 
    signal.signal && signal.signal.trim() !== ''
  );
  
  if (filledBodySignals.length > 0) {
    const signalsText = filledBodySignals.map(signal => 
      `${signal.signal} (intensity: ${signal.intensity}/10)`
    ).join(', ');
    message += `. Body signals: ${signalsText}`;
  }

  // Persist emotional state immediately (fail-safe: stop if save fails)
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    await axios.patch(`${apiBaseUrl}/api/trade-plans/${currentTradePlanId.value}/emotional-state`, {
      emotionalState: getSanitizedEmotionalState()
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    emotionalSaved.value = true;
  } catch (err) {
    console.error('Error saving emotional state:', err);
    alert('Failed to save emotional check. Please try again.');
    return;
  }
  
  // Add emotion selection to chat and stream Aria's reply
  addUserMessage(message);
  await streamChat(message);
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
};

const sendUserMessage = async () => {
  if (!userMessage.value.trim() || ariaTyping.value || isThinking.value) return;

  const message = userMessage.value.trim();
  userMessage.value = '';
  addUserMessage(message);

  // Prefer true streaming; fallback handled inside streamChat
  await streamChat(message);
};

const proceedToEmotionalCheck = async () => {
  try {
    isLoading.value = true;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

    // Create trade plan (normalize timeframe collection to a valid backend enum)
    let timeframeNormalized = tradeSetup.value.timeframe;
    const selectedCollection = timeframes.value.find(tf => tf.label === tradeSetup.value.timeframe);

    if (selectedCollection && Array.isArray(selectedCollection.timeframes) && selectedCollection.timeframes.length > 0) {
      const token = selectedCollection.timeframes[0];
      const match = token.match(/^([MH])(\d+)$/i);
      if (match) {
        const unit = match[1].toUpperCase() === 'M' ? 'm' : 'h';
        timeframeNormalized = `${match[2]}${unit}`; // e.g., '15m' or '1h'
      } else {
        timeframeNormalized = token.toLowerCase();
      }
    } else if (/^[MH]\d+$/i.test(timeframeNormalized)) {
      const match = timeframeNormalized.match(/^([MH])(\d+)$/i);
      if (match) {
        const unit = match[1].toUpperCase() === 'M' ? 'm' : 'h';
        timeframeNormalized = `${match[2]}${unit}`;
      }
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

    // Switch to emotional check immediately
    currentStep.value = 2;

    // Immediate system onboarding message (no network, not persisted)
    addSystemMessage("Before a trade is a great time for emotional check-in. How are you feeling right now, and what physical sensations are you noticing? Remember, starting with emotional awareness sets the foundation for disciplined decisions.");

    // Get today's trades for future context (MT5 ingest ready)
    try {
      const todayTradesResponse = await axios.get(`${apiBaseUrl}/api/trade-plans/today-trades`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      todayTrades.value = Array.isArray(todayTradesResponse.data) ? todayTradesResponse.data : [];
    } catch (e) {
      todayTrades.value = [];
    }

    // Removed: background non-stream analyze-emotions call

  } catch (error) {
    console.error('Error proceeding to emotional check:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
      url: error?.config?.url,
      payload: error?.config?.data
    });

    if (error?.response?.status === 400) {
      alert('Invalid trade plan data. Please check your inputs and try again.');
    } else if (error?.response?.status === 404) {
      alert('Unable to create trade plan. Please check your connection and try again.');
    } else {
      alert('Failed to create trade plan. Please try again.');
    }
  } finally {
    isLoading.value = false;
  }
};

const proceedToTechnicalAnalysis = async () => {
  if (!emotionalSaved.value) {
    await updateEmotionalState();
    emotionalSaved.value = true;
  }
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
      emotionalState: getSanitizedEmotionalState()
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
const getSanitizedEmotionalState = () => {
  const sanitizeIntensity = (n) => {
    const num = Number(n);
    if (Number.isNaN(num)) return 5;
    return Math.max(1, Math.min(10, num));
  };
  const signals = Array.isArray(emotionalState.value.bodySignals)
    ? emotionalState.value.bodySignals
        .filter(s => s && typeof s.signal === 'string' && s.signal.trim() !== '')
        .map(s => ({ signal: s.signal.trim(), intensity: sanitizeIntensity(s.intensity) }))
    : [];
  return {
    state: emotionalState.value.state || '',
    bodySignals: signals,
    notes: emotionalState.value.notes || ''
  };
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper: return a comma-separated list of timeframes for the selected collection label
const getSelectedTimeframes = (selectedLabel) => {
  const selectedCollection = timeframes.value.find(tf => tf.label === selectedLabel);
  return selectedCollection && Array.isArray(selectedCollection.timeframes)
    ? selectedCollection.timeframes.join(', ')
    : '';
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

// Function to simulate character-by-character typing for a given text
const typeCharacters = async (text, assistantMessage) => {
  // Visible typing speed and guaranteed paint between characters
  const baseDelay = 12; // ms per character
  const randomVariation = 6; // natural feel
  
  // For very short tokens, still yield a frame so the first letters paint
  if (text.length <= 2) {
    assistantMessage.content += text;
    // Ensure DOM updates and a frame is painted before continuing
    await nextTick();
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
    scrollToBottom();
    await new Promise(resolve => setTimeout(resolve, baseDelay));
    return;
  }
  
  // Type each character and force a paint between characters
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    assistantMessage.content += char;
    
    // Flush Vue updates and force a browser paint
    await nextTick();
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
    
    // Keep the latest text visible
    scrollToBottom();
    
    // Delay slightly to keep typing visible and yield the event loop
    await new Promise(resolve => setTimeout(resolve, baseDelay + Math.random() * randomVariation));
  }
};

onMounted(() => {
  // Initialize with one body signal
  emotionalState.value.bodySignals = [{ signal: '', intensity: 5 }];
  // Load configurations from API
  loadConfigurations();
});

// Load configurations from API
const loadConfigurations = async () => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const configUrl = apiBaseUrl ? `${apiBaseUrl}/api/config` : '/api/config';
    
    dlog('API Base URL:', import.meta.env.VITE_API_BASE_URL);
    dlog('API URL:', configUrl);
    
    // Remove auth headers since we made the API public
    const response = await axios.get(configUrl);
    
    dlog('Configuration API response received:', response.data);
    dlog('Response keys:', Object.keys(response.data));
    
    const config = response.data;
    
    // Debug each config type
    dlog('assets in config:', config.assets);
    dlog('timeframes in config:', config.timeframes);
    dlog('emotions in config:', config.emotions);
    dlog('body_signals in config:', config.body_signals);
    
    // Set assets and timeframes
    availableAssets.value = config.assets || [];
    timeframes.value = config.timeframes || [];
    emotionalStates.value = config.emotions || [];
    bodySignals.value = (config.body_signals || []).map(item => item.signal);
    
    dlog('Final loaded data:');
    dlog('Available assets:', availableAssets.value);
    dlog('Available timeframes:', timeframes.value);
    dlog('Emotional states count:', emotionalStates.value.length);
    dlog('Body signals count:', bodySignals.value.length);
    
  } catch (error) {
    console.error('Error loading configurations:', error);
    dlog('Using fallback configuration data');
    
    // Fallback to default values if API fails
    availableAssets.value = ['BTC', 'NQ', 'GBPUSD', 'USDJPY', 'GOLD', 'JP225'];
    timeframes.value = [
      { label: 'M15, M5, M1', timeframes: ['M15', 'M5', 'M1'], description: 'Short-term analysis set' },
      { label: 'H1, M15, M5', timeframes: ['H1', 'M15', 'M5'], description: 'Medium-term analysis set' },
      { label: 'H4, H1, M15', timeframes: ['H4', 'H1', 'M15'], description: 'Long-term analysis set' }
    ];
    emotionalStates.value = [
      { value: 'calm', label: 'Calm', type: 'positive', icon: '😌' },
      { value: 'focused', label: 'Focused', type: 'positive', icon: '🎯' },
      { value: 'confident', label: 'Confident', type: 'positive', icon: '💪' },
      { value: 'anxious', label: 'Anxious', type: 'negative', icon: '😰' },
      { value: 'rushed', label: 'Rushed', type: 'negative', icon: '⏱️' },
      { value: 'fearful', label: 'Fearful', type: 'negative', icon: '😨' }
    ];
    bodySignals.value = ['Tight shoulders, neck jaw', 'Clenched fists or teeth'];
  }
};
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
  width: 1200px;
  max-height: 90vh;
  height: 800px;
  overflow: hidden;
  position: relative;
  min-width: 900px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  resize: both;
}

/* Improved resize handle styling */
.modal-content::after {
  content: '';
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, transparent 50%, #6c757d 50%);
  cursor: se-resize;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  border-radius: 2px;
}

.modal-content:hover::after {
  opacity: 1;
  background: linear-gradient(135deg, transparent 50%, #495057 50%);
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
  grid-template-columns: 1fr 1fr;
  gap: 0;
  height: 650px;
  min-height: 0; /* Ensure container can shrink */
}

/* Left Column: Chat */
.chat-column {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e9ecef;
  background: #f8f9fa;
  min-height: 0; /* Ensure column can shrink */
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
  min-height: 0; /* Ensure flex child can shrink */
  overflow-y: scroll; /* Always show scrollbar */
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

.message.system .message-content {
  background: #eef2f7;
  border: 1px dashed #cfd7e3;
  color: #334155;
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

.message.system .message-avatar {
  background: #94a3b8;
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

/* Submit Emotional Check Section */
.submit-emotional-check {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #e9ecef;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.submit-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
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
