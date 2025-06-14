
This document provides a comprehensive guide for the newly implemented product review and comment system in the Coffee app.

## Overview

The review system allows users to:
- **View reviews and ratings** for any product (all users)
- **Add reviews and comments** only if they have purchased the product
- **React to reviews** with likes, dislikes, and helpful votes
- **Reply to reviews** with threaded comments
- **Upload media** (images, videos, GIFs) with reviews and comments
- **Edit and delete** their own reviews and comments
- **View review analytics** with rating distributions and verified purchases

## System Architecture

### Core Services

#### `reviewServices.ts`
The main service file handling all review and comment operations:

- **Review Operations**: Add, update, delete, fetch reviews
- **Comment Operations**: Add, update, delete, fetch comments  
- **Reaction Operations**: Like/dislike reviews and comments, mark helpful
- **Media Operations**: Upload images, videos, GIFs
- **Verification**: Check user purchase history
- **Analytics**: Generate review summaries and rating distributions

#### Key Features:
- **Purchase Verification**: Users must have purchased a product to review it
- **Automatic Rating Updates**: Product ratings update automatically when reviews are added/removed
- **Media Support**: Full support for images, videos, and GIFs in reviews/comments
- **Threaded Comments**: Support for nested replies to comments
- **Reaction System**: Facebook-like reactions (like, dislike, helpful)

### React Components

#### `ReviewSection.tsx`
Main container component that integrates into product detail pages.

**Features:**
- Review summary with average rating and distribution
- Sort options (newest, oldest, rating, helpful)
- Add review functionality with purchase verification
- List of all reviews with pagination support

#### `ReviewSummaryCard.tsx`
Displays overall product rating analytics.

**Features:**
- Large average rating display with stars
- Rating distribution bars (5-star breakdown)
- Verified purchase count
- Call-to-action for writing reviews

#### `ReviewCard.tsx`
Individual review display component.

**Features:**
- User information with verified badge
- Star rating and review content
- Media gallery (images, videos, GIFs)
- Reaction buttons (like, dislike, helpful, reply)
- Edit/delete options for own reviews
- Expandable content for long reviews
- Comment section integration

#### `AddReviewModal.tsx`
Modal for creating new reviews.

**Features:**
- Interactive star rating selector
- Title and content text inputs
- Character limits and validation
- Purchase history verification
- Review guidelines display
- Form validation and submission

### Database Structure

#### Reviews Collection (`reviews`)
```typescript
{
  id: string,
  productId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userAvatar?: string,
  rating: number, // 1-5
  title: string,
  content: string,
  images?: string[], // URLs
  videos?: string[], // URLs  
  gifs?: string[], // URLs
  likes: string[], // User IDs
  dislikes: string[], // User IDs
  helpful: string[], // User IDs
  replies: number, // Count
  verified: boolean, // Has purchased
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Comments Collection (`comments`)
```typescript
{
  id: string,
  reviewId: string,
  productId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userAvatar?: string,
  content: string,
  images?: string[], // URLs
  videos?: string[], // URLs
  gifs?: string[], // URLs
  likes: string[], // User IDs
  dislikes: string[], // User IDs
  parentCommentId?: string, // For nested replies
  verified: boolean, // Has purchased
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Implementation Guide

### 1. Integration with DetailsScreen

The review system is integrated into the product details page:

```typescript
// In DetailsScreen.tsx
import ReviewSection from '../components/ReviewSection';

// Add within the ScrollView, after product details
<ReviewSection
  productId={ItemOfIndex.id}
  productName={ItemOfIndex.name}
/>
```

### 2. Purchase Verification Logic

The system checks if a user has purchased a product before allowing reviews:

```typescript
const checkUserPurchaseHistory = async (userId: string, productId: string) => {
  // Checks main orders collection
  // Also checks user's orders subcollection
  // Returns true if user has purchased the product
};
```

### 3. Security Features

#### Data Validation
- All user inputs are validated and sanitized
- Character limits enforced on titles and content
- Media uploads are validated for type and size

#### User Authentication
- Users must be logged in to add reviews/comments
- Only verified purchasers can leave reviews
- Users can only edit/delete their own content

#### Privacy Protection
- User emails are stored but not displayed publicly
- Profile images are optional
- Users can remain anonymous if desired

### 4. Rating System

#### Automatic Updates
When reviews are added, updated, or deleted:
1. Review summary is recalculated
2. Product's average rating is updated
3. Rating distribution is refreshed
4. Changes propagate to all product displays

#### Rating Distribution
- 5-star breakdown with percentages
- Visual progress bars showing distribution
- Verified vs. unverified review counts

### 5. Media Handling

#### Supported Formats
- **Images**: JPG, PNG, WebP
- **Videos**: MP4, WebM, MOV
- **GIFs**: GIF, animated WebP

#### Upload Process
- Media uploaded to Firebase Storage
- URLs stored in review/comment documents
- Automatic thumbnail generation for videos
- Compression and optimization applied

## User Experience Flow

### For Non-Purchasers
1. View product details
2. See reviews and ratings (read-only)
3. Attempt to add review → Show "Purchase Required" message
4. Can still read all reviews and see ratings

### For Verified Purchasers
1. View product details
2. See reviews with option to add their own
3. Write review with rating, title, and content
4. Optionally add media (images, videos, GIFs)
5. Submit review → Appears immediately with "Verified" badge
6. Can react to other reviews (like, dislike, helpful)
7. Can reply to reviews with comments
8. Can edit or delete their own content

### Review Interaction Flow
1. **View Reviews**: Sort by newest, oldest, rating, or helpfulness
2. **Expand Reviews**: Click to see full content and comments
3. **React**: Like, dislike, or mark helpful (login required)
4. **Comment**: Reply to reviews with text and media
5. **Nested Replies**: Reply to specific comments in threads

## Technical Considerations

### Performance Optimization
- Pagination for large review lists
- Lazy loading of media content
- Optimistic UI updates for reactions
- Caching of review summaries

### Scalability
- Indexed queries for efficient filtering/sorting
- Batch operations for bulk updates
- CDN delivery for media content
- Background processing for rating calculations

### Error Handling
- Graceful fallbacks for network issues
- Retry mechanisms for failed uploads
- User-friendly error messages
- Offline support for viewing cached reviews

## Future Enhancements

### Phase 2 Features
- **Advanced Moderation**: Automated content filtering and reporting
- **Review Analytics**: Detailed insights for business owners
- **Social Features**: Follow users, review notifications
- **AI Integration**: Review sentiment analysis, auto-tagging

### Phase 3 Features
- **Review Rewards**: Points/badges for helpful reviews
- **Video Reviews**: Full video review support
- **Live Q&A**: Real-time product questions/answers
- **Review Syndication**: Share reviews across platforms

## API Reference

### Core Methods

```typescript
// Reviews
reviewServices.addReview(reviewData)
reviewServices.updateReview(reviewId, updates)
reviewServices.deleteReview(reviewId)
reviewServices.fetchProductReviews(productId, sortBy)

// Comments  
reviewServices.addComment(commentData)
reviewServices.updateComment(commentId, updates)
reviewServices.deleteComment(commentId)
reviewServices.fetchReviewComments(reviewId)

// Reactions
reviewServices.toggleReviewReaction(reviewId, userId, reaction)
reviewServices.toggleCommentReaction(commentId, userId, reaction)

// Utilities
reviewServices.checkUserPurchaseHistory(userId, productId)
reviewServices.getReviewSummary(productId)
reviewServices.uploadReviewMedia(reviewId, mediaFiles)
```

## Troubleshooting

### Common Issues

#### Reviews Not Showing
- Check Firebase security rules
- Verify product ID matches
- Ensure network connectivity

#### Cannot Add Review
- Confirm user is authenticated
- Verify purchase history exists
- Check form validation errors

#### Media Upload Fails
- Check file size limits
- Verify supported formats
- Ensure storage permissions

### Debug Tools
- Review service logs in console
- Firebase console for data verification
- Network tab for API call monitoring

## Conclusion

This review system provides a comprehensive, secure, and user-friendly way for customers to share their experiences with products. The purchase verification ensures review authenticity, while the rich media support and social features encourage detailed, helpful feedback.

The modular architecture makes it easy to extend and customize for specific business needs, while the Firebase backend ensures reliable, scalable performance. 