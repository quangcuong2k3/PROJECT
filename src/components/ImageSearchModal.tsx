import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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
import imageSearchService, {ImageSearchResult} from '../services/imageSearchService';

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

  // Debug modal visibility
  useEffect(() => {
    if (visible) {
      console.log('📷 ImageSearchModal: Modal opened');
    } else {
      console.log('📷 ImageSearchModal: Modal closed');
    }
  }, [visible]);

  const handleClose = () => {
    setSelectedImage(null);
    setAnalysisResults(null);
    setIsAnalyzing(false);
    onClose();
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
        await analyzeImage(imageUri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(
        'Image Search Unavailable', 
        'Image picker is not available on this device. This feature requires:\n\n• Camera/gallery permissions\n• Physical device for camera\n• Image picker service',
        [
          { text: 'Use Text Search Instead', onPress: onClose },
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
          // Image is not coffee-related
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
          // Coffee-related image with results
          setAnalysisResults(response.results);
        } else {
          // No results but might be coffee-related
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

  const handleUseResults = () => {
    if (analysisResults) {
      const searchTerms = imageSearchService.generateSearchTermsFromImage(analysisResults);
      onSearchResults(searchTerms, selectedImage || undefined, analysisResults);
      handleClose();
    }
  };

  const handleRetakePhoto = () => {
    setSelectedImage(null);
    setAnalysisResults(null);
  };

  const renderImageSelection = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.title}>Search by Image</Text>
      <Text style={styles.subtitle}>
        Take a photo or select from gallery to find similar coffee products
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleImageSource('camera')}
        >
          <View style={styles.optionIconContainer}>
            <CustomIcon
              name="camera"
              size={FONTSIZE.size_30}
              color={COLORS.primaryOrangeHex}
            />
          </View>
          <Text style={styles.optionText}>Take Photo</Text>
          <Text style={styles.optionSubtext}>Use camera to capture coffee</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleImageSource('gallery')}
        >
          <View style={styles.optionIconContainer}>
            <CustomIcon
              name="image"
              size={FONTSIZE.size_30}
              color={COLORS.primaryOrangeHex}
            />
          </View>
          <Text style={styles.optionText}>Choose from Gallery</Text>
          <Text style={styles.optionSubtext}>Select existing photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImageAnalysis = () => (
    <View style={styles.analysisContainer}>
      <Text style={styles.title}>Image Analysis</Text>
      
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{uri: selectedImage}} style={styles.selectedImage} />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetakePhoto}
          >
            <CustomIcon
              name="refresh"
              size={FONTSIZE.size_16}
              color={COLORS.primaryWhiteHex}
            />
          </TouchableOpacity>
        </View>
      )}

      {isAnalyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          <Text style={styles.loadingText}>Analyzing image...</Text>
          <Text style={styles.loadingSubtext}>
            Identifying coffee type and characteristics
          </Text>
        </View>
      ) : analysisResults ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Analysis Results</Text>
          
          {analysisResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultType}>
                  {result.productType === 'coffee' ? '☕ Coffee Drink' : '🫘 Coffee Beans'}
                </Text>
                <Text style={styles.confidence}>
                  {Math.round(result.confidence * 100)}% match
                </Text>
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
                  {Object.entries(result.characteristics).map(([key, value]) => (
                    <Text key={key} style={styles.characteristicItem}>
                      • {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {value}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.useResultsButton}
            onPress={handleUseResults}
          >
            <Text style={styles.useResultsButtonText}>Search with these results</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

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
          <Text style={styles.headerTitle}>Image Search</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {!selectedImage ? renderImageSelection() : renderImageAnalysis()}
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
    padding: SPACING.space_20,
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_12,
  },
  subtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginBottom: SPACING.space_36,
    lineHeight: 20,
  },
  optionsContainer: {
    width: '100%',
    gap: SPACING.space_20,
  },
  optionButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  optionText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  optionSubtext: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  analysisContainer: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: SPACING.space_24,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: BORDERRADIUS.radius_15,
    backgroundColor: COLORS.primaryGreyHex,
  },
  retakeButton: {
    position: 'absolute',
    top: SPACING.space_8,
    right: -20,
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.space_36,
  },
  loadingText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_16,
  },
  loadingSubtext: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_4,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
  },
  resultItem: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_12,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  resultType: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  confidence: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryOrangeHex,
  },
  suggestionsContainer: {
    marginBottom: SPACING.space_12,
  },
  suggestionsLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
  },
  suggestionTag: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_4,
  },
  suggestionTagText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  characteristicsContainer: {
    marginTop: SPACING.space_8,
  },
  characteristicsLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  characteristicItem: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_2,
  },
  useResultsButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_16,
    alignItems: 'center',
    marginTop: SPACING.space_20,
  },
  useResultsButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
});

export default ImageSearchModal; 