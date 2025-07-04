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
      console.log('🎤 VoiceSearchModal: Modal opened');
      initializeModal();
    } else {
      console.log('🎤 VoiceSearchModal: Modal closed');
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
    console.log('🎤 VoiceSearchModal: Module status:', status);
    
    // Reset states
    setErrorMessage('');
    setTranscript('');
    setIsProcessing(false);

    // Check voice availability
    await checkVoiceAvailability();
  };

  const checkVoiceAvailability = async () => {
    console.log('🎤 VoiceSearchModal: Checking voice availability...');
    
    try {
      // Check if modules are loaded
      if (!moduleStatus.voiceLoaded) {
        const errorMsg = 'Voice recognition module is not available. Please ensure you are testing on a physical device.';
        setErrorMessage(errorMsg);
        console.warn('❌ Voice module not loaded');
        return;
      }

      if (!moduleStatus.initialized) {
        const errorMsg = 'Voice recognition service is not properly initialized. Please restart the app.';
        setErrorMessage(errorMsg);
        console.warn('❌ Voice service not initialized');
        return;
      }

      // Check device compatibility
      if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
        const errorMsg = 'Voice recognition is only supported on Android and iOS devices.';
        setErrorMessage(errorMsg);
        console.warn('❌ Unsupported platform');
        return;
      }

      // Check if running on simulator
      if (__DEV__ && Platform.OS === 'ios') {
        // Note: This is a basic check, more sophisticated detection would require native code
        console.warn('⚠️ If you are running on iOS Simulator, voice recognition will not work');
      }

      const isAvailable = await voiceSearchService.isVoiceAvailable();
      console.log('🎤 VoiceSearchModal: Voice available:', isAvailable);
      
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
            { text: 'Use Text Search Instead', onPress: onClose },
            { text: 'Try Anyway', onPress: () => setErrorMessage('') },
            { text: 'Cancel', onPress: onClose }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error checking voice availability:', error);
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
    stopAnimations();
  };

  const handleClose = async () => {
    await cleanup();
    onClose();
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
      console.log('🎤 VoiceSearchModal: Starting voice recognition...');
      setIsListening(true);
      setTranscript('');
      setIsProcessing(false);
      setErrorMessage('');

      const result: VoiceSearchResult = await voiceSearchService.startListening({
        language: 'en-US',
        timeout: 10000,
        partialResults: true,
      });

      console.log('🎤 VoiceSearchModal: Voice recognition result:', result);
      setIsListening(false);

      if (result.success && result.transcript) {
        console.log('🎤 VoiceSearchModal: Voice recognition successful:', result.transcript);
        setTranscript(result.transcript);
        setIsProcessing(true);

        // Process the voice query
        const processedQuery = voiceSearchService.processVoiceQuery(result.transcript);
        console.log('🎤 VoiceSearchModal: Processed query:', processedQuery);
        
        // Provide audio feedback
        try {
          await voiceSearchService.speak(`Searching for ${result.transcript}`);
        } catch (speechError) {
          console.warn('⚠️ Text-to-speech feedback failed:', speechError);
        }

        // Return search results
        onSearchResults(processedQuery.searchTerms, processedQuery.originalQuery);
        
        // Close modal after a brief delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        console.log('🎤 VoiceSearchModal: Voice recognition failed:', result.error);
        setErrorMessage(result.error || 'Voice recognition failed');
        
        // Show user-friendly error dialog
        const isModuleError = result.error?.includes('install') || result.error?.includes('module') || result.error?.includes('available');
        
        if (isModuleError) {
          Alert.alert(
            'Voice Recognition Setup Required',
            result.error || 'Voice recognition dependencies are missing.',
            [
              { text: 'Use Text Search', onPress: handleClose },
              { text: 'OK', onPress: () => setErrorMessage('') }
            ]
          );
        } else {
          Alert.alert(
            'Voice Recognition Failed',
            result.error || 'Could not understand your voice. Please try again.',
            [
              { text: 'Use Text Search', onPress: handleClose },
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
      console.error('🎤 VoiceSearchModal: Voice search error:', error);
      setIsListening(false);
      setErrorMessage(`Voice search failed: ${error}`);
      
      Alert.alert(
        'Voice Search Error', 
        `Voice search encountered an error: ${error}\n\nThis feature requires:\n• Physical device (not simulator)\n• Microphone permissions\n• Voice recognition dependencies`,
        [
          { text: 'Use Text Search', onPress: handleClose },
          { text: 'OK', onPress: () => setErrorMessage('') }
        ]
      );
    }
  };

  const handleStopListening = async () => {
    console.log('🛑 VoiceSearchModal: Stopping voice recognition');
    await voiceSearchService.stopListening();
    setIsListening(false);
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
            onPress={handleClose}
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
            {moduleStatus.error && (
              <Text style={styles.debugText}>Error: {moduleStatus.error}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderListeningState = () => {
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
            onPress={handleClose}
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
          <Text style={styles.headerTitle}>Voice Search</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderListeningState()}
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Voice Search Tips:</Text>
          <Text style={styles.tipText}>• Say coffee names: "cappuccino", "latte", "americano"</Text>
          <Text style={styles.tipText}>• Mention roast levels: "dark roast", "medium roast"</Text>
          <Text style={styles.tipText}>• Specify bean types: "arabica beans", "robusta"</Text>
          <Text style={styles.tipText}>• Use descriptive words: "strong coffee", "mild beans"</Text>
        </View>
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
});

export default VoiceSearchModal; 