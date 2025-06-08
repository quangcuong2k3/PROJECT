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
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
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
        products.push({
          id: document.id,
          ...data,
        } as Product);
      });
    } else {
      // Fetch from both collections
      console.log('📦 Fetching from coffees collection...');
      const coffeesSnapshot = await getDocs(collection(firestore, 'coffees'));
      coffeesSnapshot.forEach(document => {
        const data = document.data();
        console.log(`  - Found coffee: ${document.id} (${data.name})`);
        products.push({
          id: document.id,
          ...data,
        } as Product);
      });

      console.log('📦 Fetching from beans collection...');
      const beansSnapshot = await getDocs(collection(firestore, 'beans'));
      beansSnapshot.forEach(document => {
        const data = document.data();
        console.log(`  - Found bean: ${document.id} (${data.name})`);
        products.push({
          id: document.id,
          ...data,
        } as Product);
      });
    }

    console.log(`✅ Total fetched: ${products.length} products from Firebase`);
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
      return {
        id: document.id,
        ...document.data(),
      } as Product;
    }

    // Try beans collection
    docSnap = await getDocs(
      query(collection(firestore, 'beans'), where('__name__', '==', id)),
    );

    if (!docSnap.empty) {
      const document = docSnap.docs[0];
      console.log(`✅ Found bean: ${document.id}`);
      return {
        id: document.id,
        ...document.data(),
      } as Product;
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
};
