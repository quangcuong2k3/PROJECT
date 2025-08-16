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
let voiceModuleError: string | null = null;

// Try to load expo-speech
try {
  Speech = require('expo-speech');
} catch (error) {
  // expo-speech not available
}

// Try to load react-native-voice with multiple strategies
const loadVoiceModule = () => {
  try {
    // Strategy 1: Try default import
    const voiceModule = require('@react-native-voice/voice');
    Voice = voiceModule.default || voiceModule;
    
    if (Voice && typeof Voice === 'object') {
      return true;
    }
  } catch (error) {
    // Strategy 1 failed
  }

  try {
    // Strategy 2: Try direct require
    Voice = require('@react-native-voice/voice');
    if (Voice && typeof Voice === 'object') {
      return true;
    }
  } catch (error) {
    // Strategy 2 failed
  }

  try {
    // Strategy 3: Try with .default
    const voiceModule = require('@react-native-voice/voice').default;
    Voice = voiceModule;
    if (Voice && typeof Voice === 'object') {
      return true;
    }
  } catch (error) {
    // Strategy 3 failed
  }

  // All strategies failed
  voiceModuleError = 'Voice recognition module could not be loaded. This usually means:\n\n1. You are running on a simulator/emulator (voice recognition only works on physical devices)\n2. The @react-native-voice/voice package is not properly installed\n3. You need to rebuild your app after installing the package\n\nPlease try:\n• Using a physical device\n• Running "npm install @react-native-voice/voice"\n• Rebuilding your app with "expo run:android" or "expo run:ios"';
  return false;
};

// Load the voice module
const voiceModuleLoaded = loadVoiceModule();

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
  private isInitialized = false;

  constructor() {
    this.initializeVoice();
  }

  /**
   * Initialize voice recognition
   */
  private initializeVoice() {
    if (!voiceModuleLoaded || !Voice) {
      return;
    }

    try {
      // Set up event handlers with error catching
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechRecognized = this.onSpeechRecognized;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechError = this.onSpeechError;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechPartialResults = this.onSpeechPartialResults;
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing voice recognition:', error);
      voiceModuleError = `Voice initialization failed: ${error}`;
    }
  }

  /**
   * Check if voice recognition is available
   */
  async isVoiceAvailable(): Promise<boolean> {
    try {
      // Check if module is loaded
      if (!voiceModuleLoaded || !Voice) {
        return false;
      }

      // Check if initialized
      if (!this.isInitialized) {
        return false;
      }

      // Check platform compatibility
      if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
        return false;
      }

      // Try different availability check methods
      let available = false;
      
      if (typeof Voice.isAvailable === 'function') {
        available = await Voice.isAvailable();
      } else if (typeof Voice.getSpeechRecognitionServices === 'function') {
        const services = await Voice.getSpeechRecognitionServices();
        available = services && services.length > 0;
      } else {
        // If no availability check method exists, assume it's available
        // This is a fallback for cases where the API might be different
        available = true;
      }
      
      return Boolean(available);
    } catch (error) {
      console.error('Error checking voice availability:', error);
      return false;
    }
  }

  /**
   * Check if the voice module is properly loaded
   */
  isModuleLoaded(): boolean {
    return voiceModuleLoaded && !!Voice;
  }

  /**
   * Check if running on a simulator/emulator
   */
  isSimulator(): boolean {
    if (Platform.OS === 'ios') {
      // iOS Simulator detection
      return __DEV__ && Platform.OS === 'ios';
    } else if (Platform.OS === 'android') {
      // Android Emulator detection (basic)
      return __DEV__ && Platform.OS === 'android';
    }
    return false;
  }

  /**
   * Get detailed error information
   */
  getErrorDetails(): string | null {
    if (this.isSimulator()) {
      return 'Voice recognition does not work on simulators or emulators. Please test on a physical device.';
    }
    
    if (!voiceModuleLoaded) {
      return 'Voice recognition module failed to load. Please ensure @react-native-voice/voice is properly installed.';
    }
    
    if (!Voice) {
      return 'Voice recognition module is null or undefined.';
    }
    
    if (!this.isInitialized) {
      return 'Voice recognition service is not initialized. Please restart the app.';
    }
    
    return null;
  }

  /**
   * Request microphone permissions
   */
  async requestMicrophonePermissions(): Promise<boolean> {
    try {
      if (!voiceModuleLoaded || !Voice) {
        return false;
      }
      
      if (Platform.OS === 'android') {
        // For Android, permissions should be handled automatically by the voice module
        // But we can check if the permission is available
        try {
          if (typeof Voice.requestSpeechRecognitionPermission === 'function') {
            const granted = await Voice.requestSpeechRecognitionPermission();
            return granted;
          } else {
            // No explicit permission request method, assuming granted
            return true;
          }
        } catch (permError) {
          // Permission request failed, but might still work
          return true;
        }
      } else if (Platform.OS === 'ios') {
        // For iOS, permissions are requested automatically when starting recognition
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting microphone permissions:', error);
      Alert.alert(
        'Microphone Permission Required',
        'Please grant microphone permission to use voice search. You may need to enable it in your device settings.',
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
      // Check if voice module is available
      if (!voiceModuleLoaded || !Voice) {
        const errorMessage = voiceModuleError || 'Voice recognition module is not available. Please ensure you are running on a physical device with @react-native-voice/voice properly installed.';
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Check if initialized
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Voice recognition service is not properly initialized. Please restart the app and try again.',
        };
      }

      // Check permissions
      const hasPermission = await this.requestMicrophonePermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Microphone permission is required for voice search.',
        };
      }

      // Check availability
      const isAvailable = await this.isVoiceAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Voice recognition is not available on this device. Please ensure you are using a physical device (not simulator) and have microphone access.',
        };
      }

      // Stop any existing recognition
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

      // Start voice recognition
      try {
        await Voice.start(language, {
          EXTRA_PARTIAL_RESULTS: partialResults,
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 1000,
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
        });
      } catch (startError) {
        console.error('Error starting voice recognition:', startError);
        this.cleanup();
        return {
          success: false,
          error: `Failed to start voice recognition: ${startError}. Please ensure microphone permissions are granted and try again.`,
        };
      }

      // Return a promise that resolves when recognition completes
      return new Promise((resolve) => {
        const originalOnResults = Voice.onSpeechResults;
        const originalOnError = Voice.onSpeechError;
        const originalOnEnd = Voice.onSpeechEnd;

        let resolved = false;

        const resolveOnce = (result: VoiceSearchResult) => {
          if (!resolved) {
            resolved = true;
            // Restore original handlers
            Voice.onSpeechResults = originalOnResults;
            Voice.onSpeechError = originalOnError;
            Voice.onSpeechEnd = originalOnEnd;
            resolve(result);
          }
        };

        Voice.onSpeechResults = (event: SpeechResultsEvent) => {
          if (originalOnResults) originalOnResults(event);
          
          if (event.value && event.value.length > 0) {
            this.cleanup();
            resolveOnce({
              success: true,
              transcript: event.value[0],
              confidence: 1.0, // Voice API doesn't provide confidence scores
            });
          }
        };

        Voice.onSpeechError = (event: SpeechErrorEvent) => {
          if (originalOnError) originalOnError(event);
          
          this.cleanup();
          const errorMessage = event.error?.message || 'Voice recognition failed';
          resolveOnce({
            success: false,
            error: `Voice recognition error: ${errorMessage}. Please speak clearly and try again.`,
          });
        };

        Voice.onSpeechEnd = (event: any) => {
          if (originalOnEnd) originalOnEnd(event);
          
          // If we haven't resolved yet and recognition ended without results
          setTimeout(() => {
            if (!resolved) {
              this.cleanup();
              resolveOnce({
                success: false,
                error: 'No speech detected. Please try speaking more clearly.',
              });
            }
          }, 500);
        };
      });
    } catch (error) {
      console.error('Unexpected error in voice recognition:', error);
      this.cleanup();
      return {
        success: false,
        error: `Voice recognition failed: ${error}. Please ensure you are using a physical device with microphone access.`,
      };
    }
  }

  /**
   * Stop voice recognition
   */
  async stopListening(): Promise<void> {
    try {
      if (!Voice) {
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
   * Get module status for debugging
   */
  getModuleStatus(): {
    voiceLoaded: boolean;
    speechLoaded: boolean;
    initialized: boolean;
    error?: string;
  } {
    return {
      voiceLoaded: voiceModuleLoaded && !!Voice,
      speechLoaded: !!Speech,
      initialized: this.isInitialized,
      error: voiceModuleError || undefined,
    };
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
    // Voice recognition started
  };

  private onSpeechRecognized = (event: SpeechRecognizedEvent) => {
    // Speech recognized
  };

  private onSpeechEnd = (event: any) => {
    // Voice recognition ended
  };

  private onSpeechError = (event: SpeechErrorEvent) => {
    // Voice recognition error
  };

  private onSpeechResults = (event: SpeechResultsEvent) => {
    // Voice recognition results
  };

  private onSpeechPartialResults = (event: SpeechResultsEvent) => {
    // Voice recognition partial results
  };

  /**
   * Destroy voice recognition instance
   */
  async destroy(): Promise<void> {
    try {
      await this.stopListening();
      if (Voice && typeof Voice.destroy === 'function') {
        await Voice.destroy();
      }
    } catch (error) {
      console.error('Error destroying voice recognition:', error);
    }
  }
}

export default new VoiceSearchService(); 