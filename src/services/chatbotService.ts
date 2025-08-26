// Gemini-powered Chatbot Service for Coffee App Support
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatbotResponse {
  success: boolean;
  message?: string;
  error?: string;
  suggestions?: string[];
}

export interface UserContext {
  firstName?: string;
  lastName?: string;
  email?: string;
  orderHistory?: any[];
  favorites?: any[];
  recentSearches?: string[];
}

class ChatbotService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private chat: any = null;
  private apiKey: string = '';
  private isInitialized: boolean = false;
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    // You'll need to set your API key
    // this.initializeWithApiKey('YOUR_GEMINI_API_KEY');
  }

  /**
   * Initialize the chatbot with Gemini API key
   */
  initializeWithApiKey(apiKey: string): boolean {
    try {
      this.apiKey = apiKey;
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        },
      });
      
      this.isInitialized = true;
      console.log('✅ Gemini chatbot initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Gemini chatbot:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Get the system prompt for the coffee app chatbot
   */
  private getSystemPrompt(userContext?: UserContext): string {
    const userName = userContext?.firstName ? ` ${userContext.firstName}` : '';
    
    return `You are Coffee Bot, a friendly and knowledgeable AI assistant for "The Coffee" mobile app - a premium coffee ordering and discovery platform.

**YOUR ROLE:**
- Help users with coffee-related questions, app features, and order assistance
- Provide personalized recommendations based on user preferences
- Troubleshoot app issues and guide users through features
- Share coffee knowledge and brewing tips
- Maintain a warm, enthusiastic, and professional tone

**COFFEE APP FEATURES YOU CAN HELP WITH:**
🏠 **Home & Discovery:**
- Browse coffee drinks: Americano, Black Coffee, Cappuccino, Espresso, Latte, Macchiato
- Coffee beans: Arabica, Robusta, Liberica, Excelsa from various origins
- Popular products and recommendations
- Voice search and image search for coffee products

📱 **App Features:**
- Search functionality (text, voice, image)
- Advanced filters (price, rating, roast level)
- Favorites management
- Cart and ordering
- User profiles and preferences
- Order history and tracking
- Push notifications

☕ **Coffee Knowledge:**
- Roast levels: Light, Medium, Dark
- Origins: South America, Africa, Southeast Asia
- Brewing methods and tips
- Coffee bean characteristics
- Drink customization options

🛒 **Ordering & Account:**
- Cart management and checkout
- Payment methods and pricing
- Delivery address setup
- Order tracking and history
- Profile management
- Account preferences

**AVAILABLE PRODUCTS:**
**Coffee Drinks:** Americano, Black Coffee, Cappuccino, Espresso, Latte, Macchiato
**Coffee Beans:** Arabica Beans, Robusta Beans, Liberica Beans, Excelsa Beans
**Roast Levels:** Light Roasted, Medium Roasted, Dark Roasted
**Sizes:** S, M, L for drinks | 250gm, 500gm, 1kg for beans

**USER CONTEXT:**${userName ? `
- User Name: ${userName}` : ''}${userContext?.email ? `
- Email: ${userContext.email}` : ''}${userContext?.favorites?.length ? `
- Favorite Items: ${userContext.favorites.length} items` : ''}${userContext?.orderHistory?.length ? `
- Order History: ${userContext.orderHistory.length} orders` : ''}${userContext?.recentSearches?.length ? `
- Recent Searches: ${userContext.recentSearches.slice(0, 3).join(', ')}` : ''}

**RESPONSE GUIDELINES:**
1. Keep responses concise but helpful (2-4 sentences max)
2. Use coffee and food emojis appropriately ☕🥐🌟
3. Provide specific actionable advice
4. Offer to help with related questions
5. If you don't know something specific about the app, acknowledge it and suggest alternatives
6. Always maintain an enthusiastic and friendly coffee shop vibe

**EXAMPLE RESPONSES:**
- "Great choice${userName}! ☕ Cappuccino is one of our most popular drinks with its perfect balance of espresso and steamed milk. Would you like me to help you find the perfect roast level or add it to your cart?"
- "I'd love to help you discover new coffees! 🌟 Try our voice search feature - just tap the microphone and say what you're looking for. You can also use image search if you have a photo of coffee you like!"
- "For a strong, bold flavor, I recommend our Dark Roasted Robusta Beans from Africa ☕ They're perfect for espresso-based drinks. Would you like to know more about brewing tips or pricing?"

Remember: You're here to make coffee discovery and ordering delightful and easy!`;
  }

  /**
   * Start a new chat session with context
   */
  async startChat(userContext?: UserContext): Promise<boolean> {
    if (!this.isInitialized || !this.model) {
      console.error('Chatbot not initialized');
      return false;
    }

    try {
      const systemPrompt = this.getSystemPrompt(userContext);
      
      this.chat = this.model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          },
          {
            role: "model",
            parts: [{ text: `Hello${userContext?.firstName ? ` ${userContext.firstName}` : ''}! ☕ Welcome to The Coffee app support! I'm here to help you discover amazing coffees, navigate the app, and answer any questions you have. What can I help you with today? 

You can ask me about:
🔍 Finding specific coffees or beans
📱 Using app features like search or voice commands  
☕ Coffee knowledge and recommendations
🛒 Orders, cart, or account help
⭐ Personalized suggestions based on your taste

How can I make your coffee experience better?` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 1024,
        },
      });

      this.conversationHistory = [];
      console.log('✅ Chat session started with user context');
      return true;
    } catch (error) {
      console.error('❌ Failed to start chat session:', error);
      return false;
    }
  }

  /**
   * Send a message to the chatbot and get response
   */
  async sendMessage(userMessage: string, userContext?: UserContext): Promise<ChatbotResponse> {
    if (!this.isInitialized || !this.chat) {
      return {
        success: false,
        error: 'Chatbot not initialized. Please try again.',
      };
    }

    try {
      console.log('🤖 Sending message to chatbot:', userMessage);
      
      // Add user context to enhance the message if available
      let enhancedMessage = userMessage;
      if (userContext) {
        const contextInfo = [];
        if (userContext.recentSearches?.length) {
          contextInfo.push(`Recent searches: ${userContext.recentSearches.slice(0, 3).join(', ')}`);
        }
        if (userContext.favorites?.length) {
          contextInfo.push(`Has ${userContext.favorites.length} favorite items`);
        }
        
        if (contextInfo.length > 0) {
          enhancedMessage = `${userMessage}\n\n[User Context: ${contextInfo.join(', ')}]`;
        }
      }

      const result = await this.chat.sendMessage(enhancedMessage);
      const response = await result.response;
      const botMessage = response.text();

      console.log('🤖 Chatbot response:', botMessage);

      // Store conversation history
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        text: userMessage,
        isUser: true,
        timestamp: new Date(),
      };

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        text: botMessage,
        isUser: false,
        timestamp: new Date(),
      };

      this.conversationHistory.push(userMsg, botMsg);

      // Generate suggestions based on the response
      const suggestions = this.generateSuggestions(userMessage, botMessage);

      return {
        success: true,
        message: botMessage,
        suggestions,
      };
    } catch (error: any) {
      console.error('❌ Chatbot error:', error);
      
      // Handle specific error types
      if (error.message?.includes('API key')) {
        return {
          success: false,
          error: 'API configuration error. Please check your connection and try again.',
        };
      } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
        return {
          success: false,
          error: 'Service temporarily unavailable. Please try again in a few moments.',
        };
      } else {
        return {
          success: false,
          error: 'Sorry, I encountered an error. Please try asking your question differently.',
        };
      }
    }
  }

  /**
   * Generate quick reply suggestions based on context
   */
  private generateSuggestions(userMessage: string, botResponse: string): string[] {
    const message = userMessage.toLowerCase();
    const response = botResponse.toLowerCase();
    const suggestions: string[] = [];

    // Coffee-related suggestions
    if (message.includes('coffee') || message.includes('recommend')) {
      suggestions.push('What\'s popular today?', 'Show me dark roast options', 'Help with coffee brewing');
    }
    
    // Search-related suggestions
    if (message.includes('search') || message.includes('find')) {
      suggestions.push('How to use voice search?', 'Image search tips', 'Advanced filters');
    }
    
    // Order-related suggestions
    if (message.includes('order') || message.includes('cart')) {
      suggestions.push('Track my order', 'Payment options', 'Delivery information');
    }
    
    // Profile-related suggestions
    if (message.includes('profile') || message.includes('account')) {
      suggestions.push('Update my preferences', 'Manage favorites', 'Notification settings');
    }

    // Bean-specific suggestions
    if (response.includes('bean') || response.includes('arabica') || response.includes('robusta')) {
      suggestions.push('Tell me about coffee origins', 'Best beans for espresso', 'Roast level differences');
    }

    // Default suggestions if no specific context
    if (suggestions.length === 0) {
      suggestions.push('Coffee recommendations', 'App features', 'Order help');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Check if chatbot is ready to use
   */
  isReady(): boolean {
    return this.isInitialized && this.chat !== null;
  }

  /**
   * Get chatbot status
   */
  getStatus(): { initialized: boolean; hasActiveChat: boolean; messageCount: number } {
    return {
      initialized: this.isInitialized,
      hasActiveChat: this.chat !== null,
      messageCount: this.conversationHistory.length,
    };
  }

  /**
   * End current chat session
   */
  endChat(): void {
    this.chat = null;
    this.conversationHistory = [];
    console.log('🤖 Chat session ended');
  }

  /**
   * Handle common app-related queries with quick responses
   */
  getQuickResponse(query: string): string | null {
    const q = query.toLowerCase().trim();
    
    const quickResponses: { [key: string]: string } = {
      'hello': 'Hi there! ☕ Welcome to The Coffee app! How can I help you today?',
      'hi': 'Hello! ☕ I\'m here to help with all your coffee needs. What would you like to know?',
      'help': 'I can help you with coffee recommendations, app features, orders, and more! What specifically would you like assistance with?',
      'menu': 'Our menu includes delicious coffee drinks (Americano, Cappuccino, Latte, etc.) and premium coffee beans (Arabica, Robusta, etc.). Would you like recommendations?',
      'hours': 'The Coffee app is available 24/7 for ordering! ☕ Delivery times may vary by location. Would you like help with placing an order?',
      'price': 'Our coffee drinks range from $1.15 to $3.55, and coffee beans from $5.50 to $18.50. Would you like to see specific pricing for any items?',
    };

    return quickResponses[q] || null;
  }
}

// Export singleton instance
export default new ChatbotService();
