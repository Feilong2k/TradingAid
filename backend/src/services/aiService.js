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
TRADING CONTEXT CHECK-IN:

The user is planning to trade ${tradePlan.asset} ${tradePlan.direction} on ${tradePlan.timeframe}.

TRADING DAY CONTEXT:
- Today's trades so far: ${todayTrades.length}
- First trade of the day: ${todayTrades.length === 0 ? 'Yes' : 'No'}
- Recent activity: ${todayTrades.length > 0 ? 'Already traded today' : 'Fresh start'}

EMOTIONAL CHECK-IN REQUEST:
Please provide a warm, supportive prompt asking the user to check in with their emotional state before proceeding. Focus on:
1. Acknowledge the trading context briefly
2. Ask them to reflect on how they're feeling right now
3. Emphasize the importance of emotional awareness
4. Keep it concise (2-3 sentences maximum)

Remember: The user hasn't completed the emotional questionnaire yet - you're inviting them to do so now.
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

  async callDeepseek(userId, prompt, model = 'deepseek-reasoner') {
    try {
      // Get conversation history for context continuity
      const history = this.conversationHistory.get(userId) || [];
      
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
      throw new Error('AI service temporarily unavailable');
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
