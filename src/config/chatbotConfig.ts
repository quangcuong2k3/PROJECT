// Chatbot Configuration
// Place your Google Gemini API key here

export const CHATBOT_CONFIG = {
  // Replace with your actual Gemini API key
  // Get your API key from: https://makersuite.google.com/app/apikey
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  
  // Chatbot settings
  MAX_MESSAGE_LENGTH: 500,
  MAX_CONVERSATION_HISTORY: 50,
  TYPING_DELAY: 1000, // ms
  
  // Quick responses configuration
  ENABLE_QUICK_RESPONSES: true,
  
  // Error handling
  MAX_RETRIES: 3,
  TIMEOUT_DURATION: 15000, // ms
  
  // Model configuration
  MODEL_CONFIG: {
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1024,
    },
  },
};

// Instructions for setting up the API key:
/*
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key for your project
3. Replace 'YOUR_GEMINI_API_KEY_HERE' above with your actual API key
4. Save this file

Example:
GEMINI_API_KEY: 'AIzaSyC7YourActualApiKeyHere1234567890',

Note: Keep your API key secure and never commit it to public repositories!
*/
