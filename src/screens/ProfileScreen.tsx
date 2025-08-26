import React, {useState, useEffect, useRef} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Easing,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ToastAndroid,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import {BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import UserAvatar from '../components/UserAvatar';
import CustomIcon from '../components/CustomIcon';
import ChatbotModal from '../components/ChatbotModal';
import {useStore} from '../store/firebaseStore';
import authService from '../services/authService';
import locationService, {DetailedAddress} from '../services/locationService';
import {UserContext} from '../services/chatbotService';
import {CHATBOT_CONFIG} from '../config/chatbotConfig';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({children, delay = 0, style}) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]);
    animation.start();
  }, [slideAnim, fadeAnim, scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [
            {translateY: slideAnim},
            {scale: scaleAnim},
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
};

const ProfileScreen = ({navigation}: any) => {
  const {
    user,
    userProfile,
    signOut,
    setUserProfile,
    isAuthenticated,
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Form validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{[key: string]: boolean}>({});
  
  // Location states
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<DetailedAddress | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);
  
  // Chatbot states
  const [showChatbot, setShowChatbot] = useState(false);

  const buttonPressAnim = useRef(new Animated.Value(1)).current;
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Validation functions
  const validateFirstName = (name: string): {isValid: boolean, error: string} => {
    if (!name.trim()) return {isValid: false, error: 'First name is required'};
    if (name.trim().length < 2) return {isValid: false, error: 'First name must be at least 2 characters'};
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) return {isValid: false, error: 'First name can only contain letters'};
    return {isValid: true, error: ''};
  };

  const validateLastName = (name: string): {isValid: boolean, error: string} => {
    if (!name.trim()) return {isValid: false, error: 'Last name is required'};
    if (name.trim().length < 2) return {isValid: false, error: 'Last name must be at least 2 characters'};
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) return {isValid: false, error: 'Last name can only contain letters'};
    return {isValid: true, error: ''};
  };

  const validatePhone = (phoneNumber: string): {isValid: boolean, error: string} => {
    if (!phoneNumber.trim()) return {isValid: false, error: 'Phone number is required'};
    
    // Remove all non-digit characters for validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Vietnamese phone number patterns
    const vietnamesePatterns = [
      /^(84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/, // Mobile
      /^(84|0)(2[0-9])[0-9]{8}$/, // Landline
    ];
    
    const isValidVietnamese = vietnamesePatterns.some(pattern => pattern.test(cleanPhone));
    
    if (!isValidVietnamese) {
      return {isValid: false, error: 'Please enter a valid Vietnamese phone number'};
    }
    
    return {isValid: true, error: ''};
  };

  const validateAddress = (addr: string): {isValid: boolean, error: string} => {
    if (!addr.trim()) return {isValid: false, error: 'Address is required'};
    if (addr.trim().length < 10) return {isValid: false, error: 'Please enter a complete address (at least 10 characters)'};
    return {isValid: true, error: ''};
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('84')) {
      // Format: +84 xxx xxx xxx
      const match = cleaned.match(/^84(\d{3})(\d{3})(\d{3})$/);
      if (match) return `+84 ${match[1]} ${match[2]} ${match[3]}`;
    } else if (cleaned.startsWith('0')) {
      // Format: 0xxx xxx xxx
      const match = cleaned.match(/^0(\d{3})(\d{3})(\d{3})$/);
      if (match) return `0${match[1]} ${match[2]} ${match[3]}`;
    }
    
    return phoneNumber;
  };

  // Validate field on change
  const validateField = (field: string, value: string) => {
    let validation;
    switch (field) {
      case 'firstName':
        validation = validateFirstName(value);
        break;
      case 'lastName':
        validation = validateLastName(value);
        break;
      case 'phone':
        validation = validatePhone(value);
        break;
      case 'address':
        validation = validateAddress(value);
        break;
      default:
        return;
    }

    setErrors(prev => ({
      ...prev,
      [field]: validation.error,
    }));

    setValidationStatus(prev => ({
      ...prev,
      [field]: validation.isValid,
    }));
  };

  // Check for unsaved changes
  const checkForChanges = () => {
    const hasChanges = 
      firstName !== (userProfile?.firstName || '') ||
      lastName !== (userProfile?.lastName || '') ||
      phone !== (userProfile?.phone || '') ||
      address !== (userProfile?.address || '') ||
      notifications !== (userProfile?.preferences?.notifications ?? true);
    
    setHasUnsavedChanges(hasChanges);
  };

  // Shake animation for errors
  const triggerShakeAnimation = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 10, duration: 100, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -10, duration: 100, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 10, duration: 100, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 100, useNativeDriver: true}),
    ]).start();
  };

  // Success animation
  const triggerSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(successAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
      Animated.delay(1500),
      Animated.timing(successAnim, {toValue: 0, duration: 300, useNativeDriver: true}),
    ]).start();
  };

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setPhone(userProfile.phone || '');
      setAddress(userProfile.address || '');
      setNotifications(userProfile.preferences?.notifications ?? true);
      
      // Reset form state when profile loads
      setErrors({});
      setValidationStatus({});
      setHasUnsavedChanges(false);
    }
  }, [userProfile]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Check for changes when form values change
  useEffect(() => {
    if (userProfile) {
      checkForChanges();
    }
  }, [firstName, lastName, phone, address, notifications, userProfile]);

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: notifications ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [notifications, toggleAnim]);

  const animateButtonPress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonPressAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;

    // Validate all fields before saving
    const firstNameValidation = validateFirstName(firstName);
    const lastNameValidation = validateLastName(lastName);
    const phoneValidation = validatePhone(phone);
    const addressValidation = validateAddress(address);

    const newErrors = {
      firstName: firstNameValidation.error,
      lastName: lastNameValidation.error,
      phone: phoneValidation.error,
      address: addressValidation.error,
    };

    const newValidationStatus = {
      firstName: firstNameValidation.isValid,
      lastName: lastNameValidation.isValid,
      phone: phoneValidation.isValid,
      address: addressValidation.isValid,
    };

    setErrors(newErrors);
    setValidationStatus(newValidationStatus);

    // Check if all fields are valid
    const isFormValid = Object.values(newValidationStatus).every(status => status);

    if (!isFormValid) {
      triggerShakeAnimation();
      ToastAndroid.show('Please fix the errors before saving', ToastAndroid.SHORT);
      return;
    }

    setIsLoading(true);
    try {
      const updates = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: formatPhoneNumber(phone),
        address: address.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        preferences: {
          ...userProfile.preferences,
          notifications,
        },
      };

      const result = await authService.updateUserProfile(user.uid, updates);
      if (result.success) {
        // Fetch the updated profile to get the new avatar data
        const updatedProfile = await authService.getUserProfile(user.uid);
        if (updatedProfile) {
          setUserProfile(updatedProfile);
          console.log(`✅ Profile updated with avatar: ${updatedProfile.avatarInitials}`);
        } else {
          setUserProfile({...userProfile, ...updates});
        }
        
        setIsEditing(false);
        setHasUnsavedChanges(false);
        triggerSuccessAnimation();
        
        ToastAndroid.showWithGravity(
          'Profile updated successfully! ✨',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );

      } else {
        triggerShakeAnimation();
        ToastAndroid.show(result.error || 'Failed to update profile', ToastAndroid.SHORT);
      }
    } catch (error: any) {
      triggerShakeAnimation();
      ToastAndroid.show(error.message || 'Failed to update profile', ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        '⚠️ Unsaved Changes',
        'You have unsaved changes. Are you sure you want to cancel?',
        [
          {text: 'Keep Editing', style: 'cancel'},
          {
            text: 'Discard Changes',
            style: 'destructive',
            onPress: () => {
              // Reset to original values
              if (userProfile) {
                setFirstName(userProfile.firstName || '');
                setLastName(userProfile.lastName || '');
                setPhone(userProfile.phone || '');
                setAddress(userProfile.address || '');
                setNotifications(userProfile.preferences?.notifications ?? true);
              }
              setIsEditing(false);
              setErrors({});
              setValidationStatus({});
              setHasUnsavedChanges(false);
            },
          },
        ],
        {cancelable: true}
      );
    } else {
      setIsEditing(false);
      setErrors({});
      setValidationStatus({});
    }
  };

  // Enhanced input handlers with validation
  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    validateField('firstName', text);
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    validateField('lastName', text);
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    validateField('phone', text);
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);
    validateField('address', text);
  };

  // Location functions
  const handleUseCurrentLocation = async () => {
    if (!isEditing) return;

    setIsLoadingLocation(true);
    try {
      // First check permissions
      const hasPermission = await locationService.requestLocationPermission();
      setLocationPermissionGranted(hasPermission);
      
      if (!hasPermission) {
        ToastAndroid.show(
          'Location permission required to use this feature',
          ToastAndroid.LONG
        );
        return;
      }

      // Get current location
      const location = await locationService.getCurrentDetailedAddress();
      
      if (location) {
        setCurrentLocation(location);
        setAddress(location.formattedAddress);
        validateField('address', location.formattedAddress);
        
        // Success feedback
        Vibration.vibrate([100, 50, 100]);
        ToastAndroid.showWithGravity(
          '📍 Location detected successfully!',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      } else {
        ToastAndroid.show(
          'Unable to get your location. Please try again or enter manually.',
          ToastAndroid.LONG
        );
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
      ToastAndroid.show(
        'Failed to get location. Please enter address manually.',
        ToastAndroid.SHORT
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleRefreshLocation = async () => {
    if (!isEditing || isLoadingLocation) return;
    
    // Clear current location and get fresh one
    setCurrentLocation(null);
    await handleUseCurrentLocation();
  };

  // Check location permission on component mount
  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        // Just check if we have permission without requesting
        const location = await locationService.getCurrentLocation();
        setLocationPermissionGranted(!!location);
      } catch (error) {
        setLocationPermissionGranted(false);
      }
    };
    checkLocationPermission();
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      '🚪 Sign Out',
      'Are you sure you want to sign out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.navigate('Login');
          },
        },
      ],
      {cancelable: true}
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Add any refresh logic here if needed
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Get user context for chatbot
  const getUserContext = (): UserContext => {
    return {
      firstName: userProfile?.firstName,
      lastName: userProfile?.lastName,
      email: user?.email || '',
      // You can add more context here when you have order history and favorites
      orderHistory: [], // TODO: Get from store when available
      favorites: [], // TODO: Get from store when available
      recentSearches: [], // TODO: Get from search history when available
    };
  };

  const handleOpenChatbot = () => {
    setShowChatbot(true);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.ScreenContainer}>
        <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
        <View style={styles.NotAuthenticatedContainer}>
          <AnimatedCard>
            <View style={styles.NotAuthenticatedCard}>
              <View style={styles.NotAuthIconContainer}>
                <CustomIcon
                  name="person"
                  color={COLORS.primaryWhiteHex}
                  size={FONTSIZE.size_30}
                />
              </View>
              <Text style={styles.NotAuthenticatedTitle}>Welcome to Coffee Shop</Text>
              <Text style={styles.NotAuthenticatedText}>
                Sign in to personalize your coffee experience and access exclusive features
              </Text>
              <TouchableOpacity
                style={styles.PremiumSignInButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}>
                <View style={styles.SignInButtonGradient}>
                  <Text style={styles.SignInButtonText}>Sign In</Text>
                  <CustomIcon
                    name="chevron-forward"
                    color={COLORS.primaryWhiteHex}
                    size={FONTSIZE.size_16}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.ScreenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
      
      {/* Success overlay */}
      <Animated.View 
        style={[
          styles.SuccessOverlay,
          {
            opacity: successAnim,
            transform: [
              {
                scale: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none">
        <View style={styles.SuccessContainer}>
          <CustomIcon
            name="checkmark-circle"
            color={COLORS.primaryWhiteHex}
            size={FONTSIZE.size_30}
          />
          <Text style={styles.SuccessText}>Profile Updated! ✨</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.ScrollViewFlex,
          keyboardVisible && styles.ScrollViewKeyboard
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primaryOrangeHex]}
            tintColor={COLORS.primaryOrangeHex}
          />
        }>
        <HeaderBar title="Profile" />

        <View style={styles.ProfileContainer}>
          {/* Enhanced Profile Header */}
          <AnimatedCard delay={100}>
            <View style={styles.ProfileHeaderCard}>
              <View style={styles.ProfileHeaderContainer}>
                <View style={styles.ProfilePicContainer}>
                  <UserAvatar 
                    firstName={userProfile?.firstName}
                    lastName={userProfile?.lastName}
                    profileImageUrl={userProfile?.profileImageUrl}
                    avatarInitials={userProfile?.avatarInitials}
                    avatarBackgroundColor={userProfile?.avatarBackgroundColor}
                    size="large"
                    showOnlineIndicator={true}
                    showEditIcon={isEditing}
                    onPress={isEditing ? () => {
                      // Future: Add image picker functionality
                      console.log('Edit avatar pressed');
                    } : undefined}
                  />
                </View>
                <Text style={styles.ProfileName}>
                  {userProfile?.displayName || 'Coffee Lover'}
                </Text>
                <Text style={styles.ProfileEmail}>{user?.email}</Text>
                <View style={styles.ProfileStats}>
                  <View style={styles.StatItem}>
                    <Text style={styles.StatNumber}>0</Text>
                    <Text style={styles.StatLabel}>Orders</Text>
                  </View>
                  <View style={styles.StatDivider} />
                  <View style={styles.StatItem}>
                    <Text style={styles.StatNumber}>0</Text>
                    <Text style={styles.StatLabel}>Points</Text>
                  </View>
                  <View style={styles.StatDivider} />
                  <View style={styles.StatItem}>
                    <Text style={styles.StatNumber}>0</Text>
                    <Text style={styles.StatLabel}>Favorites</Text>
                  </View>
                </View>
                <Animated.View style={{transform: [{scale: buttonPressAnim}]}}>
                  <TouchableOpacity
                    style={styles.EditButton}
                    onPress={() => animateButtonPress(() => 
                      isEditing ? handleCancelEdit() : setIsEditing(true)
                    )}
                    activeOpacity={0.8}>
                    <View style={[
                      styles.EditButtonGradient,
                      isEditing ? styles.EditButtonCancel : styles.EditButtonEdit
                    ]}>
                      <CustomIcon
                        name={isEditing ? 'close' : 'pencil'}
                        color={COLORS.primaryWhiteHex}
                        size={FONTSIZE.size_16}
                      />
                      <Text style={styles.EditButtonText}>
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Text>
                      {hasUnsavedChanges && (
                        <View style={styles.UnsavedChangesIndicator}>
                          <CustomIcon
                            name="ellipse"
                            color={COLORS.primaryOrangeHex}
                            size={FONTSIZE.size_8}
                          />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </AnimatedCard>

          {/* Enhanced Profile Information */}
          <AnimatedCard delay={200}>
            <View style={styles.ProfileInfoCard}>
              <View style={styles.SectionHeader}>
                <CustomIcon
                  name="person-outline"
                  color={COLORS.primaryOrangeHex}
                  size={FONTSIZE.size_20}
                />
                <Text style={styles.SectionTitle}>Personal Information</Text>
              </View>

              {/* Enhanced Input Fields with Validation */}
              <Animated.View style={{transform: [{translateX: shakeAnim}]}}>
                <View style={styles.InputRow}>
                  <View style={[styles.InputContainer, {flex: 1, marginRight: SPACING.space_8}]}>
                    <Text style={styles.InputLabel}>First Name</Text>
                    <View style={styles.InputWrapper}>
                      <TextInput
                        style={[
                          styles.TextInputContainer,
                          !isEditing && styles.TextInputDisabled,
                          isEditing && styles.TextInputActive,
                          errors.firstName && isEditing && styles.TextInputError,
                          validationStatus.firstName && isEditing && styles.TextInputSuccess,
                        ]}
                        value={firstName}
                        onChangeText={handleFirstNameChange}
                        placeholder="Enter first name"
                        placeholderTextColor={COLORS.primaryLightGreyHex}
                        editable={isEditing}
                        autoCapitalize="words"
                        maxLength={30}
                      />
                      {isEditing && (
                        <View style={styles.InputIconContainer}>
                          {validationStatus.firstName ? (
                            <CustomIcon
                              name="checkmark-circle"
                              color="#4CAF50"
                              size={FONTSIZE.size_16}
                            />
                          ) : errors.firstName ? (
                            <CustomIcon
                              name="close-circle"
                              color={COLORS.primaryRedHex}
                              size={FONTSIZE.size_16}
                            />
                          ) : (
                            <CustomIcon
                              name="pencil"
                              color={COLORS.primaryOrangeHex}
                              size={FONTSIZE.size_14}
                            />
                          )}
                        </View>
                      )}
                    </View>
                    {errors.firstName && isEditing && (
                      <Text style={styles.ErrorText}>{errors.firstName}</Text>
                    )}
                  </View>

                  <View style={[styles.InputContainer, {flex: 1, marginLeft: SPACING.space_8}]}>
                    <Text style={styles.InputLabel}>Last Name</Text>
                    <View style={styles.InputWrapper}>
                      <TextInput
                        style={[
                          styles.TextInputContainer,
                          !isEditing && styles.TextInputDisabled,
                          isEditing && styles.TextInputActive,
                          errors.lastName && isEditing && styles.TextInputError,
                          validationStatus.lastName && isEditing && styles.TextInputSuccess,
                        ]}
                        value={lastName}
                        onChangeText={handleLastNameChange}
                        placeholder="Enter last name"
                        placeholderTextColor={COLORS.primaryLightGreyHex}
                        editable={isEditing}
                        autoCapitalize="words"
                        maxLength={30}
                      />
                      {isEditing && (
                        <View style={styles.InputIconContainer}>
                          {validationStatus.lastName ? (
                            <CustomIcon
                              name="checkmark-circle"
                              color="#4CAF50"
                              size={FONTSIZE.size_16}
                            />
                          ) : errors.lastName ? (
                            <CustomIcon
                              name="close-circle"
                              color={COLORS.primaryRedHex}
                              size={FONTSIZE.size_16}
                            />
                          ) : (
                            <CustomIcon
                              name="pencil"
                              color={COLORS.primaryOrangeHex}
                              size={FONTSIZE.size_14}
                            />
                          )}
                        </View>
                      )}
                    </View>
                    {errors.lastName && isEditing && (
                      <Text style={styles.ErrorText}>{errors.lastName}</Text>
                    )}
                  </View>
                </View>

                {/* Phone Input */}
                <View style={styles.InputContainer}>
                  <Text style={styles.InputLabel}>Phone Number</Text>
                  <View style={styles.InputWrapper}>
                    <CustomIcon
                      name="call"
                      color={isEditing ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
                      size={FONTSIZE.size_16}
                      style={styles.InputPrefixIcon}
                    />
                    <TextInput
                      style={[
                        styles.TextInputContainer,
                        styles.TextInputWithIcon,
                        !isEditing && styles.TextInputDisabled,
                        isEditing && styles.TextInputActive,
                        errors.phone && isEditing && styles.TextInputError,
                        validationStatus.phone && isEditing && styles.TextInputSuccess,
                      ]}
                      value={phone}
                      onChangeText={handlePhoneChange}
                      placeholder="0901234567"
                      placeholderTextColor={COLORS.primaryLightGreyHex}
                      keyboardType="phone-pad"
                      editable={isEditing}
                      maxLength={15}
                    />
                    {isEditing && (
                      <View style={styles.InputIconContainer}>
                        {validationStatus.phone ? (
                          <CustomIcon
                            name="checkmark-circle"
                            color="#4CAF50"
                            size={FONTSIZE.size_16}
                          />
                        ) : errors.phone ? (
                          <CustomIcon
                            name="close-circle"
                            color={COLORS.primaryRedHex}
                            size={FONTSIZE.size_16}
                          />
                        ) : null}
                      </View>
                    )}
                  </View>
                  {errors.phone && isEditing && (
                    <Text style={styles.ErrorText}>{errors.phone}</Text>
                  )}
                </View>

                {/* Enhanced Address Input with Location */}
                <View style={styles.InputContainer}>
                  <View style={styles.AddressLabelContainer}>
                    <Text style={styles.InputLabel}>Delivery Address</Text>
                    {currentLocation && (
                      <View style={styles.LocationIndicator}>
                        <CustomIcon
                          name="location"
                          color="#4CAF50"
                          size={FONTSIZE.size_12}
                        />
                        <Text style={styles.LocationIndicatorText}>Location detected</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.InputWrapper}>
                    <CustomIcon
                      name="location"
                      color={isEditing ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
                      size={FONTSIZE.size_16}
                      style={styles.InputPrefixIcon}
                    />
                    <TextInput
                      style={[
                        styles.TextInputContainer,
                        styles.TextInputWithIcon,
                        styles.TextInputMultiline,
                        !isEditing && styles.TextInputDisabled,
                        isEditing && styles.TextInputActive,
                        errors.address && isEditing && styles.TextInputError,
                        validationStatus.address && isEditing && styles.TextInputSuccess,
                      ]}
                      value={address}
                      onChangeText={handleAddressChange}
                      placeholder="Enter your complete delivery address"
                      placeholderTextColor={COLORS.primaryLightGreyHex}
                      multiline
                      numberOfLines={3}
                      editable={isEditing}
                      maxLength={200}
                    />
                    {isEditing && (
                      <View style={[styles.InputIconContainer, styles.InputIconMultiline]}>
                        {validationStatus.address ? (
                          <CustomIcon
                            name="checkmark-circle"
                            color="#4CAF50"
                            size={FONTSIZE.size_16}
                          />
                        ) : errors.address ? (
                          <CustomIcon
                            name="close-circle"
                            color={COLORS.primaryRedHex}
                            size={FONTSIZE.size_16}
                          />
                        ) : null}
                      </View>
                    )}
                  </View>

                  {/* Location Action Buttons */}
                  {isEditing && (
                    <View style={styles.LocationButtonsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.LocationActionButton,
                          styles.PrimaryLocationButton,
                          isLoadingLocation && styles.LocationButtonDisabled,
                        ]}
                        onPress={handleUseCurrentLocation}
                        disabled={isLoadingLocation}
                        activeOpacity={0.8}>
                        {isLoadingLocation ? (
                          <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                        ) : (
                          <CustomIcon
                            name="locate"
                            size={FONTSIZE.size_16}
                            color={COLORS.primaryWhiteHex}
                          />
                        )}
                        <Text style={styles.PrimaryLocationButtonText}>
                          {isLoadingLocation ? 'Getting Location...' : 'Use My Location'}
                        </Text>
                      </TouchableOpacity>

                      {currentLocation && (
                        <TouchableOpacity
                          style={[
                            styles.LocationActionButton,
                            styles.SecondaryLocationButton,
                            isLoadingLocation && styles.LocationButtonDisabled,
                          ]}
                          onPress={handleRefreshLocation}
                          disabled={isLoadingLocation}
                          activeOpacity={0.8}>
                          <CustomIcon
                            name="refresh"
                            size={FONTSIZE.size_16}
                            color={COLORS.primaryOrangeHex}
                          />
                          <Text style={styles.SecondaryLocationButtonText}>Refresh</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Location Info Display */}
                  {currentLocation && isEditing && (
                    <View style={styles.LocationInfoContainer}>
                      <View style={styles.LocationInfoHeader}>
                        <CustomIcon
                          name="information-circle"
                          color={COLORS.primaryOrangeHex}
                          size={FONTSIZE.size_14}
                        />
                        <Text style={styles.LocationInfoTitle}>Detected Location</Text>
                      </View>
                      <Text style={styles.LocationInfoText}>
                        📍 {locationService.formatAddressForDisplay(currentLocation)}
                      </Text>
                      <Text style={styles.LocationInfoSubtext}>
                        Accuracy: ±{currentLocation.coordinates.accuracy?.toFixed(0) || '10'}m
                      </Text>
                    </View>
                  )}

                  {errors.address && isEditing && (
                    <Text style={styles.ErrorText}>{errors.address}</Text>
                  )}
                </View>
              </Animated.View>

              {isEditing && (
                <TouchableOpacity
                  style={styles.SaveButton}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                  activeOpacity={0.8}>
                  <View style={styles.SaveButtonGradient}>
                    {isLoading ? (
                      <Text style={styles.SaveButtonText}>Saving...</Text>
                    ) : (
                      <>
                        <CustomIcon
                          name="checkmark"
                          color={COLORS.primaryWhiteHex}
                          size={FONTSIZE.size_16}
                        />
                        <Text style={styles.SaveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </AnimatedCard>

          {/* Enhanced Preferences */}
          <AnimatedCard delay={300}>
            <View style={styles.PreferencesCard}>
              <View style={styles.SectionHeader}>
                <CustomIcon
                  name="settings"
                  color={COLORS.primaryOrangeHex}
                  size={FONTSIZE.size_20}
                />
                <Text style={styles.SectionTitle}>Preferences</Text>
              </View>

              <TouchableOpacity
                style={styles.PreferenceContainer}
                onPress={() => isEditing && setNotifications(!notifications)}
                disabled={!isEditing}
                activeOpacity={0.8}>
                <View style={styles.PreferenceLeft}>
                  <View style={styles.PreferenceIconContainer}>
                    <CustomIcon
                      name="notifications"
                      color={notifications ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
                      size={FONTSIZE.size_18}
                    />
                  </View>
                  <View style={styles.PreferenceTextContainer}>
                    <Text style={styles.PreferenceText}>Push Notifications</Text>
                    <Text style={styles.PreferenceSubtext}>
                      Get notified about order updates and offers
                    </Text>
                  </View>
                </View>
                <Animated.View
                  style={[
                    styles.ToggleContainer,
                    {
                      backgroundColor: toggleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [COLORS.primaryGreyHex, COLORS.primaryOrangeHex],
                      }),
                    },
                  ]}>
                  <Animated.View
                    style={[
                      styles.ToggleCircle,
                      {
                        transform: [
                          {
                            translateX: toggleAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [2, 22],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </AnimatedCard>

          {/* Enhanced Support Section */}
          <AnimatedCard delay={400}>
            <View style={styles.SupportCard}>
              <View style={styles.SectionHeader}>
                <CustomIcon
                  name="help-circle"
                  color={COLORS.primaryOrangeHex}
                  size={FONTSIZE.size_20}
                />
                <Text style={styles.SectionTitle}>Support & Help</Text>
              </View>

              {/* Coffee Bot Support */}
              <TouchableOpacity
                style={styles.SupportOption}
                onPress={handleOpenChatbot}
                activeOpacity={0.8}>
                <View style={styles.SupportOptionLeft}>
                  <View style={styles.SupportIconContainer}>
                    <CustomIcon
                      name="cafe"
                      color={COLORS.primaryOrangeHex}
                      size={FONTSIZE.size_18}
                    />
                  </View>
                  <View style={styles.SupportTextContainer}>
                    <Text style={styles.SupportOptionText}>Coffee Bot Support</Text>
                    <Text style={styles.SupportOptionSubtext}>
                      Get instant help with orders, coffee recommendations, and app features
                    </Text>
                  </View>
                </View>
                <View style={styles.SupportBadge}>
                  <Text style={styles.SupportBadgeText}>AI</Text>
                </View>
                <CustomIcon
                  name="chevron-forward"
                  color={COLORS.primaryLightGreyHex}
                  size={FONTSIZE.size_16}
                />
              </TouchableOpacity>

              {/* FAQ Option */}
              <TouchableOpacity
                style={styles.SupportOption}
                onPress={() => {
                  // Navigate to FAQ or show FAQ modal
                  ToastAndroid.show('FAQ coming soon!', ToastAndroid.SHORT);
                }}
                activeOpacity={0.8}>
                <View style={styles.SupportOptionLeft}>
                  <View style={styles.SupportIconContainer}>
                    <CustomIcon
                      name="help"
                      color={COLORS.primaryOrangeHex}
                      size={FONTSIZE.size_18}
                    />
                  </View>
                  <View style={styles.SupportTextContainer}>
                    <Text style={styles.SupportOptionText}>FAQ</Text>
                    <Text style={styles.SupportOptionSubtext}>
                      Common questions and answers
                    </Text>
                  </View>
                </View>
                <CustomIcon
                  name="chevron-forward"
                  color={COLORS.primaryLightGreyHex}
                  size={FONTSIZE.size_16}
                />
              </TouchableOpacity>

              {/* Contact Support */}
              <TouchableOpacity
                style={styles.SupportOption}
                onPress={() => {
                  Alert.alert(
                    '📧 Contact Support',
                    'Send us an email at support@thecoffee.app or use our AI Coffee Bot for instant help!',
                    [
                      { text: 'Use Coffee Bot', onPress: handleOpenChatbot },
                      { text: 'OK', style: 'cancel' },
                    ]
                  );
                }}
                activeOpacity={0.8}>
                <View style={styles.SupportOptionLeft}>
                  <View style={styles.SupportIconContainer}>
                    <CustomIcon
                      name="mail"
                      color={COLORS.primaryOrangeHex}
                      size={FONTSIZE.size_18}
                    />
                  </View>
                  <View style={styles.SupportTextContainer}>
                    <Text style={styles.SupportOptionText}>Contact Support</Text>
                    <Text style={styles.SupportOptionSubtext}>
                      Get personalized help from our team
                    </Text>
                  </View>
                </View>
                <CustomIcon
                  name="chevron-forward"
                  color={COLORS.primaryLightGreyHex}
                  size={FONTSIZE.size_16}
                />
              </TouchableOpacity>
            </View>
          </AnimatedCard>

          {/* Enhanced Sign Out Button */}
          <AnimatedCard delay={500}>
            <TouchableOpacity
              style={styles.SignOutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}>
              <View style={styles.SignOutButtonGradient}>
                <CustomIcon
                  name="log-out"
                  color={COLORS.primaryRedHex}
                  size={FONTSIZE.size_20}
                />
                <Text style={styles.SignOutButtonText}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </AnimatedCard>
        </View>
      </ScrollView>

      {/* Chatbot Modal */}
      <ChatbotModal
        visible={showChatbot}
        onClose={() => setShowChatbot(false)}
        userContext={getUserContext()}
        apiKey={CHATBOT_CONFIG.GEMINI_API_KEY}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  ScrollViewFlex: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  // Enhanced Not Authenticated State
  NotAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
    backgroundColor: COLORS.primaryBlackHex,
  },
  NotAuthenticatedCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_20,
    padding: SPACING.space_30,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  NotAuthIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryOrangeHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  NotAuthenticatedTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_12,
  },
  NotAuthenticatedText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.space_30,
  },
  PremiumSignInButton: {
    borderRadius: SPACING.space_15,
    overflow: 'hidden',
  },
  SignInButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_30,
    paddingVertical: SPACING.space_16,
    backgroundColor: COLORS.primaryOrangeHex,
    gap: SPACING.space_10,
  },
  SignInButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  
  // Enhanced Profile Container
  ProfileContainer: {
    paddingHorizontal: SPACING.space_20,
    gap: SPACING.space_20,
  },
  
  // Enhanced Profile Header
  ProfileHeaderCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_20,
    padding: SPACING.space_24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ProfileHeaderContainer: {
    alignItems: 'center',
  },
  ProfilePicContainer: {
    position: 'relative',
    marginBottom: SPACING.space_16,
  },

  ProfileName: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  ProfileEmail: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_20,
  },
  ProfileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_24,
  },
  StatItem: {
    alignItems: 'center',
    flex: 1,
  },
  StatNumber: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
  },
  StatLabel: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_2,
  },
  StatDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.primaryGreyHex,
  },
  EditButton: {
    borderRadius: SPACING.space_15,
    overflow: 'hidden',
  },
  EditButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
    gap: SPACING.space_8,
  },
  EditButtonEdit: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  EditButtonCancel: {
    backgroundColor: COLORS.primaryRedHex,
  },
  EditButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },

  // Enhanced Profile Info
  ProfileInfoCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_20,
    padding: SPACING.space_24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  SectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_20,
    gap: SPACING.space_12,
  },
  SectionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  
  // Enhanced Input Fields
  InputRow: {
    flexDirection: 'row',
    marginBottom: SPACING.space_16,
  },
  InputContainer: {
    marginBottom: SPACING.space_16,
  },
  InputLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  InputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  TextInputContainer: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    flex: 1,
  },
  TextInputWithIcon: {
    paddingLeft: SPACING.space_36,
  },
  TextInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  TextInputDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryLightGreyHex,
    borderColor: COLORS.primaryGreyHex,
  },
  TextInputActive: {
    borderColor: COLORS.primaryOrangeHex,
    borderWidth: 2,
  },
  InputPrefixIcon: {
    position: 'absolute',
    left: SPACING.space_12,
    zIndex: 1,
  },
  InputIcon: {
    position: 'absolute',
    right: SPACING.space_12,
  },
  
  // Enhanced Save Button
  SaveButton: {
    borderRadius: SPACING.space_15,
    overflow: 'hidden',
    marginTop: SPACING.space_20,
  },
  SaveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_16,
    backgroundColor: '#4CAF50',
    gap: SPACING.space_8,
  },
  SaveButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },

  // Enhanced Preferences
  PreferencesCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_20,
    padding: SPACING.space_24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  PreferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.space_12,
    borderRadius: SPACING.space_12,
    paddingHorizontal: SPACING.space_4,
  },
  PreferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  PreferenceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryBlackHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  PreferenceTextContainer: {
    flex: 1,
  },
  PreferenceText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  PreferenceSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_2,
  },
  ToggleContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  ToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryWhiteHex,
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // Enhanced Sign Out
  SignOutButton: {
    borderRadius: SPACING.space_15,
    overflow: 'hidden',
  },
  SignOutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_18,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryRedHex,
    gap: SPACING.space_12,
  },
  SignOutButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryRedHex,
  },

  // Success overlay styles
  SuccessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  SuccessContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_20,
    padding: SPACING.space_30,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  SuccessText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_12,
    textAlign: 'center',
  },

  // Keyboard handling
  ScrollViewKeyboard: {
    paddingBottom: 200,
  },

  // Unsaved changes indicator
  UnsavedChangesIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryOrangeHex,
  },

  // Enhanced input validation styles
  TextInputError: {
    borderColor: COLORS.primaryRedHex,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
  },
  TextInputSuccess: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  InputIconContainer: {
    position: 'absolute',
    right: SPACING.space_12,
    top: SPACING.space_12,
    zIndex: 1,
  },
  InputIconMultiline: {
    top: SPACING.space_16,
  },
  ErrorText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryRedHex,
    marginTop: SPACING.space_4,
    marginLeft: SPACING.space_4,
  },

  // Location feature styles
  AddressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  LocationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_10,
    gap: SPACING.space_4,
  },
  LocationIndicatorText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: '#4CAF50',
  },
  LocationButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.space_12,
    marginTop: SPACING.space_12,
  },
  LocationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_15,
    gap: SPACING.space_8,
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  PrimaryLocationButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  SecondaryLocationButton: {
    backgroundColor: COLORS.primaryGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  LocationButtonDisabled: {
    opacity: 0.6,
  },
  PrimaryLocationButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  SecondaryLocationButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
  },
  LocationInfoContainer: {
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginTop: SPACING.space_12,
    borderWidth: 1,
    borderColor: 'rgba(209, 120, 66, 0.2)',
  },
  LocationInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
    gap: SPACING.space_8,
  },
  LocationInfoTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
  },
  LocationInfoText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    lineHeight: 18,
    marginBottom: SPACING.space_4,
  },
  LocationInfoSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
    fontStyle: 'italic',
  },

  // Support section styles
  SupportCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_20,
    padding: SPACING.space_24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBlackHex,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  SupportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.space_16,
    paddingHorizontal: SPACING.space_4,
    borderRadius: SPACING.space_12,
    marginBottom: SPACING.space_8,
  },
  SupportOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  SupportIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryBlackHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  SupportTextContainer: {
    flex: 1,
  },
  SupportOptionText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  SupportOptionSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    lineHeight: 16,
  },
  SupportBadge: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_10,
    marginRight: SPACING.space_12,
  },
  SupportBadgeText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
});

export default ProfileScreen;
