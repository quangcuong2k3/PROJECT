# Review & Comment System Test Guide

## 🧪 Testing the Complete Review System

### Prerequisites
1. ✅ Firebase indexes are set up (run the setup script if needed)
2. ✅ At least 2 user accounts are available for testing
3. ✅ Some orders exist in the database to enable review permissions

### Test Scenarios

## 1. 🔍 Basic Review Display
**Test:** Navigate to any product detail page
- ✅ Should see "Reviews (0)" section
- ✅ Should see review summary card with rating breakdown
- ✅ Should see "Write Review" or "Add Review" button

## 2. ✍️ Adding Reviews
**Test:** Submit a review as a user who has purchased the product

### With Purchase History:
1. Click "Add Review" button
2. ✅ Modal should open successfully  
3. ✅ Rate the product (1-5 stars)
4. ✅ Write review title (optional)
5. ✅ Write review content (required)
6. ✅ Click "Post" button
7. ✅ Review should appear in the list
8. ✅ Should show "Verified" badge

### Without Purchase History:
1. Click "Add Review" button
2. ✅ Should show "Purchase Required" alert

## 3. 👍 Review Reactions
**Test:** React to reviews as different users

### For Review Author:
- ✅ Should see edit/delete buttons on their own reviews
- ✅ Should be able to edit review content
- ✅ Should be able to delete reviews

### Edit Review Testing:
1. Click the edit button (pencil icon) on your own review
2. ✅ Edit Review modal should open
3. ✅ Should see current rating, title, and content pre-filled
4. ✅ Change the rating (click different stars)
5. ✅ Modify the title or content
6. ✅ "Save" button should be enabled when changes are made
7. ✅ Should see "You have unsaved changes" indicator
8. ✅ Click "Save" to update the review
9. ✅ Should see "Review Updated" success message
10. ✅ Updated review should appear in the list with new content
11. ✅ Product rating should update if star rating changed

### For Other Users:
1. Click Like button on a review
2. ✅ Should increment like count
3. ✅ Should change button color to orange
4. ✅ Console should show successful reaction logs
5. Click Dislike button
6. ✅ Should remove like and add dislike
7. ✅ Click "Helpful" button
8. ✅ Should increment helpful count

## 4. 💬 Comments System
**Test:** Add and interact with comments

### Adding Comments:
1. Click "Reply" button on a review
2. ✅ Comment section should expand
3. ✅ Should see "Add Comment" button
4. ✅ Click "Add Comment"
5. ✅ Should show comment input field
6. ✅ Write a comment (min 5 characters)
7. ✅ Click "Post"
8. ✅ Comment should appear in the list
9. ✅ Review reply count should increment

### Comment Interactions:
1. ✅ Like/dislike comments
2. ✅ Reply to comments (nested)
3. ✅ Edit own comments
4. ✅ Delete own comments

## 5. 🔍 Sorting & Filtering
**Test:** Review sorting functionality
1. ✅ Sort by "Newest" - should show recent reviews first
2. ✅ Sort by "Oldest" - should show oldest reviews first  
3. ✅ Sort by "Highest Rating" - should show 5-star reviews first
4. ✅ Sort by "Lowest Rating" - should show 1-star reviews first
5. ✅ Sort by "Most Helpful" - should sort by helpful count

## 6. 📊 Review Summary
**Test:** Review aggregation and statistics
1. ✅ Average rating should update when new reviews are added
2. ✅ Total review count should be accurate
3. ✅ Rating distribution bars should reflect actual data
4. ✅ Verified review count should be accurate

## Expected Console Logs (Success)

### Adding Review:
```
🔄 Adding review for product: C6
🧹 Cleaned review data: {productId: "C6", userId: "...", ...}
📁 Using collection: coffees
✅ Review added with ID: [reviewId]
✅ Review also added to main reviews collection
🔄 Updating product rating for: C6
📊 Review summary: {...}
✅ Updated rating in coffees collection
```

### Editing Review:
```
🔄 Updating review: [reviewId] with updates: {rating: 5, title: "Amazing!", content: "Updated content"}
✅ Updated review in main collection, productId: C6
🔄 Updating product rating because rating changed
🔄 Updating product rating for: C6
✅ Review update completed successfully
```

### Adding Comment:
```
🔄 Adding comment for review: [reviewId]
✅ Comment added with ID: [commentId]
✅ Updated reply count in main collection
```

### Handling Reactions:
```
🔄 Handling reaction: like for review: [reviewId] by user: [userId]
🔄 Toggling reaction for review: [reviewId] user: [userId] reaction: like
✅ Found review in main collection, productId: C6
➕ Adding reaction
✅ Reaction updated successfully
```

## 🚨 Troubleshooting

### "Review not found" Error:
- Check console logs to see which collections are being searched
- Verify review ID is correct
- Run Firebase index setup script if needed

### "Purchase Required" Alert:
- Ensure user has orders in the database with the specific product
- Check both main orders collection and user subcollection

### "Failed to update reaction" Error:
- Check review ID format in console logs
- Verify user authentication is working
- Check Firebase security rules

### Missing Comments:
- Verify comment is being added to correct review ID
- Check if purchase verification is working for comments
- Look for Firebase permission errors

## 🎯 Success Criteria

The review system is working correctly if:
- ✅ Users can add reviews for purchased products
- ✅ Reviews display with correct user information and verification status
- ✅ Reactions (like/dislike/helpful) work for all users
- ✅ Comments can be added, edited, and deleted
- ✅ Nested replies work properly
- ✅ Review summary updates automatically
- ✅ Sorting functions correctly
- ✅ Purchase verification prevents unauthorized reviews/comments

## 📝 Test Results Log

Date: ___________
Tester: ___________

| Feature | Status | Notes |
|---------|--------|--------|
| Review Display | ⭕ | |
| Add Review | ⭕ | |
| Review Reactions | ⭕ | |
| Edit Review | ⭕ | |
| Comments | ⭕ | |
| Sorting | ⭕ | |
| Summary Stats | ⭕ | |

Legend: ✅ Pass | ❌ Fail | ⭕ Not Tested 