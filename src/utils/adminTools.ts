// Admin tools for testing and updating Firebase images
// Import this in any component to run admin functions

import { testFirebaseIntegration, quickImageTest } from './runImageTests';
import { updateAllProductImages, previewImageUpdates } from './updateFirebaseImages';
import { Alert } from 'react-native';

/**
 * Test all image mappings and Firebase integration
 */
export const runCompleteImageTest = async (): Promise<void> => {
  try {
    console.log('🚀 Running Complete Image Test');
    console.log('==============================');
    
    // Test local image mappings
    console.log('\n1️⃣ Testing local image mappings...');
    quickImageTest();
    
    // Test Firebase integration
    console.log('\n2️⃣ Testing Firebase integration...');
    await testFirebaseIntegration();
    
    console.log('\n✅ Complete image test finished! Check console for details.');
    
    Alert.alert(
      'Image Test Complete',
      'All tests completed. Check the console for detailed results.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('❌ Complete image test failed:', error);
    Alert.alert(
      'Test Failed',
      `Image test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Preview Firebase image updates without applying them
 */
export const previewFirebaseUpdates = async (): Promise<void> => {
  try {
    console.log('👀 Previewing Firebase Updates');
    console.log('==============================');
    
    await previewImageUpdates();
    
    Alert.alert(
      'Preview Complete',
      'Preview completed. Check console to see what changes would be made to Firebase.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('❌ Preview failed:', error);
    Alert.alert(
      'Preview Failed',
      `Could not preview updates: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Update all Firebase products with local image paths
 */
export const updateFirebaseImages = async (): Promise<void> => {
  try {
    // First show preview
    Alert.alert(
      'Update Firebase Images',
      'This will update ALL products in Firebase with local image paths. Do you want to preview the changes first?',
      [
        {
          text: 'Preview First',
          onPress: async () => {
            await previewFirebaseUpdates();
            
            // Ask if they want to proceed after preview
            setTimeout(() => {
              Alert.alert(
                'Proceed with Update?',
                'After reviewing the preview, do you want to proceed with updating Firebase?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Update Firebase',
                    style: 'destructive',
                    onPress: async () => {
                      await performFirebaseUpdate();
                    },
                  },
                ]
              );
            }, 1000);
          },
        },
        {
          text: 'Update Now',
          style: 'destructive',
          onPress: async () => {
            await performFirebaseUpdate();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  } catch (error) {
    console.error('❌ Update failed:', error);
    Alert.alert(
      'Update Failed',
      `Could not update Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Internal function to perform the actual Firebase update
 */
const performFirebaseUpdate = async (): Promise<void> => {
  try {
    console.log('🔄 Updating Firebase images...');
    
    await updateAllProductImages();
    
    console.log('✅ Firebase update completed!');
    
    Alert.alert(
      'Update Complete',
      'All Firebase products have been updated with local image paths. New products loaded from Firebase will now use local images automatically.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('❌ Firebase update failed:', error);
    Alert.alert(
      'Update Failed',
      `Firebase update failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your internet connection and Firebase permissions.`,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Quick test just for cart and favorites
 */
export const testCartAndFavorites = (
  fixCartItemImages: () => void,
  fixFavoritesImages: () => void
): void => {
  try {
    console.log('🛒 Testing Cart and Favorites Images');
    console.log('===================================');
    
    console.log('🔧 Fixing cart item images...');
    fixCartItemImages();
    
    console.log('❤️ Fixing favorites images...');
    fixFavoritesImages();
    
    console.log('✅ Cart and favorites images fixed!');
    
    Alert.alert(
      'Cart & Favorites Updated',
      'All cart items and favorites have been updated with local images.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('❌ Cart/favorites test failed:', error);
    Alert.alert(
      'Update Failed',
      `Could not update cart/favorites: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Complete setup - run this after installing the image mapping solution
 */
export const completeImageSetup = async (
  fixCartItemImages: () => void,
  fixFavoritesImages: () => void
): Promise<void> => {
  try {
    Alert.alert(
      'Complete Image Setup',
      'This will:\n1. Test all image mappings\n2. Fix existing cart/favorites\n3. Preview Firebase updates\n\nProceed?',
      [
        {
          text: 'Yes, Setup Everything',
          onPress: async () => {
            console.log('🚀 Starting Complete Image Setup');
            console.log('================================');
            
            // Step 1: Test mappings
            console.log('\n1️⃣ Testing image mappings...');
            quickImageTest();
            
            // Step 2: Fix existing data
            console.log('\n2️⃣ Fixing existing cart and favorites...');
            fixCartItemImages();
            fixFavoritesImages();
            
            // Step 3: Test Firebase integration
            console.log('\n3️⃣ Testing Firebase integration...');
            await testFirebaseIntegration();
            
            // Step 4: Preview Firebase updates
            console.log('\n4️⃣ Previewing Firebase updates...');
            await previewFirebaseUpdates();
            
            console.log('\n✅ Complete setup finished!');
            
            Alert.alert(
              'Setup Complete',
              'Image mapping setup is complete!\n\n• Local images are working\n• Cart & favorites fixed\n• Firebase integration tested\n• Ready to update Firebase\n\nCheck console for details.',
              [{ text: 'Perfect!' }]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  } catch (error) {
    console.error('❌ Complete setup failed:', error);
    Alert.alert(
      'Setup Failed',
      `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
  }
};

export default {
  runCompleteImageTest,
  previewFirebaseUpdates,
  updateFirebaseImages,
  testCartAndFavorites,
  completeImageSetup,
}; 