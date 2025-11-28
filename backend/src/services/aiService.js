import axios from 'axios';
import { getSystemPrompt, AI_PERSONALITY } from '../config/aiPersonality.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

export class AIService {
  constructor() {
    this.conversationHistory = new Map(); // userId -> message history
  }

  // Direct chat with the AI - for general conversations
  async chat(userId, message, context = '') {
    const prompt = context ? `${context}\n\n${message}` : message;
    return await this.callDeepseek(userId, prompt, 'deepseek-chat');
  }

  // Analyze trading context and prompt for emotional check-in
  async analyzeTradingContext(userId, tradePlan, todayTrades = []) {
    const tradeContext = {
      asset: tradePlan.asset,
      direction: tradePlan.direction,
      timeframe: tradePlan.timeframe,
      todayTradeCount: todayTrades.length,
      isFirstTradeOfDay: todayTrades.length === 0
    };

    const prompt = `
EMOTIONAL CHECK-IN REQUEST:

The user is about to begin their trading process. This is the emotional check phase where we focus ONLY on their emotional state and coping strategies.

IMPORTANT: DO NOT ask about trading specifics like the asset, setup, or technical analysis. The user hasn't done their analysis yet.

Focus exclusively on:
1. Acknowledging they're starting a trading session
2. Asking them to check in with their current emotional state
3. Emphasizing that emotional awareness comes before analysis
4. Keeping it warm, supportive, and focused on feelings (not trading)

Keep it concise (2-3 sentences maximum). Remember: This is about emotional preparation, not trading strategy.
`;

    return await this.callDeepseek(userId, prompt, 'deepseek-reasoner');
  }

  // Analyze emotional questionnaire responses using reasoner model
  async analyzeEmotionalQuestionnaire(userId, questionnaireResponses) {
    const prompt = `
EMOTIONAL QUESTIONNAIRE ANALYSIS:

User has completed an emotional questionnaire with the following responses:
${JSON.stringify(questionnaireResponses, null, 2)}

Please provide a concise analysis (2-3 paragraphs maximum) focusing on:
1. Key emotional patterns or concerns
2. Trading readiness assessment
3. One key question for self-reflection

Keep it supportive and actionable, not overwhelming.
`;

    return await this.callDeepseek(userId, prompt, 'deepseek-reasoner');
  }

  // Generate technical assessment for analysis entries
  async generateTechnicalAssessment(userId, analysisEntry, tradePlan) {
    const {
      timeframe,
      trend,
      choch,
      divergence,
      stochastics,
      timeCriteria,
      atrAnalysis,
      movingAverages,
      notes
    } = analysisEntry;

    // Calculate grades for context
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
    };

    const totalGrade = Object.keys(gradeValues).reduce((sum, element) => {
      return sum + (gradeValues[element][analysisEntry[element]] || 0);
    }, 0);

    const directionalBias = totalGrade > 5 ? 'Long Focus' : totalGrade < -5 ? 'Short Focus' : 'Unclear';

    const prompt = `
TECHNICAL ANALYSIS ASSESSMENT REQUEST:

TRADE PLAN CONTEXT:
- Asset: ${tradePlan.asset}
- Direction: ${tradePlan.direction}
- Timeframe: ${tradePlan.timeframe}
- Analysis Timeframe: ${timeframe}

TECHNICAL ANALYSIS DATA:
1. Trend: ${trend} (Score: ${gradeValues.trend[trend] || 0})
2. CHoCH: ${choch} (Score: ${gradeValues.choch[choch] || 0})
3. Divergence: ${divergence} (Score: ${gradeValues.divergence[divergence] || 0})
4. Stochastics: ${stochastics} (Score: ${gradeValues.stochastics[stochastics] || 0})
5. Time Criteria: ${timeCriteria} (Score: ${gradeValues.timeCriteria[timeCriteria] || 0})
6. ATR Analysis: ${atrAnalysis} (Score: ${gradeValues.atrAnalysis[atrAnalysis] || 0})
7. Moving Averages: ${movingAverages} (Score: ${gradeValues.movingAverages[movingAverages] || 0})

CALCULATED METRICS:
- Total Grade: ${totalGrade}
- Directional Bias: ${directionalBias}

USER NOTES:
${notes || 'No additional notes provided'}

Please provide a structured technical assessment with the following sections:

1. STRUCTURED BREAKDOWN (analyze each of the 7 elements):
   - For each element, provide 1-2 sentences of commentary
   - Highlight strengths and weaknesses in the analysis
   - Note any inconsistencies or areas needing clarification

2. FREE-FORM ANALYSIS (2-3 paragraphs):
   - Overall technical picture assessment
   - Market context and momentum analysis
   - Key technical levels and patterns observed

3. TRADE RECOMMENDATION (1 paragraph):
   - Clear recommendation based on the analysis
   - Risk assessment and confidence level
   - Suggested next steps or additional analysis needed

Maintain a professional, analytical tone while being supportive. Focus on objective technical analysis while acknowledging the user's work.
`;

    return await this.callDeepseek(userId, prompt, 'deepseek-reasoner');
  }

  // Analyze chat message during emotional check conversation
  async analyzeChatMessage(userId, userMessage, emotionalState, conversationHistory = [], todayTrades = []) {
    // Format conversation history for context
    const conversationContext = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Aria'}: ${msg.content}`)
      .join('\n');

    const currentEmotion = emotionalState?.state ? `Current emotion: ${emotionalState.state}` : 'No emotion selected yet';
    const totalTrades = Array.isArray(todayTrades) ? todayTrades.length : 0;
    const openTrades = Array.isArray(todayTrades) ? todayTrades.filter(t => t.status === 'entered').length : 0;
    const completedTrades = Array.isArray(todayTrades) ? todayTrades.filter(t => t.status === 'completed').length : 0;
    const firstTradeOfDay = totalTrades === 0 ? 'yes' : 'no';

    const prompt = `
EMOTIONAL CHECK CHAT:

CONVERSATION CONTEXT:
${conversationContext || 'No previous conversation'}

CURRENT EMOTIONAL STATE:
${currentEmotion}

TODAY'S TRADES CONTEXT:
- Total: ${totalTrades}, Open: ${openTrades}, Completed: ${completedTrades}, FirstTradeOfDay: ${firstTradeOfDay}

USER'S MESSAGE:
"${userMessage}"

Please respond as Aria, the supportive trading coach. Your response should:
1. Acknowledge the user's message naturally
2. Focus exclusively on emotional support and coping strategies
3. Ask questions that help the user explore their feelings
4. Offer proactive suggestions for managing emotions (like taking a 5-minute break, breathing exercises, or stepping away from trading)
5. Keep responses concise (2-3 sentences maximum)
6. Maintain a warm, caring friend tone
7. Guide the conversation toward emotional awareness and coping strategies

CRITICAL: DO NOT ask about trading specifics, setups, or technical analysis. The user hasn't done their analysis yet. This phase is ONLY about emotional state and coping strategies.
`;

    return await this.callDeepseek(userId, prompt, 'deepseek-reasoner');
  }

  async callDeepseek(userId, prompt, model = 'deepseek-reasoner') {
    try {
      // Get conversation history for context continuity
      const history = this.conversationHistory.get(userId) || [];

      // If API key is not configured, return a graceful fallback response
      if (!DEEPSEEK_API_KEY) {
        const aiResponse = this.generateFallbackResponse(prompt);
        history.push(
          { role: 'user', content: prompt },
          { role: 'assistant', content: aiResponse }
        );
        this.conversationHistory.set(userId, history);
        return aiResponse;
      }
      
      const messages = [
        { role: 'system', content: getSystemPrompt() },
        ...history.slice(-8), // Last 8 messages for better context
        { role: 'user', content: prompt }
      ];

      const response = await axios.post(
        `${DEEPSEEK_BASE_URL}/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: AI_PERSONALITY.modelSettings.temperature,
          presence_penalty: AI_PERSONALITY.modelSettings.presencePenalty,
          frequency_penalty: AI_PERSONALITY.modelSettings.frequencyPenalty,
          max_tokens: AI_PERSONALITY.modelSettings.maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Update conversation history for memory
      history.push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: aiResponse }
      );
      this.conversationHistory.set(userId, history);

      return aiResponse;
    } catch (error) {
      console.error('Deepseek API error:', error);
      // Graceful fallback instead of failing the request
      const history = this.conversationHistory.get(userId) || [];
      const aiResponse = this.generateFallbackResponse(prompt);
      history.push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: aiResponse }
      );
      this.conversationHistory.set(userId, history);
      return aiResponse;
    }
  }

  // Fallback response generator when AI service is unavailable
  generateFallbackResponse(prompt) {
    try {
      if (prompt && prompt.includes('EMOTIONAL CHECK-IN REQUEST')) {
        return "Let's start with a moment of self-awareness. Take a deep breath and check in with yourself: what emotion are you feeling right now? This emotional awareness is your foundation for clear decision-making.";
      }
      if (prompt && prompt.includes('EMOTIONAL QUESTIONNAIRE ANALYSIS')) {
        return "Thanks for sharing your emotional state. Let's focus on how you can manage these feelings effectively. What's one small step you can take right now to feel more centered?";
      }
      if (prompt && prompt.includes('EMOTIONAL CHECK CHAT')) {
        return "I hear you. Let's focus on your emotional state right now. What's the strongest feeling you notice, and how might you ease it with a simple breathing exercise or short break?";
      }
      if (prompt && prompt.includes('TECHNICAL ANALYSIS ASSESSMENT REQUEST')) {
        return `TECHNICAL ASSESSMENT (Fallback Mode):

STRUCTURED BREAKDOWN:
- Trend: Your trend analysis shows ${prompt.includes('up_trending_above_ma') ? 'strong bullish momentum' : 'mixed signals'}. Consider confirming with volume analysis.
- CHoCH: The change of character pattern indicates ${prompt.includes('up_confirmed_verified') ? 'confirmed bullish structure' : 'developing market structure'}.
- Divergence: ${prompt.includes('divergence') ? 'Divergence patterns suggest potential reversal zones' : 'No significant divergence detected'}.
- Stochastics: Momentum indicators show ${prompt.includes('oversold') ? 'potential oversold conditions' : 'neutral momentum'}.
- Time Criteria: ${prompt.includes('time_not_over') ? 'Time criteria support continuation' : 'Time factors are neutral'}.
- ATR Analysis: Volatility assessment indicates ${prompt.includes('high') ? 'elevated market volatility' : 'normal volatility conditions'}.
- Moving Averages: ${prompt.includes('crossing_up') ? 'Bullish MA alignment' : 'Mixed MA signals'}.

FREE-FORM ANALYSIS:
Based on your technical analysis, the market shows a balanced technical picture. The calculated grade suggests ${prompt.includes('Long Focus') ? 'bullish bias' : prompt.includes('Short Focus') ? 'bearish bias' : 'neutral conditions'}. Consider waiting for additional confirmation from price action and volume before making trading decisions.

TRADE RECOMMENDATION:
Given the current technical assessment, maintain a cautious approach. Wait for clearer directional confirmation and consider smaller position sizing until stronger signals emerge. Monitor key support/resistance levels for breakout opportunities.`;
      }
      return "Let's begin with an emotional check-in. How are you feeling right now? Remember, emotional awareness comes before analysis.";
    } catch {
      return "Let's start with a quick emotional check-in. How are you feeling right now?";
    }
  }

  // Get conversation history for a user
  getConversationHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  // Clear conversation history for a user
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  // Export conversation history (for saving to database)
  exportHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  // Import conversation history (for loading from database)
  importHistory(userId, history) {
    this.conversationHistory.set(userId, history);
  }
}

export const aiService = new AIService();
