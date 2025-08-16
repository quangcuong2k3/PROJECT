// Firestore Index Setup Script for TheCoffee Review System
// This script helps you create the necessary indexes for the review system

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json'); // You'll need to add your service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'thecoffee-b780f'
});

const db = admin.firestore();

async function setupIndexes() {
  console.log('🔧 Setting up Firestore indexes...');
  
  try {
    // Read the index configuration
    const indexConfig = JSON.parse(fs.readFileSync('./firestore.indexes.json', 'utf8'));
    
    console.log('📋 Index configuration loaded:');
    console.log(JSON.stringify(indexConfig, null, 2));
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('1. Firestore indexes must be created through the Firebase Console or Firebase CLI');
    console.log('2. The required index for orders collection:');
    console.log('   - Collection: orders');
    console.log('   - Fields: userId (Ascending), orderDate (Descending)');
    console.log('   - Query scope: Collection');
    
    console.log('\n🔗 You can create the index using one of these methods:');
    console.log('\n📱 Method 1 - Firebase Console:');
    console.log('   Visit: https://console.firebase.google.com/project/thecoffee-b780f/firestore/indexes');
    console.log('   Click "Create Index" and add the fields mentioned above');
    
    console.log('\n💻 Method 2 - Firebase CLI:');
    console.log('   Run: firebase deploy --only firestore:indexes');
    
    console.log('\n🔗 Method 3 - Direct link from error:');
    console.log('   Use the link from the error message to create the index directly');
    
    console.log('\n✅ After creating the index, your order history should load properly!');
    
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
  }
}

// Also provide a function to test the connection
async function testConnection() {
  try {
    console.log('🔍 Testing Firestore connection...');
    const testDoc = await db.collection('test').limit(1).get();
    console.log('✅ Firestore connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Firebase Setup Utility');
  console.log('========================\n');
  
  const isConnected = await testConnection();
  if (isConnected) {
    await setupIndexes();
  } else {
    console.log('\n📝 To fix connection issues:');
    console.log('1. Make sure you have firebase-service-account.json in your project root');
    console.log('2. Download it from Firebase Console > Project Settings > Service Accounts');
    console.log('3. Generate a new private key and save as firebase-service-account.json');
  }
}

if (require.main === module) {
  main().then(() => {
    console.log('\n🏁 Setup complete!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupIndexes, testConnection }; 