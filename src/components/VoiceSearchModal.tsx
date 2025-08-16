import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
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
import voiceSearchService, {VoiceSearchResult} from '../services/voiceSearchService';

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
  const [moduleStatus, setModuleStatus] = useState<{
    voiceLoaded: boolean;
    speechLoaded: boolean;
    initialized: boolean;
    error?: string;
  }>({
    voiceLoaded: false,
    speechLoaded: false,
    initialized: false,
    error: undefined,
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
    // Get module status for debugging
    const status = voiceSearchService.getModuleStatus();
    setModuleStatus(status);
    
    // Reset states
    setErrorMessage('');
    setTranscript('');
    setIsProcessing(false);
    setShowTextInput(false);
    setTextInput('');

    // Check voice availability
    await checkVoiceAvailability();
  };

  const checkVoiceAvailability = async () => {
    try {
      // Check if running on simulator first
      if (voiceSearchService.isSimulator()) {
        const errorMsg = 'Voice recognition does not work on simulators or emulators. Please test on a physical device.';
        setErrorMessage(errorMsg);
        return;
      }

      // Check if modules are loaded
      if (!moduleStatus.voiceLoaded) {
        const errorDetails = voiceSearchService.getErrorDetails();
        const errorMsg = errorDetails || 'Voice recognition is not available on this device. Please ensure you are testing on a physical device.';
        setErrorMessage(errorMsg);
        return;
      }

      if (!moduleStatus.initialized) {
        const errorMsg = 'Voice recognition service is not properly initialized. Please restart the app.';
        setErrorMessage(errorMsg);
        return;
      }

      // Check device compatibility
      if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
        const errorMsg = 'Voice recognition is only supported on Android and iOS devices.';
        setErrorMessage(errorMsg);
        return;
      }

      const isAvailable = await voiceSearchService.isVoiceAvailable();
      
      if (!isAvailable) {
        let errorMsg = 'Voice recognition is not available on this device.';
        
        if (Platform.OS === 'android') {
          errorMsg += '\n\nPlease ensure:\n• You are using a physical device\n• Microphone permission is granted\n• Google app is installed and up to date';
        } else if (Platform.OS === 'ios') {
          errorMsg += '\n\nPlease ensure:\n• You are using a physical device (not simulator)\n• Microphone permission is granted\n• Speech recognition is enabled in Settings';
        }
        
        setErrorMessage(errorMsg);
        
        Alert.alert(
          'Voice Search Unavailable',
          errorMsg,
          [
            { text: 'Use Text Search Instead', onPress: () => setShowTextInput(true) },
            { text: 'Try Anyway', onPress: () => setErrorMessage('') },
            { text: 'Cancel', onPress: onClose }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking voice availability:', error);
      setErrorMessage(`Voice check failed: ${error}`);
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
      setIsListening(true);
      setTranscript('');
      setIsProcessing(false);
      setErrorMessage('');

      const result: VoiceSearchResult = await voiceSearchService.startListening({
        language: 'en-US',
        timeout: 10000,
        partialResults: true,
      });

      setIsListening(false);

      if (result.success && result.transcript) {
        setTranscript(result.transcript);
        setIsProcessing(true);

        // Process the voice query
        const processedQuery = voiceSearchService.processVoiceQuery(result.transcript);
        
        // Provide audio feedback
        try {
          await voiceSearchService.speak(`Searching for ${result.transcript}`);
        } catch (speechError) {
          // Silently handle speech errors
        }

        // Return search results
        onSearchResults(processedQuery.searchTerms, processedQuery.originalQuery);
        
        // Close modal after a brief delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setErrorMessage(result.error || 'Voice recognition failed');
        
        // Show user-friendly error dialog
        const isModuleError = result.error?.includes('install') || result.error?.includes('module') || result.error?.includes('available');
        
        if (isModuleError) {
          Alert.alert(
            'Voice Recognition Setup Required',
            result.error || 'Voice recognition dependencies are missing.',
            [
              { text: 'Use Text Search', onPress: () => setShowTextInput(true) },
              { text: 'OK', onPress: () => setErrorMessage('') }
            ]
          );
        } else {
          Alert.alert(
            'Voice Recognition Failed',
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
      setErrorMessage(`Voice search failed: ${error}`);
      
      Alert.alert(
        'Voice Search Error', 
        `Voice search encountered an error: ${error}\n\nThis feature requires:\n• Physical device (not simulator)\n• Microphone permissions\n• Voice recognition dependencies`,
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
        </View>

        {/* Debug info in development */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>Voice Loaded: {moduleStatus.voiceLoaded ? '✅' : '❌'}</Text>
            <Text style={styles.debugText}>Speech Loaded: {moduleStatus.speechLoaded ? '✅' : '❌'}</Text>
            <Text style={styles.debugText}>Initialized: {moduleStatus.initialized ? '✅' : '❌'}</Text>
            <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
            <Text style={styles.debugText}>Simulator: {voiceSearchService.isSimulator() ? '⚠️ Yes' : '✅ No'}</Text>
            {moduleStatus.error && (
              <Text style={styles.debugText}>Error: {moduleStatus.error}</Text>
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
          !moduleStatus.voiceLoaded && styles.microphoneContainerDisabled
        ]}>
          <CustomIcon
            name="mic"
            size={FONTSIZE.size_30}
            color={moduleStatus.voiceLoaded ? COLORS.primaryLightGreyHex : COLORS.primaryRedHex}
          />
        </View>
        
        <Text style={styles.stateTitle}>Voice Search</Text>
        <Text style={styles.stateSubtitle}>
          {moduleStatus.voiceLoaded 
            ? "Tap the microphone and speak to search for coffee products"
            : "Voice search is not available on this device"
          }
        </Text>
        
        {moduleStatus.voiceLoaded ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartListening}
          >
            <CustomIcon
              name="mic"
              size={FONTSIZE.size_20}
              color={COLORS.primaryWhiteHex}
            />
            <Text style={styles.startButtonText}>Start Listening</Text>
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
            <Text style={styles.tipText}>• Say coffee names: "cappuccino", "latte", "americano"</Text>
            <Text style={styles.tipText}>• Mention roast levels: "dark roast", "medium roast"</Text>
            <Text style={styles.tipText}>• Specify bean types: "arabica beans", "robusta"</Text>
            <Text style={styles.tipText}>• Use descriptive words: "strong coffee", "mild beans"</Text>
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
    flexDirection: 'row',
    gap: SPACING.space_12,
    marginBottom: SPACING.space_24,
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
});

export default VoiceSearchModal; 