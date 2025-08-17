import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  TextInput,
} from 'react-native';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../theme/theme';
import CustomIcon from './CustomIcon';
import voiceSearchService, {VoiceSearchResult, VoiceSearchState} from '../services/voiceSearchService';

interface VoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearchResults: (searchTerms: string[], transcript: string) => void;
}

const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  visible,
  onClose,
  onSearchResults,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceSearchState>({
    isListening: false,
    isAvailable: false,
    isSupported: false,
  });
  
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      initializeModal();
    } else {
      cleanup();
    }
  }, [visible]);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const initializeModal = async () => {
    // Get initial voice state
    const state = voiceSearchService.getState();
    setVoiceState(state);
    
    // Set up state change listener
    voiceSearchService.onStateChange(setVoiceState);
    
    // Reset states
    setErrorMessage('');
    setTranscript('');
    setIsProcessing(false);
    setShowTextInput(false);
    setTextInput('');

    // Small delay to ensure service is fully initialized
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check voice availability
    await checkVoiceAvailability();
  };

  const checkVoiceAvailability = async () => {
    try {
      console.log('🔍 Checking voice availability...', voiceState);
      
      // Wait a bit for the service to initialize
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get fresh state
      const currentState = voiceSearchService.getState();
      setVoiceState(currentState);
      
      console.log('🔍 Current voice state:', currentState);
      
      // Check if speech recognition is supported
      if (!currentState.isSupported) {
        console.log('❌ Voice recognition not supported');
        if (voiceSearchService.isFallbackMode()) {
          // In fallback mode, we can still work
          setErrorMessage('');
          console.log('✅ Using fallback mode - voice search available');
          return;
        } else {
          const errorMsg = 'Voice recognition is not supported on this device. You can use text search instead.';
          setErrorMessage(errorMsg);
          return;
        }
      }

      // Check if available
      if (!currentState.isAvailable && !voiceSearchService.isFallbackMode()) {
        console.log('⚠️ Voice recognition unavailable');
        const errorMsg = 'Voice recognition is temporarily unavailable. Please try again in a moment.';
        setErrorMessage(errorMsg);
        return;
      }

      // Clear any previous errors
      console.log('✅ Voice recognition is available');
      setErrorMessage('');
    } catch (error) {
      console.error('Error checking voice availability:', error);
      setErrorMessage(`Voice availability check failed: ${error}`);
    }
  };

  const cleanup = async () => {
    if (isListening) {
      await voiceSearchService.stopListening();
    }
    setIsListening(false);
    setTranscript('');
    setIsProcessing(false);
    setErrorMessage('');
    setShowTextInput(false);
    setTextInput('');
    stopAnimations();
  };

  const handleClose = async () => {
    await cleanup();
    onClose();
  };

  const handleTextSearch = () => {
    if (textInput.trim()) {
      const processedQuery = voiceSearchService.processVoiceQuery(textInput.trim());
      onSearchResults(processedQuery.searchTerms, processedQuery.originalQuery);
      handleClose();
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  };

  const handleStartListening = async () => {
    try {
      console.log('🎤 Starting voice listening...');
      
      // Clear any previous states
      setTranscript('');
      setIsProcessing(false);
      setErrorMessage('');
      
      // Check availability first
      await checkVoiceAvailability();
      
      if (errorMessage) {
        console.log('❌ Voice not available, skipping start');
        return;
      }
      
      setIsListening(true);

      // Add a safety timeout to prevent hanging
      const searchTimeout = setTimeout(() => {
        console.log('⏰ Voice search safety timeout triggered');
        if (isListening) {
          setIsListening(false);
          setErrorMessage('Voice search took too long. Please try again.');
        }
      }, 20000); // 20 second safety timeout

      console.log('🎤 Calling voiceSearchService.startListening...');
      const result: VoiceSearchResult = await voiceSearchService.startListening({
        language: 'en-US',
        timeout: 15000, // 15 second timeout for the service
        continuous: false,
        interimResults: true,
      });

      console.log('🎤 Voice search result:', result);
      clearTimeout(searchTimeout);
      setIsListening(false);

      if (result.success && result.transcript) {
        const cleanTranscript = result.transcript.trim();
        console.log('✅ Voice transcript received:', cleanTranscript);
        
        setTranscript(cleanTranscript);
        setIsProcessing(true);

        // Process the voice query
        const processedQuery = voiceSearchService.processVoiceQuery(cleanTranscript);
        
        console.log('🎤 Voice query processed:', processedQuery);
        
        // Check if we have valid search terms
        if (processedQuery.searchTerms && processedQuery.searchTerms.length > 0) {
          console.log('✅ Valid search terms found, calling onSearchResults');
          // Return search results
          onSearchResults(processedQuery.searchTerms, processedQuery.originalQuery);
          
          // Close modal after a brief delay
          setTimeout(() => {
            handleClose();
          }, 1000);
        } else {
          console.log('❌ No valid search terms extracted');
          setIsProcessing(false);
          setErrorMessage('Could not understand what you said. Please try speaking more clearly or use text search.');
        }
      } else {
        console.log('❌ Voice recognition failed:', result.error);
        setErrorMessage(result.error || 'Voice recognition failed');
        
        // Show user-friendly error dialog only for real errors
        if (result.error && !result.error.includes('timeout') && !result.error.includes('No speech')) {
          Alert.alert(
            'Voice Recognition Issue',
            result.error || 'Could not understand your voice. Please try again.',
            [
              { text: 'Use Text Search', onPress: () => setShowTextInput(true) },
              { text: 'Try Again', onPress: () => {
                setErrorMessage('');
                setTimeout(handleStartListening, 500);
              }},
              { text: 'Cancel', onPress: () => setErrorMessage('') },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Voice search error:', error);
      setIsListening(false);
      setIsProcessing(false);
      setErrorMessage(`Voice search failed: ${error}`);
      
      Alert.alert(
        'Voice Search Error', 
        `Voice search encountered an error.\n\nPlease check:\n• Microphone permissions\n• Internet connection\n• Try using text search instead`,
        [
          { text: 'Use Text Search', onPress: () => setShowTextInput(true) },
          { text: 'OK', onPress: () => setErrorMessage('') }
        ]
      );
    }
  };

  const handleStopListening = async () => {
    await voiceSearchService.stopListening();
    setIsListening(false);
  };

  const renderTextInputFallback = () => {
    if (!showTextInput) return null;

    return (
      <View style={styles.textInputContainer}>
        <Text style={styles.textInputTitle}>Text Search</Text>
        <Text style={styles.textInputSubtitle}>
          Since voice search is not available, you can type your search query instead.
        </Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Type your search query..."
          placeholderTextColor={COLORS.primaryLightGreyHex}
          value={textInput}
          onChangeText={setTextInput}
          autoFocus
          multiline
        />
        
        <View style={styles.textInputButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowTextInput(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleTextSearch}
            disabled={!textInput.trim()}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderErrorState = () => {
    if (!errorMessage) return null;

    return (
      <View style={styles.errorContainer}>
        <CustomIcon
          name="warning"
          size={FONTSIZE.size_24}
          color={COLORS.primaryRedHex}
        />
        <Text style={styles.errorTitle}>Voice Search Issue</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        
        <View style={styles.errorButtons}>
          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={() => {
              setErrorMessage('');
              checkVoiceAvailability();
            }}
          >
            <Text style={styles.tryAgainButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.textSearchButton}
            onPress={() => setShowTextInput(true)}
          >
            <Text style={styles.textSearchButtonText}>Use Text Search</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.retryVoiceButton}
            onPress={() => {
              setErrorMessage('');
              setTimeout(handleStartListening, 500);
            }}
          >
            <Text style={styles.retryVoiceButtonText}>Retry Voice</Text>
          </TouchableOpacity>
        </View>

        {/* Debug info in development */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>Supported: {voiceState.isSupported ? '✅' : '❌'}</Text>
            <Text style={styles.debugText}>Available: {voiceState.isAvailable ? '✅' : '❌'}</Text>
            <Text style={styles.debugText}>Listening: {voiceState.isListening ? '✅' : '❌'}</Text>
            <Text style={styles.debugText}>Fallback Mode: {voiceSearchService.isFallbackMode() ? '⚠️ Yes' : '✅ No'}</Text>
            <Text style={styles.debugText}>Platform: {voiceSearchService.getPlatformInfo().platform}</Text>
            {voiceState.error && (
              <Text style={styles.debugText}>Error: {voiceState.error}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderListeningState = () => {
    if (showTextInput) {
      return renderTextInputFallback();
    }

    if (errorMessage) {
      return renderErrorState();
    }

    if (isProcessing) {
      return (
        <View style={styles.stateContainer}>
          <View style={styles.processingContainer}>
            <CustomIcon
              name="checkmark-circle"
              size={FONTSIZE.size_30}
              color={COLORS.primaryOrangeHex}
            />
            <Text style={styles.stateTitle}>Processing...</Text>
            <Text style={styles.transcriptText}>"{transcript}"</Text>
          </View>
        </View>
      );
    }

    if (isListening) {
      return (
        <View style={styles.stateContainer}>
          <Animated.View
            style={[
              styles.microphoneContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <CustomIcon
              name="mic"
              size={FONTSIZE.size_30}
              color={COLORS.primaryWhiteHex}
            />
            
            {/* Sound waves */}
            <Animated.View
              style={[
                styles.soundWave,
                styles.wave1,
                {
                  opacity: waveAnim,
                  transform: [
                    {
                      scale: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.soundWave,
                styles.wave2,
                {
                  opacity: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 0],
                  }),
                  transform: [
                    {
                      scale: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.2, 2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.soundWave,
                styles.wave3,
                {
                  opacity: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0],
                  }),
                  transform: [
                    {
                      scale: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.4, 2.5],
                      }),
                    },
                  ],
                },
              ]}
            />
          </Animated.View>
          
          <Text style={styles.stateTitle}>Listening...</Text>
          <Text style={styles.stateSubtitle}>Say something like "cappuccino" or "dark roast beans"</Text>
          
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopListening}
          >
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <View style={[
          styles.microphoneContainer,
          !voiceState.isSupported && styles.microphoneContainerDisabled
        ]}>
          <CustomIcon
            name="mic"
            size={FONTSIZE.size_30}
            color={voiceState.isSupported ? COLORS.primaryLightGreyHex : COLORS.primaryRedHex}
          />
        </View>
        
        <Text style={styles.stateTitle}>Voice Search</Text>
        <Text style={styles.stateSubtitle}>
          {voiceState.isSupported 
            ? voiceSearchService.isFallbackMode()
              ? "Demo mode: Tap to test voice search with sample results"
              : "Tap the microphone and speak clearly to search for coffee"
            : "Voice search requires microphone access and Web Speech API support"
          }
        </Text>
        
        {voiceState.isSupported ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartListening}
            disabled={isListening}
          >
            <CustomIcon
              name="mic"
              size={FONTSIZE.size_20}
              color={isListening ? COLORS.primaryGreyHex : COLORS.primaryWhiteHex}
            />
            <Text style={[
              styles.startButtonText,
              isListening && { color: COLORS.primaryGreyHex }
            ]}>
              {isListening ? 'Initializing...' : 'Start Listening'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.textSearchButton}
            onPress={() => setShowTextInput(true)}
          >
            <Text style={styles.textSearchButtonText}>Use Text Search Instead</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <CustomIcon
              name="close"
              size={FONTSIZE.size_24}
              color={COLORS.primaryWhiteHex}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {showTextInput ? 'Text Search' : 'Voice Search'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderListeningState()}
        </View>

        {/* Tips */}
        {!showTextInput && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Voice Search Tips:</Text>
            <Text style={styles.tipText}>• Say coffee names clearly: "cappuccino", "latte", "americano"</Text>
            <Text style={styles.tipText}>• Mention roast levels: "dark roast", "medium roast"</Text>
            <Text style={styles.tipText}>• Specify bean types: "arabica beans", "robusta beans"</Text>
            <Text style={styles.tipText}>• Use descriptive words: "strong coffee", "mild beans"</Text>
            {voiceSearchService.isFallbackMode() && (
              <Text style={styles.tipText}>• Demo mode: Shows random coffee suggestions for testing</Text>
            )}
            <Text style={styles.tipText}>• Speak slowly and clearly for best results</Text>
            <Text style={styles.tipText}>• Ensure microphone permissions are enabled</Text>
            <Text style={styles.tipText}>• Use text search if voice recognition fails</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  closeButton: {
    padding: SPACING.space_8,
  },
  headerTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  headerSpacer: {
    width: FONTSIZE.size_24 + SPACING.space_16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_20,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  microphoneContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryDarkGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_24,
    borderWidth: 2,
    borderColor: COLORS.primaryGreyHex,
  },
  microphoneContainerDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
    borderColor: COLORS.primaryRedHex,
  },
  soundWave: {
    position: 'absolute',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primaryOrangeHex,
  },
  wave1: {
    width: 120,
    height: 120,
  },
  wave2: {
    width: 140,
    height: 140,
  },
  wave3: {
    width: 160,
    height: 160,
  },
  processingContainer: {
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.space_24,
    paddingHorizontal: SPACING.space_20,
  },
  transcriptText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
    textAlign: 'center',
    marginTop: SPACING.space_12,
    fontStyle: 'italic',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_16,
    gap: SPACING.space_12,
  },
  startButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  stopButton: {
    backgroundColor: COLORS.primaryRedHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_12,
  },
  stopButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  textSearchButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  textSearchButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
  },
  // Error state styles
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  errorTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryRedHex,
    marginTop: SPACING.space_16,
    marginBottom: SPACING.space_12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.space_24,
  },
  errorButtons: {
    flexDirection: 'column',
    gap: SPACING.space_12,
    marginBottom: SPACING.space_24,
    alignItems: 'center',
  },
  tryAgainButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
  },
  tryAgainButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  // Debug info styles
  debugInfo: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_16,
    width: '100%',
    marginTop: SPACING.space_16,
  },
  debugTitle: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_8,
  },
  debugText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  tipsContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_20,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  tipsTitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_12,
  },
  tipText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
    lineHeight: 16,
  },
  textInputContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_20,
    width: '100%',
    alignItems: 'center',
  },
  textInputTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  textInputSubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginBottom: SPACING.space_16,
    lineHeight: 20,
  },
  textInput: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_10,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryBlackHex,
    textAlignVertical: 'top',
    marginBottom: SPACING.space_16,
  },
  textInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: SPACING.space_12,
  },
  cancelButton: {
    backgroundColor: COLORS.primaryRedHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
  },
  cancelButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  searchButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
  },
  searchButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  retryVoiceButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
  },
  retryVoiceButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
});

export default VoiceSearchModal; 