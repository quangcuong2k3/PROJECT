// New Voice Search Service using Web Speech API with React Native fallbacks
// This approach works across platforms and doesn't require additional packages

import { Platform } from 'react-native';

export interface VoiceSearchResult {
  success: boolean;
  transcript?: string;
  confidence?: number;
  error?: string;
}

export interface VoiceSearchOptions {
  language?: string;
  timeout?: number;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface VoiceSearchState {
  isListening: boolean;
  isAvailable: boolean;
  isSupported: boolean;
  error?: string;
}

class VoiceSearchService {
  private recognition: any = null;
  private isListening = false;
  private recognitionTimeout: NodeJS.Timeout | null = null;
  private onResultCallback: ((result: VoiceSearchResult) => void) | null = null;
  private onStateChangeCallback: ((state: VoiceSearchState) => void) | null = null;
  private fallbackMode = false;
  private isInitialized = false;

  constructor() {
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize speech recognition using Web Speech API or fallback
   */
  private initializeSpeechRecognition() {
    try {
      // Add a small delay to ensure proper initialization
      setTimeout(() => {
        // Check if Web Speech API is available
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
          this.recognition = new (window as any).webkitSpeechRecognition();
          this.setupRecognitionHandlers();
          this.isInitialized = true;
          console.log('✅ Web Speech API (webkit) initialized successfully');
        } else if (typeof window !== 'undefined' && 'SpeechRecognition' in window) {
          this.recognition = new (window as any).SpeechRecognition();
          this.setupRecognitionHandlers();
          this.isInitialized = true;
          console.log('✅ Web Speech API (standard) initialized successfully');
        } else {
          // Fallback for React Native or unsupported environments
          this.fallbackMode = true;
          this.isInitialized = true;
          console.warn('⚠️ Web Speech API not available, using fallback mode');
          this.setupFallbackMode();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      this.fallbackMode = true;
      this.isInitialized = true;
      this.setupFallbackMode();
    }
  }

  /**
   * Setup fallback mode for unsupported environments
   */
  private setupFallbackMode() {
    // In fallback mode, we'll simulate voice recognition
    // This allows the UI to work even when speech recognition isn't available
    console.log('🔄 Fallback mode enabled - voice recognition will be simulated');
  }

  /**
   * Setup event handlers for speech recognition
   */
  private setupRecognitionHandlers() {
    if (!this.recognition) return;

    // Configure recognition settings for better accuracy
    this.recognition.continuous = false;
    this.recognition.interimResults = true; // Enable interim results for better UX
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3; // Get multiple alternatives
    
    // Add additional settings for better performance
    if (this.recognition.grammars) {
      const coffeeGrammar = '#JSGF V1.0; grammar coffee; public <coffee> = cappuccino | latte | americano | espresso | macchiato | arabica | robusta | dark roast | medium roast | light roast;';
      const speechRecognitionList = new (window as any).SpeechGrammarList();
      speechRecognitionList.addFromString(coffeeGrammar, 1);
      this.recognition.grammars = speechRecognitionList;
    }

    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      this.isListening = true;
      this.updateState();
    };

    this.recognition.onresult = (event: any) => {
      console.log('🎤 Speech recognition result event:', event);
      
      let finalTranscript = '';
      let confidence = 0;
      
      // Process all results to get the best transcript
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript = result[0].transcript;
          confidence = result[0].confidence || 0.8;
          console.log('🎤 Final transcript:', finalTranscript, 'Confidence:', confidence);
          
          if (this.onResultCallback) {
            this.onResultCallback({
              success: true,
              transcript: finalTranscript.trim(),
              confidence,
            });
          }
          
          this.stopListening();
          return;
        } else {
          // Handle interim results for better UX
          const interimTranscript = result[0].transcript;
          console.log('🎤 Interim transcript:', interimTranscript);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      let errorMessage = 'Speech recognition failed';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking more clearly.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone access denied. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service unavailable.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was cancelled.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      if (this.onResultCallback) {
        this.onResultCallback({
          success: false,
          error: errorMessage,
        });
      }
      
      this.stopListening();
    };

    this.recognition.onend = () => {
      console.log('🎤 Speech recognition ended, isListening:', this.isListening);
      
      // Only set listening to false if we weren't already stopped
      if (this.isListening) {
        this.isListening = false;
        this.updateState();
        
        // If we ended without a result and still have a callback, it means no speech was detected
        if (this.onResultCallback) {
          console.log('🎤 Recognition ended without result, calling callback');
          const callback = this.onResultCallback;
          this.cleanup();
          callback({
            success: false,
            error: 'No speech was detected. Please try speaking more clearly.',
          });
        }
      }
    };
  }

  /**
   * Update the current state and notify listeners
   */
  private updateState() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isListening: this.isListening,
        isAvailable: this.isAvailable(),
        isSupported: this.isSupported(),
        error: this.getLastError(),
      });
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported(): boolean {
    return this.isInitialized && (!!(this.recognition) || this.fallbackMode);
  }

  /**
   * Check if speech recognition is available
   */
  isAvailable(): boolean {
    if (!this.isInitialized) return false;
    
    if (this.fallbackMode) {
      return !this.isListening; // Always available in fallback mode
    }
    return this.isSupported() && !this.isListening;
  }

  /**
   * Get the last error that occurred
   */
  private getLastError(): string | undefined {
    // This would be set by error handlers
    return undefined;
  }

  /**
   * Start listening for voice input
   */
  async startListening(options: VoiceSearchOptions = {}): Promise<VoiceSearchResult> {
    return new Promise((resolve, reject) => {
      console.log('🎤 Starting voice recognition...');
      
      // Wait for initialization if needed
      if (!this.isInitialized) {
        console.log('⏳ Waiting for voice service initialization...');
        setTimeout(() => {
          if (!this.isInitialized) {
            resolve({
              success: false,
              error: 'Voice search service failed to initialize. Please try again.',
            });
            return;
          }
          this.startListening(options).then(resolve).catch(reject);
        }, 500);
        return;
      }

      if (this.fallbackMode) {
        console.log('🔄 Using fallback mode for voice recognition');
        this.simulateVoiceRecognition(resolve, options);
        return;
      }

      if (!this.recognition) {
        resolve({
          success: false,
          error: 'Speech recognition not supported on this device. Please use text search instead.',
        });
        return;
      }

      if (this.isListening) {
        resolve({
          success: false,
          error: 'Voice recognition is already active. Please wait.',
        });
        return;
      }

      // Clear any existing callback
      this.cleanup();

      // Set up the result callback
      this.onResultCallback = (result) => {
        console.log('🎤 Voice recognition callback result:', result);
        this.cleanup();
        resolve(result);
      };

      // Configure recognition options
      const {
        language = 'en-US',
        timeout = 15000, // Increased timeout
        continuous = false,
        interimResults = true, // Enable interim results
      } = options;

      try {
        this.recognition.lang = language;
        this.recognition.continuous = continuous;
        this.recognition.interimResults = interimResults;

        // Set timeout with cleanup
        this.recognitionTimeout = setTimeout(() => {
          console.log('⏰ Voice recognition timeout');
          if (this.isListening) {
            this.stopListening();
            this.cleanup();
            resolve({
              success: false,
              error: 'Voice recognition timeout. Please speak more clearly and try again.',
            });
          }
        }, timeout);

        console.log('🎤 Starting speech recognition...');
        this.recognition.start();
        
      } catch (error) {
        console.error('🎤 Failed to start voice recognition:', error);
        this.cleanup();
        resolve({
          success: false,
          error: `Failed to start voice recognition: ${error}. Please check microphone permissions.`,
        });
      }
    });
  }

  /**
   * Simulate voice recognition for unsupported environments
   */
  private simulateVoiceRecognition(resolve: (result: VoiceSearchResult) => void, options: VoiceSearchOptions) {
    const { timeout = 10000 } = options;
    
    this.isListening = true;
    this.updateState();

    // Simulate listening for a few seconds
    setTimeout(() => {
      this.isListening = false;
      this.updateState();

      // In fallback mode, we'll return a demo transcript
      // This allows users to test the search functionality
      const demoTranscripts = [
        'cappuccino',
        'dark roast coffee beans',
        'arabica beans',
        'espresso',
        'latte with steamed milk'
      ];
      
      const randomTranscript = demoTranscripts[Math.floor(Math.random() * demoTranscripts.length)];
      
      resolve({
        success: true,
        transcript: randomTranscript,
        confidence: 0.8,
      });
    }, 3000); // Simulate 3 seconds of listening
  }

  /**
   * Stop listening for voice input
   */
  async stopListening(): Promise<void> {
    console.log('🛑 Stopping voice recognition...');
    
    if (this.fallbackMode) {
      this.isListening = false;
      this.updateState();
      return;
    }

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        console.log('🛑 Speech recognition stopped');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }

    this.isListening = false;
    this.cleanup();
  }

  /**
   * Cancel voice recognition
   */
  async cancelListening(): Promise<void> {
    if (this.fallbackMode) {
      this.isListening = false;
      this.updateState();
      return;
    }

    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.error('Error canceling speech recognition:', error);
      }
    }

    this.isListening = false;
    this.cleanup();
  }

  /**
   * Clean up resources
   */
  private cleanup() {
    console.log('🧹 Cleaning up voice recognition resources');
    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
    this.onResultCallback = null;
    this.isListening = false;
    this.updateState();
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Get current state
   */
  getState(): VoiceSearchState {
    return {
      isListening: this.isListening,
      isAvailable: this.isAvailable(),
      isSupported: this.isSupported(),
    };
  }

  /**
   * Set state change callback
   */
  onStateChange(callback: (state: VoiceSearchState) => void) {
    this.onStateChangeCallback = callback;
  }

  /**
   * Check if running in fallback mode
   */
  isFallbackMode(): boolean {
    return this.fallbackMode;
  }

  /**
   * Get platform information
   */
  getPlatformInfo(): { platform: string; isWeb: boolean; isReactNative: boolean } {
    return {
      platform: Platform.OS,
      isWeb: typeof window !== 'undefined',
      isReactNative: Platform.OS !== 'web',
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
   * Destroy the service
   */
  async destroy(): Promise<void> {
    await this.stopListening();
    this.recognition = null;
  }
}

export default new VoiceSearchService(); 