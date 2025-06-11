// Firestore Index Setup Script for TheCoffee Review System
// This script helps you create the necessary indexes for the review system

console.log('🔥 Firebase Index Setup for TheCoffee Review System');
console.log('========================================================');
console.log('');

const requiredIndexes = [
  {
    collection: 'reviews',
    description: 'Main reviews collection - for querying reviews by product',
    fields: [
      { field: 'productId', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'reviews',
    description: 'Main reviews collection - for querying reviews by user',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'orders',
    description: 'Orders collection - for purchase verification',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'orderDate', order: 'DESCENDING' }
    ]
  }
];

const manualSteps = () => {
  console.log('📋 MANUAL SETUP STEPS:');
  console.log('');
  console.log('1. Go to Firebase Console:');
  console.log('   https://console.firebase.google.com/project/thecoffee-b780f/firestore/indexes');
  console.log('');
  console.log('2. Click "Create Index" for each of the following:');
  console.log('');

  requiredIndexes.forEach((index, i) => {
    console.log(`   Index ${i + 1}: ${index.description}`);
    console.log(`   Collection ID: ${index.collection}`);
    console.log('   Fields:');
    index.fields.forEach(field => {
      console.log(`     - ${field.field} (${field.order})`);
    });
    console.log('');
  });

  console.log('3. Subcollection Indexes (if using subcollections):');
  console.log('   Collection Group: reviews');
  console.log('   Fields:');
  console.log('     - createdAt (DESCENDING)');
  console.log('');

  console.log('4. Wait for indexes to build (usually 1-2 minutes)');
  console.log('');
  console.log('5. Test your review system!');
  console.log('');
};

const firestoreIndexesJson = () => {
  console.log('📄 FIRESTORE INDEXES JSON:');
  console.log('');
  console.log('If you have Firebase CLI installed, create this firestore.indexes.json file:');
  console.log('');

  const indexesConfig = {
    indexes: requiredIndexes.map(index => ({
      collectionGroup: index.collection,
      queryScope: 'COLLECTION',
      fields: index.fields.map(field => ({
        fieldPath: field.field,
        order: field.order
      }))
    }))
  };

  // Add subcollection index
  indexesConfig.indexes.push({
    collectionGroup: 'reviews',
    queryScope: 'COLLECTION_GROUP',
    fields: [
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  });

  console.log(JSON.stringify(indexesConfig, null, 2));
  console.log('');
  console.log('Then run: firebase deploy --only firestore:indexes');
  console.log('');
};

const troubleshooting = () => {
  console.log('🛠️ TROUBLESHOOTING:');
  console.log('');
  console.log('❌ If you see "The query requires an index" error:');
  console.log('   → Click the URL in the error message to auto-create the index');
  console.log('   → Or manually create the indexes using the steps above');
  console.log('');
  console.log('❌ If reviews are not loading:');
  console.log('   → Check if indexes have finished building');
  console.log('   → Verify your internet connection');
  console.log('   → Check Firebase Console for any errors');
  console.log('');
  console.log('❌ If review submission still fails with undefined values:');
  console.log('   → Check that all required fields are provided');
  console.log('   → Verify user authentication is working');
  console.log('   → Look for JavaScript errors in console');
  console.log('');
  console.log('✅ Success indicators:');
  console.log('   → Reviews appear in Firebase Console under the subcollections');
  console.log('   → No console errors when loading product details');
  console.log('   → Review submission shows success message');
  console.log('');
};

const databaseStructureCheck = () => {
  console.log('🗂️ DATABASE STRUCTURE CHECK:');
  console.log('');
  console.log('Your database should have this structure:');
  console.log('');
  console.log('coffees/');
  console.log('  C1/');
  console.log('    reviews/ (subcollection)');
  console.log('      {reviewId}/');
  console.log('  C2/');
  console.log('    reviews/ (subcollection)');
  console.log('      {reviewId}/');
  console.log('  ...');
  console.log('');
  console.log('beans/');
  console.log('  B1/');
  console.log('    reviews/ (subcollection)');
  console.log('      {reviewId}/');
  console.log('  B2/');
  console.log('    reviews/ (subcollection)');
  console.log('      {reviewId}/');
  console.log('  ...');
  console.log('');
  console.log('reviews/ (main collection for easier querying)');
  console.log('  {reviewId}/');
  console.log('  ...');
  console.log('');
  console.log('orders/');
  console.log('  {orderId}/');
  console.log('  ...');
  console.log('');
};

// Run all functions
manualSteps();
firestoreIndexesJson();
databaseStructureCheck();
troubleshooting();

console.log('🎉 Setup complete! Follow the steps above to enable the review system.');
console.log('');

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    requiredIndexes,
    manualSteps,
    firestoreIndexesJson,
    troubleshooting,
    databaseStructureCheck
  };
} 