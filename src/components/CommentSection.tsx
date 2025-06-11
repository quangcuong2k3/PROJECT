import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
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
import reviewServices, {Comment} from '../services/reviewServices';

interface CommentSectionProps {
  reviewId: string;
  productId: string;
  currentUserId?: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  reviewId,
  productId,
  currentUserId,
}) => {
  const {user, userProfile} = useStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [reviewId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const fetchedComments = await reviewServices.fetchReviewComments(reviewId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserPurchasePermission = async (): Promise<boolean> => {
    if (!user?.uid) return false;
    
    try {
      const hasPurchased = await reviewServices.checkUserPurchaseHistory(user.uid, productId);
      return hasPurchased;
    } catch (error) {
      console.error('Error checking purchase permission:', error);
      return false;
    }
  };

  const handleAddComment = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to comment');
      return;
    }

    if (newComment.trim().length < 5) {
      Alert.alert('Error', 'Comment must be at least 5 characters long');
      return;
    }

    const hasPurchased = await checkUserPurchasePermission();
    if (!hasPurchased) {
      Alert.alert(
        'Purchase Required',
        'You need to purchase this product before you can comment.',
        [{text: 'OK'}]
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      const commentData = {
        reviewId,
        productId,
        userId: user.uid,
        userName: userProfile?.displayName || `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Anonymous',
        userEmail: user.email || '',
        userAvatar: userProfile?.profileImageUrl,
        content: newComment.trim(),
        images: [],
        videos: [],
        gifs: [],
        likes: [],
        dislikes: [],
        verified: hasPurchased,
        parentCommentId: replyingToId || undefined,
      };

      await reviewServices.addComment(commentData);
      setNewComment('');
      setShowAddComment(false);
      setReplyingToId(null);
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (editingContent.trim().length < 5) {
      Alert.alert('Error', 'Comment must be at least 5 characters long');
      return;
    }

    try {
      await reviewServices.updateComment(commentId, {
        content: editingContent.trim(),
      });
      setEditingCommentId(null);
      setEditingContent('');
      loadComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', 'Failed to update comment');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reviewServices.deleteComment(commentId);
              loadComments();
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handleReaction = async (commentId: string, reaction: 'like' | 'dislike') => {
    if (!currentUserId) return;

    try {
      await reviewServices.toggleCommentReaction(commentId, currentUserId, reaction);
      loadComments();
    } catch (error) {
      console.error('Error handling comment reaction:', error);
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwnComment = currentUserId === comment.userId;
    const isEditing = editingCommentId === comment.id;
    const isLiked = comment.likes?.includes(currentUserId || '') || false;
    const isDisliked = comment.dislikes?.includes(currentUserId || '') || false;

    const formatDate = (timestamp: any) => {
      if (!timestamp) return '';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <View key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentUserInfo}>
            <View style={styles.commentAvatar}>
              {comment.userAvatar ? (
                <Image source={{uri: comment.userAvatar}} style={styles.commentAvatarImage} />
              ) : (
                <CustomIcon
                  name="person"
                  size={FONTSIZE.size_16}
                  color={COLORS.primaryLightGreyHex}
                />
              )}
            </View>
            <View style={styles.commentUserDetails}>
              <View style={styles.commentNameContainer}>
                <Text style={styles.commentUserName}>{comment.userName}</Text>
                {comment.verified && (
                  <View style={styles.commentVerifiedBadge}>
                    <CustomIcon
                      name="checkmark-circle"
                      size={FONTSIZE.size_10}
                      color={COLORS.primaryOrangeHex}
                    />
                  </View>
                )}
              </View>
              <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
            </View>
          </View>
          
          {isOwnComment && (
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.commentActionButton}
                onPress={() => {
                  setEditingCommentId(comment.id || null);
                  setEditingContent(comment.content);
                }}>
                <CustomIcon
                  name="create"
                  size={FONTSIZE.size_12}
                  color={COLORS.primaryLightGreyHex}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commentActionButton}
                onPress={() => handleDeleteComment(comment.id || '')}>
                <CustomIcon
                  name="trash"
                  size={FONTSIZE.size_12}
                  color={COLORS.primaryRedHex}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editingContent}
              onChangeText={setEditingContent}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder="Edit your comment..."
              placeholderTextColor={COLORS.primaryLightGreyHex}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => {
                  setEditingCommentId(null);
                  setEditingContent('');
                }}>
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSaveButton}
                onPress={() => handleUpdateComment(comment.id || '')}>
                <Text style={styles.editSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.commentContent}>{comment.content}</Text>
            
            <View style={styles.commentReactions}>
              <TouchableOpacity
                style={[styles.commentReactionButton, isLiked && styles.commentReactionActive]}
                onPress={() => handleReaction(comment.id || '', 'like')}
                disabled={!currentUserId}>
                <CustomIcon
                  name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={FONTSIZE.size_12}
                  color={isLiked ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
                />
                <Text style={[styles.commentReactionText, isLiked && styles.commentReactionTextActive]}>
                  {comment.likes?.length || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.commentReactionButton, isDisliked && styles.commentReactionActive]}
                onPress={() => handleReaction(comment.id || '', 'dislike')}
                disabled={!currentUserId}>
                <CustomIcon
                  name={isDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={FONTSIZE.size_12}
                  color={isDisliked ? COLORS.primaryRedHex : COLORS.primaryLightGreyHex}
                />
                <Text style={[styles.commentReactionText, isDisliked && styles.commentReactionTextActive]}>
                  {comment.dislikes?.length || 0}
                </Text>
              </TouchableOpacity>

              {!isReply && (
                <TouchableOpacity
                  style={styles.commentReactionButton}
                  onPress={() => {
                    setReplyingToId(comment.id || null);
                    setShowAddComment(true);
                  }}
                  disabled={!currentUserId}>
                  <CustomIcon
                    name="chatbubble-outline"
                    size={FONTSIZE.size_12}
                    color={COLORS.primaryLightGreyHex}
                  />
                  <Text style={styles.commentReactionText}>Reply</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Render replies */}
        {!isReply && comments
          .filter(reply => reply.parentCommentId === comment.id)
          .map(reply => renderComment(reply, true))}
      </View>
    );
  };

  // Filter top-level comments (not replies)
  const topLevelComments = comments.filter(comment => !comment.parentCommentId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Comments ({comments.length})
        </Text>
        {user && (
          <TouchableOpacity
            style={styles.addCommentButton}
            onPress={() => {
              setReplyingToId(null);
              setShowAddComment(!showAddComment);
            }}>
            <CustomIcon
              name="add"
              size={FONTSIZE.size_14}
              color={COLORS.primaryOrangeHex}
            />
            <Text style={styles.addCommentButtonText}>Add Comment</Text>
          </TouchableOpacity>
        )}
      </View>

      {showAddComment && (
        <View style={styles.addCommentContainer}>
          {replyingToId && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                Replying to comment...
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReplyingToId(null);
                  setShowAddComment(false);
                }}>
                <CustomIcon
                  name="close"
                  size={FONTSIZE.size_12}
                  color={COLORS.primaryLightGreyHex}
                />
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder={replyingToId ? "Write a reply..." : "Write a comment..."}
            placeholderTextColor={COLORS.primaryLightGreyHex}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={styles.commentInputActions}>
            <Text style={styles.characterCount}>{newComment.length}/500</Text>
            <View style={styles.commentInputButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddComment(false);
                  setNewComment('');
                  setReplyingToId(null);
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.postButton,
                  (newComment.trim().length < 5 || isSubmitting) && styles.postButtonDisabled,
                ]}
                onPress={handleAddComment}
                disabled={newComment.trim().length < 5 || isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : (
        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {topLevelComments.length > 0 ? (
            topLevelComments.map(comment => renderComment(comment))
          ) : (
            <View style={styles.noCommentsContainer}>
              <Text style={styles.noCommentsText}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryBlackHex,
    paddingTop: SPACING.space_15,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_15,
    marginBottom: SPACING.space_15,
  },
  headerTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  addCommentButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_4,
  },
  addCommentContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    margin: SPACING.space_15,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
    paddingBottom: SPACING.space_8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  replyingToText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    fontStyle: 'italic',
  },
  commentInput: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_10,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    minHeight: 80,
  },
  commentInputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.space_8,
  },
  characterCount: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  commentInputButtons: {
    flexDirection: 'row',
    gap: SPACING.space_8,
  },
  cancelButton: {
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
  },
  cancelButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  postButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    minWidth: 50,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  postButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.space_20,
  },
  loadingText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginLeft: SPACING.space_8,
  },
  commentsList: {
    maxHeight: 400,
    paddingHorizontal: SPACING.space_15,
  },
  noCommentsContainer: {
    alignItems: 'center',
    padding: SPACING.space_20,
  },
  noCommentsText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  commentContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    marginBottom: SPACING.space_10,
  },
  replyContainer: {
    marginLeft: SPACING.space_20,
    backgroundColor: COLORS.primaryBlackHex,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primaryOrangeHex,
    paddingLeft: SPACING.space_12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_8,
  },
  commentAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_2,
  },
  commentUserName: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_4,
  },
  commentVerifiedBadge: {
    backgroundColor: 'rgba(209, 120, 66, 0.2)',
    padding: SPACING.space_2,
    borderRadius: BORDERRADIUS.radius_4,
  },
  commentDate: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentActionButton: {
    padding: SPACING.space_4,
    marginLeft: SPACING.space_4,
  },
  commentContent: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    lineHeight: 16,
    marginBottom: SPACING.space_8,
  },
  commentReactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentReactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_8,
    marginRight: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_8,
  },
  commentReactionActive: {
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
  },
  commentReactionText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
    marginLeft: SPACING.space_4,
  },
  commentReactionTextActive: {
    color: COLORS.primaryOrangeHex,
  },
  editContainer: {
    marginTop: SPACING.space_8,
  },
  editInput: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_10,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.space_8,
    gap: SPACING.space_8,
  },
  editCancelButton: {
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_4,
  },
  editCancelText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  editSaveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
  },
  editSaveText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
});

export default CommentSection; 