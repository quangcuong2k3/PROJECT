import React, {useState, useEffect, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../theme/theme';
import CustomIcon from './CustomIcon';
import imageSearchService, {ImageSearchResult} from '../services/imageSearchService';
import {LinearGradient} from 'expo-linear-gradient';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface ImageSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearchResults: (searchTerms: string[], imageUri?: string, analysisResults?: any) => void;
}

const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  visible,
  onClose,
  onSearchResults,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ImageSearchResult[] | null>(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<'select' | 'preview' | 'results'>('select');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const resultsScrollY = useRef(new Animated.Value(0)).current;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      console.log('📷 ImageSearchModal: Modal opened');
      setCurrentStep('select');
      setSelectedImage(null);
      setAnalysisResults(null);
      setSelectedResultIndex(null);
      setIsAnalyzing(false);
      
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      console.log('📷 ImageSearchModal: Modal closed');
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(screenHeight);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleClose = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedImage(null);
      setAnalysisResults(null);
      setSelectedResultIndex(null);
      setIsAnalyzing(false);
      setCurrentStep('select');
      onClose();
    });
  };

  const handleImageSource = async (source: 'camera' | 'gallery') => {
    try {
      let imageUri: string | null = null;

      if (source === 'camera') {
        imageUri = await imageSearchService.takePhoto();
      } else {
        imageUri = await imageSearchService.pickImage();
      }

      if (imageUri) {
        setSelectedImage(imageUri);
        setCurrentStep('preview');
        await analyzeImage(imageUri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(
        'Image Search Unavailable', 
        'Image picker is not available on this device. This feature requires:\n\n• Camera/gallery permissions\n• Physical device for camera\n• Image picker service',
        [
          { text: 'Use Text Search Instead', onPress: handleClose },
          { text: 'OK' }
        ]
      );
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    try {
      const response = await imageSearchService.analyzeImage(imageUri);
      
      if (response.success) {
        if (response.isCoffeeRelated === false) {
          Alert.alert(
            'Not Coffee Related', 
            response.error || 'This image does not appear to contain coffee, coffee beans, or coffee beverages. Please try with a coffee-related image.',
            [
              { text: 'Try Another Image', onPress: handleRetakePhoto },
              { text: 'Cancel', onPress: handleClose }
            ]
          );
          setAnalysisResults(null);
        } else if (response.results && response.results.length > 0) {
          setAnalysisResults(response.results);
          setCurrentStep('results');
          // Auto-select first result if only one
          if (response.results.length === 1) {
            setSelectedResultIndex(0);
          }
        } else {
          Alert.alert(
            'Analysis Incomplete', 
            'Could not identify specific coffee types in this image. Please try with a clearer image of coffee or coffee beans.',
            [
              { text: 'Try Another Image', onPress: handleRetakePhoto },
              { text: 'Cancel', onPress: handleClose }
            ]
          );
          setAnalysisResults(null);
        }
      } else {
        Alert.alert('Analysis Failed', response.error || 'Could not analyze the image.');
        setAnalysisResults(null);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
      setAnalysisResults(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseResult = (resultIndex: number) => {
    if (analysisResults && analysisResults[resultIndex]) {
      const searchTerms = imageSearchService.generateSearchTermsFromImage([analysisResults[resultIndex]]);
      onSearchResults(searchTerms, selectedImage || undefined, [analysisResults[resultIndex]]);
      handleClose();
    }
  };

  const handleUseAllResults = () => {
    if (analysisResults) {
      const searchTerms = imageSearchService.generateSearchTermsFromImage(analysisResults);
      onSearchResults(searchTerms, selectedImage || undefined, analysisResults);
      handleClose();
    }
  };

  const handleRetakePhoto = () => {
    setSelectedImage(null);
    setAnalysisResults(null);
    setSelectedResultIndex(null);
    setCurrentStep('select');
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.step, currentStep === 'select' && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep === 'select' && styles.stepNumberActive]}>1</Text>
      </View>
      <View style={[styles.stepLine, currentStep !== 'select' && styles.stepLineActive]} />
      <View style={[styles.step, currentStep === 'preview' && styles.stepActive, currentStep === 'results' && styles.stepCompleted]}>
        <Text style={[styles.stepNumber, (currentStep === 'preview' || currentStep === 'results') && styles.stepNumberActive]}>2</Text>
      </View>
      <View style={[styles.stepLine, currentStep === 'results' && styles.stepLineActive]} />
      <View style={[styles.step, currentStep === 'results' && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep === 'results' && styles.stepNumberActive]}>3</Text>
      </View>
    </View>
  );

  const renderImageSelection = () => (
    <Animated.View 
      style={[
        styles.selectionContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      <View style={styles.titleContainer}>
        <CustomIcon
          name="camera"
          size={FONTSIZE.size_24}
          color={COLORS.primaryOrangeHex}
          style={styles.titleIcon}
        />
        <Text style={styles.title}>Visual Search</Text>
        <Text style={styles.subtitle}>
          Discover coffee by capturing or selecting an image
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleImageSource('camera')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primaryOrangeHex, '#E68B5B']}
            style={styles.optionGradient}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <CustomIcon
                  name="camera"
                  size={FONTSIZE.size_30}
                  color={COLORS.primaryWhiteHex}
                />
              </View>
              <Text style={styles.optionText}>Take Photo</Text>
              <Text style={styles.optionSubtext}>Capture coffee with camera</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleImageSource('gallery')}
          activeOpacity={0.8}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionIconContainer}>
              <CustomIcon
                name="image"
                size={FONTSIZE.size_30}
                color={COLORS.primaryOrangeHex}
              />
            </View>
            <Text style={styles.optionText}>Choose from Gallery</Text>
            <Text style={styles.optionSubtext}>Select existing photo</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.featureHighlights}>
        <View style={styles.featureItem}>
          <CustomIcon name="flash" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
          <Text style={styles.featureText}>AI-Powered Recognition</Text>
        </View>
        <View style={styles.featureItem}>
          <CustomIcon name="search" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
          <Text style={styles.featureText}>Instant Product Matching</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderImagePreview = () => (
    <Animated.View 
      style={[
        styles.previewContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <Text style={styles.title}>Analyzing Image</Text>
      
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{uri: selectedImage}} style={styles.selectedImage} />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetakePhoto}
          >
            <CustomIcon
              name="refresh"
              size={FONTSIZE.size_18}
              color={COLORS.primaryWhiteHex}
            />
          </TouchableOpacity>
        </View>
      )}

      {isAnalyzing && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          </View>
          <Text style={styles.loadingText}>Analyzing image...</Text>
          <Text style={styles.loadingSubtext}>
            Identifying coffee characteristics and matching products
          </Text>
          
          <View style={styles.loadingSteps}>
            <View style={styles.loadingStep}>
              <CustomIcon name="search" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
              <Text style={styles.loadingStepText}>Detecting coffee elements</Text>
            </View>
            <View style={styles.loadingStep}>
              <CustomIcon name="flash" size={FONTSIZE.size_16} color={COLORS.primaryLightGreyHex} />
              <Text style={styles.loadingStepText}>AI analysis in progress</Text>
            </View>
            <View style={styles.loadingStep}>
              <CustomIcon name="star" size={FONTSIZE.size_16} color={COLORS.primaryLightGreyHex} />
              <Text style={styles.loadingStepText}>Generating matches</Text>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );

  const renderResults = () => (
    <Animated.View 
      style={[
        styles.resultsContainer,
        {
          opacity: fadeAnim,
        }
      ]}
    >
      {/* <View style={styles.resultsHeader}>
        <Text style={styles.title}>Analysis Results</Text>
        <Text style={styles.resultsSubtitle}>
          {analysisResults?.length === 1 
            ? 'Select to search with this result'
            : `Found ${analysisResults?.length} possible matches - choose one or use all`
          }
        </Text>
      </View> */}

      <Animated.ScrollView
        style={styles.resultsScrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: resultsScrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {analysisResults?.map((result, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.resultCard,
              selectedResultIndex === index && styles.resultCardSelected
            ]}
            onPress={() => setSelectedResultIndex(index)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                selectedResultIndex === index
                  ? [COLORS.primaryOrangeHex + '20', COLORS.primaryOrangeHex + '10']
                  : [COLORS.primaryDarkGreyHex, COLORS.primaryDarkGreyHex]
              }
              style={styles.resultCardGradient}
            >
              <View style={styles.resultHeader}>
                <View style={styles.resultTitleRow}>
                  <Text style={styles.resultType}>
                    {result.productType === 'coffee' ? '☕ Coffee Drink' : '🫘 Coffee Beans'}
                  </Text>
                  <View style={styles.confidenceContainer}>
                    <View style={[styles.confidenceDot, { opacity: result.confidence }]} />
                    <Text style={styles.confidence}>
                      {Math.round(result.confidence * 100)}% match
                    </Text>
                  </View>
                </View>
                
                {selectedResultIndex === index && (
                  <View style={styles.selectedIndicator}>
                    <CustomIcon
                      name="star"
                      size={FONTSIZE.size_16}
                      color={COLORS.primaryOrangeHex}
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsLabel}>Suggested matches:</Text>
                <View style={styles.suggestionTags}>
                  {result.suggestedNames.map((name, nameIndex) => (
                    <View key={nameIndex} style={styles.suggestionTag}>
                      <Text style={styles.suggestionTagText}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {Object.keys(result.characteristics).length > 0 && (
                <View style={styles.characteristicsContainer}>
                  <Text style={styles.characteristicsLabel}>Characteristics:</Text>
                  <View style={styles.characteristicsList}>
                    {Object.entries(result.characteristics).map(([key, value]) => (
                      <View key={key} style={styles.characteristicItem}>
                        <View style={styles.characteristicDot} />
                        <Text style={styles.characteristicText}>
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.quickSearchButton,
                  selectedResultIndex === index && styles.quickSearchButtonSelected
                ]}
                onPress={() => handleUseResult(index)}
              >
                <CustomIcon
                  name="search"
                  size={FONTSIZE.size_14}
                  color={selectedResultIndex === index ? COLORS.primaryWhiteHex : COLORS.primaryOrangeHex}
                />
                <Text style={[
                  styles.quickSearchText,
                  selectedResultIndex === index && styles.quickSearchTextSelected
                ]}>
                  Search with this result
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </Animated.ScrollView>

      <View style={styles.actionButtons}>
        {analysisResults && analysisResults.length > 1 && (
          <TouchableOpacity
            style={styles.useAllButton}
            onPress={handleUseAllResults}
          >
            <Text style={styles.useAllButtonText}>Use All Results</Text>
          </TouchableOpacity>
        )}
        
        {selectedResultIndex !== null && (
          <TouchableOpacity
            style={styles.useSelectedButton}
            onPress={() => handleUseResult(selectedResultIndex)}
          >
            <LinearGradient
              colors={[COLORS.primaryOrangeHex, '#E68B5B']}
              style={styles.useSelectedButtonGradient}
            >
              <CustomIcon
                name="search"
                size={FONTSIZE.size_16}
                color={COLORS.primaryWhiteHex}
              />
              <Text style={styles.useSelectedButtonText}>Search Selected</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <CustomIcon
              name="close"
              size={FONTSIZE.size_24}
              color={COLORS.primaryWhiteHex}
            />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Image Search</Text>
            {renderStepIndicator()}
          </View>
          
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {currentStep === 'select' && renderImageSelection()}
          {currentStep === 'preview' && renderImagePreview()}
          {currentStep === 'results' && renderResults()}
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
    paddingVertical: SPACING.space_20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  closeButton: {
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  headerSpacer: {
    width: FONTSIZE.size_24 + SPACING.space_16,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  stepCompleted: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  stepNumber: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryLightGreyHex,
  },
  stepNumberActive: {
    color: COLORS.primaryWhiteHex,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.primaryGreyHex,
    marginHorizontal: SPACING.space_4,
  },
  stepLineActive: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  content: {
    flex: 1,
  },
  selectionContainer: {
    flex: 1,
    padding: SPACING.space_24,
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_40,
  },
  titleIcon: {
    marginBottom: SPACING.space_16,
  },
  title: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_8,
  },
  subtitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: SPACING.space_16,
    marginBottom: SPACING.space_32,
  },
  optionButton: {
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
  },
  optionGradient: {
    borderRadius: BORDERRADIUS.radius_20,
  },
  optionContent: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_24,
    alignItems: 'center',
    borderRadius: BORDERRADIUS.radius_20,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  optionIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primaryGreyHex + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  optionText: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  optionSubtext: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  featureHighlights: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.space_20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  featureText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  previewContainer: {
    flex: 1,
    padding: SPACING.space_24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginVertical: SPACING.space_32,
  },
  selectedImage: {
    width: 250,
    height: 250,
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.primaryGreyHex,
  },
  retakeButton: {
    position: 'absolute',
    top: SPACING.space_12,
    right: SPACING.space_12,
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_12,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  loadingCircle: {
    marginBottom: SPACING.space_24,
  },
  loadingText: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  loadingSubtext: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginBottom: SPACING.space_32,
    lineHeight: 20,
  },
  loadingSteps: {
    width: '100%',
    gap: SPACING.space_16,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
  },
  loadingStepText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  resultsContainer: {
    flex: 1,
    padding: SPACING.space_20,
  },
  resultsHeader: {
    marginBottom: SPACING.space_20,
  },
  resultsSubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_8,
    lineHeight: 20,
  },
  resultsScrollView: {
    flex: 1,
    marginBottom: SPACING.space_20,
  },
  resultCard: {
    marginBottom: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
  },
  resultCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryOrangeHex,
  },
  resultCardGradient: {
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_20,
  },
  resultHeader: {
    marginBottom: SPACING.space_16,
  },
  resultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  resultType: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryOrangeHex,
  },
  confidence: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  selectedIndicator: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primaryOrangeHex + '20',
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_8,
    marginTop: SPACING.space_8,
  },
  suggestionsContainer: {
    marginBottom: SPACING.space_16,
  },
  suggestionsLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_10,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
  },
  suggestionTag: {
    backgroundColor: COLORS.primaryOrangeHex + '20',
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex + '40',
  },
  suggestionTagText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
  },
  characteristicsContainer: {
    marginBottom: SPACING.space_16,
  },
  characteristicsLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_10,
  },
  characteristicsList: {
    gap: SPACING.space_4,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  characteristicDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primaryLightGreyHex,
  },
  characteristicText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    flex: 1,
  },
  quickSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.space_8,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex + '40',
  },
  quickSearchButtonSelected: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderColor: COLORS.primaryOrangeHex,
  },
  quickSearchText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
  },
  quickSearchTextSelected: {
    color: COLORS.primaryWhiteHex,
  },
  actionButtons: {
    gap: SPACING.space_12,
  },
  useAllButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingVertical: SPACING.space_16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  useAllButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
  },
  useSelectedButton: {
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
  },
  useSelectedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.space_8,
    paddingVertical: SPACING.space_18,
    paddingHorizontal: SPACING.space_24,
  },
  useSelectedButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
});

export default ImageSearchModal; 