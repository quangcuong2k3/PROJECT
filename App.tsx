import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View, ActivityIndicator, StyleSheet, LogBox} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {StripeProvider} from '@stripe/stripe-react-native';
import TabNavigator from './src/navigators/TabNavigator';
import AuthNavigator from './src/navigators/AuthNavigator';
import DetailsScreen from './src/screens/DetailsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import {useStore} from './src/store/firebaseStore';
import authService from './src/services/authService';
import {COLORS} from './src/theme/theme';
import Toast from 'react-native-toast-message';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const App = () => {
  LogBox.ignoreLogs(['@firebase/auth: Auth']);
  LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
  LogBox.ignoreAllLogs(); //Ignore all log notifications
  const [isLoading, setIsLoading] = useState(true);
  const {isAuthenticated, setUserProfile, loadProducts, loadUserPreferences} =
    useStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load products from Firebase
        await loadProducts();

        // Check for existing user session
        const sessionResult = await authService.checkUserSession();
        if (sessionResult.isAuthenticated && sessionResult.userToken) {
          // Get current user from Firebase Auth
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            // Load user profile from Firestore
            const userProfile = await authService.getUserProfile(
              currentUser.uid,
            );
            if (userProfile) {
              setUserProfile(userProfile);
              // Load user preferences
              await loadUserPreferences(currentUser.uid);
            }
          }
        } // Listen to auth state changes
        const unsubscribe = authService.onAuthStateChanged(async authUser => {
          if (authUser) {
            const userProfile = await authService.getUserProfile(authUser.uid);
            if (userProfile) {
              setUserProfile(userProfile);
              await loadUserPreferences(authUser.uid);
            }
          }
        });

        setIsLoading(false);
        // Hide splash screen after initialization
        await SplashScreen.hideAsync();

        // Cleanup auth listener on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoading(false);
        // Hide splash screen even if there's an error
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, [loadProducts, loadUserPreferences, setUserProfile]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  return (
    <StripeProvider publishableKey="pk_test_51RX1WA7wRtne0I6D93hoCGp1Rc7TCyTSpEPociAUft1Jpb3CW7xcGPgyxcbm3HU08UJqhdDgqBlV0VMlMlXWbQjE003TZH52Cg">
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {isAuthenticated ? (
            // Authenticated user screens
            <>
              <Stack.Screen
                name="Tab"
                component={TabNavigator}
                options={{animation: 'slide_from_bottom'}}
              />
              <Stack.Screen
                name="Details"
                component={DetailsScreen}
                options={{animation: 'slide_from_bottom'}}
              />
              <Stack.Screen
                name="Payment"
                component={PaymentScreen}
                options={{animation: 'slide_from_bottom'}}
              />
            </>
          ) : (
            // Authentication screens
            <Stack.Screen
              name="Auth"
              component={AuthNavigator}
              options={{animation: 'slide_from_bottom'}}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
});

export default App;
