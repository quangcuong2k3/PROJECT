// Image mapping utility for local assets
// This maps Firebase storage URLs to local React Native require statements

export interface ImageAsset {
  square: any;
  portrait: any;
}

// Coffee Images
const coffeeImages: { [key: string]: ImageAsset } = {
  americano: {
    square: require('../assets/coffee_assets/americano/square/americano_pic_1_square.png'),
    portrait: require('../assets/coffee_assets/americano/portrait/americano_pic_1_portrait.png'),
  },
  'black coffee': {
    square: require('../assets/coffee_assets/black_coffee/square/black_coffee_pic_1_square.png'),
    portrait: require('../assets/coffee_assets/black_coffee/portrait/black_coffee_pic_1_portrait.png'),
  },
  cappuccino: {
    square: require('../assets/coffee_assets/cappuccino/square/cappuccino_pic_1_square.png'),
    portrait: require('../assets/coffee_assets/cappuccino/portrait/cappuccino_pic_1_portrait.png'),
  },
  espresso: {
    square: require('../assets/coffee_assets/espresso/square/espresso_pic_1_square.png'),
    portrait: require('../assets/coffee_assets/espresso/portrait/espresso_pic_1_portrait.png'),
  },
  latte: {
    square: require('../assets/coffee_assets/latte/square/latte_pic_1_square.png'),
    portrait: require('../assets/coffee_assets/latte/portrait/latte_pic_1_portrait.png'),
  },
  macchiato: {
    square: require('../assets/coffee_assets/macchiato/square/macchiato_pic_1_square.png'),
    portrait: require('../assets/coffee_assets/macchiato/portrait/macchiato_pic_1_portrait.png'),
  },
};

// Bean Images
const beanImages: { [key: string]: ImageAsset } = {
  'arabica beans': {
    square: require('../assets/coffee_assets/arabica_coffee_beans/arabica_coffee_beans_square.png'),
    portrait: require('../assets/coffee_assets/arabica_coffee_beans/arabica_coffee_beans_portrait.png'),
  },
  'robusta beans': {
    square: require('../assets/coffee_assets/robusta_coffee_beans/robusta_coffee_beans_square.png'),
    portrait: require('../assets/coffee_assets/robusta_coffee_beans/robusta_coffee_beans_portrait.png'),
  },
  'liberica beans': {
    square: require('../assets/coffee_assets/liberica_coffee_beans/liberica_coffee_beans_square.png'),
    portrait: require('../assets/coffee_assets/liberica_coffee_beans/liberica_coffee_beans_portrait.png'),
  },
  'excelsa beans': {
    square: require('../assets/coffee_assets/excelsa_coffee_beans/excelsa_coffee_beans_square.png'),
    portrait: require('../assets/coffee_assets/excelsa_coffee_beans/excelsa_coffee_beans_portrait.png'),
  },
};

// Combined image mapping
const allImages = { ...coffeeImages, ...beanImages };

/**
 * Get local image asset for a product
 * @param productName - The name of the product (e.g., "Americano", "Arabica Beans")
 * @param imageType - Type of image needed ("square" or "portrait")
 * @returns React Native image require or null if not found
 */
export const getLocalImage = (productName: string, imageType: 'square' | 'portrait' = 'square'): any => {
  const normalizedName = productName.toLowerCase();
  
  // Direct match
  if (allImages[normalizedName]) {
    return allImages[normalizedName][imageType];
  }
  
  // Try to find partial matches
  const matchingKey = Object.keys(allImages).find(key => 
    normalizedName.includes(key) || key.includes(normalizedName)
  );
  
  if (matchingKey) {
    return allImages[matchingKey][imageType];
  }
  
  // Fallback - return americano for coffee, arabica for beans
  console.warn(`⚠️ Image not found for "${productName}", using fallback`);
  if (normalizedName.includes('bean')) {
    return allImages['arabica beans'][imageType];
  }
  return allImages['americano'][imageType];
};

/**
 * Convert Firebase image URL to local image require
 * @param imageUrl - Firebase storage URL or local path
 * @param productName - Product name for fallback matching
 * @param imageType - Type of image ("square" or "portrait")
 * @returns React Native image require
 */
export const convertFirebaseUrlToLocal = (
  imageUrl: string, 
  productName: string, 
  imageType: 'square' | 'portrait' = 'square'
): any => {
  // If it's already a Firebase storage URL, extract product info and convert
  if (imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.includes('firebase')) {
    // Extract product name from URL or use provided productName
    return getLocalImage(productName, imageType);
  }
  
  // If it's a local path (like "src/assets/coffee_assets/..."), convert to require
  if (imageUrl.includes('src/assets/coffee_assets/')) {
    return getLocalImage(productName, imageType);
  }
  
  // If it's already a require statement or unknown format, try to get local image
  return getLocalImage(productName, imageType);
};

/**
 * Update product object to use local images
 * @param product - Product object from Firebase
 * @returns Product with local image requires
 */
export const updateProductWithLocalImages = (product: any): any => {
  return {
    ...product,
    imagelink_square: getLocalImage(product.name, 'square'),
    imagelink_portrait: getLocalImage(product.name, 'portrait'),
    imageUrlSquare: getLocalImage(product.name, 'square'),
    imageUrlPortrait: getLocalImage(product.name, 'portrait'),
  };
};

/**
 * Batch update products to use local images
 * @param products - Array of products from Firebase
 * @returns Array of products with local image requires
 */
export const updateProductsWithLocalImages = (products: any[]): any[] => {
  return products.map(updateProductWithLocalImages);
};

export default {
  getLocalImage,
  convertFirebaseUrlToLocal,
  updateProductWithLocalImages,
  updateProductsWithLocalImages,
  coffeeImages,
  beanImages,
  allImages,
}; 