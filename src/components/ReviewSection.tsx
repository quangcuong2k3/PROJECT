import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../theme/theme';
import CustomIcon from './CustomIcon';
import ReviewSummaryCard from './ReviewSummaryCard';
import ReviewCard from './ReviewCard';
import AddReviewModal from './AddReviewModal';
import {useStore} from '../store/firebaseStore';
import reviewServices, {
  Review,
  ReviewSummary,
} from '../services/reviewServices';

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  productId,
  productName,
}) => {
  const {user, isAuthenticated} = useStore();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful'>('newest');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReviews();
    loadReviewSummary();
    if (user?.uid) {
      checkReviewPermission();
    }
  }, [productId, user?.uid, sortBy]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const fetchedReviews = await reviewServices.fetchProductReviews(productId, sortBy);
      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviewSummary = async () => {
    try {
      const summary = await reviewServices.getReviewSummary(productId);
      setReviewSummary(summary);
    } catch (error) {
      console.error('Error loading review summary:', error);
    }
  };

  const checkReviewPermission = async () => {
    if (!user?.uid) {
      setCanReview(false);
      return;
    }

    try {
      const hasPurchased = await reviewServices.checkUserPurchaseHistory(user.uid, productId);
      setCanReview(hasPurchased);
    } catch (error) {
      console.error('Error checking review permission:', error);
      setCanReview(false);
    }
  };

  const handleAddReview = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to leave a review.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Sign In', onPress: () => {/* Navigate to login */}},
        ]
      );
      return;
    }

    if (!canReview) {
      Alert.alert(
        'Purchase Required',
        'You need to purchase this product before you can leave a review.',
        [{text: 'OK'}]
      );
      return;
    }

    setShowAddReview(true);
  };

  const handleReviewAdded = () => {
    setShowAddReview(false);
    loadReviews();
    loadReviewSummary();
  };

  const handleReviewUpdated = () => {
    loadReviews();
    loadReviewSummary();
  };

  const handleReviewDeleted = (reviewId: string) => {
    setReviews(prev => prev.filter(review => review.id !== reviewId));
    loadReviewSummary();
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
  };

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const renderSortOptions = () => {
    const options = [
      {key: 'newest', label: 'Newest'},
      {key: 'oldest', label: 'Oldest'},
      {key: 'rating_high', label: 'Highest Rating'},
      {key: 'rating_low', label: 'Lowest Rating'},
      {key: 'helpful', label: 'Most Helpful'},
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.sortContainer}
        contentContainerStyle={styles.sortContentContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortButton,
              sortBy === option.key && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange(option.key as typeof sortBy)}>
            <Text
              style={[
                styles.sortButtonText,
                sortBy === option.key && styles.sortButtonTextActive,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Review Summary */}
      {reviewSummary && (
        <ReviewSummaryCard
          summary={reviewSummary}
          onAddReview={handleAddReview}
          canReview={canReview}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Reviews Header */}
      <View style={styles.reviewsHeader}>
        <Text style={styles.reviewsTitle}>
          Reviews ({reviewSummary?.totalReviews || 0})
        </Text>
        {isAuthenticated && (
          <TouchableOpacity
            style={[
              styles.addReviewButton,
              !canReview && styles.addReviewButtonDisabled,
            ]}
            onPress={handleAddReview}
            disabled={!canReview}>
            <CustomIcon
              name="add"
              size={FONTSIZE.size_16}
              color={canReview ? COLORS.primaryOrangeHex : COLORS.primaryGreyHex}
            />
            <Text
              style={[
                styles.addReviewButtonText,
                !canReview && styles.addReviewButtonTextDisabled,
              ]}>
              Add Review
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      {reviews.length > 0 && renderSortOptions()}

      {/* Reviews List */}
      <ScrollView
        style={styles.reviewsList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadReviews}
            tintColor={COLORS.primaryOrangeHex}
          />
        }>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.uid}
              isExpanded={expandedReviews.has(review.id || '')}
              onToggleExpand={() => toggleReviewExpansion(review.id || '')}
              onReviewUpdated={handleReviewUpdated}
              onReviewDeleted={handleReviewDeleted}
            />
          ))
        ) : (
          <View style={styles.noReviewsContainer}>
            <CustomIcon
              name="chatbubble-outline"
              size={FONTSIZE.size_30}
              color={COLORS.primaryGreyHex}
            />
            <Text style={styles.noReviewsText}>
              No reviews yet. Be the first to review this product!
            </Text>
            {canReview && (
              <TouchableOpacity
                style={styles.firstReviewButton}
                onPress={handleAddReview}>
                <Text style={styles.firstReviewButtonText}>Write First Review</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Review Modal */}
      <AddReviewModal
        visible={showAddReview}
        productId={productId}
        productName={productName}
        onClose={() => setShowAddReview(false)}
        onReviewAdded={handleReviewAdded}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_15,
  },
  reviewsTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  addReviewButtonDisabled: {
    borderColor: COLORS.primaryGreyHex,
    backgroundColor: COLORS.primaryGreyHex,
  },
  addReviewButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_4,
  },
  addReviewButtonTextDisabled: {
    color: COLORS.primaryGreyHex,
  },
  sortContainer: {
    paddingHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_15,
  },
  sortContentContainer: {
    paddingRight: SPACING.space_20,
  },
  sortButton: {
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    marginRight: SPACING.space_8,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderColor: COLORS.primaryOrangeHex,
  },
  sortButtonText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  sortButtonTextActive: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  reviewsList: {
    flex: 1,
    paddingHorizontal: SPACING.space_20,
  },
  noReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36,
  },
  noReviewsText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_12,
    marginBottom: SPACING.space_20,
  },
  firstReviewButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
  },
  firstReviewButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default ReviewSection; 