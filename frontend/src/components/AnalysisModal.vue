<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content analysis-modal" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>

      <!-- Main Content Layout -->
      <div class="analysis-layout">
        <!-- Left Column: Chat with Aria -->
        <div class="chat-column">
          <div class="chat-header">
            <h3>Chat with Aria</h3>
            <div class="ai-status" v-if="isThinking || isTyping">
              <span class="thinking-indicator" v-if="isThinking">🤔 Thinking...</span>
              <span class="typing-indicator" v-if="isTyping">✍️ Typing...</span>
            </div>
          </div>
          
          <div class="chat-messages" ref="chatMessages">
            <div 
              v-for="message in conversation" 
              :key="message.id" 
              :class="['message', message.role]"
            >
              <div class="message-content">
                {{ message.content }}
              </div>
            </div>
          </div>

          <div class="chat-input-container">
            <input
              v-model="userMessage"
              @keyup.enter="sendUserMessage"
              placeholder="Ask Aria about your analysis..."
              class="chat-input"
              :disabled="isThinking || isTyping"
            />
            <button 
              @click="sendUserMessage" 
              class="send-button"
              :disabled="isThinking || isTyping || !userMessage.trim()"
            >
              Send
            </button>
          </div>
        </div>

        <!-- Right Column: Analysis Form -->
        <div class="analysis-column">
          <div class="analysis-header">
            <h3>Technical Analysis - {{ currentTimeframe }}</h3>
            <div class="analysis-header-controls">
              <div class="grade-display" :class="getGradeClass(totalGrade)">
                <span class="grade-label">Total Grade:</span>
                <span class="grade-value">{{ totalGrade }}</span>
                <span class="bias-indicator">{{ directionalBias }}</span>
              </div>
            </div>
          </div>

          <!-- 7 Technical Elements Form -->
          <form @submit.prevent="submitAnalysis" class="analysis-form">
            <!-- Trend -->
            <div class="form-group">
              <label for="trend">1. Trend</label>
              <select v-model="formData.trend" @change="calculateGrade" id="trend">
                <option value="">Select trend...</option>
                <option value="up_trending_above_ma">Up trending, price closed above 10 MA (+2)</option>
                <option value="up_consolidation">Up consolidation, overall up trend, price closed below 10 MA (+1)</option>
                <option value="down_trending_below_ma">Down trending, price closed below 10 MA (-2)</option>
                <option value="down_consolidation">Down consolidation, overall down trend, price closed below 10 MA (-1)</option>
                <option value="unclear">Unclear, no clearly identifiable trend (0)</option>
              </select>
              <span class="element-score" :class="getScoreClass(getElementScore('trend'))">
                {{ getElementScore('trend') }}
              </span>
            </div>

            <!-- CHoCH -->
            <div class="form-group">
              <label for="choch">2. CHoCH</label>
              <select v-model="formData.choch" @change="calculateGrade" id="choch">
                <option value="">Select CHoCH...</option>
                <option value="no_change">No Recent Changes (0)</option>
                <option value="up_trend_broken">Up trend broken (-1)</option>
                <option value="down_trend_broken">Down trend broken (+1)</option>
                <option value="up_confirmed_not_verified">Up Trend confirmed but not verified (+2)</option>
                <option value="down_confirmed_not_verified">Down trend confirmed but not verified (-2)</option>
                <option value="up_verified_not_confirmed">Up trend verified but not confirmed (+2)</option>
                <option value="down_verified_not_confirmed">Down trend verified but not confirmed (-2)</option>
                <option value="up_confirmed_verified">Up trend confirmed and verified (+3)</option>
                <option value="down_confirmed_verified">Down trend confirmed and verified (-3)</option>
              </select>
              <span class="element-score" :class="getScoreClass(getElementScore('choch'))">
                {{ getElementScore('choch') }}
              </span>
            </div>

            <!-- Divergence -->
            <div class="form-group">
              <label for="divergence">3. Divergence</label>
              <select v-model="formData.divergence" @change="calculateGrade" id="divergence">
                <option value="">Select divergence...</option>
                <option value="none">No divergence is not present (0)</option>
                <option value="five_waves_up_divergence">5 Waves up and divergence (-2)</option>
                <option value="five_waves_down_divergence">5 Waves down and divergence (+2)</option>
                <option value="three_waves_up_divergence">3 Waves up and divergence (-1)</option>
                <option value="three_waves_down_divergence">3 Waves down and divergence (+1)</option>
              </select>
              <span class="element-score" :class="getScoreClass(getElementScore('divergence'))">
                {{ getElementScore('divergence') }}
              </span>
            </div>

            <!-- Stochastics -->
            <div class="form-group">
              <label for="stochastics">4. Stochastics</label>
              <select v-model="formData.stochastics" @change="calculateGrade" id="stochastics">
                <option value="">Select stochastics...</option>
                <option value="oversold">Oversold (+1)</option>
                <option value="overbought">Overbought (-1)</option>
                <option value="moving_up">Moving up (+1)</option>
                <option value="moving_down">Moving down (-1)</option>
                <option value="directionless">Directionless (0)</option>
                <option value="divergence_overbought">Divergence around Overbought (-1)</option>
                <option value="divergence_oversold">Divergence around Oversold (+1)</option>
              </select>
              <span class="element-score" :class="getScoreClass(getElementScore('stochastics'))">
                {{ getElementScore('stochastics') }}
              </span>
            </div>

            <!-- Time Criteria -->
            <div class="form-group">
              <label for="timeCriteria">5. Time Criteria</label>
              <select v-model="formData.timeCriteria" @change="calculateGrade" id="timeCriteria">
                <option value="">Select time criteria...</option>
                <option value="uptrend_consolidation_met">Uptrend consolidation time met (+1)</option>
                <option value="downtrend_consolidation_met">Downtrend consolidation time met (-1)</option>
                <option value="uptrend_time_not_over">Uptrend time not over (+1)</option>
                <option value="downtrend_time_not_over">Downtrend time not over (-1)</option>
                <option value="consolidation_not_met">Consolidation time not met (0)</option>
                <option value="trend_time_over">Trend time over (0)</option>
                <option value="not_valid">Time criteria not valid (0)</option>
              </select>
              <span class="element-score" :class="getScoreClass(getElementScore('timeCriteria'))">
                {{ getElementScore('timeCriteria') }}
              </span>
            </div>

            <!-- ATR Analysis -->
            <div class="form-group">
              <label for="atrAnalysis">6. ATR Analysis</label>
              <select v-model="formData.atrAnalysis" @change="calculateGrade" id="atrAnalysis">
                <option value="">Select ATR analysis...</option>
                <option value="up_candle_high">Up candle High (>30%) (+2)</option>
                <option value="down_candle_high">Down candle High (>30%) (-2)</option>
                <option value="up_candle_medium">Up candle Medium (< 30%, > -30%) (+1)</option>
                <option value="down_candle_medium">Down candle Medium (< 30%, > -30%) (-1)</option>
                <option value="low">Low (0)</option>
              </select>
              <span class="element-score" :class="getScoreClass(getElementScore('atrAnalysis'))">
                {{ getElementScore('atrAnalysis') }}
              </span>
            </div>

            <!-- Moving Averages -->
            <div class="form-group">
              <label for="movingAverages">7. Moving Averages</label>
              <select v-model="formData.movingAverages" @change="calculateGrade" id="movingAverages">
                <option value="">Select moving averages...</option>
                <option value="crossing_up">Point of crossing up (+2)</option>
                <option value="fanning_up">MAs fanning up (+1)</option>
                <option value="crossing_down">Point of crossing down (-2)</option>
                <option value="fanning_down">MAs fanning down (-1)</option>
                <option value="unclear">Unclear (0)</option>
              </select>
              <span class="element-score" :class="getScoreClass(getElementScore('movingAverages'))">
                {{ getElementScore('movingAverages') }}
              </span>
            </div>

            <!-- Screenshots Section -->
            <div class="screenshots-section">
              <h4>Screenshots</h4>
              <div v-for="(screenshot, index) in formData.screenshots" :key="index" class="screenshot-row">
                <input
                  v-model="screenshot.url"
                  :placeholder="`Screenshot URL ${index + 1}`"
                  class="screenshot-input"
                />
                <input
                  v-model="screenshot.note"
                  placeholder="Note about this screenshot"
                  class="screenshot-note"
                />
                <button
                  v-if="index > 0"
                  @click="removeScreenshot(index)"
                  class="remove-screenshot"
                  type="button"
                >
                  ×
                </button>
              </div>
              <button @click="addScreenshot" class="add-screenshot" type="button">
                + Add Another Screenshot
              </button>
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label for="notes">Analysis Notes</label>
              <textarea
                v-model="formData.notes"
                id="notes"
                placeholder="Additional notes about your analysis..."
                rows="3"
              ></textarea>
            </div>

            <!-- Navigation Buttons -->
            <div class="navigation-buttons">
              <button 
                @click="goBack" 
                class="nav-button back-button"
                type="button"
              >
                ← Back
              </button>
              <button 
                @click="getAriaAnalysis" 
                class="nav-button aria-analysis-button"
                :disabled="!isFormValid || isGettingAriaAnalysis"
                type="button"
              >
                {{ isGettingAriaAnalysis ? 'Analyzing...' : 'Get Aria Analysis' }}
              </button>
              <button 
                type="submit" 
                class="nav-button submit-button"
                :disabled="!isFormValid || isSubmitting"
              >
                {{ isSubmitting ? 'Submitting...' : submitButtonText }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'

export default {
  name: 'AnalysisModal',
  props: {
    tradePlanId: {
      type: String,
      required: true
    },
    currentTimeframe: {
      type: String,
      required: true,
      validator: (value) => ['HTF', 'MTF', 'LTF'].includes(value)
    },
    showBackButton: {
      type: Boolean,
      default: false
    },
    isLastTimeframe: {
      type: Boolean,
      default: false
    },
    asset: {
      type: String,
      default: ''
    },
    timeframe: {
      type: String,
      default: ''
    },
    direction: {
      type: String,
      default: ''
    },
    createdAt: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'back', 'next-timeframe', 'analysis-submitted'],
  
  setup(props, { emit }) {
    // Reactive state
    const userMessage = ref('')
    const isThinking = ref(false)
    const isTyping = ref(false)
    const isSubmitting = ref(false)
    const isGettingAriaAnalysis = ref(false)
    const chatMessages = ref(null)
    const conversation = ref([])

    // Form data
    const formData = ref({
      trend: '',
      choch: '',
      divergence: '',
      stochastics: '',
      timeCriteria: '',
      atrAnalysis: '',
      movingAverages: '',
      notes: '',
      screenshots: [{ url: '', note: '' }]
    })

    // Grade calculation
    const totalGrade = ref(0)
    const directionalBias = ref('Unclear')

    // Computed properties
    const modalTitle = computed(() => {
      const asset = props.asset || 'Unknown'
      const timeframe = props.timeframe || 'Unknown'
      const direction = props.direction || 'Unknown'
      const createdAt = props.createdAt ? new Date(props.createdAt).toLocaleString() : ''
      const analysisType = props.currentTimeframe
      
      return `${asset} ${timeframe} ${direction} signal - ${createdAt}, ${analysisType} Analysis`
    })

    const submitButtonText = computed(() => {
      return props.isLastTimeframe ? 'Complete Analysis' : 'Next →'
    })

    const isFormValid = computed(() => {
      const requiredFields = [
        'trend', 'choch', 'divergence', 'stochastics', 
        'timeCriteria', 'atrAnalysis', 'movingAverages'
      ]
      return requiredFields.every(field => formData.value[field])
    })

    // Grade calculation logic
    const gradeValues = {
      trend: {
        up_trending_above_ma: 2,
        up_consolidation: 1,
        down_trending_below_ma: -2,
        down_consolidation: -1,
        unclear: 0
      },
      choch: {
        no_change: 0,
        up_trend_broken: -1,
        down_trend_broken: 1,
        up_confirmed_not_verified: 2,
        down_confirmed_not_verified: -2,
        up_verified_not_confirmed: 2,
        down_verified_not_confirmed: -2,
        up_confirmed_verified: 3,
        down_confirmed_verified: -3
      },
      divergence: {
        none: 0,
        five_waves_up_divergence: -2,
        five_waves_down_divergence: 2,
        three_waves_up_divergence: -1,
        three_waves_down_divergence: 1
      },
      stochastics: {
        oversold: 1,
        overbought: -1,
        moving_up: 1,
        moving_down: -1,
        directionless: 0,
        divergence_overbought: -1,
        divergence_oversold: 1
      },
      timeCriteria: {
        uptrend_consolidation_met: 1,
        downtrend_consolidation_met: -1,
        uptrend_time_not_over: 1,
        downtrend_time_not_over: -1,
        consolidation_not_met: 0,
        trend_time_over: 0,
        not_valid: 0
      },
      atrAnalysis: {
        up_candle_high: 2,
        down_candle_high: -2,
        up_candle_medium: 1,
        down_candle_medium: -1,
        low: 0
      },
      movingAverages: {
        crossing_up: 2,
        fanning_up: 1,
        crossing_down: -2,
        fanning_down: -1,
        unclear: 0
      }
    }

    // Methods
    const getElementScore = (element) => {
      const value = formData.value[element]
      return value ? gradeValues[element][value] || 0 : 0
    }

    const calculateGrade = () => {
      const elements = Object.keys(gradeValues)
      let total = 0
      
      elements.forEach(element => {
        total += getElementScore(element)
      })
      
      totalGrade.value = total
      
      // Determine directional bias
      if (total > 5) {
        directionalBias.value = 'Long Focus'
      } else if (total < -5) {
        directionalBias.value = 'Short Focus'
      } else {
        directionalBias.value = 'Unclear'
      }
    }

    const getScoreClass = (score) => {
      if (score > 0) return 'positive'
      if (score < 0) return 'negative'
      return 'neutral'
    }

    const getGradeClass = (grade) => {
      if (grade > 5) return 'long-focus'
      if (grade < -5) return 'short-focus'
      return 'unclear'
    }

    const addScreenshot = () => {
      formData.value.screenshots.push({ url: '', note: '' })
    }

    const removeScreenshot = (index) => {
      formData.value.screenshots.splice(index, 1)
    }

    const scrollToBottom = async () => {
      await nextTick()
      if (chatMessages.value) {
        chatMessages.value.scrollTop = chatMessages.value.scrollHeight
      }
    }

    const sendUserMessage = async () => {
      if (!userMessage.value.trim()) return

      const message = userMessage.value.trim()
      userMessage.value = ''

      // Add user message to conversation
      conversation.value.push({
        id: Date.now(),
        role: 'user',
        content: message
      })

      await scrollToBottom()

      // Simulate AI response (will be replaced with actual API call)
      isThinking.value = true
      setTimeout(() => {
        isThinking.value = false
        isTyping.value = true
        
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: ''
        }
        conversation.value.push(assistantMessage)

        const response = "I can see you're working on your technical analysis. Let me know if you need any help interpreting the grading system or want to discuss your findings."
        
        // Simulate typing effect
        let i = 0
        const typeWriter = () => {
          if (i < response.length) {
            assistantMessage.content += response.charAt(i)
            i++
            setTimeout(typeWriter, 20)
          } else {
            isTyping.value = false
            scrollToBottom()
          }
        }
        typeWriter()
      }, 1000)
    }

    const submitAnalysis = async () => {
      if (!isFormValid.value) return
      
      isSubmitting.value = true
      
      try {
        // Filter out empty screenshots
        const validScreenshots = formData.value.screenshots.filter(s => s.url.trim())
        
        const analysisData = {
          timeframe: props.currentTimeframe,
          trend: formData.value.trend,
          choch: formData.value.choch,
          divergence: formData.value.divergence,
          stochastics: formData.value.stochastics,
          timeCriteria: formData.value.timeCriteria,
          atrAnalysis: formData.value.atrAnalysis,
          movingAverages: formData.value.movingAverages,
          notes: formData.value.notes,
          screenshots: validScreenshots
        }
        
        console.log('Submitting analysis data:', analysisData)
        
        // Get API base URL from environment
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
        
        // Submit to backend API
        const response = await fetch(`${apiBaseUrl}/api/trade-plans/${props.tradePlanId}/analysis-entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(analysisData)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          })
          throw new Error(`Failed to submit analysis: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('Analysis submitted successfully:', result)
        
        // Emit event based on whether this is the last timeframe
        if (props.isLastTimeframe) {
          emit('analysis-submitted', result)
        } else {
          emit('next-timeframe', result)
        }
        
      } catch (error) {
        console.error('Error submitting analysis:', error)
        // Add error message to chat
        conversation.value.push({
          id: Date.now(),
          role: 'assistant',
          content: `I encountered an error submitting your analysis: ${error.message}. Please try again or contact support if the issue persists.`
        })
        await scrollToBottom()
      } finally {
        isSubmitting.value = false
      }
    }

    const closeModal = () => {
      emit('close')
    }

    const getAriaAnalysis = async () => {
      if (!isFormValid.value) return
      
      isGettingAriaAnalysis.value = true
      
      try {
        // Add user message showing the analysis data
        const analysisSummary = `I've completed my ${props.currentTimeframe} analysis with the following selections:
- Trend: ${formData.value.trend} (${getElementScore('trend')})
- CHoCH: ${formData.value.choch} (${getElementScore('choch')})
- Divergence: ${formData.value.divergence} (${getElementScore('divergence')})
- Stochastics: ${formData.value.stochastics} (${getElementScore('stochastics')})
- Time Criteria: ${formData.value.timeCriteria} (${getElementScore('timeCriteria')})
- ATR Analysis: ${formData.value.atrAnalysis} (${getElementScore('atrAnalysis')})
- Moving Averages: ${formData.value.movingAverages} (${getElementScore('movingAverages')})

Total Grade: ${totalGrade.value} (${directionalBias.value})

Please provide your technical assessment of this analysis.`

        conversation.value.push({
          id: Date.now(),
          role: 'user',
          content: analysisSummary
        })

        await scrollToBottom()

        // Simulate Aria analysis (will be replaced with actual API call)
        isThinking.value = true
        setTimeout(() => {
          isThinking.value = false
          isTyping.value = true
          
          const assistantMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: ''
          }
          conversation.value.push(assistantMessage)

          const response = `Based on your ${props.currentTimeframe} analysis with a total grade of ${totalGrade.value} (${directionalBias.value}), here's my technical assessment:

**Structured Breakdown:**
1. **Trend Analysis**: Your trend selection shows ${formData.value.trend.replace(/_/g, ' ')} which contributes ${getElementScore('trend')} to the overall grade.
2. **CHoCH Pattern**: The ${formData.value.choch.replace(/_/g, ' ')} pattern indicates ${getElementScore('choch') > 0 ? 'bullish' : 'bearish'} momentum.
3. **Divergence Signals**: ${formData.value.divergence.replace(/_/g, ' ')} provides ${getElementScore('divergence') > 0 ? 'supportive' : 'contrary'} evidence.

**Free-form Analysis:**
The combination of these technical elements suggests ${directionalBias.value.toLowerCase()} bias. The ${props.currentTimeframe} timeframe shows ${totalGrade.value > 0 ? 'constructive' : 'deteriorating'} technical structure.

**Recommendation:**
${totalGrade.value > 5 ? 'Consider long positions with proper risk management' : totalGrade.value < -5 ? 'Consider short positions with proper risk management' : 'Wait for clearer directional signals before entering trades'}.`

          // Simulate typing effect
          let i = 0
          const typeWriter = () => {
            if (i < response.length) {
              assistantMessage.content += response.charAt(i)
              i++
              setTimeout(typeWriter, 20)
            } else {
              isTyping.value = false
              scrollToBottom()
            }
          }
          typeWriter()
        }, 1500)
        
      } catch (error) {
        console.error('Error getting Aria analysis:', error)
        conversation.value.push({
          id: Date.now(),
          role: 'assistant',
          content: "I encountered an error analyzing your technical selections. Please try again or contact support if the issue persists."
        })
        await scrollToBottom()
      } finally {
        isGettingAriaAnalysis.value = false
      }
    }

    const goBack = () => {
      emit('back')
    }

    // Initialize with welcome message
    onMounted(() => {
      conversation.value.push({
        id: Date.now(),
        role: 'assistant',
        content: `Welcome to your ${props.currentTimeframe} analysis! I'm here to help you work through the 7 technical elements. Feel free to ask me any questions about the grading system or your analysis.`
      })
      scrollToBottom()
    })

    return {
      userMessage,
      isThinking,
      isTyping,
      isSubmitting,
      isGettingAriaAnalysis,
      chatMessages,
      conversation,
      formData,
      totalGrade,
      directionalBias,
      modalTitle,
      submitButtonText,
      isFormValid,
      getElementScore,
      calculateGrade,
      getScoreClass,
      getGradeClass,
      addScreenshot,
      removeScreenshot,
      sendUserMessage,
      submitAnalysis,
      getAriaAnalysis,
      closeModal,
      goBack
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.analysis-modal {
  width: 95vw;
  height: 90vh;
  max-width: 1400px;
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.analysis-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  min-height: 0;
}

/* Chat Column Styles */
.chat-column {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  min-height: 0;
}

.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.chat-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.ai-status {
  margin-top: 5px;
  font-size: 0.875rem;
  color: #6b7280;
}

.chat-messages {
  flex: 1;
  overflow-y: scroll;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.4;
}

.message.user {
  align-self: flex-end;
  background: #3b82f6;
  color: white;
}

.message.assistant {
  align-self: flex-start;
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

.chat-input-container {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 10px;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
}

.chat-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.send-button {
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

.send-button:hover:not(:disabled) {
  background: #2563eb;
}

.send-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Analysis Column Styles */
.analysis-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.analysis-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analysis-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.analysis-header-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.aria-analysis-button {
  padding: 8px 16px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.aria-analysis-button:hover:not(:disabled) {
  background: #7c3aed;
}

.aria-analysis-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.grade-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
}

.grade-display.long-focus {
  background: #dcfce7;
  color: #166534;
}

.grade-display.short-focus {
  background: #fee2e2;
  color: #991b1b;
}

.grade-display.unclear {
  background: #fef3c7;
  color: #92400e;
}

.grade-label {
  font-size: 0.875rem;
}

.grade-value {
  font-size: 1.125rem;
}

.bias-indicator {
  font-size: 0.75rem;
  opacity: 0.8;
}

.analysis-form {
  flex: 1;
  overflow-y: scroll;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.element-score {
  font-weight: 600;
  font-size: 0.875rem;
  padding: 4px 8px;
  border-radius: 4px;
  align-self: flex-start;
}

.element-score.positive {
  background: #dcfce7;
  color: #166534;
}

.element-score.negative {
  background: #fee2e2;
  color: #991b1b;
}

.element-score.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

/* Screenshots Section */
.screenshots-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.screenshots-section h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 1rem;
}

.screenshot-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.screenshot-input,
.screenshot-note {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.remove-screenshot {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
}

.remove-screenshot:hover {
  background: #dc2626;
}

.add-screenshot {
  background: none;
  border: 1px dashed #d1d5db;
  color: #6b7280;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.add-screenshot:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Navigation Buttons */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.nav-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  margin-right: auto;
}

.back-button:hover {
  background: #e5e7eb;
}

.aria-analysis-button {
  background: #8b5cf6;
  color: white;
  margin: 0 auto;
}

.aria-analysis-button:hover:not(:disabled) {
  background: #7c3aed;
}

.aria-analysis-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.submit-button {
  background: #10b981;
  color: white;
  margin-left: auto;
}

.submit-button:hover:not(:disabled) {
  background: #059669;
}

.submit-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
