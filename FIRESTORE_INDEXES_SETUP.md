# Firestore Indexes Setup for Inventory Management

## Overview
The inventory management system requires specific Firestore indexes to work properly. The error messages you're seeing indicate that composite indexes need to be created.

## Required Indexes

### 1. Stock Alerts Index
**Collection:** `stockAlerts`
**Fields:**
- `isRead` (Ascending)
- `createdAt` (Descending)

### 2. Stock Movements Index
**Collection:** `stockMovements`
**Fields:**
- `productId` (Ascending)
- `createdAt` (Descending)

### 3. Inventory Items Index
**Collection:** `inventory`
**Fields:**
- `status` (Ascending)
- `lastUpdated` (Descending)

## How to Create Indexes

### Option 1: Using Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `thecoffee-b780f`
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Add the indexes listed above

### Option 2: Using Firebase CLI
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy indexes (after creating firestore.indexes.json)
firebase deploy --only firestore:indexes
```

### Option 3: Click the Error Links
When you see the error messages, they contain direct links to create the indexes:
- Click on the URL in the error message
- It will take you directly to the Firebase Console with the index pre-configured
- Click **Create Index**

## Firestore Rules Update
Make sure your Firestore rules allow read/write access to the new collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // Inventory management rules
    match /inventory/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /stockAlerts/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /stockMovements/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Verification
After creating the indexes:
1. Wait 5-10 minutes for indexes to build
2. Restart your React Native app
3. The inventory screen should load without errors

## Troubleshooting
- **Index still building**: Wait a few more minutes
- **Permission denied**: Check Firestore rules
- **Still getting errors**: Clear app cache and restart

## Alternative Solution (Temporary)
If you want to test immediately without waiting for indexes, the code has been updated to use simpler queries that filter results in memory instead of using composite Firestore queries. This may be slightly slower but doesn't require indexes. 