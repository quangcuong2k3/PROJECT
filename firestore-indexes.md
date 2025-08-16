# Firestore Indexes and Security Rules for Review System

## Required Firestore Indexes

Due to the compound queries used in the review system, you need to create the following indexes in the Firebase Console:

### 1. Reviews Collection Indexes

Go to [Firebase Console > Firestore > Indexes](https://console.firebase.google.com/project/thecoffee-b780f/firestore/indexes) and create these composite indexes:

#### Index 1: Reviews by Product ID and Creation Date
- **Collection ID**: `reviews`
- **Fields**:
  - `productId` (Ascending)
  - `createdAt` (Descending)

#### Index 2: Reviews by User ID and Creation Date
- **Collection ID**: `reviews`
- **Fields**:
  - `userId` (Ascending)
  - `createdAt` (Descending)

### 2. Comments Collection Indexes

#### Index 3: Comments by Review ID and Creation Date
- **Collection ID**: `comments`
- **Fields**:
  - `reviewId` (Ascending)
  - `createdAt` (Ascending)

#### Index 4: Comments by Parent Comment ID
- **Collection ID**: `comments`
- **Fields**:
  - `parentCommentId` (Ascending)
  - `createdAt` (Ascending)

### 3. Orders Collection Indexes (for purchase verification)

#### Index 5: Orders by User ID
- **Collection ID**: `orders`
- **Fields**:
  - `userId` (Ascending)
  - `orderDate` (Descending)

## Firestore Security Rules

Add these rules to your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow reading user orders subcollection for purchase verification
      match /orders/{orderId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Products are readable by all, writable by admins only
    match /products/{productId} {
      allow read: if true;
      allow write: if false; // Only through admin functions
    }
    
    // Coffees are readable by all, writable by admins only
    match /coffees/{coffeeId} {
      allow read: if true;
      allow write: if false; // Only through admin functions
    }
    
    // Beans are readable by all, writable by admins only
    match /beans/{beanId} {
      allow read: if true;
      allow write: if false; // Only through admin functions
    }
    
    // Reviews are readable by all
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && validateReviewData();
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && validateReviewData();
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      function validateReviewData() {
        return request.resource.data.keys().hasAll(['productId', 'userId', 'userName', 'userEmail', 'rating', 'content', 'verified'])
          && request.resource.data.rating is int
          && request.resource.data.rating >= 1
          && request.resource.data.rating <= 5
          && request.resource.data.content is string
          && request.resource.data.content.size() >= 10
          && request.resource.data.content.size() <= 1000;
      }
    }
    
    // Comments are readable by all
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && validateCommentData();
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && validateCommentData();
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      function validateCommentData() {
        return request.resource.data.keys().hasAll(['reviewId', 'productId', 'userId', 'userName', 'userEmail', 'content'])
          && request.resource.data.content is string
          && request.resource.data.content.size() >= 1
          && request.resource.data.content.size() <= 500;
      }
    }
    
    // Orders are readable by the user who created them
    match /orders/{orderId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update: if false; // Orders should not be updated after creation
      allow delete: if false; // Orders should not be deleted
    }
  }
}
```

## Quick Setup Commands

If the Firebase CLI is installed, you can create the indexes using this command:

```bash
# Create firestore.indexes.json file
cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "productId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "comments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "reviewId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "comments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "parentCommentId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "orderDate", "order": "DESCENDING" }
      ]
    }
  ]
}
EOF

# Deploy indexes
firebase deploy --only firestore:indexes
```

## Manual Setup Instructions

1. **Go to Firebase Console**: https://console.firebase.google.com/project/thecoffee-b780f/firestore/indexes

2. **Click "Create Index"** and add each index listed above

3. **Update Security Rules**: Go to the Rules tab and update with the rules provided above

4. **Test the Setup**: Try creating a review to verify everything works

## Collection Structure

The review system uses this collection structure:

```
firestore/
├── reviews/               # Main reviews collection
│   ├── {reviewId}/       # Individual review documents
│   └── ...
├── comments/             # Main comments collection  
│   ├── {commentId}/      # Individual comment documents
│   └── ...
├── orders/               # Orders for purchase verification
│   ├── {orderId}/        # Individual order documents
│   └── ...
├── users/                # User profiles
│   ├── {userId}/         # User document
│   │   └── orders/       # User's orders subcollection
│   └── ...
├── coffees/              # Coffee products
└── beans/                # Bean products
```

## Troubleshooting

If you see index-related errors:

1. Check the error message for the exact index URL
2. Click the provided URL to auto-create the index
3. Wait 1-2 minutes for the index to build
4. Retry the operation

Common index errors:
- `The query requires an index` - Missing composite index
- `PERMISSION_DENIED` - Check security rules
- `NOT_FOUND` - Collection doesn't exist yet (will be created on first write) 