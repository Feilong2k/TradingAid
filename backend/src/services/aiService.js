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

  // Analyze chat message during emotional check conversation
  async analyzeChatMessage(userId, userMessage, emotionalState, conversationHistory = []) {
    // Format conversation history for context
    const conversationContext = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Aria'}: ${msg.content}`)
      .join('\n');

    const currentEmotion = emotionalState?.state ? `Current emotion: ${emotionalState.state}` : 'No emotion selected yet';

    const prompt = `
EMOTIONAL CHECK CHAT:

CONVERSATION CONTEXT:
${conversationContext || 'No previous conversation'}

CURRENT EMOTIONAL STATE:
${currentEmotion}

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
