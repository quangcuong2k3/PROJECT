import { getFirebaseImageUrl } from '../services/firebaseServices';

/**
 * Test Firebase Images
 * This utility helps you test if Firebase images are working correctly
 */

export const testFirebaseImages = () => {
  console.log('🧪 Testing Firebase Image URLs...\n');
  
  // Test Coffee products
  const coffeeProducts = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
  console.log('☕ Coffee Products:');
  coffeeProducts.forEach(productId => {
    const squareUrl = getFirebaseImageUrl(productId, 'square');
    const portraitUrl = getFirebaseImageUrl(productId, 'portrait');
    console.log(`${productId}:`);
    console.log(`  Square: ${squareUrl}`);
    console.log(`  Portrait: ${portraitUrl}`);
    console.log('');
  });
  
  // Test Bean products
  const beanProducts = ['B1', 'B2', 'B3', 'B4'];
  console.log('🫘 Bean Products:');
  beanProducts.forEach(productId => {
    const squareUrl = getFirebaseImageUrl(productId, 'square');
    const portraitUrl = getFirebaseImageUrl(productId, 'portrait');
    console.log(`${productId}:`);
    console.log(`  Square: ${squareUrl}`);
    console.log(`  Portrait: ${portraitUrl}`);
    console.log('');
  });
};

/**
 * Validate that all Firebase image URLs are accessible
 */
export const validateFirebaseImages = async () => {
  console.log('🔍 Validating Firebase Image accessibility...\n');
  
  const allProducts = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'B1', 'B2', 'B3', 'B4'];
  const imageTypes: ('square' | 'portrait')[] = ['square', 'portrait'];
  
  let successCount = 0;
  let totalCount = 0;
  
  for (const productId of allProducts) {
    for (const imageType of imageTypes) {
      totalCount++;
      const imageUrl = getFirebaseImageUrl(productId, imageType);
      
      if (imageUrl) {
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`✅ ${productId} ${imageType}: Accessible`);
            successCount++;
          } else {
            console.log(`❌ ${productId} ${imageType}: HTTP ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ ${productId} ${imageType}: Network error`);
        }
      } else {
        console.log(`❌ ${productId} ${imageType}: No URL generated`);
      }
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${totalCount} images are accessible`);
  return { successCount, totalCount, successRate: (successCount / totalCount) * 100 };
};

export default {
  testFirebaseImages,
  validateFirebaseImages
};
