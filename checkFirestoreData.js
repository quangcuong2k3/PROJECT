const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://thecoffee-b780f-default-rtdb.firebaseio.com/',
  storageBucket: 'thecoffee-b780f.appspot.com',
});

const db = admin.firestore();

async function checkAllData() {
  console.log('🔍 Checking all Firestore data...\n');

  try {
    // Check products collection
    console.log('📦 Products collection:');
    const productsSnapshot = await db.collection('products').get();
    console.log(`Found ${productsSnapshot.size} documents`);
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.name} (${data.type})`);
    });

    // Check coffees collection
    console.log('\n☕ Coffees collection:');
    const coffeesSnapshot = await db.collection('coffees').get();
    console.log(`Found ${coffeesSnapshot.size} documents`);
    coffeesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.name} (${data.type})`);
    });

    // Check beans collection
    console.log('\n🫘 Beans collection:');
    const beansSnapshot = await db.collection('beans').get();
    console.log(`Found ${beansSnapshot.size} documents`);
    beansSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.name} (${data.type})`);
    });
  } catch (error) {
    console.error('❌ Error checking data:', error);
  }

  console.log('\n✅ Data check complete!');
  process.exit(0);
}

checkAllData();
