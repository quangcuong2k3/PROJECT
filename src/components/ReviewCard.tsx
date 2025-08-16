import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../theme/theme';
import CustomIcon from './CustomIcon';
import CommentSection from './CommentSection';
import EditReviewModal from './EditReviewModal';
import MediaViewer, { MediaItem } from './MediaViewer';
import {useStore} from '../store/firebaseStore';
import reviewServices, {Review} from '../services/reviewServices';

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReviewUpdated: () => void;
  onReviewDeleted: (reviewId: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUserId,
  isExpanded,
  onToggleExpand,
  onReviewUpdated,
  onReviewDeleted,
}) => {
  const {user} = useStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isHelpful, setIsHelpful] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [helpfulCount, setHelpfulCount] = useState(0);

  const isOwnReview = currentUserId === review.userId;

  useEffect(() => {
    if (currentUserId) {
      setIsLiked(review.likes?.includes(currentUserId) || false);
      setIsDisliked(review.dislikes?.includes(currentUserId) || false);
      setIsHelpful(review.helpful?.includes(currentUserId) || false);
    }
    setLikesCount(review.likes?.length || 0);
    setDislikesCount(review.dislikes?.length || 0);
    setHelpfulCount(review.helpful?.length || 0);
  }, [review, currentUserId]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <CustomIcon
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={FONTSIZE.size_14}
          color={i <= rating ? COLORS.primaryOrangeHex : COLORS.primaryGreyHex}
        />
      );
    }
    return stars;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleReaction = async (type: 'like' | 'dislike' | 'helpful') => {
    if (!currentUserId || !review.id) {
      console.log('❌ Cannot handle reaction: currentUserId:', currentUserId, 'review.id:', review.id);
      return;
    }

    console.log('🔄 Handling reaction:', type, 'for review:', review.id, 'by user:', currentUserId);

    try {
      await reviewServices.toggleReviewReaction(review.id, currentUserId, type);
      
      // Update local state optimistically
      if (type === 'like') {
        if (isLiked) {
          setIsLiked(false);
          setLikesCount(prev => prev - 1);
        } else {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          if (isDisliked) {
            setIsDisliked(false);
            setDislikesCount(prev => prev - 1);
          }
        }
      } else if (type === 'dislike') {
        if (isDisliked) {
          setIsDisliked(false);
          setDislikesCount(prev => prev - 1);
        } else {
          setIsDisliked(true);
          setDislikesCount(prev => prev + 1);
          if (isLiked) {
            setIsLiked(false);
            setLikesCount(prev => prev - 1);
          }
        }
      } else if (type === 'helpful') {
        if (isHelpful) {
          setIsHelpful(false);
          setHelpfulCount(prev => prev - 1);
        } else {
          setIsHelpful(true);
          setHelpfulCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (review.id) {
                await reviewServices.deleteReview(review.id);
                onReviewDeleted(review.id);
              }
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review');
            }
          },
        },
      ]
    );
  };

  const handleMediaPress = (index: number) => {
    setSelectedMediaIndex(index);
    setShowMediaViewer(true);
  };

  const getAllMedia = () => {
    const media = [];
    if (review.images) {
      media.push(...review.images.map(url => ({type: 'image', url})));
    }
    if (review.videos) {
      media.push(...review.videos.map(url => ({type: 'video', url})));
    }
    if (review.gifs) {
      media.push(...review.gifs.map(url => ({type: 'gif', url})));
    }
    return media;
  };

  const renderMedia = () => {
    const allMedia = getAllMedia();
    if (allMedia.length === 0) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.mediaContainer}>
        {allMedia.map((media, index) => (
          <TouchableOpacity
            key={index}
            style={styles.mediaItem}
            onPress={() => handleMediaPress(index)}>
            <Image 
              source={{uri: media.url}}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {media.type === 'video' && (
              <View style={styles.videoOverlay}>
                <CustomIcon
                  name="play"
                  size={FONTSIZE.size_20}
                  color={COLORS.primaryWhiteHex}
                />
              </View>
            )}
            {media.type === 'gif' && (
              <View style={styles.gifOverlay}>
                <Text style={styles.gifText}>GIF</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Review Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {review.userAvatar ? (
              <Image source={{uri: review.userAvatar}} style={styles.avatarImage} />
            ) : (
              <CustomIcon
                name="person"
                size={FONTSIZE.size_20}
                color={COLORS.primaryLightGreyHex}
              />
            )}
          </View>
          <View style={styles.userDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{review.userName}</Text>
              {review.verified && (
                <View style={styles.verifiedBadge}>
                  <CustomIcon
                    name="checkmark-circle"
                    size={FONTSIZE.size_12}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.ratingContainer}>
              {renderStars(review.rating)}
              <Text style={styles.dateText}>{formatDate(review.createdAt)}</Text>
            </View>
          </View>
        </View>
        
        {isOwnReview && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowEditModal(true)}>
              <CustomIcon
                name="create"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}>
              <CustomIcon
                name="trash"
                size={FONTSIZE.size_16}
                color={COLORS.primaryRedHex}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Review Content */}
      <View style={styles.content}>
        {review.title && (
          <Text style={styles.reviewTitle}>{review.title}</Text>
        )}
        <Text style={styles.reviewContent} numberOfLines={isExpanded ? undefined : 3}>
          {review.content}
        </Text>
        {review.content.length > 150 && (
          <TouchableOpacity onPress={onToggleExpand}>
            <Text style={styles.expandText}>
              {isExpanded ? 'Show less' : 'Show more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Media */}
      {renderMedia()}

      {/* Reaction Buttons */}
      <View style={styles.reactions}>
        <TouchableOpacity
          style={[styles.reactionButton, isLiked && styles.reactionButtonActive]}
          onPress={() => handleReaction('like')}
          disabled={!currentUserId}>
          <CustomIcon
            name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={FONTSIZE.size_16}
            color={isLiked ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
          />
          <Text style={[styles.reactionText, isLiked && styles.reactionTextActive]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reactionButton, isDisliked && styles.reactionButtonActive]}
          onPress={() => handleReaction('dislike')}
          disabled={!currentUserId}>
          <CustomIcon
            name={isDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
            size={FONTSIZE.size_16}
            color={isDisliked ? COLORS.primaryRedHex : COLORS.primaryLightGreyHex}
          />
          <Text style={[styles.reactionText, isDisliked && styles.reactionTextActive]}>
            {dislikesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reactionButton, isHelpful && styles.reactionButtonActive]}
          onPress={() => handleReaction('helpful')}
          disabled={!currentUserId}>
          <CustomIcon
            name={isHelpful ? 'heart' : 'heart-outline'}
            size={FONTSIZE.size_16}
            color={isHelpful ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
          />
          <Text style={[styles.reactionText, isHelpful && styles.reactionTextActive]}>
            Helpful ({helpfulCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reactionButton}
          onPress={onToggleExpand}>
          <CustomIcon
            name="chatbubble-outline"
            size={FONTSIZE.size_16}
            color={COLORS.primaryLightGreyHex}
          />
          <Text style={styles.reactionText}>
            Reply ({review.replies})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {isExpanded && review.id && (
        <CommentSection
          reviewId={review.id}
          productId={review.productId}
          currentUserId={currentUserId}
        />
      )}

      {/* Edit Modal */}
      <EditReviewModal
        visible={showEditModal}
        review={review}
        onClose={() => setShowEditModal(false)}
        onReviewUpdated={() => {
          setShowEditModal(false);
          onReviewUpdated();
        }}
      />

      {/* Media Viewer */}
      <MediaViewer
        visible={showMediaViewer}
        media={getAllMedia() as MediaItem[]}
        initialIndex={selectedMediaIndex}
        onClose={() => setShowMediaViewer(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_15,
    marginBottom: SPACING.space_15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_4,
  },
  userName: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(209, 120, 66, 0.2)',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderRadius: BORDERRADIUS.radius_10,
  },
  verifiedText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginLeft: SPACING.space_8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: SPACING.space_8,
    marginLeft: SPACING.space_4,
  },
  content: {
    marginBottom: SPACING.space_12,
  },
  reviewTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  reviewContent: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    lineHeight: 20,
  },
  expandText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginTop: SPACING.space_4,
  },
  mediaContainer: {
    marginBottom: SPACING.space_12,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: BORDERRADIUS.radius_10,
    marginRight: SPACING.space_8,
    position: 'relative',
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gifOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderRadius: BORDERRADIUS.radius_4,
  },
  gifText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_8,
    color: COLORS.primaryWhiteHex,
  },
  reactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.space_12,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
  },
  reactionText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginLeft: SPACING.space_4,
  },
  reactionTextActive: {
    color: COLORS.primaryOrangeHex,
  },
});

export default ReviewCard; 