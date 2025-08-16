// Simple test runner that can be called from your React Native app
// Import this in your HomeScreen or any component to test the image mapping

import { runAllTests } from './testImageMapping';
import { previewImageUpdates } from './updateFirebaseImages';

/**
 * Run image mapping tests in React Native app
 * Call this function from any component to test the setup
 */
export const testImageSetup = async (): Promise<void> => {
  console.log('🧪 Testing Image Setup in React Native App');
  console.log('===========================================');
  
  try {
    // Test local image mappings
    console.log('\n📝 Testing local image mappings...');
    runAllTests();
    
    // Preview Firebase updates (without actually updating)
    console.log('\n👀 Previewing Firebase updates...');
    await previewImageUpdates();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. If tests pass, run updateAllProductImages() to update Firebase');
    console.log('2. Your app will then automatically use local images');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🛠️ Troubleshooting:');
    console.log('1. Check that image files exist in src/assets/coffee_assets/');
    console.log('2. Verify Firebase connection');
    console.log('3. Check console for specific error details');
  }
};

/**
 * Quick image test - just test if images can be loaded
 */
export const quickImageTest = (): void => {
  console.log('⚡ Quick Image Test');
  console.log('==================');
  
  try {
    const { getLocalImage } = require('./imageMapping');
    
    // Test a few key products
    const testProducts = [
      { name: 'Americano', type: 'coffee' },
      { name: 'Arabica Beans', type: 'bean' },
      { name: 'Unknown Product', type: 'fallback' }
    ];
    
    testProducts.forEach(({ name, type }) => {
      console.log(`\n📝 Testing ${name} (${type}):`);
      try {
        const squareImage = getLocalImage(name, 'square');
        const portraitImage = getLocalImage(name, 'portrait');
        
        console.log(`  ✅ Square: ${squareImage ? 'Found' : 'Missing'}`);
        console.log(`  ✅ Portrait: ${portraitImage ? 'Found' : 'Missing'}`);
      } catch (error) {
        console.log(`  ❌ Error: ${error}`);
      }
    });
    
    console.log('\n✅ Quick test completed!');
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
};

/**
 * Test Firebase integration
 */
export const testFirebaseIntegration = async (): Promise<void> => {
  console.log('🔥 Testing Firebase Integration');
  console.log('==============================');
  
  try {
    const { fetchProducts } = require('../services/firebaseServices');
    
    console.log('📦 Fetching products from Firebase...');
    const products = await fetchProducts();
    
    console.log(`✅ Fetched ${products.length} products`);
    
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log('\n📋 First Product:');
      console.log(`  Name: ${firstProduct.name}`);
      console.log(`  Type: ${firstProduct.type}`);
      console.log(`  Square Image: ${firstProduct.imageUrlSquare ? 'Local require loaded' : 'Missing'}`);
      console.log(`  Portrait Image: ${firstProduct.imageUrlPortrait ? 'Local require loaded' : 'Missing'}`);
      console.log(`  Legacy Square: ${firstProduct.imagelink_square ? 'Local require loaded' : 'Missing'}`);
    }
    
    console.log('\n✅ Firebase integration test completed!');
  } catch (error) {
    console.error('❌ Firebase integration test failed:', error);
  }
};

export default {
  testImageSetup,
  quickImageTest,
  testFirebaseIntegration,
}; 