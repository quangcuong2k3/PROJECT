import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
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
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      console.log('🎤 VoiceSearchModal: Modal opened');
      checkVoiceAvailability();
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

  const checkVoiceAvailability = async () => {
    console.log('🎤 VoiceSearchModal: Checking voice availability...');
    const isAvailable = await voiceSearchService.isVoiceAvailable();
    console.log('🎤 VoiceSearchModal: Voice available:', isAvailable);
    
    if (!isAvailable) {
      Alert.alert(
        'Voice Search Unavailable',
        'Voice recognition is not available on this device. This feature requires:\n\n• Physical device (not simulator)\n• Microphone permissions\n• Voice recognition service',
        [
          { text: 'Use Text Search Instead', onPress: onClose },
          { text: 'OK', onPress: onClose }
        ]
      );
    }
  };

  const cleanup = async () => {
    if (isListening) {
      await voiceSearchService.stopListening();
    }
    setIsListening(false);
    setTranscript('');
    setIsProcessing(false);
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
        await voiceSearchService.speak(`Searching for ${result.transcript}`);

        // Return search results
        onSearchResults(processedQuery.searchTerms, processedQuery.originalQuery);
        
        // Close modal after a brief delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        console.log('🎤 VoiceSearchModal: Voice recognition failed:', result.error);
        // Show detailed error message
        const errorTitle = result.error?.includes('install') ? 'Dependencies Missing' : 'Voice Recognition Failed';
        const errorMessage = result.error || 'Could not understand your voice. Please try again.';
        
        Alert.alert(
          errorTitle,
          errorMessage,
          [
            { text: 'Use Text Search', onPress: handleClose },
            { text: 'Try Again', onPress: handleStartListening },
            { text: 'Cancel', onPress: handleClose },
          ]
        );
      }
    } catch (error) {
      console.error('🎤 VoiceSearchModal: Voice search error:', error);
      setIsListening(false);
      Alert.alert(
        'Voice Search Error', 
        'Voice search failed. This feature requires:\n\n• Physical device (not simulator)\n• Microphone permissions\n• Voice recognition dependencies\n\nPlease install dependencies and try again.',
        [
          { text: 'Use Text Search', onPress: handleClose },
          { text: 'OK', onPress: handleClose }
        ]
      );
    }
  };

  const handleStopListening = async () => {
    await voiceSearchService.stopListening();
    setIsListening(false);
  };

  const renderListeningState = () => {
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
        <View style={styles.microphoneContainer}>
          <CustomIcon
            name="mic"
            size={FONTSIZE.size_30}
            color={COLORS.primaryLightGreyHex}
          />
        </View>
        
        <Text style={styles.stateTitle}>Voice Search</Text>
        <Text style={styles.stateSubtitle}>
          Tap the microphone and speak to search for coffee products
        </Text>
        
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