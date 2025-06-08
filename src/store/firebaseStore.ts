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
  Product,
  CartItem,
  Order,
  UserPreferences,
  Price,
  fetchUserOrders,
} from '../services/firebaseServices';
import authService, {UserProfile} from '../services/authService';
import {User} from 'firebase/auth';

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

  // Loading states
  isLoading: boolean;
  isLoadingProducts: boolean;
  isLoadingOrders: boolean;

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

  // Cart operations
  addToCart: (cartItem: CartItem) => void;
  calculateCartPrice: () => void;
  incrementCartItemQuantity: (id: string, size: string) => void;
  decrementCartItemQuantity: (id: string, size: string) => void;
  removeFromCart: (id: string, size: string) => void;
  clearCart: () => void;

  // Favorites operations
  addToFavoriteList: (type: string, id: string) => Promise<void>;
  deleteFromFavoriteList: (type: string, id: string) => Promise<void>;
  // Order operations
  addToOrderHistoryListFromCart: (
    paymentDetails: any,
  ) => Promise<{success: boolean; error?: string}>;
  loadUserOrders: () => Promise<void>;

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
      isLoading: false,
      isLoadingProducts: false,
      isLoadingOrders: false,
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
            let found = false;
            for (let i = 0; i < state.CartList.length; i++) {
              if (state.CartList[i].id === cartItem.id) {
                found = true;
                let j;
                for (j = 0; j < state.CartList[i].prices.length; j++) {
                  if (
                    state.CartList[i].prices[j].size === cartItem.prices[0].size
                  ) {
                    state.CartList[i].prices[j].quantity =
                      (state.CartList[i].prices[j].quantity || 1) + 1;
                    break;
                  }
                }
                if (j === state.CartList[i].prices.length) {
                  state.CartList[i].prices.push({
                    ...cartItem.prices[0],
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
                ...cartItem,
                prices: [{...cartItem.prices[0], quantity: 1}],
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
                state.FavoritesList.push(product);
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

      // Order operations (enhanced with Firebase)
      addToOrderHistoryListFromCart: async (paymentDetails: any) => {
        const state = get();
        set({isLoading: true, error: null});

        try {
          const newOrder: Omit<Order, 'id'> = {
            userId: state.user?.uid || state.userId,
            items: [...state.CartList],
            totalAmount: parseFloat(state.CartPrice),
            paymentMethod: paymentDetails.method || 'unknown',
            orderDate: new Date(),
            status:
              paymentDetails.method === 'Cash on Delivery'
                ? 'confirmed'
                : 'pending',
            deliveryAddress:
              paymentDetails.address || state.userProfile?.address || '',
            paymentId: paymentDetails.paymentId || null,
            customerInfo: paymentDetails.customerInfo || {
              name:
                state.userProfile?.displayName ||
                `${state.userProfile?.firstName} ${state.userProfile?.lastName}` ||
                'Unknown',
              email: state.user?.email || 'unknown@email.com',
              phone: state.userProfile?.phone || '',
            },
          };

          // Add to global orders collection in Firebase
          if (state.useFirebase) {
            const orderId = await addOrder(newOrder);

            // Also add to user's personal orders subcollection
            if (state.user?.uid) {
              await authService.addOrderToHistory(state.user.uid, orderId);
            }

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
          } else {
            // Local storage fallback
            set(
              produce((stateToUpdate: StoreState) => {
                const orderWithId = {
                  ...newOrder,
                  id: Date.now().toString(),
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
          const orders = await fetchUserOrders(state.user.uid);
          const formattedOrders = orders.map(order => ({
            ...order,
            OrderDate:
              order.orderDate instanceof Date
                ? order.orderDate.toDateString() +
                  ' ' +
                  order.orderDate.toLocaleTimeString()
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
        } catch (error: any) {
          console.error('Error loading user orders:', error);
          set({
            isLoadingOrders: false,
            error:
              'Failed to load orders: ' + (error.message || 'Unknown error'),
          });
        }
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
            set({
              isAuthLoading: false,
              authError: result.error || 'Failed to sign in',
            });
          }
        } catch (error: any) {
          set({
            isAuthLoading: false,
            authError: error.message || 'Failed to sign in',
          });
        }
      },
      signOut: async () => {
        set({isAuthLoading: true});
        try {
          const result = await authService.logoutUser();
          if (result.success) {
            set({
              user: null,
              userProfile: null,
              isAuthenticated: false,
              isAuthLoading: false,
              userId: 'default-user',
              userPreferences: null,
              FavoritesList: [],
              CartList: [],
              OrderHistoryList: [],
              authError: null,
            });
          } else {
            set({
              isAuthLoading: false,
              authError: result.error || 'Failed to sign out',
            });
          }
        } catch (error: any) {
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
            set({
              isAuthLoading: false,
              authError: result.error || 'Failed to register',
            });
          }
        } catch (error: any) {
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
          set({
            isAuthLoading: false,
            authError: result.success
              ? null
              : result.error || 'Failed to send password reset',
          });
          return result.success;
        } catch (error: any) {
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
        userId: state.userId,
        userPreferences: state.userPreferences,
        useFirebase: state.useFirebase,
        lastSync: state.lastSync,
      }),
    },
  ),
);
