import {create} from 'zustand';
import {produce} from 'immer';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchProducts,
  addOrder,
  getUserPreferences,
  updateUserPreferences,
  updateProductPopularity,
  getPopularProducts,
  searchProductsWithAI,
  searchProductsByTerms,
  searchProductsBySuggestedNames,
  Product,
  CartItem,
  Order,
  UserPreferences,
  Price,
  fetchUserOrders,
} from '../services/firebaseServices';
import {
  fetchInventoryItems,
  fetchStockAlerts,
  updateStock,
  InventoryItem,
  StockAlert,
  getInventoryStats,
} from '../services/inventoryService';
import authService, {UserProfile} from '../services/authService';
import {User} from 'firebase/auth';
import { updateProductWithLocalImages } from '../utils/imageMapping';

// Extended Price interface for cart items that includes quantity
export interface CartPrice extends Price {
  quantity: number;
}

interface StoreState {
  // Data
  CoffeeList: Product[];
  BeanList: Product[];
  ProductsList: Product[]; // Unified products list
  PopularProducts: Product[];

  // Cart and pricing
  CartPrice: string;
  FavoritesList: Product[];
  CartList: CartItem[];
  OrderHistoryList: Order[];

  // Inventory Management
  InventoryItems: InventoryItem[];
  StockAlerts: StockAlert[];
  InventoryStats: ReturnType<typeof getInventoryStats> | null;

  // Loading states
  isLoading: boolean;
  isLoadingProducts: boolean;
  isLoadingOrders: boolean;
  isLoadingInventory: boolean;

  // User and Authentication
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userId: string;
  userPreferences: UserPreferences | null;

  // Error handling
  error: string | null;
  authError: string | null;

  // Firebase integration flags
  useFirebase: boolean;
  lastSync: number;
}

interface StoreActions {
  // Firebase data operations
  loadProducts: (forceRefresh?: boolean) => Promise<void>;
  loadPopularProducts: () => Promise<void>;
  loadUserPreferences: (userId: string) => Promise<void>;
  syncToFirebase: () => Promise<void>;

  // Product operations
  trackProductView: (productId: string) => Promise<void>;

  // Enhanced search operations
  searchProductsWithAI: (
    searchQuery: string,
    searchTerms: string[],
    searchType?: 'voice' | 'image' | 'text',
    options?: {
      minRelevanceScore?: number;
      maxResults?: number;
      boostPopular?: boolean;
    }
  ) => Promise<{
    products: Product[];
    relevanceScores: { [key: string]: number };
    searchMetadata: {
      originalQuery: string;
      processedTerms: string[];
      searchType: string;
      totalMatches: number;
    };
  }>;

  searchProductsByTerms: (
    searchTerms: string[],
    options?: {
      minRelevanceScore?: number;
      maxResults?: number;
      includePartialMatches?: boolean;
    }
  ) => Promise<{ products: Product[]; relevanceScores: { [key: string]: number } }>;

  searchProductsBySuggestedNames: (
    suggestedNames: string[],
    options?: {
      minRelevanceScore?: number;
      maxResults?: number;
    }
  ) => Promise<{ products: Product[]; relevanceScores: { [key: string]: number } }>;

  // Inventory operations
  loadInventoryItems: () => Promise<void>;
  loadStockAlerts: () => Promise<void>;
  updateInventoryStock: (inventoryId: string, size: string, newStock: number, reason: string) => Promise<void>;
  refreshInventoryStats: () => void;

  // Cart operations
  addToCart: (cartItem: CartItem) => void;
  calculateCartPrice: () => void;
  incrementCartItemQuantity: (id: string, size: string) => void;
  decrementCartItemQuantity: (id: string, size: string) => void;
  removeFromCart: (id: string, size: string) => void;
  clearCart: () => void;
  fixCartItemImages: () => void;

  // Favorites operations
  addToFavoriteList: (type: string, id: string) => Promise<void>;
  deleteFromFavoriteList: (type: string, id: string) => Promise<void>;
  fixFavoritesImages: () => void;
  
  // Order operations
  sanitizeCartItemsForStore: (cartItems: CartItem[]) => CartItem[];
  addToOrderHistoryListFromCart: (
    paymentDetails: any,
  ) => Promise<{success: boolean; error?: string}>;
  loadUserOrders: () => Promise<void>;
  loadOrderHistory: () => Promise<void>;

  // Authentication
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  registerUser: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  setUserProfile: (profile: UserProfile) => void;

  // Settings
  setUserId: (userId: string) => void;
  setUseFirebase: (use: boolean) => void;
  toggleFirebaseMode: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

type Store = StoreState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state - NO LOCAL DATA, start empty and load from Firebase
      CoffeeList: [],
      BeanList: [],
      ProductsList: [],
      PopularProducts: [],
      CartPrice: '0.00',
      FavoritesList: [],
      CartList: [],
      OrderHistoryList: [],
      InventoryItems: [],
      StockAlerts: [],
      InventoryStats: null,
      isLoading: false,
      isLoadingProducts: false,
      isLoadingOrders: false,
      isLoadingInventory: false,
      user: null,
      userProfile: null,
      isAuthenticated: false,
      isAuthLoading: false,
      userId: 'default-user', // In a real app, this would come from authentication
      userPreferences: null,
      error: null,
      authError: null,
      useFirebase: true, // Always use Firebase
      lastSync: 0,

      // Firebase data operations
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      loadProducts: async (forceRefresh = false) => {
        set({isLoadingProducts: true, error: null});
        try {
          const products = await fetchProducts(); // fetch from 'products' collection
          const CoffeeList = products.filter(p => p.type === 'Coffee');
          const BeanList = products.filter(p => p.type === 'Bean');
          set({
            CoffeeList,
            BeanList,
            ProductsList: products,
            isLoadingProducts: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoadingProducts: false,
            error: error.message || 'Failed to load products',
          });
        }
      },

      loadPopularProducts: async () => {
        if (!get().useFirebase) {
          return;
        }

        try {
          const popularIds = await getPopularProducts();
          const allProducts = get().ProductsList;
          const popularProducts = allProducts.filter(p =>
            popularIds.includes(p.id || ''),
          );

          set({PopularProducts: popularProducts});
        } catch (error) {
          console.error('Error loading popular products:', error);
        }
      },

      loadUserPreferences: async (userId: string) => {
        if (!get().useFirebase) {
          return;
        }

        try {
          const preferences = await getUserPreferences(userId);
          set({userPreferences: preferences, userId});

          // Update favorites list based on preferences
          if (preferences?.favorites) {
            const allProducts = get().ProductsList;
            const favoriteProducts = allProducts.filter(p =>
              preferences.favorites.includes(p.id || ''),
            );
            set({FavoritesList: favoriteProducts});
          }
        } catch (error) {
          console.error('Error loading user preferences:', error);
        }
      },

      syncToFirebase: async () => {
        const state = get();
        if (!state.useFirebase || !state.userId) {
          return;
        }

        try {
          // Sync user preferences
          await updateUserPreferences(state.userId, {
            favorites: state.FavoritesList.map(item => item.id || ''),
            orderHistory: state.OrderHistoryList.map(order => order.id || ''),
          });

          console.log('✅ Synced to Firebase successfully');
        } catch (error) {
          console.error('Error syncing to Firebase:', error);
          set({error: 'Failed to sync data to Firebase'});
        }
      },

      // Product tracking
      trackProductView: async (productId: string) => {
        if (!get().useFirebase) {
          return;
        }

        try {
          await updateProductPopularity(productId);
        } catch (error) {
          console.error('Error tracking product view:', error);
        }
      },

      // Cart operations (enhanced)
      addToCart: (cartItem: CartItem) =>
        set(
          produce((state: StoreState) => {
            // Convert Firebase URLs to local images before adding to cart
            const cartItemWithLocalImages = updateProductWithLocalImages(cartItem);
            
            let found = false;
            for (let i = 0; i < state.CartList.length; i++) {
              if (state.CartList[i].id === cartItemWithLocalImages.id) {
                found = true;
                let j;
                for (j = 0; j < state.CartList[i].prices.length; j++) {
                  if (
                    state.CartList[i].prices[j].size === cartItemWithLocalImages.prices[0].size
                  ) {
                    state.CartList[i].prices[j].quantity =
                      (state.CartList[i].prices[j].quantity || 1) + 1;
                    break;
                  }
                }
                if (j === state.CartList[i].prices.length) {
                  state.CartList[i].prices.push({
                    ...cartItemWithLocalImages.prices[0],
                    quantity: 1,
                  });
                }
                state.CartList[i].prices.sort((a: any, b: any) => {
                  if (a.size > b.size) {
                    return -1;
                  }
                  if (a.size < b.size) {
                    return 1;
                  }
                  return 0;
                });
                break;
              }
            }
            if (!found) {
              state.CartList.push({
                ...cartItemWithLocalImages,
                prices: [{...cartItemWithLocalImages.prices[0], quantity: 1}],
              });
            }
          }),
        ),

      calculateCartPrice: () =>
        set(
          produce((state: StoreState) => {
            let totalprice = 0;
            for (let i = 0; i < state.CartList.length; i++) {
              let tempprice = 0;
              for (let j = 0; j < state.CartList[i].prices.length; j++) {
                const price = parseFloat(state.CartList[i].prices[j].price);
                const quantity = state.CartList[i].prices[j].quantity || 1;
                tempprice = tempprice + price * quantity;
              }
              totalprice = totalprice + tempprice;
            }
            state.CartPrice = totalprice.toFixed(2).toString();
          }),
        ),

      incrementCartItemQuantity: (id: string, size: string) =>
        set(
          produce((state: StoreState) => {
            for (let item of state.CartList) {
              if (item.id === id) {
                for (let price of item.prices) {
                  if (price.size === size) {
                    price.quantity = (price.quantity || 1) + 1;
                    break;
                  }
                }
                break;
              }
            }
          }),
        ),

      decrementCartItemQuantity: (id: string, size: string) =>
        set(
          produce((state: StoreState) => {
            for (let item of state.CartList) {
              if (item.id === id) {
                for (let price of item.prices) {
                  if (price.size === size) {
                    if ((price.quantity || 1) > 1) {
                      price.quantity = (price.quantity || 1) - 1;
                    }
                    break;
                  }
                }
                break;
              }
            }
          }),
        ),

      removeFromCart: (id: string, size: string) =>
        set(
          produce((state: StoreState) => {
            for (let i = 0; i < state.CartList.length; i++) {
              if (state.CartList[i].id === id) {
                state.CartList[i].prices = state.CartList[i].prices.filter(
                  (price: any) => price.size !== size,
                );
                if (state.CartList[i].prices.length === 0) {
                  state.CartList.splice(i, 1);
                }
                break;
              }
            }
          }),
        ),

      clearCart: () => set({CartList: [], CartPrice: '0.00'}),

      // Fix existing cart items to use local images
      fixCartItemImages: () =>
        set(
          produce((state: StoreState) => {
            console.log('🔄 Fixing cart item images...');
            state.CartList = state.CartList.map(item => {
              const updatedItem = updateProductWithLocalImages(item);
              console.log(`✅ Fixed images for: ${item.name}`);
              return updatedItem;
            });
            console.log('🎉 All cart items updated with local images');
          }),
        ),

      // Favorites operations (enhanced with Firebase sync)
      addToFavoriteList: async (type: string, id: string) => {
        set(
          produce((state: StoreState) => {
            const productsList = state.ProductsList;
            const product = productsList.find(item => item.id === id);
            if (product) {
              const existingIndex = state.FavoritesList.findIndex(
                fav => fav.id === id,
              );
              if (existingIndex === -1) {
                // Ensure product has local images when adding to favorites
                const productWithLocalImages = updateProductWithLocalImages(product);
                state.FavoritesList.push(productWithLocalImages);
              }
            }
          }),
        );

        // Sync to Firebase if enabled
        const currentState = get();
        if (currentState.useFirebase && currentState.userId) {
          try {
            await updateUserPreferences(currentState.userId, {
              favorites: currentState.FavoritesList.map(item => item.id || ''),
            });
          } catch (error) {
            console.error('Error syncing favorites to Firebase:', error);
          }
        }
      },

      deleteFromFavoriteList: async (type: string, id: string) => {
        set(
          produce((state: StoreState) => {
            state.FavoritesList = state.FavoritesList.filter(
              (item: any) => item.id !== id,
            );
          }),
        );

        // Sync to Firebase if enabled
        const currentState = get();
        if (currentState.useFirebase && currentState.userId) {
          try {
            await updateUserPreferences(currentState.userId, {
              favorites: currentState.FavoritesList.map(item => item.id || ''),
            });
          } catch (error) {
            console.error('Error syncing favorites to Firebase:', error);
          }
        }
      },

      // Fix existing favorites to use local images
      fixFavoritesImages: () =>
        set(
          produce((state: StoreState) => {
            console.log('🔄 Fixing favorites images...');
            state.FavoritesList = state.FavoritesList.map(item => {
              const updatedItem = updateProductWithLocalImages(item);
              console.log(`✅ Fixed favorite images for: ${item.name}`);
              return updatedItem;
            });
            console.log('🎉 All favorites updated with local images');
          }),
        ),

      // Sanitize cart items for Firebase compatibility
      sanitizeCartItemsForStore: (cartItems: CartItem[]): CartItem[] => {
        return cartItems.map(item => ({
          id: item.id || '',
          name: item.name || '',
          description: item.description || '',
          roasted: item.roasted || '',
          imageUrlSquare: item.imageUrlSquare || '',
          imageUrlPortrait: item.imageUrlPortrait || '',
          ingredients: item.ingredients || '',
          special_ingredient: item.special_ingredient || '',
          prices: (item.prices || []).map(price => ({
            size: price.size || '',
            price: price.price || '0.00',
            currency: price.currency || '$',
            quantity: price.quantity || 1,
          })),
          average_rating: item.average_rating || 0,
          ratings_count: item.ratings_count || '0',
          favourite: item.favourite || false,
          type: item.type || 'Coffee',
          index: item.index || 0,
          category: item.category,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
      },

      // Order operations (enhanced - only for local history, Firebase orders handled by payment service)
      addToOrderHistoryListFromCart: async (paymentDetails: any) => {
        const state = get();
        set({isLoading: true, error: null});

        try {
          // Sanitize cart items to prevent undefined values
          const sanitizedItems = get().sanitizeCartItemsForStore(state.CartList);

          const newOrder: Omit<Order, 'id'> = {
            userId: state.user?.uid || state.userId || 'default-user',
            items: sanitizedItems,
            totalAmount: parseFloat(state.CartPrice),
            paymentMethod: paymentDetails.paymentMethod || paymentDetails.method || 'unknown',
            orderDate: new Date(),
            status: paymentDetails.method === 'cash' || paymentDetails.paymentMethod === 'cash'
              ? 'confirmed'
              : 'pending',
            deliveryAddress: paymentDetails.customerInfo?.address || 
                           paymentDetails.address || 
                           state.userProfile?.address || '',
            paymentId: paymentDetails.paymentId || null,
            customerInfo: {
              name: paymentDetails.customerInfo?.name ||
                    state.userProfile?.displayName ||
                    `${state.userProfile?.firstName || ''} ${state.userProfile?.lastName || ''}`.trim() ||
                    'Unknown',
              email: paymentDetails.customerInfo?.email ||
                     state.user?.email || 'unknown@email.com',
              phone: paymentDetails.customerInfo?.phone ||
                     state.userProfile?.phone || '',
            },
          };

          // Only add to local order history - Firebase orders are handled by payment service
          const orderId = paymentDetails.orderId || Date.now().toString();

          set(
            produce((stateToUpdate: StoreState) => {
              const orderWithId = {
                ...newOrder,
                id: orderId,
                OrderDate:
                  newOrder.orderDate.toDateString() +
                  ' ' +
                  newOrder.orderDate.toLocaleTimeString(),
                CartList: newOrder.items,
                CartListPrice: newOrder.totalAmount.toFixed(2).toString(),
              };

              stateToUpdate.OrderHistoryList.unshift(orderWithId);
              stateToUpdate.CartList = [];
              stateToUpdate.CartPrice = '0.00';
              stateToUpdate.isLoading = false;
            }),
          );

          // Sync the order history to Firebase user preferences if enabled
          if (state.useFirebase && state.userId && state.userId !== 'default-user') {
            try {
              await updateUserPreferences(state.userId, {
                orderHistory: [orderId, ...get().userPreferences?.orderHistory || []],
              });
              console.log(`✅ User preferences updated with order ${orderId}`);
            } catch (syncError) {
              console.error('⚠️ Failed to sync order to user preferences:', syncError);
              // Don't fail the operation if sync fails
            }
          }

          return {success: true};
        } catch (error: any) {
          console.error('Error saving order:', error);
          set({
            isLoading: false,
            error:
              'Failed to save order: ' + (error.message || 'Unknown error'),
          });
          return {
            success: false,
            error: error.message || 'Failed to save order',
          };
        }
      },

      loadUserOrders: async () => {
        const state = get();
        if (!state.user?.uid || !state.useFirebase) {
          return;
        }

        set({isLoadingOrders: true, error: null});
        try {
          console.log(`🔄 Loading orders for user ${state.user.uid}...`);
          
          // Try to load from user's orders subcollection first
          let orders = await authService.getUserOrders(state.user.uid);
          
          // If no orders in subcollection, fallback to main orders collection
          if (orders.length === 0) {
            console.log('📦 No orders in subcollection, trying main orders collection...');
            orders = await fetchUserOrders(state.user.uid);
          }
          
          const formattedOrders = orders.map(order => ({
            ...order,
            OrderDate:
              order.orderDate instanceof Date
                ? order.orderDate.toDateString() +
                  ' ' +
                  order.orderDate.toLocaleTimeString()
                : order.createdAt
                ? new Date(order.createdAt.toDate()).toDateString() +
                  ' ' +
                  new Date(order.createdAt.toDate()).toLocaleTimeString()
                : new Date(order.orderDate).toDateString() +
                  ' ' +
                  new Date(order.orderDate).toLocaleTimeString(),
            CartList: order.items,
            CartListPrice: order.totalAmount.toFixed(2).toString(),
          }));

          set({
            OrderHistoryList: formattedOrders,
            isLoadingOrders: false,
            error: null,
          });
          
          console.log(`✅ Loaded ${formattedOrders.length} orders for user`);
        } catch (error: any) {
          console.error('❌ Error loading user orders:', error);
          set({
            isLoadingOrders: false,
            error:
              'Failed to load orders: ' + (error.message || 'Unknown error'),
          });
        }
      },

      // Load order history (alias for loadUserOrders for backward compatibility)
      loadOrderHistory: async () => {
        const currentState = get();
        await currentState.loadUserOrders();
      },

      // Authentication
      signIn: async (email: string, password: string) => {
        set({isAuthLoading: true, authError: null});
        try {
          const result = await authService.loginUser(email, password);
          if (result.success && result.user) {
            const userProfile = await authService.getUserProfile(
              result.user.uid,
            );
            set({
              user: result.user,
              userProfile,
              isAuthenticated: true,
              isAuthLoading: false,
              userId: result.user.uid,
              authError: null,
            });

            // Load user preferences after successful login
            get().loadUserPreferences(result.user.uid);
          } else {
            // Handle enhanced error structure with severity and suggestions
            const errorMessage = result.error?.message || result.error || 'Failed to sign in';
            console.log('Login error details:', result.error); // For debugging
            set({
              isAuthLoading: false,
              authError: errorMessage,
            });
          }
        } catch (error: any) {
          console.error('Login catch error:', error);
          set({
            isAuthLoading: false,
            authError: error.message || 'Failed to sign in',
          });
        }
      },

      signOut: async () => {
        set({isAuthLoading: true, authError: null});
        try {
          await authService.logoutUser();
          set({
            user: null,
            userProfile: null,
            isAuthenticated: false,
            isAuthLoading: false,
            userId: '',
            authError: null,
            // Clear user-specific data
            FavoritesList: [],
            CartList: [],
            OrderHistoryList: [],
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          set({
            isAuthLoading: false,
            authError: error.message || 'Failed to sign out',
          });
        }
      },

      registerUser: async (
        email: string,
        password: string,
        firstName: string,
        lastName: string,
      ) => {
        set({isAuthLoading: true, authError: null});
        try {
          const result = await authService.registerUser(
            email,
            password,
            firstName,
            lastName,
          );
          if (result.success && result.user) {
            const userProfile = await authService.getUserProfile(
              result.user.uid,
            );
            set({
              user: result.user,
              userProfile,
              isAuthenticated: true,
              isAuthLoading: false,
              userId: result.user.uid,
              authError: null,
            });

            // Load user preferences after successful registration
            get().loadUserPreferences(result.user.uid);
          } else {
            // Handle enhanced error structure with comprehensive details
            const errorMessage = result.error?.message || result.error || 'Failed to register';
            console.log('Registration error details:', result.error); // For debugging
            set({
              isAuthLoading: false,
              authError: errorMessage,
            });
          }
        } catch (error: any) {
          console.error('Registration catch error:', error);
          set({
            isAuthLoading: false,
            authError: error.message || 'Failed to register',
          });
        }
      },

      sendPasswordReset: async (email: string) => {
        set({isAuthLoading: true, authError: null});
        try {
          const result = await authService.sendPasswordReset(email);
          if (result.success) {
            set({
              isAuthLoading: false,
              authError: null,
            });
            return true;
          } else {
            // Handle enhanced error structure
            const errorMessage = result.error?.message || result.error || 'Failed to send password reset';
            console.log('Password reset error details:', result.error); // For debugging
            set({
              isAuthLoading: false,
              authError: errorMessage,
            });
            return false;
          }
        } catch (error: any) {
          console.error('Password reset catch error:', error);
          set({
            isAuthLoading: false,
            authError: error.message || 'Failed to send password reset',
          });
          return false;
        }
      },

      setUserProfile: (profile: UserProfile) => {
        set({userProfile: profile});
      },

      // Settings
      setUserId: (userId: string) => {
        set({userId});
        get().loadUserPreferences(userId);
      },

      setUseFirebase: (use: boolean) => {
        set({useFirebase: use});
        if (use) {
          get().loadProducts(true);
        }
      },

      toggleFirebaseMode: () => {
        const currentMode = get().useFirebase;
        get().setUseFirebase(!currentMode);
      },

      // Inventory operations
      loadInventoryItems: async () => {
        if (!get().useFirebase) return;
        
        set({isLoadingInventory: true, error: null});
        try {
          const items = await fetchInventoryItems();
          const stats = getInventoryStats(items);
          set({
            InventoryItems: items,
            InventoryStats: stats,
            isLoadingInventory: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoadingInventory: false,
            error: error.message || 'Failed to load inventory items',
          });
        }
      },

      loadStockAlerts: async () => {
        if (!get().useFirebase) return;
        
        try {
          const alerts = await fetchStockAlerts();
          set({StockAlerts: alerts});
        } catch (error: any) {
          console.error('Error loading stock alerts:', error);
          set({error: error.message || 'Failed to load stock alerts'});
        }
      },

      updateInventoryStock: async (inventoryId: string, size: string, newStock: number, reason: string) => {
        if (!get().useFirebase || !get().user?.uid) return;
        
        try {
          await updateStock(inventoryId, size, newStock, reason, get().user!.uid);
          // Reload inventory items to get updated data
          await get().loadInventoryItems();
          await get().loadStockAlerts();
        } catch (error: any) {
          console.error('Error updating inventory stock:', error);
          set({error: error.message || 'Failed to update stock'});
          throw error;
        }
      },

      refreshInventoryStats: () => {
        const items = get().InventoryItems;
        const stats = getInventoryStats(items);
        set({InventoryStats: stats});
      },

      // Enhanced search operations
      searchProductsWithAI: async (
        searchQuery: string,
        searchTerms: string[],
        searchType?: 'voice' | 'image' | 'text',
        options?: {
          minRelevanceScore?: number;
          maxResults?: number;
          boostPopular?: boolean;
        }
      ) => {
        if (!get().useFirebase) {
          return {
            products: [],
            relevanceScores: {},
            searchMetadata: {
              originalQuery: '',
              processedTerms: [],
              searchType: '',
              totalMatches: 0,
            },
          };
        }

        try {
          const result = await searchProductsWithAI(searchQuery, searchTerms, searchType, options);
          return result;
        } catch (error: any) {
          console.error('Error searching products with AI:', error);
          return {
            products: [],
            relevanceScores: {},
            searchMetadata: {
              originalQuery: '',
              processedTerms: [],
              searchType: '',
              totalMatches: 0,
            },
          };
        }
      },

      searchProductsByTerms: async (
        searchTerms: string[],
        options?: {
          minRelevanceScore?: number;
          maxResults?: number;
          includePartialMatches?: boolean;
        }
      ) => {
        if (!get().useFirebase) {
          return {
            products: [],
            relevanceScores: {},
          };
        }

        try {
          const result = await searchProductsByTerms(searchTerms, options);
          return result;
        } catch (error: any) {
          console.error('Error searching products by terms:', error);
          return {
            products: [],
            relevanceScores: {},
          };
        }
      },

      searchProductsBySuggestedNames: async (
        suggestedNames: string[],
        options?: {
          minRelevanceScore?: number;
          maxResults?: number;
        }
      ) => {
        if (!get().useFirebase) {
          return {
            products: [],
            relevanceScores: {},
          };
        }

        try {
          const result = await searchProductsBySuggestedNames(suggestedNames, options);
          return result;
        } catch (error: any) {
          console.error('Error searching products by suggested names:', error);
          return {
            products: [],
            relevanceScores: {},
          };
        }
      },

      // Error handling
      setError: (error: string | null) => set({error}),
      clearError: () => set({error: null}),
    }),
    {
      name: 'coffee-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist loading states and errors
      partialize: (state: Store) => ({
        CoffeeList: state.CoffeeList,
        BeanList: state.BeanList,
        ProductsList: state.ProductsList,
        PopularProducts: state.PopularProducts,
        CartPrice: state.CartPrice,
        FavoritesList: state.FavoritesList,
        CartList: state.CartList,
        OrderHistoryList: state.OrderHistoryList,
        InventoryItems: state.InventoryItems,
        StockAlerts: state.StockAlerts,
        InventoryStats: state.InventoryStats,
        userId: state.userId,
        userPreferences: state.userPreferences,
        useFirebase: state.useFirebase,
        lastSync: state.lastSync,
      }),
    },
  ),
);
