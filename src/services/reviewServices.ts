import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {firestore, storage} from '../../firebaseconfig';

// Types for Reviews and Comments
export interface Review {
  id?: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  rating: number; // 1-5 stars
  title: string;
  content: string;
  images?: string[]; // URLs of uploaded images
  videos?: string[]; // URLs of uploaded videos
  gifs?: string[]; // URLs of uploaded GIFs
  likes: string[]; // Array of user IDs who liked this review
  dislikes: string[]; // Array of user IDs who disliked this review
  replies: number; // Count of replies
  verified: boolean; // True if user has purchased this product
  helpful: string[]; // Array of user IDs who found this helpful
  createdAt: any;
  updatedAt: any;
}

export interface Comment {
  id?: string;
  reviewId: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  content: string;
  images?: string[]; // URLs of uploaded images
  videos?: string[]; // URLs of uploaded videos
  gifs?: string[]; // URLs of uploaded GIFs
  likes: string[]; // Array of user IDs who liked this comment
  dislikes: string[]; // Array of user IDs who disliked this comment
  parentCommentId?: string; // For nested replies
  verified: boolean; // True if user has purchased this product
  createdAt: any;
  updatedAt: any;
}

export interface MediaUpload {
  uri: string;
  type: 'image' | 'video' | 'gif';
  fileName: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verifiedReviews: number;
}

// ======================
// REVIEW OPERATIONS
// ======================

export const addReview = async (
  review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'replies'>,
): Promise<string> => {
  try {
    console.log('🔄 Adding review for product:', review.productId);
    
    // Clean the review data by removing undefined values
    const cleanReviewData: any = {
      productId: review.productId,
      userId: review.userId,
      userName: review.userName,
      userEmail: review.userEmail,
      rating: review.rating,
      title: review.title,
      content: review.content,
      verified: review.verified,
      images: review.images || [],
      videos: review.videos || [],
      gifs: review.gifs || [],
      likes: review.likes || [],
      dislikes: review.dislikes || [],
      helpful: review.helpful || [],
      replies: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add userAvatar if it's not undefined
    if (review.userAvatar && review.userAvatar !== undefined) {
      cleanReviewData.userAvatar = review.userAvatar;
    }

    console.log('🧹 Cleaned review data:', cleanReviewData);

    // Determine the product collection (coffees or beans)
    let productCollection = 'products'; // fallback
    try {
      // Check if product exists in coffees collection
      const coffeeDoc = await getDoc(doc(firestore, 'coffees', review.productId));
      if (coffeeDoc.exists()) {
        productCollection = 'coffees';
      } else {
        // Check if product exists in beans collection
        const beanDoc = await getDoc(doc(firestore, 'beans', review.productId));
        if (beanDoc.exists()) {
          productCollection = 'beans';
        }
      }
    } catch (error) {
      console.log('Using fallback collection for product:', review.productId);
    }

    console.log('📁 Using collection:', productCollection);

    // Add to product's reviews subcollection
    const reviewsSubcollection = collection(firestore, productCollection, review.productId, 'reviews');
    const docRef = await addDoc(reviewsSubcollection, cleanReviewData);
    console.log('✅ Review added with ID:', docRef.id);

    // Also add to main reviews collection for easier querying
    try {
      await addDoc(collection(firestore, 'reviews'), cleanReviewData);
      console.log('✅ Review also added to main reviews collection');
    } catch (error) {
      console.log('⚠️ Failed to add to main reviews collection:', error);
    }

    // Update product rating
    await updateProductRating(review.productId);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding review:', error);
    throw error;
  }
};

export const updateReview = async (
  reviewId: string,
  updates: Partial<Review>,
): Promise<void> => {
  try {
    console.log('🔄 Updating review:', reviewId, 'with updates:', updates);
    
    // First try to update in the main reviews collection
    let reviewRef = doc(firestore, 'reviews', reviewId);
    let reviewDoc = await getDoc(reviewRef);
    let productId: string | null = null;
    let found = false;
    
    if (reviewDoc.exists()) {
      productId = reviewDoc.data().productId;
      await updateDoc(reviewRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      found = true;
      console.log('✅ Updated review in main collection, productId:', productId);
    } else {
      console.log('⚠️ Review not found in main collection, searching subcollections...');
      
      // Try to find and update in subcollections
      const collections = ['coffees', 'beans'];
      
      for (const collectionName of collections) {
        try {
          // Get all products in this collection
          const productsSnapshot = await getDocs(collection(firestore, collectionName));
          
          for (const productDoc of productsSnapshot.docs) {
            const reviewSubRef = doc(firestore, collectionName, productDoc.id, 'reviews', reviewId);
            const reviewSubDoc = await getDoc(reviewSubRef);
            
            if (reviewSubDoc.exists()) {
              productId = productDoc.id;
              await updateDoc(reviewSubRef, {
                ...updates,
                updatedAt: serverTimestamp(),
              });
              found = true;
              console.log(`✅ Updated review in ${collectionName}/${productId}/reviews subcollection`);
              break;
            }
          }
          
          if (found) break;
        } catch (error) {
          console.log(`⚠️ Error searching in ${collectionName}:`, error);
        }
      }
      
      if (!found) {
        throw new Error('Review not found in any collection');
      }
    }

    // Also update in main collection if this was found in subcollection
    if (found && !reviewDoc.exists()) {
      try {
        const mainReviewRef = doc(firestore, 'reviews', reviewId);
        const mainReviewDoc = await getDoc(mainReviewRef);
        if (mainReviewDoc.exists()) {
          await updateDoc(mainReviewRef, {
            ...updates,
            updatedAt: serverTimestamp(),
          });
          console.log('✅ Also updated review in main collection');
        }
      } catch (error) {
        console.log('⚠️ Could not update main collection:', error);
      }
    }

    // Update product rating if rating changed
    if (updates.rating !== undefined && productId) {
      console.log('🔄 Updating product rating because rating changed');
      await updateProductRating(productId);
    }
    
    console.log('✅ Review update completed successfully');
  } catch (error) {
    console.error('❌ Error updating review:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    const reviewRef = doc(firestore, 'reviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (reviewDoc.exists()) {
      const productId = reviewDoc.data().productId;
      
      // Delete associated comments
      const commentsQuery = query(
        collection(firestore, 'comments'),
        where('reviewId', '==', reviewId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      const batch = writeBatch(firestore);
      commentsSnapshot.docs.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
      });
      
      // Delete the review
      batch.delete(reviewRef);
      await batch.commit();

      // Update product rating
      await updateProductRating(productId);
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export const fetchProductReviews = async (
  productId: string,
  sortBy: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful' = 'newest',
): Promise<Review[]> => {
  try {
    console.log('🔄 Fetching reviews for product:', productId, 'sortBy:', sortBy);
    
    // Determine the product collection (coffees or beans)
    let productCollection = 'products'; // fallback
    try {
      // Check if product exists in coffees collection
      const coffeeDoc = await getDoc(doc(firestore, 'coffees', productId));
      if (coffeeDoc.exists()) {
        productCollection = 'coffees';
      } else {
        // Check if product exists in beans collection
        const beanDoc = await getDoc(doc(firestore, 'beans', productId));
        if (beanDoc.exists()) {
          productCollection = 'beans';
        }
      }
    } catch (error) {
      console.log('Using fallback collection for product:', productId);
    }

    console.log('📁 Fetching from collection:', productCollection);

    let reviews: Review[] = [];

    // Try to fetch from product's reviews subcollection first
    try {
      const reviewsSubcollection = collection(firestore, productCollection, productId, 'reviews');
      const snapshot = await getDocs(reviewsSubcollection);
      reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];
      console.log(`✅ Found ${reviews.length} reviews in subcollection`);
    } catch (error) {
      console.log('⚠️ Failed to fetch from subcollection, trying main collection');
      
      // Fallback to main reviews collection
      const reviewsQuery = query(
        collection(firestore, 'reviews'),
        where('productId', '==', productId)
      );
      const snapshot = await getDocs(reviewsQuery);
      reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];
      console.log(`✅ Found ${reviews.length} reviews in main collection`);
    }

    // Handle sorting client-side to avoid complex index requirements
    switch (sortBy) {
      case 'newest':
        reviews = reviews.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime();
        });
        break;
      case 'oldest':
        reviews = reviews.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return aTime.getTime() - bTime.getTime();
        });
        break;
      case 'rating_high':
        reviews = reviews.sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime();
        });
        break;
      case 'rating_low':
        reviews = reviews.sort((a, b) => {
          if (a.rating !== b.rating) return a.rating - b.rating;
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime();
        });
        break;
      case 'helpful':
        reviews = reviews.sort((a, b) => (b.helpful?.length || 0) - (a.helpful?.length || 0));
        break;
    }

    return reviews;
  } catch (error) {
    console.error('❌ Error fetching product reviews:', error);
    throw error;
  }
};

export const fetchUserReviews = async (userId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(firestore, 'reviews'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    let reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];

    // Sort by newest first
    reviews = reviews.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    });

    return reviews;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
};

// ======================
// COMMENT OPERATIONS
// ======================

export const addComment = async (
  comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  try {
    console.log('🔄 Adding comment for review:', comment.reviewId);
    
    // Clean the comment data by removing undefined values
    const commentData: any = {
      reviewId: comment.reviewId,
      productId: comment.productId,
      userId: comment.userId,
      userName: comment.userName,
      userEmail: comment.userEmail,
      content: comment.content,
      images: comment.images || [],
      videos: comment.videos || [],
      gifs: comment.gifs || [],
      likes: comment.likes || [],
      dislikes: comment.dislikes || [],
      verified: comment.verified,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add optional fields if they're not undefined
    if (comment.userAvatar && comment.userAvatar !== undefined) {
      commentData.userAvatar = comment.userAvatar;
    }
    if (comment.parentCommentId && comment.parentCommentId !== undefined) {
      commentData.parentCommentId = comment.parentCommentId;
    }

    const docRef = await addDoc(collection(firestore, 'comments'), commentData);
    console.log('✅ Comment added with ID:', docRef.id);

    // Increment reply count for the review - try multiple locations
    try {
      // First try main reviews collection
      const mainReviewRef = doc(firestore, 'reviews', comment.reviewId);
      const mainReviewDoc = await getDoc(mainReviewRef);
      
      if (mainReviewDoc.exists()) {
        await updateDoc(mainReviewRef, {
          replies: increment(1),
        });
        console.log('✅ Updated reply count in main collection');
      } else {
        console.log('⚠️ Review not found in main collection, searching subcollections...');
        
        // Try to find in subcollections
        const collections = ['coffees', 'beans'];
        let found = false;
        
        for (const collectionName of collections) {
          try {
            const productsSnapshot = await getDocs(collection(firestore, collectionName));
            
            for (const productDoc of productsSnapshot.docs) {
              const reviewSubRef = doc(firestore, collectionName, productDoc.id, 'reviews', comment.reviewId);
              const reviewSubDoc = await getDoc(reviewSubRef);
              
              if (reviewSubDoc.exists()) {
                await updateDoc(reviewSubRef, {
                  replies: increment(1),
                });
                found = true;
                console.log(`✅ Updated reply count in ${collectionName}/${productDoc.id}/reviews subcollection`);
                break;
              }
            }
            
            if (found) break;
          } catch (error) {
            console.log(`⚠️ Error searching in ${collectionName}:`, error);
          }
        }
        
        if (!found) {
          console.log('⚠️ Could not find review to update reply count');
        }
      }
    } catch (replyError) {
      console.error('⚠️ Error updating reply count:', replyError);
      // Don't fail the comment addition if reply count update fails
    }

    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    throw error;
  }
};

export const updateComment = async (
  commentId: string,
  updates: Partial<Comment>,
): Promise<void> => {
  try {
    const commentRef = doc(firestore, 'comments', commentId);
    await updateDoc(commentRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const commentRef = doc(firestore, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (commentDoc.exists()) {
      const commentData = commentDoc.data();
      
      // Delete nested replies first
      const repliesQuery = query(
        collection(firestore, 'comments'),
        where('parentCommentId', '==', commentId)
      );
      const repliesSnapshot = await getDocs(repliesQuery);
      
      const batch = writeBatch(firestore);
      repliesSnapshot.docs.forEach(replyDoc => {
        batch.delete(replyDoc.ref);
      });
      
      // Delete the comment
      batch.delete(commentRef);
      await batch.commit();

      // Decrement reply count for the review
      const reviewRef = doc(firestore, 'reviews', commentData.reviewId);
      await updateDoc(reviewRef, {
        replies: increment(-1 - repliesSnapshot.docs.length), // Subtract comment and its replies
      });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const fetchReviewComments = async (reviewId: string): Promise<Comment[]> => {
  try {
    const q = query(
      collection(firestore, 'comments'),
      where('reviewId', '==', reviewId)
    );

    const snapshot = await getDocs(q);
    let comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];

    // Sort by creation time
    comments = comments.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return aTime.getTime() - bTime.getTime();
    });

    return comments;
  } catch (error) {
    console.error('Error fetching review comments:', error);
    throw error;
  }
};

// ======================
// REACTION OPERATIONS
// ======================

export const toggleReviewReaction = async (
  reviewId: string,
  userId: string,
  reaction: 'like' | 'dislike' | 'helpful',
): Promise<void> => {
  try {
    console.log('🔄 Toggling reaction for review:', reviewId, 'user:', userId, 'reaction:', reaction);
    
    // First try to find the review in the main reviews collection
    let reviewRef = doc(firestore, 'reviews', reviewId);
    let reviewDoc = await getDoc(reviewRef);
    let reviewData: Review | null = null;
    let productId: string | null = null;
    
    if (reviewDoc.exists()) {
      reviewData = reviewDoc.data() as Review;
      productId = reviewData.productId;
      console.log('✅ Found review in main collection, productId:', productId);
    } else {
      console.log('⚠️ Review not found in main collection, searching subcollections...');
      
      // Try to find in subcollections by searching all products
      const collections = ['coffees', 'beans'];
      let found = false;
      
      for (const collectionName of collections) {
        try {
          // Get all products in this collection
          const productsSnapshot = await getDocs(collection(firestore, collectionName));
          
          for (const productDoc of productsSnapshot.docs) {
            const reviewSubRef = doc(firestore, collectionName, productDoc.id, 'reviews', reviewId);
            const reviewSubDoc = await getDoc(reviewSubRef);
            
            if (reviewSubDoc.exists()) {
              reviewRef = reviewSubRef;
              reviewData = reviewSubDoc.data() as Review;
              productId = productDoc.id;
              found = true;
              console.log(`✅ Found review in ${collectionName}/${productId}/reviews subcollection`);
              break;
            }
          }
          
          if (found) break;
        } catch (error) {
          console.log(`⚠️ Error searching in ${collectionName}:`, error);
        }
      }
      
      if (!found) {
        throw new Error('Review not found in any collection');
      }
    }

    if (!reviewData) {
      throw new Error('Review data not found');
    }

    const currentReactions = reviewData[reaction === 'helpful' ? 'helpful' : reaction === 'like' ? 'likes' : 'dislikes'] || [];
    
    const updates: any = {};
    
    if (currentReactions.includes(userId)) {
      // Remove reaction
      updates[reaction === 'helpful' ? 'helpful' : reaction === 'like' ? 'likes' : 'dislikes'] = arrayRemove(userId);
      console.log('➖ Removing reaction');
    } else {
      // Add reaction
      updates[reaction === 'helpful' ? 'helpful' : reaction === 'like' ? 'likes' : 'dislikes'] = arrayUnion(userId);
      console.log('➕ Adding reaction');
      
      // Remove opposite reaction if exists
      if (reaction === 'like' && reviewData.dislikes?.includes(userId)) {
        updates.dislikes = arrayRemove(userId);
        console.log('➖ Removing opposite dislike');
      } else if (reaction === 'dislike' && reviewData.likes?.includes(userId)) {
        updates.likes = arrayRemove(userId);
        console.log('➖ Removing opposite like');
      }
    }

    await updateDoc(reviewRef, updates);
    
    // Also update in main collection if this was found in subcollection
    if (productId && reviewRef.path.includes('/reviews/')) {
      try {
        const mainReviewRef = doc(firestore, 'reviews', reviewId);
        const mainReviewDoc = await getDoc(mainReviewRef);
        if (mainReviewDoc.exists()) {
          await updateDoc(mainReviewRef, updates);
          console.log('✅ Also updated reaction in main collection');
        }
      } catch (error) {
        console.log('⚠️ Could not update main collection:', error);
      }
    }
    
    console.log('✅ Reaction updated successfully');
  } catch (error) {
    console.error('❌ Error toggling review reaction:', error);
    throw error;
  }
};

export const toggleCommentReaction = async (
  commentId: string,
  userId: string,
  reaction: 'like' | 'dislike',
): Promise<void> => {
  try {
    const commentRef = doc(firestore, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const commentData = commentDoc.data() as Comment;
    const currentReactions = commentData[reaction === 'like' ? 'likes' : 'dislikes'] || [];
    
    const updates: any = {};
    
    if (currentReactions.includes(userId)) {
      // Remove reaction
      updates[reaction === 'like' ? 'likes' : 'dislikes'] = arrayRemove(userId);
    } else {
      // Add reaction
      updates[reaction === 'like' ? 'likes' : 'dislikes'] = arrayUnion(userId);
      
      // Remove opposite reaction if exists
      if (reaction === 'like' && commentData.dislikes?.includes(userId)) {
        updates.dislikes = arrayRemove(userId);
      } else if (reaction === 'dislike' && commentData.likes?.includes(userId)) {
        updates.likes = arrayRemove(userId);
      }
    }

    await updateDoc(commentRef, updates);
  } catch (error) {
    console.error('Error toggling comment reaction:', error);
    throw error;
  }
};

// ======================
// MEDIA UPLOAD OPERATIONS
// ======================

export const uploadReviewMedia = async (
  reviewId: string,
  media: MediaUpload[],
): Promise<string[]> => {
  try {
    const uploadPromises = media.map(async (item, index) => {
      const response = await fetch(item.uri);
      const blob = await response.blob();
      
      const fileName = `${item.fileName}_${Date.now()}_${index}`;
      const mediaPath = `reviews/${reviewId}/${item.type}s/${fileName}`;
      const mediaRef = ref(storage, mediaPath);
      
      await uploadBytes(mediaRef, blob);
      return await getDownloadURL(mediaRef);
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading review media:', error);
    throw error;
  }
};

export const uploadCommentMedia = async (
  commentId: string,
  media: MediaUpload[],
): Promise<string[]> => {
  try {
    const uploadPromises = media.map(async (item, index) => {
      const response = await fetch(item.uri);
      const blob = await response.blob();
      
      const fileName = `${item.fileName}_${Date.now()}_${index}`;
      const mediaPath = `comments/${commentId}/${item.type}s/${fileName}`;
      const mediaRef = ref(storage, mediaPath);
      
      await uploadBytes(mediaRef, blob);
      return await getDownloadURL(mediaRef);
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading comment media:', error);
    throw error;
  }
};

// ======================
// VERIFICATION AND UTILS
// ======================

export const checkUserPurchaseHistory = async (
  userId: string,
  productId: string,
): Promise<boolean> => {
  try {
    console.log('🔄 Checking purchase history for user:', userId, 'product:', productId);
    
    // Check in main orders collection
    const ordersQuery = query(
      collection(firestore, 'orders'),
      where('userId', '==', userId)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      const items = orderData.items || [];
      
      // Check if any item in the order matches the product
      const hasPurchased = items.some((item: any) => item.id === productId);
      if (hasPurchased) {
        console.log('✅ User has purchased this product');
        return true;
      }
    }

    // Also check user's orders subcollection
    try {
      const userOrdersQuery = query(
        collection(firestore, 'users', userId, 'orders')
      );
      
      const userOrdersSnapshot = await getDocs(userOrdersQuery);
      
      for (const orderDoc of userOrdersSnapshot.docs) {
        const orderData = orderDoc.data();
        const items = orderData.items || [];
        
        const hasPurchased = items.some((item: any) => item.id === productId);
        if (hasPurchased) {
          console.log('✅ User has purchased this product (from subcollection)');
          return true;
        }
      }
    } catch (subError) {
      console.log('⚠️ Could not check user subcollection orders:', subError);
    }

    console.log('❌ User has not purchased this product');
    return false;
  } catch (error) {
    console.error('❌ Error checking user purchase history:', error);
    return false;
  }
};

export const getReviewSummary = async (productId: string): Promise<ReviewSummary> => {
  try {
    console.log('🔄 Getting review summary for product:', productId);
    
    // Use the same logic as fetchProductReviews to get reviews
    const reviews = await fetchProductReviews(productId);
    
    const totalReviews = reviews.length;
    const verifiedReviews = reviews.filter(review => review.verified).length;
    
    if (totalReviews === 0) {
      console.log('📊 No reviews found');
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        verifiedReviews: 0,
      };
    }
    
    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = ratingSum / totalReviews;
    
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });
    
    console.log('📊 Review summary:', { averageRating: averageRating.toFixed(1), totalReviews, verifiedReviews });
    
    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
      ratingDistribution,
      verifiedReviews,
    };
  } catch (error) {
    console.error('❌ Error getting review summary:', error);
    throw error;
  }
};

export const updateProductRating = async (productId: string): Promise<void> => {
  try {
    console.log('🔄 Updating product rating for:', productId);
    
    const summary = await getReviewSummary(productId);
    
    // Update product rating in the main product collections
    const collections = ['products', 'coffees', 'beans'];
    
    for (const collectionName of collections) {
      try {
        const productRef = doc(firestore, collectionName, productId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          await updateDoc(productRef, {
            average_rating: summary.averageRating,
            ratings_count: summary.totalReviews.toString(),
            updatedAt: serverTimestamp(),
          });
          console.log(`✅ Updated rating in ${collectionName} collection`);
          break; // Product found and updated, no need to check other collections
        }
      } catch (error) {
        // Continue to next collection if this one fails
        console.log(`⚠️ Product not found in ${collectionName} collection`);
      }
    }
  } catch (error) {
    console.error('❌ Error updating product rating:', error);
    throw error;
  }
};

export default {
  // Reviews
  addReview,
  updateReview,
  deleteReview,
  fetchProductReviews,
  fetchUserReviews,
  
  // Comments
  addComment,
  updateComment,
  deleteComment,
  fetchReviewComments,
  
  // Reactions
  toggleReviewReaction,
  toggleCommentReaction,
  
  // Media
  uploadReviewMedia,
  uploadCommentMedia,
  
  // Utils
  checkUserPurchaseHistory,
  getReviewSummary,
  updateProductRating,
}; 