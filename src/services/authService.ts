import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, firestore } from '../../firebaseconfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateInitials, generateAvatarColor, sanitizeNameForAvatar } from '../utils/avatarUtils';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  // Avatar data for users without profile images
  avatarInitials?: string;
  avatarBackgroundColor?: string;
  favoriteItems: string[];
  cartItems: any[];
  orderHistory: string[];
  orders?: string[]; // Alternative field name for orders (for compatibility)
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark';
    defaultPaymentMethod?: string;
  };
  createdAt: any;
  updatedAt: any;
}

class AuthService {
  // Register new user with email and password
  async registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Keep original names but generate avatar data from sanitized versions
      const sanitizedFirstName = sanitizeNameForAvatar(firstName);
      const sanitizedLastName = sanitizeNameForAvatar(lastName);

      // Generate avatar data from sanitized names (for initials only)
      const avatarInitials = generateInitials(sanitizedFirstName, sanitizedLastName);
      const avatarBackgroundColor = generateAvatarColor(avatarInitials);

      // Update user profile with display name using original names
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      // Create user profile in Firestore with original names
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        // Avatar data for users without profile images
        avatarInitials,
        avatarBackgroundColor,
        favoriteItems: [],
        cartItems: [],
        orderHistory: [],
        orders: [], // Initialize orders field for compatibility
        preferences: {
          notifications: true,
          theme: 'dark',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'users', user.uid), userProfile);

      // Cache user session
      await AsyncStorage.setItem('userToken', user.uid);
      await AsyncStorage.setItem('userEmail', user.email!);

      console.log(`✅ User registered with avatar: ${avatarInitials} (${avatarBackgroundColor})`);

      return { success: true, user };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Login user with email and password
  async loginUser(
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Cache user session
      await AsyncStorage.setItem('userToken', user.uid);
      await AsyncStorage.setItem('userEmail', user.email!);

      // Update last login timestamp
      await updateDoc(doc(firestore, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true, user };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logoutUser(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      // Clear cached session
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userProfile');

      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordReset(
    email: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // If firstName or lastName is being updated, regenerate avatar data
      if (updates.firstName || updates.lastName) {
        const currentProfile = await this.getUserProfile(uid);
        const firstName = updates.firstName || currentProfile?.firstName || '';
        const lastName = updates.lastName || currentProfile?.lastName || '';

        // Keep original names but generate avatar from sanitized versions
        const sanitizedFirstName = sanitizeNameForAvatar(firstName);
        const sanitizedLastName = sanitizeNameForAvatar(lastName);
        const avatarInitials = generateInitials(sanitizedFirstName, sanitizedLastName);
        const avatarBackgroundColor = generateAvatarColor(avatarInitials);

        // Store original names, not sanitized ones
        updates.firstName = firstName.trim();
        updates.lastName = lastName.trim();
        updates.avatarInitials = avatarInitials;
        updates.avatarBackgroundColor = avatarBackgroundColor;

        // Update display name with original names
        if (firstName.trim() && lastName.trim()) {
          updates.displayName = `${firstName.trim()} ${lastName.trim()}`;
        }

        console.log(`✅ Avatar updated: ${avatarInitials} (${avatarBackgroundColor}) for ${firstName.trim()} ${lastName.trim()}`);
      }

      await updateDoc(doc(firestore, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user session exists
  async checkUserSession(): Promise<{
    isAuthenticated: boolean;
    userToken?: string;
    userEmail?: string;
  }> {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userEmail = await AsyncStorage.getItem('userEmail');

      if (userToken && userEmail) {
        return {
          isAuthenticated: true,
          userToken,
          userEmail,
        };
      }
      return { isAuthenticated: false };
    } catch (error) {
      console.error('Error checking user session:', error);
      return { isAuthenticated: false };
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Add item to user favorites
  async addToFavorites(
    uid: string,
    itemId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      const updatedFavorites = [...userProfile.favoriteItems];
      if (!updatedFavorites.includes(itemId)) {
        updatedFavorites.push(itemId);
        await this.updateUserProfile(uid, { favoriteItems: updatedFavorites });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Remove item from user favorites
  async removeFromFavorites(
    uid: string,
    itemId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      const updatedFavorites = userProfile.favoriteItems.filter(
        id => id !== itemId,
      );
      await this.updateUserProfile(uid, { favoriteItems: updatedFavorites });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update user cart
  async updateUserCart(
    uid: string,
    cartItems: any[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateUserProfile(uid, { cartItems });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Add order to user's orders subcollection and orderHistory array
  async addOrderToUserCollection(
    uid: string,
    orderId: string,
    orderData: any,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Adding order ${orderId} to user ${uid} subcollection...`);

      // Add order to user's orders subcollection
      const userOrdersCollection = collection(firestore, 'users', uid, 'orders');
      const orderDocRef = doc(userOrdersCollection, orderId);

      await setDoc(orderDocRef, {
        ...orderData,
        orderId: orderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Order ${orderId} added to user ${uid} orders subcollection`);

      // Also add to orderHistory array for backward compatibility
      await this.addOrderToHistory(uid, orderId);

      return { success: true };
    } catch (error: any) {
      console.error(`❌ Error adding order to user collection:`, error);
      return { success: false, error: error.message };
    }
  }

  // Add order to user history (keeps existing functionality)
  async addOrderToHistory(
    uid: string,
    orderId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      const updatedOrderHistory = [...userProfile.orderHistory, orderId];

      // Update both orderHistory array and orders field (if it exists)
      const updateData: any = {
        orderHistory: updatedOrderHistory,
      };

      // Also update 'orders' field if it exists in the user document
      // This handles both the current structure and any legacy 'orders' field
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.orders !== undefined) {
          // If user document has an 'orders' field, update it too
          const currentOrders = Array.isArray(userData.orders) ? userData.orders : [];
          updateData.orders = [...currentOrders, orderId];
        }
      }

      await this.updateUserProfile(uid, updateData);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get user orders from subcollection
  async getUserOrders(uid: string): Promise<any[]> {
    try {
      console.log(`🔄 Fetching orders for user ${uid} from subcollection...`);

      const userOrdersCollection = collection(firestore, 'users', uid, 'orders');
      const ordersQuery = query(userOrdersCollection, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);

      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`✅ Found ${orders.length} orders for user ${uid}`);
      return orders;
    } catch (error) {
      console.error('❌ Error fetching user orders from subcollection:', error);
      return [];
    }
  }
}

export default new AuthService();
