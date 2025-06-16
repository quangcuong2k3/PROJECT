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
} from 'react-native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import UserAvatar from '../components/UserAvatar';
import CustomIcon from '../components/CustomIcon';
import {useStore} from '../store/firebaseStore';
import authService from '../services/authService';

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

  const buttonPressAnim = useRef(new Animated.Value(1)).current;
  const toggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setPhone(userProfile.phone || '');
      setAddress(userProfile.address || '');
      setNotifications(userProfile.preferences?.notifications ?? true);
    }
  }, [userProfile]);

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

    setIsLoading(true);
    try {
      const updates = {
        firstName,
        lastName,
        phone,
        address,
        displayName: `${firstName} ${lastName}`,
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
        Alert.alert('✅ Success', 'Profile updated successfully!', [
          {text: 'OK', style: 'default'},
        ]);
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

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
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}
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
                    onPress={() => animateButtonPress(() => setIsEditing(!isEditing))}
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

              {/* Enhanced Input Fields */}
              <View style={styles.InputRow}>
                <View style={[styles.InputContainer, {flex: 1, marginRight: SPACING.space_8}]}>
                  <Text style={styles.InputLabel}>First Name</Text>
                  <View style={styles.InputWrapper}>
                    <TextInput
                      style={[
                        styles.TextInputContainer,
                        !isEditing && styles.TextInputDisabled,
                        isEditing && styles.TextInputActive,
                      ]}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Enter first name"
                      placeholderTextColor={COLORS.primaryLightGreyHex}
                      editable={isEditing}
                    />
                    {isEditing && (
                      <CustomIcon
                        name="pencil"
                        color={COLORS.primaryOrangeHex}
                        size={FONTSIZE.size_14}
                        style={styles.InputIcon}
                      />
                    )}
                  </View>
                </View>

                <View style={[styles.InputContainer, {flex: 1, marginLeft: SPACING.space_8}]}>
                  <Text style={styles.InputLabel}>Last Name</Text>
                  <View style={styles.InputWrapper}>
                    <TextInput
                      style={[
                        styles.TextInputContainer,
                        !isEditing && styles.TextInputDisabled,
                        isEditing && styles.TextInputActive,
                      ]}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Enter last name"
                      placeholderTextColor={COLORS.primaryLightGreyHex}
                      editable={isEditing}
                    />
                    {isEditing && (
                      <CustomIcon
                        name="pencil"
                        color={COLORS.primaryOrangeHex}
                        size={FONTSIZE.size_14}
                        style={styles.InputIcon}
                      />
                    )}
                  </View>
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
                    ]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor={COLORS.primaryLightGreyHex}
                    keyboardType="phone-pad"
                    editable={isEditing}
                  />
                </View>
              </View>

              {/* Address Input */}
              <View style={styles.InputContainer}>
                <Text style={styles.InputLabel}>Delivery Address</Text>
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
                    ]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter delivery address"
                    placeholderTextColor={COLORS.primaryLightGreyHex}
                    multiline
                    numberOfLines={3}
                    editable={isEditing}
                  />
                </View>
              </View>

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

          {/* Enhanced Sign Out Button */}
          <AnimatedCard delay={400}>
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
    </View>
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
});

export default ProfileScreen;
