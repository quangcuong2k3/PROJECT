# ☕ Coffee Bot Setup Guide

## Overview
Your Coffee app now includes an AI-powered chatbot using Google's Gemini API. The chatbot provides intelligent support for coffee recommendations, app features, order assistance, and general coffee knowledge.

## 🚀 Quick Setup

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Your App
1. Open `src/config/chatbotConfig.ts`
2. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:
```typescript
GEMINI_API_KEY: 'AIzaSyC7YourActualApiKeyHere1234567890',
```

### 3. Test the Chatbot
1. Run your app: `npm start` or `expo start`
2. Navigate to the Profile screen
3. Tap "Coffee Bot Support" in the Support & Help section
4. Start chatting!

## ✨ Features

### 🤖 AI-Powered Responses
- **Coffee Knowledge**: Bean types, roast levels, brewing tips
- **Product Recommendations**: Personalized suggestions based on preferences
- **App Support**: Help with search, orders, voice features, etc.
- **Order Assistance**: Cart management, checkout, payment help
- **Account Help**: Profile settings, preferences, favorites

### 🎯 Context-Aware
- Knows your name and profile information
- Remembers conversation context
- Provides relevant quick reply suggestions
- Adapts responses based on user history

### 🎨 Modern UI
- Sleek chat interface with animations
- Typing indicators and message timestamps
- Quick reply suggestions
- Error handling and fallback modes
- Responsive design

## 📱 Usage Examples

### Sample User Queries:
- "What's the difference between arabica and robusta beans?"
- "I need help finding a strong coffee for espresso"
- "How do I use voice search?"
- "My order isn't showing up"
- "What coffee would you recommend for a beginner?"
- "How do I add items to my cart?"

### Bot Capabilities:
- **Coffee Education**: Bean origins, roast profiles, brewing methods
- **Product Discovery**: Recommendations based on taste preferences
- **Technical Support**: App features, troubleshooting, how-to guides
- **Order Management**: Help with cart, checkout, tracking
- **Account Assistance**: Profile updates, settings, preferences

## 🔧 Customization

### 1. Modify Bot Personality
Edit the system prompt in `src/services/chatbotService.ts`:
```typescript
private getSystemPrompt(userContext?: UserContext): string {
  // Customize the bot's personality and knowledge here
}
```

### 2. Add More Context
Update the `getUserContext()` function in ProfileScreen:
```typescript
const getUserContext = (): UserContext => {
  return {
    firstName: userProfile?.firstName,
    lastName: userProfile?.lastName,
    email: user?.email || '',
    orderHistory: [], // Add actual order history
    favorites: [], // Add user favorites
    recentSearches: [], // Add search history
  };
};
```

### 3. Configure Settings
Modify `src/config/chatbotConfig.ts`:
```typescript
export const CHATBOT_CONFIG = {
  GEMINI_API_KEY: 'your-key-here',
  MAX_MESSAGE_LENGTH: 500,
  TYPING_DELAY: 1000,
  // ... other settings
};
```

## 🛠️ Integration Points

### Current Integration:
- ✅ **Profile Screen**: Support & Help section
- ✅ **User Context**: Name, email, profile data
- ✅ **Coffee Knowledge**: Product database integration

### Future Integration Opportunities:
- **Search Results**: "Need help finding coffee?" button
- **Cart Screen**: "Questions about your order?" support
- **Order History**: "Having issues with an order?" assistance
- **Home Screen**: Floating chat button for quick access
- **Push Notifications**: Proactive support suggestions

## 🔒 Security & Best Practices

### API Key Security:
- ✅ Stored in config file (not hardcoded)
- ⚠️ **Important**: Add `src/config/chatbotConfig.ts` to `.gitignore`
- 🔐 Consider using environment variables for production

### Rate Limiting:
- Gemini has generous free tier limits
- Monitor usage in Google AI Studio console
- Implement client-side throttling if needed

### Privacy:
- Bot doesn't store conversation history permanently
- User context is only used for current session
- No sensitive data is sent to Gemini

## 📊 Analytics & Monitoring

### Track Usage:
```typescript
// Add to your analytics service
trackEvent('chatbot_opened', { user_id: user.uid });
trackEvent('chatbot_message_sent', { message_type: 'user_query' });
trackEvent('chatbot_helpful', { rating: 'positive' });
```

### Monitor Performance:
- Response times
- Error rates
- User satisfaction
- Common queries

## 🐛 Troubleshooting

### Common Issues:

1. **"API key not configured"**
   - Check `src/config/chatbotConfig.ts`
   - Ensure API key is correct and active

2. **"Service temporarily unavailable"**
   - Check internet connection
   - Verify API key hasn't exceeded quota

3. **Slow responses**
   - Check network connection
   - Consider reducing message complexity

4. **Bot not understanding queries**
   - Improve system prompt
   - Add more specific coffee knowledge
   - Train with common user patterns

### Debug Mode:
Enable detailed logging by adding to `chatbotService.ts`:
```typescript
const DEBUG_MODE = true;
if (DEBUG_MODE) {
  console.log('Chatbot debug:', { query, response, context });
}
```

## 🚀 Future Enhancements

### Planned Features:
- [ ] Multi-language support
- [ ] Voice input/output integration
- [ ] Image recognition for coffee photos
- [ ] Order placement through chat
- [ ] Proactive notifications and tips
- [ ] Integration with recommendation engine
- [ ] Analytics dashboard for support insights

### Advanced Capabilities:
- [ ] Custom coffee recipe suggestions
- [ ] Brewing timer and reminders
- [ ] Coffee education modules
- [ ] Social features (share recommendations)
- [ ] Loyalty program integration

## 📞 Support

Need help with the chatbot implementation?
- Check the console logs for error details
- Verify your Gemini API key and quota
- Test with simple queries first
- Review the system prompt for accuracy

Your Coffee Bot is ready to help users discover amazing coffee and navigate your app! ☕🤖✨
