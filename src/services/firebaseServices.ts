import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  //deleteDoc,
  query,
  where,
  orderBy,
  //onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  //deleteObject
} from 'firebase/storage';
import {
  ref as rtdbRef,
  //push,
  set,
  get,
  onValue,
  off,
  //remove,
} from 'firebase/database';
import {firestore, storage, realtimeDb} from '../../firebaseconfig';
import { updateProductWithLocalImages } from '../utils/imageMapping';

// Types
export interface Price {
  quantity: any;
  size: string;
  price: string;
  currency: string;
}

export interface Bean {
  id?: string;
  name: string;
  description: string;
  roasted: string;
  imageUrlSquare: string;
  imageUrlPortrait: string;
  ingredients: string;
  special_ingredient: string;
  prices: Price[];
  average_rating: number;
  ratings_count: string;
  favourite: boolean;
  type: string;
  index: number;
  [key: string]: any;
}

export interface Coffee {
  id?: string;
  name: string;
  description: string;
  roasted: string;
  imageUrlSquare: string;
  imageUrlPortrait: string;
  ingredients: string;
  special_ingredient: string;
  prices: Price[];
  average_rating: number;
  ratings_count: string;
  favourite: boolean;
  type: string;
  index: number;
  [key: string]: any;
}

// Enhanced types
export interface Product {
  id?: string;
  name: string;
  description: string;
  roasted: string;
  imageUrlSquare: string;
  imageUrlPortrait: string;
  ingredients: string;
  special_ingredient: string;
  prices: Price[];
  average_rating: number;
  ratings_count: string;
  favourite: boolean;
  type: 'Bean' | 'Coffee';
  index: number;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem extends Product {
  prices: Price[];
}

export interface Order {
  id?: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  orderDate: Date;
  status: 'pending' | 'paid' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  deliveryAddress?: string;
  paymentId?: string | null;
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface UserPreferences {
  id?: string;
  userId: string;
  favorites: string[];
  recentSearches: string[];
  orderHistory: string[];
}

// ======================
// UNIFIED PRODUCT OPERATIONS
// ======================

// Fetch all products (unified coffee and beans)
export const fetchProducts = async (
  type?: 'Coffee' | 'Bean',
): Promise<Product[]> => {
  try {
    console.log('🔄 Fetching products from Firebase...', type || 'all types');
    const products: Product[] = [];

    if (type) {
      // Fetch from specific collection
      const collectionName = type === 'Coffee' ? 'coffees' : 'beans';
      console.log(`📦 Fetching from ${collectionName} collection...`);

      const snapshot = await getDocs(collection(firestore, collectionName));
      snapshot.forEach(document => {
        const data = document.data();
        console.log(`  - Found: ${document.id} (${data.name})`);
        
        // Convert Firebase URLs to local image requires
        const productWithLocalImages = updateProductWithLocalImages({
          id: document.id,
          ...data,
        });
        
        products.push(productWithLocalImages as Product);
      });
    } else {
      // Fetch from both collections
      console.log('📦 Fetching from coffees collection...');
      const coffeesSnapshot = await getDocs(collection(firestore, 'coffees'));
      coffeesSnapshot.forEach(document => {
        const data = document.data();
        console.log(`  - Found coffee: ${document.id} (${data.name})`);
        
        // Convert Firebase URLs to local image requires
        const productWithLocalImages = updateProductWithLocalImages({
          id: document.id,
          ...data,
        });
        
        products.push(productWithLocalImages as Product);
      });

      console.log('📦 Fetching from beans collection...');
      const beansSnapshot = await getDocs(collection(firestore, 'beans'));
      beansSnapshot.forEach(document => {
        const data = document.data();
        console.log(`  - Found bean: ${document.id} (${data.name})`);
        
        // Convert Firebase URLs to local image requires
        const productWithLocalImages = updateProductWithLocalImages({
          id: document.id,
          ...data,
        });
        
        products.push(productWithLocalImages as Product);
      });
    }

    console.log(`✅ Total fetched: ${products.length} products from Firebase`);
    console.log('🖼️ All image URLs converted to local requires');
    return products;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  try {
    console.log(`🔍 Fetching product by ID: ${id}`);

    // Try coffees collection first
    let docSnap = await getDocs(
      query(collection(firestore, 'coffees'), where('__name__', '==', id)),
    );

    if (!docSnap.empty) {
      const document = docSnap.docs[0];
      console.log(`✅ Found coffee: ${document.id}`);
      
      // Convert Firebase URLs to local image requires
      const productWithLocalImages = updateProductWithLocalImages({
        id: document.id,
        ...document.data(),
      });
      
      return productWithLocalImages as Product;
    }

    // Try beans collection
    docSnap = await getDocs(
      query(collection(firestore, 'beans'), where('__name__', '==', id)),
    );

    if (!docSnap.empty) {
      const document = docSnap.docs[0];
      console.log(`✅ Found bean: ${document.id}`);
      
      // Convert Firebase URLs to local image requires
      const productWithLocalImages = updateProductWithLocalImages({
        id: document.id,
        ...document.data(),
      });
      
      return productWithLocalImages as Product;
    }

    console.log(`❌ Product not found: ${id}`);
    return null;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};

export const addProduct = async (
  product: Omit<Product, 'id'>,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(firestore, 'products'), {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (
  id: string,
  updates: Partial<Product>,
): Promise<void> => {
  try {
    const docRef = doc(firestore, 'products', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// ======================
// ORDER OPERATIONS
// ======================

export const addOrder = async (order: Omit<Order, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(firestore, 'orders'), {
      ...order,
      orderDate: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
};

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(firestore, 'orders'),
      where('userId', '==', userId),
      orderBy('orderDate', 'desc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      document =>
        ({
          id: document.id,
          ...document.data(),
        } as Order),
    );
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

// ======================
// USER PREFERENCES
// ======================

export const getUserPreferences = async (
  userId: string,
): Promise<UserPreferences | null> => {
  try {
    const q = query(
      collection(firestore, 'userPreferences'),
      where('userId', '==', userId),
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const document = snapshot.docs[0];
      return {
        id: document.id,
        ...document.data(),
      } as UserPreferences;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<void> => {
  try {
    const existing = await getUserPreferences(userId);

    if (existing && existing.id) {
      const docRef = doc(firestore, 'userPreferences', existing.id);
      await updateDoc(docRef, preferences);
    } else {
      await addDoc(collection(firestore, 'userPreferences'), {
        userId,
        favorites: [],
        recentSearches: [],
        orderHistory: [],
        ...preferences,
      });
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

// ======================
// ENHANCED STORAGE OPERATIONS
// ======================

export const uploadProductImage = async (
  imageUri: string,
  productId: string,
  imageType: 'square' | 'portrait',
): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const imagePath = `products/${productId}/${imageType}_${Date.now()}.jpg`;
    const imageRef = ref(storage, imagePath);

    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// ======================
// REALTIME DATABASE OPERATIONS
// ======================

// Live order tracking
export const updateOrderStatus = async (
  orderId: string,
  status: Order['status'],
): Promise<void> => {
  try {
    const orderRef = rtdbRef(realtimeDb, `orderTracking/${orderId}`);
    await set(orderRef, {
      status,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const subscribeToOrderStatus = (
  orderId: string,
  callback: (status: Order['status']) => void,
): (() => void) => {
  const orderRef = rtdbRef(realtimeDb, `orderTracking/${orderId}`);

  const unsubscribe = onValue(orderRef, snapshot => {
    const data = snapshot.val();
    if (data && data.status) {
      callback(data.status);
    }
  });

  return () => off(orderRef, 'value', unsubscribe);
};

// Live product popularity tracking
export const updateProductPopularity = async (
  productId: string,
): Promise<void> => {
  try {
    const popularityRef = rtdbRef(realtimeDb, `productPopularity/${productId}`);
    const snapshot = await get(popularityRef);
    const currentViews = snapshot.val()?.views || 0;

    await set(popularityRef, {
      views: currentViews + 1,
      lastViewed: Date.now(),
    });
  } catch (error) {
    console.error('Error updating product popularity:', error);
    throw error;
  }
};

export const getPopularProducts = async (): Promise<string[]> => {
  try {
    const popularityRef = rtdbRef(realtimeDb, 'productPopularity');
    const snapshot = await get(popularityRef);
    const data = snapshot.val();

    if (!data) {
      return [];
    }

    // Sort by views and return product IDs
    const sortedProducts = Object.entries(data)
      .sort(([, a]: any, [, b]: any) => b.views - a.views)
      .slice(0, 10)
      .map(([productId]) => productId);

    return sortedProducts;
  } catch (error) {
    console.error('Error getting popular products:', error);
    return [];
  }
};

// Batch operations for data migration
export const batchAddProducts = async (
  products: Omit<Product, 'id'>[],
): Promise<void> => {
  try {
    const batch = writeBatch(firestore);

    products.forEach(product => {
      const docRef = doc(collection(firestore, 'products'));
      batch.set(docRef, {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error batch adding products:', error);
    throw error;
  }
};

// ======================
// ENHANCED SEARCH OPERATIONS
// ======================

// Search products with relevance scoring based on multiple terms
export const searchProductsByTerms = async (
  searchTerms: string[],
  options: {
    minRelevanceScore?: number;
    maxResults?: number;
    includePartialMatches?: boolean;
  } = {}
): Promise<{ products: Product[]; relevanceScores: { [key: string]: number } }> => {
  try {
    console.log('🔍 Searching products by terms:', searchTerms);
    
    const {
      minRelevanceScore = 0.1,
      maxResults = 20,
      includePartialMatches = true,
    } = options;

    // Fetch all products
    const allProducts = await fetchProducts();
    
    // Calculate relevance scores for each product
    const productScores: { product: Product; score: number }[] = [];
    
    allProducts.forEach(product => {
      let relevanceScore = 0;
      const searchableText = [
        product.name,
        product.description,
        product.ingredients,
        product.special_ingredient,
        product.roasted,
        product.type,
        product.category,
      ].join(' ').toLowerCase();

      searchTerms.forEach(term => {
        const lowerTerm = term.toLowerCase();
        
        // Exact name match (highest score)
        if (product.name.toLowerCase().includes(lowerTerm)) {
          relevanceScore += 1.0;
        }
        
        // Type match (high score)
        if (product.type.toLowerCase().includes(lowerTerm)) {
          relevanceScore += 0.8;
        }
        
        // Ingredients match (medium-high score)
        if (product.ingredients.toLowerCase().includes(lowerTerm)) {
          relevanceScore += 0.7;
        }
        
        // Special ingredient match (medium score)
        if (product.special_ingredient.toLowerCase().includes(lowerTerm)) {
          relevanceScore += 0.6;
        }
        
        // Roast level match (medium score)
        if (product.roasted.toLowerCase().includes(lowerTerm)) {
          relevanceScore += 0.5;
        }
        
        // Description match (lower score)
        if (product.description.toLowerCase().includes(lowerTerm)) {
          relevanceScore += 0.3;
        }
        
        // Partial matches in searchable text
        if (includePartialMatches && searchableText.includes(lowerTerm)) {
          relevanceScore += 0.2;
        }
        
        // Fuzzy matching for common coffee terms
        const coffeeTermMappings: { [key: string]: string[] } = {
          'espresso': ['americano', 'cappuccino', 'latte', 'macchiato'],
          'milk': ['cappuccino', 'latte', 'macchiato'],
          'foam': ['cappuccino', 'latte'],
          'strong': ['espresso', 'americano', 'black coffee'],
          'light': ['americano', 'latte'],
          'dark': ['espresso', 'black coffee'],
          'bean': ['arabica', 'robusta', 'liberica', 'excelsa'],
          'roast': ['light', 'medium', 'dark'],
        };
        
        Object.entries(coffeeTermMappings).forEach(([key, relatedTerms]) => {
          if (lowerTerm.includes(key)) {
            relatedTerms.forEach(relatedTerm => {
              if (searchableText.includes(relatedTerm)) {
                relevanceScore += 0.4;
              }
            });
          }
        });
      });

      // Normalize score by number of search terms
      relevanceScore = relevanceScore / searchTerms.length;
      
      if (relevanceScore >= minRelevanceScore) {
        productScores.push({ product, score: relevanceScore });
      }
    });

    // Sort by relevance score (highest first)
    productScores.sort((a, b) => b.score - a.score);
    
    // Limit results
    const limitedResults = productScores.slice(0, maxResults);
    
    // Extract products and create score mapping
    const products = limitedResults.map(item => item.product);
    const relevanceScores: { [key: string]: number } = {};
    limitedResults.forEach(item => {
      if (item.product.id) {
        relevanceScores[item.product.id] = item.score;
      }
    });

    console.log(`✅ Found ${products.length} relevant products`);
    console.log('Top matches:', products.slice(0, 3).map(p => ({ name: p.name, score: relevanceScores[p.id || ''] })));
    
    return { products, relevanceScores };
  } catch (error) {
    console.error('❌ Error searching products by terms:', error);
    throw error;
  }
};

// Search products with AI-enhanced matching
export const searchProductsWithAI = async (
  searchQuery: string,
  searchTerms: string[],
  searchType: 'voice' | 'image' | 'text' = 'text',
  options: {
    minRelevanceScore?: number;
    maxResults?: number;
    boostPopular?: boolean;
  } = {}
): Promise<{ 
  products: Product[]; 
  relevanceScores: { [key: string]: number };
  searchMetadata: {
    originalQuery: string;
    processedTerms: string[];
    searchType: string;
    totalMatches: number;
  };
}> => {
  try {
    console.log(`🤖 AI-enhanced search - Type: ${searchType}, Query: "${searchQuery}"`);
    
    const {
      minRelevanceScore = 0.1,
      maxResults = 20,
      boostPopular = true,
    } = options;

    // Enhance search terms based on search type
    let enhancedTerms = [...searchTerms];
    
    if (searchType === 'voice') {
      // Add voice-specific enhancements
      enhancedTerms = enhanceVoiceSearchTerms(searchQuery, searchTerms);
    } else if (searchType === 'image') {
      // Add image-specific enhancements
      enhancedTerms = enhanceImageSearchTerms(searchTerms);
    }

    // Get search results
    const { products, relevanceScores } = await searchProductsByTerms(enhancedTerms, {
      minRelevanceScore,
      maxResults: maxResults * 2, // Get more results for further processing
      includePartialMatches: true,
    });

    // Apply popularity boost if enabled
    let finalProducts = products;
    let finalScores = { ...relevanceScores };
    
    if (boostPopular) {
      const popularProductIds = await getPopularProducts();
      finalProducts.forEach(product => {
        if (product.id && popularProductIds.includes(product.id)) {
          finalScores[product.id] = (finalScores[product.id] || 0) * 1.2; // 20% boost
        }
      });
      
      // Re-sort by updated scores
      finalProducts.sort((a, b) => {
        const scoreA = finalScores[a.id || ''] || 0;
        const scoreB = finalScores[b.id || ''] || 0;
        return scoreB - scoreA;
      });
    }

    // Limit to final result count
    finalProducts = finalProducts.slice(0, maxResults);

    const searchMetadata = {
      originalQuery: searchQuery,
      processedTerms: enhancedTerms,
      searchType,
      totalMatches: products.length,
    };

    console.log(`✅ AI search completed: ${finalProducts.length} results`);
    
    return { 
      products: finalProducts, 
      relevanceScores: finalScores,
      searchMetadata,
    };
  } catch (error) {
    console.error('❌ Error in AI-enhanced search:', error);
    throw error;
  }
};

// Helper function to enhance voice search terms
const enhanceVoiceSearchTerms = (originalQuery: string, terms: string[]): string[] => {
  const enhanced = [...terms];
  const query = originalQuery.toLowerCase();
  
  // Add common voice search patterns
  const voicePatterns = [
    { pattern: /find.*coffee/i, additions: ['coffee', 'espresso'] },
    { pattern: /show.*bean/i, additions: ['bean', 'arabica', 'robusta'] },
    { pattern: /i want.*latte/i, additions: ['latte', 'milk', 'espresso'] },
    { pattern: /looking for.*cappuccino/i, additions: ['cappuccino', 'foam', 'milk'] },
    { pattern: /strong.*coffee/i, additions: ['espresso', 'dark roast', 'americano'] },
    { pattern: /mild.*coffee/i, additions: ['latte', 'cappuccino', 'light roast'] },
  ];
  
  voicePatterns.forEach(({ pattern, additions }) => {
    if (pattern.test(query)) {
      enhanced.push(...additions);
    }
  });
  
  return [...new Set(enhanced)]; // Remove duplicates
};

// Helper function to enhance image search terms
const enhanceImageSearchTerms = (terms: string[]): string[] => {
  const enhanced = [...terms];
  
  // Add related terms based on image analysis results
  terms.forEach(term => {
    const lowerTerm = term.toLowerCase();
    
    if (lowerTerm.includes('cappuccino')) {
      enhanced.push('foam', 'milk', 'espresso', 'steamed milk');
    } else if (lowerTerm.includes('latte')) {
      enhanced.push('milk', 'espresso', 'steamed milk');
    } else if (lowerTerm.includes('americano')) {
      enhanced.push('espresso', 'hot water', 'black coffee');
    } else if (lowerTerm.includes('espresso')) {
      enhanced.push('strong', 'concentrated', 'dark roast');
    } else if (lowerTerm.includes('arabica')) {
      enhanced.push('bean', 'south america', 'smooth');
    } else if (lowerTerm.includes('robusta')) {
      enhanced.push('bean', 'africa', 'strong', 'bitter');
    } else if (lowerTerm.includes('dark')) {
      enhanced.push('dark roast', 'strong', 'bold');
    } else if (lowerTerm.includes('light')) {
      enhanced.push('light roast', 'mild', 'smooth');
    } else if (lowerTerm.includes('medium')) {
      enhanced.push('medium roast', 'balanced');
    }
  });
  
  return [...new Set(enhanced)]; // Remove duplicates
};

// Search products based on Gemini's suggested names with flexible matching
// 
// Example: If Gemini analyzes an image and returns:
// suggestedNames: ["Black Coffee", "Americano"]
// 
// This function will search through all products and find matches like:
// - "Black Coffee" → matches C2 (name: "Black Coffee")
// - "Americano" → matches C1 (name: "Americano") 
// - "Coffee" → matches all Coffee type products (C1-C6)
// - "Espresso" → matches C4 (name: "Espresso") and products with "Espresso" in ingredients
// - "Arabica" → matches B2 (name: "Arabica Beans")
// - "Medium Roasted" → matches products with roasted: "Medium Roasted"
//
// The search is flexible and checks all product fields:
// - name, description, ingredients, special_ingredient, roasted, type, category
export const searchProductsBySuggestedNames = async (
  suggestedNames: string[],
  options: {
    minRelevanceScore?: number;
    maxResults?: number;
  } = {}
): Promise<{ products: Product[]; relevanceScores: { [key: string]: number } }> => {
  try {
    console.log('🔍 Searching products by Gemini suggested names:', suggestedNames);
    
    const {
      minRelevanceScore = 0.1,
      maxResults = 20,
    } = options;

    // Fetch all products from both collections
    const allProducts = await fetchProducts();
    
    // Calculate relevance scores for each product based on suggested names
    const productScores: { product: Product; score: number }[] = [];
    
    allProducts.forEach(product => {
      let relevanceScore = 0;
      
      // Create searchable text from all product fields
      const searchableFields = [
        product.name,
        product.description,
        product.ingredients,
        product.special_ingredient,
        product.roasted,
        product.type,
        product.category,
      ].map(field => (field || '').toLowerCase());
      
      const searchableText = searchableFields.join(' ');

      // Check each suggested name against all product fields
      suggestedNames.forEach(suggestedName => {
        const lowerSuggested = suggestedName.toLowerCase();
        
        // Direct name matching (highest priority)
        if (product.name.toLowerCase().includes(lowerSuggested)) {
          relevanceScore += 2.0;
          console.log(`✅ Direct name match: "${product.name}" contains "${suggestedName}"`);
        }
        
        // Type matching (high priority)
        if (product.type.toLowerCase().includes(lowerSuggested)) {
          relevanceScore += 1.5;
          console.log(`✅ Type match: "${product.type}" contains "${suggestedName}"`);
        }
        
        // Ingredients matching
        if (product.ingredients.toLowerCase().includes(lowerSuggested)) {
          relevanceScore += 1.2;
          console.log(`✅ Ingredients match: "${product.ingredients}" contains "${suggestedName}"`);
        }
        
        // Special ingredient matching
        if (product.special_ingredient.toLowerCase().includes(lowerSuggested)) {
          relevanceScore += 1.0;
          console.log(`✅ Special ingredient match: "${product.special_ingredient}" contains "${suggestedName}"`);
        }
        
        // Roasted level matching
        if (product.roasted.toLowerCase().includes(lowerSuggested)) {
          relevanceScore += 0.8;
          console.log(`✅ Roasted match: "${product.roasted}" contains "${suggestedName}"`);
        }
        
        // Description matching
        if (product.description.toLowerCase().includes(lowerSuggested)) {
          relevanceScore += 0.6;
          console.log(`✅ Description match: "${product.description}" contains "${suggestedName}"`);
        }
        
        // Partial word matching in any field
        const words = lowerSuggested.split(' ');
        words.forEach(word => {
          if (word.length > 2 && searchableText.includes(word)) {
            relevanceScore += 0.3;
            console.log(`✅ Partial word match: "${word}" found in product fields`);
          }
        });
        
        // Fuzzy matching for common coffee terms
        const coffeeTermMappings: { [key: string]: string[] } = {
          'black coffee': ['black', 'coffee', 'americano'],
          'americano': ['black coffee', 'espresso', 'hot water'],
          'cappuccino': ['espresso', 'steamed milk', 'foam'],
          'latte': ['espresso', 'steamed milk', 'milk'],
          'macchiato': ['espresso', 'steamed milk'],
          'espresso': ['strong', 'concentrated', 'coffee'],
          'arabica': ['arabica beans', 'bean', 'south america'],
          'robusta': ['robusta beans', 'bean', 'africa'],
          'liberica': ['liberica beans', 'bean', 'west africa'],
          'excelsa': ['excelsa beans', 'bean', 'southeast asia'],
          'medium roast': ['medium roasted', 'roasted'],
          'dark roast': ['dark roasted', 'roasted'],
          'light roast': ['light roasted', 'roasted'],
        };
        
        // Check fuzzy mappings
        Object.entries(coffeeTermMappings).forEach(([key, relatedTerms]) => {
          if (lowerSuggested.includes(key)) {
            relatedTerms.forEach(relatedTerm => {
              if (searchableText.includes(relatedTerm)) {
                relevanceScore += 0.5;
                console.log(`✅ Fuzzy match: "${key}" → "${relatedTerm}" found`);
              }
            });
          }
        });
      });

      // Normalize score by number of suggested names
      relevanceScore = relevanceScore / suggestedNames.length;
      
      if (relevanceScore >= minRelevanceScore) {
        productScores.push({ product, score: relevanceScore });
        console.log(`📊 Product "${product.name}" scored: ${relevanceScore.toFixed(2)}`);
      }
    });

    // Sort by relevance score (highest first)
    productScores.sort((a, b) => b.score - a.score);
    
    // Limit results
    const limitedResults = productScores.slice(0, maxResults);
    
    // Extract products and create score mapping
    const products = limitedResults.map(item => item.product);
    const relevanceScores: { [key: string]: number } = {};
    limitedResults.forEach(item => {
      if (item.product.id) {
        relevanceScores[item.product.id] = item.score;
      }
    });

    console.log(`✅ Found ${products.length} products matching suggested names`);
    console.log('Top matches:', products.slice(0, 3).map(p => ({ 
      name: p.name, 
      type: p.type,
      score: relevanceScores[p.id || '']?.toFixed(2) 
    })));
    
    return { products, relevanceScores };
  } catch (error) {
    console.error('❌ Error searching products by suggested names:', error);
    throw error;
  }
};

export default {
  fetchProducts,
  fetchProductById,
  addProduct,
  updateProduct,
  addOrder,
  fetchUserOrders,
  getUserPreferences,
  updateUserPreferences,
  uploadProductImage,
  updateOrderStatus,
  subscribeToOrderStatus,
  updateProductPopularity,
  getPopularProducts,
  batchAddProducts,
  searchProductsByTerms,
  searchProductsWithAI,
  searchProductsBySuggestedNames,
};
