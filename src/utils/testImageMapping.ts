// Test utility to verify image mapping functionality
// Use this to test if your local images are being mapped correctly

import { getLocalImage, updateProductWithLocalImages } from './imageMapping';

/**
 * Test all product image mappings
 */
export const testAllImageMappings = (): void => {
  console.log('🧪 Testing Image Mappings');
  console.log('========================');
  console.log('');

  // Test coffee products
  const coffeeProducts = [
    'Americano',
    'Black Coffee', 
    'Cappuccino',
    'Espresso',
    'Latte',
    'Macchiato'
  ];

  console.log('☕ Coffee Products:');
  coffeeProducts.forEach(product => {
    console.log(`  📝 ${product}:`);
    try {
      const squareImage = getLocalImage(product, 'square');
      const portraitImage = getLocalImage(product, 'portrait');
      console.log(`    ✅ Square: ${squareImage ? 'Found' : 'Missing'}`);
      console.log(`    ✅ Portrait: ${portraitImage ? 'Found' : 'Missing'}`);
    } catch (error) {
      console.log(`    ❌ Error: ${error}`);
    }
    console.log('');
  });

  // Test bean products
  const beanProducts = [
    'Arabica Beans',
    'Robusta Beans',
    'Liberica Beans',
    'Excelsa Beans'
  ];

  console.log('🫘 Bean Products:');
  beanProducts.forEach(product => {
    console.log(`  📝 ${product}:`);
    try {
      const squareImage = getLocalImage(product, 'square');
      const portraitImage = getLocalImage(product, 'portrait');
      console.log(`    ✅ Square: ${squareImage ? 'Found' : 'Missing'}`);
      console.log(`    ✅ Portrait: ${portraitImage ? 'Found' : 'Missing'}`);
    } catch (error) {
      console.log(`    ❌ Error: ${error}`);
    }
    console.log('');
  });
};

/**
 * Test product update functionality
 */
export const testProductUpdate = (): void => {
  console.log('🔄 Testing Product Update');
  console.log('========================');
  console.log('');

  // Mock Firebase product data
  const mockFirebaseProduct = {
    id: 'C1',
    name: 'Americano',
    description: 'Americano coffee description',
    type: 'Coffee',
    imageUrlSquare: 'https://firebasestorage.googleapis.com/old-url-square.png',
    imageUrlPortrait: 'https://firebasestorage.googleapis.com/old-url-portrait.png',
    prices: [{ size: 'M', price: '2.25', currency: '$' }],
    average_rating: 4.6,
    ratings_count: '6,879',
    favourite: false,
    index: 0
  };

  console.log('📋 Original Firebase Product:');
  console.log(`  Name: ${mockFirebaseProduct.name}`);
  console.log(`  Square URL: ${mockFirebaseProduct.imageUrlSquare}`);
  console.log(`  Portrait URL: ${mockFirebaseProduct.imageUrlPortrait}`);
  console.log('');

  try {
    const updatedProduct = updateProductWithLocalImages(mockFirebaseProduct);
    
    console.log('✨ Updated Product:');
    console.log(`  Name: ${updatedProduct.name}`);
    console.log(`  Square Image: ${updatedProduct.imageUrlSquare ? 'Local require found' : 'Missing'}`);
    console.log(`  Portrait Image: ${updatedProduct.imageUrlPortrait ? 'Local require found' : 'Missing'}`);
    console.log(`  Legacy Square: ${updatedProduct.imagelink_square ? 'Local require found' : 'Missing'}`);
    console.log(`  Legacy Portrait: ${updatedProduct.imagelink_portrait ? 'Local require found' : 'Missing'}`);
    console.log('');
    console.log('✅ Product update test successful!');
  } catch (error) {
    console.log(`❌ Product update test failed: ${error}`);
  }
};

/**
 * Test with various product name variations
 */
export const testProductNameVariations = (): void => {
  console.log('🔍 Testing Product Name Variations');
  console.log('=================================');
  console.log('');

  const testNames = [
    'americano',
    'Americano',
    'AMERICANO',
    'Black Coffee',
    'black coffee',
    'BLACK COFFEE',
    'Cappuccino',
    'cappuccino',
    'Arabica Beans',
    'arabica beans',
    'Robusta',
    'robusta',
    'Unknown Product' // Should fallback
  ];

  testNames.forEach(name => {
    console.log(`  Testing: "${name}"`);
    try {
      const image = getLocalImage(name, 'square');
      console.log(`    ✅ Image found: ${image ? 'Yes' : 'No (using fallback)'}`);
    } catch (error) {
      console.log(`    ❌ Error: ${error}`);
    }
  });
};

/**
 * Run all tests
 */
export const runAllTests = (): void => {
  console.log('🚀 Running All Image Mapping Tests');
  console.log('===================================');
  console.log('');

  testAllImageMappings();
  console.log('\n');
  testProductUpdate();
  console.log('\n');
  testProductNameVariations();
  
  console.log('\n');
  console.log('🎉 All tests completed!');
  console.log('');
  console.log('💡 If you see any missing images:');
  console.log('1. Check that the image files exist in src/assets/coffee_assets/');
  console.log('2. Update the imageMapping.ts file with correct paths');
  console.log('3. Make sure the product names match the mapping keys');
};

export default {
  testAllImageMappings,
  testProductUpdate,
  testProductNameVariations,
  runAllTests,
}; 