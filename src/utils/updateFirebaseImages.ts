// Utility script to update Firebase products with correct local image paths
// This script can be run to batch update all products in Firebase

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseconfig';

// Image path mapping based on product names and asset structure
const getImagePaths = (productName: string, productType: 'Coffee' | 'Bean'): { square: string; portrait: string } => {
  const normalizedName = productName.toLowerCase();
  
  if (productType === 'Coffee') {
    // Coffee products
    if (normalizedName.includes('americano')) {
      return {
        square: 'src/assets/coffee_assets/americano/square/americano_pic_1_square.png',
        portrait: 'src/assets/coffee_assets/americano/portrait/americano_pic_1_portrait.png',
      };
    }
    
    if (normalizedName.includes('black coffee')) {
      return {
        square: 'src/assets/coffee_assets/black_coffee/square/black_coffee_pic_1_square.png',
        portrait: 'src/assets/coffee_assets/black_coffee/portrait/black_coffee_pic_1_portrait.png',
      };
    }
    
    if (normalizedName.includes('cappuccino')) {
      return {
        square: 'src/assets/coffee_assets/cappuccino/square/cappuccino_pic_1_square.png',
        portrait: 'src/assets/coffee_assets/cappuccino/portrait/cappuccino_pic_1_portrait.png',
      };
    }
    
    if (normalizedName.includes('espresso')) {
      return {
        square: 'src/assets/coffee_assets/espresso/square/espresso_pic_1_square.png',
        portrait: 'src/assets/coffee_assets/espresso/portrait/espresso_pic_1_portrait.png',
      };
    }
    
    if (normalizedName.includes('latte')) {
      return {
        square: 'src/assets/coffee_assets/latte/square/latte_pic_1_square.png',
        portrait: 'src/assets/coffee_assets/latte/portrait/latte_pic_1_portrait.png',
      };
    }
    
    if (normalizedName.includes('macchiato')) {
      return {
        square: 'src/assets/coffee_assets/macchiato/square/macchiato_pic_1_square.png',
        portrait: 'src/assets/coffee_assets/macchiato/portrait/macchiato_pic_1_portrait.png',
      };
    }
    
    // Default for unknown coffee
    return {
      square: 'src/assets/coffee_assets/americano/square/americano_pic_1_square.png',
      portrait: 'src/assets/coffee_assets/americano/portrait/americano_pic_1_portrait.png',
    };
  } else {
    // Bean products
    if (normalizedName.includes('arabica')) {
      return {
        square: 'src/assets/coffee_assets/arabica_coffee_beans/arabica_coffee_beans_square.png',
        portrait: 'src/assets/coffee_assets/arabica_coffee_beans/arabica_coffee_beans_portrait.png',
      };
    }
    
    if (normalizedName.includes('robusta')) {
      return {
        square: 'src/assets/coffee_assets/robusta_coffee_beans/robusta_coffee_beans_square.png',
        portrait: 'src/assets/coffee_assets/robusta_coffee_beans/robusta_coffee_beans_portrait.png',
      };
    }
    
    if (normalizedName.includes('liberica')) {
      return {
        square: 'src/assets/coffee_assets/liberica_coffee_beans/liberica_coffee_beans_square.png',
        portrait: 'src/assets/coffee_assets/liberica_coffee_beans/liberica_coffee_beans_portrait.png',
      };
    }
    
    if (normalizedName.includes('excelsa')) {
      return {
        square: 'src/assets/coffee_assets/excelsa_coffee_beans/excelsa_coffee_beans_square.png',
        portrait: 'src/assets/coffee_assets/excelsa_coffee_beans/excelsa_coffee_beans_portrait.png',
      };
    }
    
    // Default for unknown bean
    return {
      square: 'src/assets/coffee_assets/arabica_coffee_beans/arabica_coffee_beans_square.png',
      portrait: 'src/assets/coffee_assets/arabica_coffee_beans/arabica_coffee_beans_portrait.png',
    };
  }
};

/**
 * Update all coffee products in Firebase with correct local image paths
 */
export const updateCoffeeImages = async (): Promise<void> => {
  try {
    console.log('🔄 Updating coffee images in Firebase...');
    
    const snapshot = await getDocs(collection(firestore, 'coffees'));
    const updatePromises: Promise<void>[] = [];
    
    snapshot.forEach((document) => {
      const data = document.data();
      const imagePaths = getImagePaths(data.name, 'Coffee');
      
      console.log(`📝 Updating ${data.name}:`, imagePaths);
      
      const updatePromise = updateDoc(doc(firestore, 'coffees', document.id), {
        imageUrlSquare: imagePaths.square,
        imageUrlPortrait: imagePaths.portrait,
        updatedAt: new Date(),
      });
      
      updatePromises.push(updatePromise);
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Updated ${updatePromises.length} coffee products`);
  } catch (error) {
    console.error('❌ Error updating coffee images:', error);
    throw error;
  }
};

/**
 * Update all bean products in Firebase with correct local image paths
 */
export const updateBeanImages = async (): Promise<void> => {
  try {
    console.log('🔄 Updating bean images in Firebase...');
    
    const snapshot = await getDocs(collection(firestore, 'beans'));
    const updatePromises: Promise<void>[] = [];
    
    snapshot.forEach((document) => {
      const data = document.data();
      const imagePaths = getImagePaths(data.name, 'Bean');
      
      console.log(`📝 Updating ${data.name}:`, imagePaths);
      
      const updatePromise = updateDoc(doc(firestore, 'beans', document.id), {
        imageUrlSquare: imagePaths.square,
        imageUrlPortrait: imagePaths.portrait,
        updatedAt: new Date(),
      });
      
      updatePromises.push(updatePromise);
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Updated ${updatePromises.length} bean products`);
  } catch (error) {
    console.error('❌ Error updating bean images:', error);
    throw error;
  }
};

/**
 * Update all products (both coffees and beans) in Firebase with correct local image paths
 */
export const updateAllProductImages = async (): Promise<void> => {
  try {
    console.log('🚀 Starting batch update of all product images...');
    
    await updateCoffeeImages();
    await updateBeanImages();
    
    console.log('🎉 Successfully updated all product images in Firebase!');
  } catch (error) {
    console.error('❌ Error updating product images:', error);
    throw error;
  }
};

/**
 * Preview what changes would be made without actually updating Firebase
 */
export const previewImageUpdates = async (): Promise<void> => {
  try {
    console.log('👀 Previewing image updates...');
    
    // Preview coffees
    console.log('\n☕ Coffee Products:');
    const coffeesSnapshot = await getDocs(collection(firestore, 'coffees'));
    coffeesSnapshot.forEach((document) => {
      const data = document.data();
      const imagePaths = getImagePaths(data.name, 'Coffee');
      
      console.log(`  📝 ${data.name}:`);
      console.log(`    Current Square: ${data.imageUrlSquare}`);
      console.log(`    New Square:     ${imagePaths.square}`);
      console.log(`    Current Portrait: ${data.imageUrlPortrait}`);
      console.log(`    New Portrait:     ${imagePaths.portrait}`);
      console.log('');
    });
    
    // Preview beans
    console.log('\n🫘 Bean Products:');
    const beansSnapshot = await getDocs(collection(firestore, 'beans'));
    beansSnapshot.forEach((document) => {
      const data = document.data();
      const imagePaths = getImagePaths(data.name, 'Bean');
      
      console.log(`  📝 ${data.name}:`);
      console.log(`    Current Square: ${data.imageUrlSquare}`);
      console.log(`    New Square:     ${imagePaths.square}`);
      console.log(`    Current Portrait: ${data.imageUrlPortrait}`);
      console.log(`    New Portrait:     ${imagePaths.portrait}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error previewing updates:', error);
    throw error;
  }
};

export default {
  updateCoffeeImages,
  updateBeanImages,
  updateAllProductImages,
  previewImageUpdates,
  getImagePaths,
}; 