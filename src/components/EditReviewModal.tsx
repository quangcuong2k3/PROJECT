import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../theme/theme';
import CustomIcon from './CustomIcon';
import {useStore} from '../store/firebaseStore';
import reviewServices, {Review} from '../services/reviewServices';

interface EditReviewModalProps {
  visible: boolean;
  review: Review;
  onClose: () => void;
  onReviewUpdated: () => void;
}

const EditReviewModal: React.FC<EditReviewModalProps> = ({
  visible,
  review,
  onClose,
  onReviewUpdated,
}) => {
  const {user, userProfile} = useStore();
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title || '');
  const [content, setContent] = useState(review.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when review changes or modal opens
  useEffect(() => {
    if (visible) {
      setRating(review.rating);
      setTitle(review.title || '');
      setContent(review.content);
    }
  }, [visible, review]);

  const handleClose = () => {
    // Reset to original values
    setRating(review.rating);
    setTitle(review.title || '');
    setContent(review.content);
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to edit a review');
      return;
    }

    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    if (content.trim().length < 10) {
      Alert.alert('Review Required', 'Please write at least 10 characters for your review');
      return;
    }

    // Check if anything actually changed
    const hasChanges = 
      rating !== review.rating ||
      title.trim() !== (review.title || '') ||
      content.trim() !== review.content;

    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes were made to the review.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🔄 Updating review:', review.id);

      const updates = {
        rating,
        title: title.trim(),
        content: content.trim(),
      };

      console.log('📝 Update data:', updates);
      await reviewServices.updateReview(review.id!, updates);
      console.log('✅ Review updated successfully');
      
      Alert.alert(
        'Review Updated',
        'Your review has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onReviewUpdated();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating review:', error);
      Alert.alert('Error', 'Failed to update review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}>
          <CustomIcon
            name={i <= rating ? 'star' : 'star-outline'}
            size={FONTSIZE.size_24}
            color={i <= rating ? COLORS.primaryOrangeHex : COLORS.primaryGreyHex}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap a star to rate';
    }
  };

  const hasChanges = 
    rating !== review.rating ||
    title.trim() !== (review.title || '') ||
    content.trim() !== review.content;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <CustomIcon
                name="close"
                size={FONTSIZE.size_24}
                color={COLORS.primaryWhiteHex}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Edit Review</Text>
            <Text style={styles.productName}>{review.productId}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || rating === 0 || content.trim().length < 10 || !hasChanges}
              style={[
                styles.submitButton,
                (isSubmitting || rating === 0 || content.trim().length < 10 || !hasChanges) && styles.submitButtonDisabled,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
              ) : (
                <Text style={styles.submitButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingText}>{getRatingText()}</Text>
          </View>

          {/* Title Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Title (Optional)</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Summarize your experience"
              placeholderTextColor={COLORS.primaryLightGreyHex}
              maxLength={100}
              multiline={false}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Content Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review *</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Share details about your experience with this product. What did you like or dislike? How did it taste? Would you recommend it to others?"
              placeholderTextColor={COLORS.primaryLightGreyHex}
              maxLength={1000}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{content.length}/1000</Text>
          </View>

          {/* Changes Indicator */}
          {hasChanges && (
            <View style={styles.changesIndicator}>
              <CustomIcon
                name="information-circle"
                size={FONTSIZE.size_16}
                color={COLORS.primaryOrangeHex}
              />
              <Text style={styles.changesText}>You have unsaved changes</Text>
            </View>
          )}

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be honest and helpful to other customers{'\n'}
              • Focus on the product's features and your experience{'\n'}
              • Avoid inappropriate language or personal information{'\n'}
              • Reviews are public and can be seen by all users
            </Text>
          </View>
        </ScrollView>
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
    paddingVertical: SPACING.space_15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: SPACING.space_8,
  },
  headerTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  productName: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_2,
  },
  submitButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    minWidth: 50,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  submitButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.space_20,
  },
  section: {
    marginBottom: SPACING.space_24,
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.space_8,
  },
  starButton: {
    padding: SPACING.space_4,
    marginHorizontal: SPACING.space_2,
  },
  ratingText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
    textAlign: 'center',
  },
  titleInput: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  contentInput: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    minHeight: 120,
  },
  characterCount: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'right',
    marginTop: SPACING.space_4,
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    marginBottom: SPACING.space_15,
    borderWidth: 1,
    borderColor: 'rgba(209, 120, 66, 0.3)',
  },
  changesText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_8,
  },
  guidelines: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_15,
    marginBottom: SPACING.space_20,
  },
  guidelinesTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_8,
  },
  guidelinesText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    lineHeight: 18,
  },
});

export default EditReviewModal; 