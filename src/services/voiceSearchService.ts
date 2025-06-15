import { Alert, Platform } from 'react-native';

// Type definitions for voice recognition
interface SpeechRecognizedEvent {
  isFinal?: boolean;
}

interface SpeechResultsEvent {
  value?: string[];
}

interface SpeechErrorEvent {
  error?: {
    message?: string;
  };
}

interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
}

// Optional imports with error handling
let Speech: any = null;
let Voice: any = null;

try {
  Speech = require('expo-speech');
  console.log('✅ expo-speech loaded successfully');
} catch (error) {
  console.warn('❌ expo-speech not available:', error);
}

try {
  // Try different import methods for voice recognition
  const voiceModule = require('@react-native-voice/voice');
  Voice = voiceModule.default || voiceModule;
  console.log('✅ @react-native-voice/voice loaded successfully');
  console.log('Available methods:', Object.keys(Voice || {}));
} catch (error) {
  console.warn('❌ @react-native-voice/voice not available:', error);
}

export interface VoiceSearchResult {
  success: boolean;
  transcript?: string;
  confidence?: number;
  error?: string;
}

export interface VoiceSearchOptions {
  language?: string;
  timeout?: number;
  partialResults?: boolean;
}

class VoiceSearchService {
  private isListening = false;
  private recognitionTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeVoice();
  }

  /**
   * Initialize voice recognition
   */
  private initializeVoice() {
    if (!Voice) {
      console.warn('Voice module not available, skipping initialization');
      return;
    }
    
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
  }

  /**
   * Check if voice recognition is available
   */
  async isVoiceAvailable(): Promise<boolean> {
    try {
      if (!Voice) {
        console.warn('Voice module not available');
        return false;
      }
      
      // Try different method names as the API might vary
      let available = false;
      
      if (typeof Voice.isAvailable === 'function') {
        available = await Voice.isAvailable();
      } else if (typeof Voice.isSpeechAvailable === 'function') {
        available = await Voice.isSpeechAvailable();
      } else {
        console.warn('No voice availability check method found');
        return false;
      }
      
      return Boolean(available);
    } catch (error) {
      console.error('Error checking voice availability:', error);
      return false;
    }
  }

  /**
   * Request microphone permissions
   */
  async requestMicrophonePermissions(): Promise<boolean> {
    try {
      if (!Voice) {
        console.warn('Voice module not available');
        return false;
      }
      
      if (Platform.OS === 'android') {
        // For Android, permissions are handled in AndroidManifest.xml
        // We'll add the permission check here if needed
        return true;
      } else {
        // For iOS, permissions are requested automatically
        return true;
      }
    } catch (error) {
      console.error('Error requesting microphone permissions:', error);
      Alert.alert(
        'Microphone Permission Required',
        'Please grant microphone permission to use voice search.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Start voice recognition
   */
  async startListening(options: VoiceSearchOptions = {}): Promise<VoiceSearchResult> {
    try {
      if (!Voice) {
        // Return a helpful error message instead of crashing
        return {
          success: false,
          error: 'Voice recognition is not available. Please install the required dependencies:\n\nnpm install @react-native-voice/voice\nnpx expo install expo-speech\n\nThen restart your development server.',
        };
      }

      const hasPermission = await this.requestMicrophonePermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Microphone permission denied',
        };
      }

      const isAvailable = await this.isVoiceAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Voice recognition not available on this device',
        };
      }

      if (this.isListening) {
        await this.stopListening();
      }

      const {
        language = 'en-US',
        timeout = 10000,
        partialResults = true,
      } = options;

      this.isListening = true;

      // Set timeout for recognition
      this.recognitionTimeout = setTimeout(() => {
        this.stopListening();
      }, timeout);

      await Voice.start(language, {
        EXTRA_PARTIAL_RESULTS: partialResults,
        EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 1000,
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
      });

      return new Promise((resolve) => {
        const originalOnResults = Voice.onSpeechResults;
        const originalOnError = Voice.onSpeechError;

        Voice.onSpeechResults = (event: SpeechResultsEvent) => {
          if (originalOnResults) originalOnResults(event);
          
          if (event.value && event.value.length > 0) {
            this.cleanup();
            resolve({
              success: true,
              transcript: event.value[0],
              confidence: 1.0, // Voice API doesn't provide confidence scores
            });
          }
        };

        Voice.onSpeechError = (event: SpeechErrorEvent) => {
          if (originalOnError) originalOnError(event);
          
          this.cleanup();
          resolve({
            success: false,
            error: event.error?.message || 'Voice recognition failed',
          });
        };
      });
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.cleanup();
      return {
        success: false,
        error: 'Failed to start voice recognition. Please ensure you have installed the required dependencies and are testing on a physical device.',
      };
    }
  }

  /**
   * Stop voice recognition
   */
  async stopListening(): Promise<void> {
    try {
      if (!Voice) {
        console.warn('Voice module not available');
        return;
      }
      if (this.isListening) {
        await Voice.stop();
        this.cleanup();
      }
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      this.cleanup();
    }
  }

  /**
   * Cancel voice recognition
   */
  async cancelListening(): Promise<void> {
    try {
      if (!Voice) {
        console.warn('Voice module not available');
        return;
      }
      if (this.isListening) {
        await Voice.cancel();
        this.cleanup();
      }
    } catch (error) {
      console.error('Error canceling voice recognition:', error);
      this.cleanup();
    }
  }

  /**
   * Clean up recognition state
   */
  private cleanup() {
    this.isListening = false;
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
  }

  /**
   * Convert text to speech (for feedback)
   */
  async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    try {
      if (!Speech) {
        console.warn('Speech module not available');
        return;
      }

      const defaultOptions: SpeechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        ...options,
      };

      await Speech.speak(text, defaultOptions);
    } catch (error) {
      console.error('Error with text-to-speech:', error);
    }
  }

  /**
   * Stop current speech
   */
  async stopSpeaking(): Promise<void> {
    try {
      if (!Speech) {
        console.warn('Speech module not available');
        return;
      }
      await Speech.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Process voice search query and extract coffee-related terms
   */
  processVoiceQuery(transcript: string): {
    searchTerms: string[];
    originalQuery: string;
    confidence: number;
  } {
    const originalQuery = transcript.toLowerCase().trim();
    
    // Enhanced coffee-related keywords that match your database
    const coffeeKeywords = [
      // Coffee drinks from your database
      'americano', 'black coffee', 'cappuccino', 'espresso', 'latte', 'macchiato',
      
      // Bean types from your database
      'arabica', 'robusta', 'liberica', 'excelsa',
      'arabica beans', 'robusta beans', 'liberica beans', 'excelsa beans',
      
      // Roast levels
      'light roast', 'medium roast', 'dark roast', 'light roasted', 'medium roasted', 'dark roasted',
      
      // Ingredients and characteristics
      'espresso', 'steamed milk', 'hot water', 'foam', 'milk',
      
      // Origins
      'south america', 'africa', 'west africa', 'southeast asia',
      
      // General terms
      'coffee', 'bean', 'beans', 'drink', 'hot', 'cold', 'iced',
      'strong', 'mild', 'smooth', 'bold', 'bitter',
    ];

    // Extract relevant terms
    const searchTerms: string[] = [];
    
    // Add the original query for broad matching
    searchTerms.push(originalQuery);
    
    // Find exact keyword matches
    let exactMatches = 0;
    coffeeKeywords.forEach(keyword => {
      if (originalQuery.includes(keyword)) {
        searchTerms.push(keyword);
        exactMatches++;
      }
    });

    // Process common voice search patterns and add related terms
    const voicePatterns = [
      {
        patterns: [/find.*coffee/i, /search.*coffee/i, /show.*coffee/i],
        additions: ['Coffee', 'coffee drink', 'espresso'],
      },
      {
        patterns: [/find.*bean/i, /search.*bean/i, /show.*bean/i],
        additions: ['Bean', 'coffee beans', 'arabica', 'robusta'],
      },
      {
        patterns: [/i want.*latte/i, /looking for.*latte/i, /find.*latte/i],
        additions: ['Latte', 'steamed milk', 'espresso', 'milk'],
      },
      {
        patterns: [/i want.*cappuccino/i, /looking for.*cappuccino/i, /find.*cappuccino/i],
        additions: ['Cappuccino', 'foam', 'steamed milk', 'espresso'],
      },
      {
        patterns: [/strong.*coffee/i, /bold.*coffee/i, /dark.*coffee/i],
        additions: ['Espresso', 'Dark Roasted', 'Americano', 'Black Coffee', 'strong'],
      },
      {
        patterns: [/mild.*coffee/i, /light.*coffee/i, /smooth.*coffee/i],
        additions: ['Latte', 'Cappuccino', 'Light Roasted', 'mild'],
      },
      {
        patterns: [/arabica/i],
        additions: ['Arabica Beans', 'South America', 'smooth'],
      },
      {
        patterns: [/robusta/i],
        additions: ['Robusta Beans', 'Africa', 'strong', 'bitter'],
      },
      {
        patterns: [/medium.*roast/i, /medium.*roasted/i],
        additions: ['Medium Roasted', 'balanced'],
      },
      {
        patterns: [/with.*milk/i, /steamed.*milk/i],
        additions: ['Steamed Milk', 'Latte', 'Cappuccino', 'Macchiato'],
      },
    ];
    
    voicePatterns.forEach(({ patterns, additions }) => {
      if (patterns.some(pattern => pattern.test(originalQuery))) {
        searchTerms.push(...additions);
        exactMatches += additions.length * 0.5; // Partial credit for pattern matches
      }
    });

    // Add contextual enhancements based on detected terms
    const detectedTerms = searchTerms.map(term => term.toLowerCase());
    
    if (detectedTerms.some(term => term.includes('espresso'))) {
      searchTerms.push('strong', 'concentrated');
    }
    
    if (detectedTerms.some(term => term.includes('milk') || term.includes('steamed'))) {
      searchTerms.push('creamy', 'smooth');
    }
    
    if (detectedTerms.some(term => term.includes('foam'))) {
      searchTerms.push('frothy', 'light');
    }

    // Remove duplicates and clean up
    const uniqueTerms = [...new Set(searchTerms)].filter(term => term.trim().length > 0);

    // Calculate confidence based on matches and query clarity
    let confidence = 0.5; // Base confidence
    
    if (exactMatches > 0) {
      confidence += Math.min(exactMatches * 0.1, 0.4); // Up to 0.4 boost for exact matches
    }
    
    if (uniqueTerms.length > 2) {
      confidence += 0.1; // Boost for multiple relevant terms
    }
    
    // Check for clear coffee-related intent
    const hasCoffeeIntent = /coffee|bean|latte|cappuccino|espresso|americano|macchiato/i.test(originalQuery);
    if (hasCoffeeIntent) {
      confidence += 0.2;
    }
    
    // Ensure confidence doesn't exceed 1.0
    confidence = Math.min(confidence, 1.0);

    return {
      searchTerms: uniqueTerms,
      originalQuery: transcript,
      confidence,
    };
  }

  /**
   * Voice event handlers
   */
  private onSpeechStart = (event: any) => {
    console.log('Voice recognition started:', event);
  };

  private onSpeechRecognized = (event: SpeechRecognizedEvent) => {
    console.log('Speech recognized:', event);
  };

  private onSpeechEnd = (event: any) => {
    console.log('Voice recognition ended:', event);
  };

  private onSpeechError = (event: SpeechErrorEvent) => {
    console.log('Voice recognition error:', event);
  };

  private onSpeechResults = (event: SpeechResultsEvent) => {
    console.log('Voice recognition results:', event);
  };

  private onSpeechPartialResults = (event: SpeechResultsEvent) => {
    console.log('Voice recognition partial results:', event);
  };

  /**
   * Destroy voice recognition instance
   */
  async destroy(): Promise<void> {
    try {
      await this.stopListening();
      if (Voice) {
        await Voice.destroy();
      }
    } catch (error) {
      console.error('Error destroying voice recognition:', error);
    }
  }
}

export default new VoiceSearchService(); 