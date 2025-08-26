import { firebaseImageService } from '../services/firebaseImageService';

/**
 * Image URL Utility for Products
 * Provides a unified way to get image URLs from Firebase or local assets
 */

// Enhanced Product interface that supports both local and Firebase images
export interface EnhancedProduct {
  id: string;
  name: string;
  type: 'Coffee' | 'Bean';
  imageUrlSquare?: string;    // Firebase URL
  imageUrlPortrait?: string;  // Firebase URL
  imagelink_square?: any;     // Local asset (legacy)
  imagelink_portrait?: any;   // Local asset (legacy)
  [key: string]: any;
}

/**
 * Get the best available image URL for a product
 */
export const getProductImageUrl = async (
  product: EnhancedProduct,
  imageType: 'square' | 'portrait'
): Promise<string | null> => {
  try {
    // First try Firebase URLs from Firestore
    const firebaseUrl = imageType === 'square' ? product.imageUrlSquare : product.imageUrlPortrait;
    if (firebaseUrl) {
      return firebaseUrl;
    }

    // Then try Firebase Storage service
    if (firebaseImageService.shouldUseFirebaseImages()) {
      const storageUrl = await firebaseImageService.getProductImageUrl(product.id, imageType);
      if (storageUrl) {
        return storageUrl;
      }
    }

    // Fallback to local assets
    const localAsset = imageType === 'square' ? product.imagelink_square : product.imagelink_portrait;
    if (localAsset) {
      return localAsset;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to get image URL for ${product.id}:`, error);
    return null;
  }
};

/**
 * Get a direct public URL for a product image (faster, no auth required)
 */
export const getProductImageUrlDirect = (
  product: EnhancedProduct,
  imageType: 'square' | 'portrait'
): string | null => {
  // First try Firebase URLs from Firestore
  const firebaseUrl = imageType === 'square' ? product.imageUrlSquare : product.imageUrlPortrait;
  if (firebaseUrl) {
    return firebaseUrl;
  }

  // Then try direct Firebase Storage URL
  const directUrl = firebaseImageService.getPublicImageUrl(product.id, imageType);
  if (directUrl) {
    return directUrl;
  }

  // Fallback to local assets
  const localAsset = imageType === 'square' ? product.imagelink_square : product.imagelink_portrait;
  return localAsset || null;
};

/**
 * Preload images for a list of products
 */
export const preloadProductImages = async (products: EnhancedProduct[]): Promise<void> => {
  const productIds = products.map(p => p.id);
  await firebaseImageService.preloadProductImages(productIds);
};

/**
 * Create a unified image component props
 */
export const createImageProps = (
  product: EnhancedProduct,
  imageType: 'square' | 'portrait'
) => {
  const imageUrl = getProductImageUrlDirect(product, imageType);
  
  if (!imageUrl) {
    return {
      source: undefined,
      style: { backgroundColor: '#f0f0f0' } // Placeholder background
    };
  }

  // Handle Firebase URLs
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('https'))) {
    return {
      source: { uri: imageUrl },
      style: {}
    };
  }

  // Handle local assets
  return {
    source: imageUrl,
    style: {}
  };
};

/**
 * Migration utility to update product objects with Firebase URLs
 */
export const updateProductWithFirebaseUrls = async (product: EnhancedProduct): Promise<EnhancedProduct> => {
  const updatedProduct = { ...product };

  try {
    // Get Firebase URLs if not already present
    if (!updatedProduct.imageUrlSquare) {
      const squareUrl = await firebaseImageService.getProductImageUrl(product.id, 'square');
      if (squareUrl) {
        updatedProduct.imageUrlSquare = squareUrl;
      }
    }
    
    if (!updatedProduct.imageUrlPortrait) {
      const portraitUrl = await firebaseImageService.getProductImageUrl(product.id, 'portrait');
      if (portraitUrl) {
        updatedProduct.imageUrlPortrait = portraitUrl;
      }
    }
  } catch (error) {
    console.warn(`Failed to update Firebase URLs for ${product.id}:`, error);
  }

  return updatedProduct;
};

/**
 * Batch update products with Firebase URLs
 */
export const updateProductsWithFirebaseUrls = async (products: EnhancedProduct[]): Promise<EnhancedProduct[]> => {
  const updatePromises = products.map(product => updateProductWithFirebaseUrls(product));
  return Promise.all(updatePromises);
};

export default {
  getProductImageUrl,
  getProductImageUrlDirect,
  preloadProductImages,
  createImageProps,
  updateProductWithFirebaseUrls,
  updateProductsWithFirebaseUrls
};
