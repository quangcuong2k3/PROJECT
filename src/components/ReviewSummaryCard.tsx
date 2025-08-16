import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../theme/theme';
import CustomIcon from './CustomIcon';
import {ReviewSummary} from '../services/reviewServices';

interface ReviewSummaryCardProps {
  summary: ReviewSummary;
  onAddReview: () => void;
  canReview: boolean;
  isAuthenticated: boolean;
}

const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({
  summary,
  onAddReview,
  canReview,
  isAuthenticated,
}) => {
  const renderStars = (rating: number, size: number = FONTSIZE.size_16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <CustomIcon
          key={i}
          name="star"
          size={size}
          color={COLORS.primaryOrangeHex}
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <CustomIcon
          key="half"
          name="star-half"
          size={size}
          color={COLORS.primaryOrangeHex}
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <CustomIcon
          key={`empty-${i}`}
          name="star-outline"
          size={size}
          color={COLORS.primaryGreyHex}
        />
      );
    }

    return stars;
  };

  const renderRatingBar = (rating: number, count: number) => {
    const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
    
    return (
      <View style={styles.ratingBarContainer}>
        <Text style={styles.ratingBarLabel}>{rating}</Text>
        <CustomIcon
          name="star"
          size={FONTSIZE.size_12}
          color={COLORS.primaryOrangeHex}
        />
        <View style={styles.ratingBarTrack}>
          <View 
            style={[
              styles.ratingBarFill,
              {width: `${percentage}%`}
            ]} 
          />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.summarySection}>
        {/* Overall Rating */}
        <View style={styles.overallRating}>
          <Text style={styles.averageRatingText}>
            {summary.averageRating.toFixed(1)}
          </Text>
          <View style={styles.starsContainer}>
            {renderStars(summary.averageRating, FONTSIZE.size_20)}
          </View>
          <Text style={styles.totalReviewsText}>
            Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
          </Text>
          {summary.verifiedReviews > 0 && (
            <Text style={styles.verifiedText}>
              {summary.verifiedReviews} verified purchase{summary.verifiedReviews !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Rating Distribution */}
        <View style={styles.distributionSection}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <View key={`rating-${rating}`}>
              {renderRatingBar(
                rating, 
                summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution]
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Write Review Button */}
      {isAuthenticated && (
        <TouchableOpacity
          style={[
            styles.writeReviewButton,
            !canReview && styles.writeReviewButtonDisabled,
          ]}
          onPress={onAddReview}
          disabled={!canReview}>
          <CustomIcon
            name="create"
            size={FONTSIZE.size_16}
            color={canReview ? COLORS.primaryWhiteHex : COLORS.primaryGreyHex}
          />
          <Text
            style={[
              styles.writeReviewButtonText,
              !canReview && styles.writeReviewButtonTextDisabled,
            ]}>
            {canReview ? 'Write a Review' : 'Purchase to Review'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_20,
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_20,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overallRating: {
    flex: 1,
    alignItems: 'center',
    paddingRight: SPACING.space_20,
  },
  averageRatingText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_30,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.space_8,
  },
  totalReviewsText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  verifiedText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryOrangeHex,
    textAlign: 'center',
    marginTop: SPACING.space_4,
  },
  distributionSection: {
    flex: 1,
    paddingLeft: SPACING.space_20,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  ratingBarLabel: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    width: 15,
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_4,
    marginHorizontal: SPACING.space_8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_4,
  },
  ratingBarCount: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    width: 25,
    textAlign: 'right',
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingVertical: SPACING.space_12,
    marginTop: SPACING.space_20,
  },
  writeReviewButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  writeReviewButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_8,
  },
  writeReviewButtonTextDisabled: {
    color: COLORS.primaryGreyHex,
  },
});

export default ReviewSummaryCard; 