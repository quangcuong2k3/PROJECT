import React from 'react';
import { storage } from '../../firebaseconfig';
import { ref, getDownloadURL } from 'firebase/storage';

/**
 * Firebase Image Service
 * Handles loading images from Firebase Storage
 */

export interface ImageConfig {
  useFirebaseImages: boolean;
  imageBaseUrl: string;
  products: {
    [productId: string]: {
      type: string;
      square: string;
      portrait: string;
    };
  };
}

class FirebaseImageService {
  private static instance: FirebaseImageService;
  private imageCache: Map<string, string> = new Map();
  private config: ImageConfig | null = null;

  private constructor() {}

  public static getInstance(): FirebaseImageService {
    if (!FirebaseImageService.instance) {
      FirebaseImageService.instance = new FirebaseImageService();
    }
    return FirebaseImageService.instance;
  }

  /**
   * Initialize the service with configuration
   */
  public async initialize(config?: ImageConfig): Promise<void> {
    if (config) {
      this.config = config;
    } else {
      // Load default configuration
      this.config = {
        useFirebaseImages: true,
        imageBaseUrl: 'https://storage.googleapis.com/thecoffee-b780f.firebasestorage.app/products',
        products: {}
      };
    }
  }

  /**
   * Get the Firebase Storage URL for a product image
   */
  public async getProductImageUrl(
    productId: string,
    imageType: 'square' | 'portrait'
  ): Promise<string | null> {
    try {
      const cacheKey = `${productId}_${imageType}`;
      
      // Check cache first
      if (this.imageCache.has(cacheKey)) {
        return this.imageCache.get(cacheKey)!;
      }

      // Construct the Firebase Storage path
      const imagePath = this.getImagePath(productId, imageType);
      if (!imagePath) {
        console.warn(`No image path found for ${productId} ${imageType}`);
        return null;
      }

      // Get download URL from Firebase Storage
      const imageRef = ref(storage, imagePath);
      const downloadURL = await getDownloadURL(imageRef);
      
      // Cache the URL
      this.imageCache.set(cacheKey, downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error(`Failed to get image URL for ${productId} ${imageType}:`, error);
      return null;
    }
  }

  /**
   * Get direct public URL (if images are made public)
   */
  public getPublicImageUrl(productId: string, imageType: 'square' | 'portrait'): string | null {
    if (!this.config) {
      console.warn('FirebaseImageService not initialized');
      return null;
    }

    const imagePath = this.getImagePath(productId, imageType);
    if (!imagePath) {
      return null;
    }

    return `${this.config.imageBaseUrl}/${imagePath}`;
  }

  /**
   * Preload images for better performance
   */
  public async preloadProductImages(productIds: string[]): Promise<void> {
    const loadPromises: Promise<any>[] = [];

    for (const productId of productIds) {
      loadPromises.push(
        this.getProductImageUrl(productId, 'square'),
        this.getProductImageUrl(productId, 'portrait')
      );
    }

    try {
      await Promise.all(loadPromises);
      console.log(`Preloaded images for ${productIds.length} products`);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }

  /**
   * Clear the image cache
   */
  public clearCache(): void {
    this.imageCache.clear();
  }

  /**
   * Get image path based on product type and naming convention
   */
  private getImagePath(productId: string, imageType: 'square' | 'portrait'): string | null {
    if (this.config?.products[productId]) {
      return this.config.products[productId][imageType];
    }

    // Fallback: construct path based on product ID pattern
    const productType = productId.startsWith('C') ? 'coffee' : 'bean';
    return `${productType}/${productId}/${imageType}/${productId}_${imageType}.png`;
  }

  /**
   * Check if we should use Firebase images or local assets
   */
  public shouldUseFirebaseImages(): boolean {
    return this.config?.useFirebaseImages ?? true;
  }

  /**
   * Get fallback local asset path
   */
  public getLocalAssetPath(productId: string, imageType: 'square' | 'portrait'): string | null {
    // This would map to your local asset structure
    const productType = productId.startsWith('C') ? 'coffee' : 'bean';
    
    // Map product IDs to asset folders
    const assetMapping: { [key: string]: string } = {
      'C1': 'americano',
      'C2': 'black_coffee', 
      'C3': 'cappuccino',
      'C4': 'espresso',
      'C5': 'latte',
      'C6': 'macchiato',
      'B1': 'robusta_coffee_beans',
      'B2': 'arabica_coffee_beans',
      'B3': 'liberica_coffee_beans',
      'B4': 'excelsa_coffee_beans'
    };

    const assetFolder = assetMapping[productId];
    if (!assetFolder) {
      return null;
    }

    if (productType === 'coffee') {
      return `../assets/coffee_assets/${assetFolder}/${imageType}/${assetFolder}_pic_1_${imageType}.png`;
    } else {
      return `../assets/coffee_assets/${assetFolder}/${assetFolder}_${imageType}.png`;
    }
  }
}

// Export singleton instance
export const firebaseImageService = FirebaseImageService.getInstance();

// Utility hook for React Native components
export const useFirebaseImage = (productId: string, imageType: 'square' | 'portrait') => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        if (firebaseImageService.shouldUseFirebaseImages()) {
          // Try Firebase first
          const firebaseUrl = await firebaseImageService.getProductImageUrl(productId, imageType);
          if (mounted && firebaseUrl) {
            setImageUrl(firebaseUrl);
            setLoading(false);
            return;
          }
        }

        // Fallback to local assets
        const localPath = firebaseImageService.getLocalAssetPath(productId, imageType);
        if (mounted && localPath) {
          setImageUrl(localPath);
        }
        
        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load image');
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [productId, imageType]);

  return { imageUrl, loading, error };
};

export default firebaseImageService;
