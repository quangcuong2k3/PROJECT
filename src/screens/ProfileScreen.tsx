import React, {useState, useEffect} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import ProfilePic from '../components/ProfilePic';
import CustomIcon from '../components/CustomIcon';
import {useStore} from '../store/firebaseStore';
import authService from '../services/authService';

const ProfileScreen = ({navigation}: any) => {
  const {
    user,
    userProfile,
    signOut,
    setUserProfile,
    //isAuthLoading,
    isAuthenticated,
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setPhone(userProfile.phone || '');
      setAddress(userProfile.address || '');
      setNotifications(userProfile.preferences?.notifications ?? true);
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    // eslint-disable-next-line curly
    if (!user || !userProfile) return;

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
        setUserProfile({...userProfile, ...updates});
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.navigate('Login');
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.ScreenContainer}>
        <StatusBar backgroundColor={COLORS.primaryBlackHex} />
        <View style={styles.NotAuthenticatedContainer}>
          <CustomIcon
            name="person"
            color={COLORS.primaryLightGreyHex}
            size={FONTSIZE.size_30}
          />
          <Text style={styles.NotAuthenticatedText}>
            Please sign in to view your profile
          </Text>
          <TouchableOpacity
            style={styles.SignInButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.SignInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <HeaderBar title="Profile" />

        <View style={styles.ProfileContainer}>
          {/* Profile Picture and Basic Info */}
          <View style={styles.ProfileHeaderContainer}>
            <ProfilePic />
            <Text style={styles.ProfileName}>
              {userProfile?.displayName || 'User'}
            </Text>
            <Text style={styles.ProfileEmail}>{user?.email}</Text>
            <TouchableOpacity
              style={styles.EditButton}
              onPress={() => setIsEditing(!isEditing)}>
              <CustomIcon
                name={isEditing ? 'close' : 'pencil'}
                color={COLORS.primaryOrangeHex}
                size={FONTSIZE.size_16}
              />
              <Text style={styles.EditButtonText}>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Information */}
          <View style={styles.ProfileInfoContainer}>
            <Text style={styles.SectionTitle}>Personal Information</Text>

            {/* First Name */}
            <View style={styles.InputContainer}>
              <Text style={styles.InputLabel}>First Name</Text>
              <TextInput
                style={[
                  styles.TextInputContainer,
                  !isEditing && styles.TextInputDisabled,
                ]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={COLORS.primaryLightGreyHex}
                editable={isEditing}
              />
            </View>

            {/* Last Name */}
            <View style={styles.InputContainer}>
              <Text style={styles.InputLabel}>Last Name</Text>
              <TextInput
                style={[
                  styles.TextInputContainer,
                  !isEditing && styles.TextInputDisabled,
                ]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={COLORS.primaryLightGreyHex}
                editable={isEditing}
              />
            </View>

            {/* Phone */}
            <View style={styles.InputContainer}>
              <Text style={styles.InputLabel}>Phone Number</Text>
              <TextInput
                style={[
                  styles.TextInputContainer,
                  !isEditing && styles.TextInputDisabled,
                ]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone Number"
                placeholderTextColor={COLORS.primaryLightGreyHex}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            {/* Address */}
            <View style={styles.InputContainer}>
              <Text style={styles.InputLabel}>Address</Text>
              <TextInput
                style={[
                  styles.TextInputContainer,
                  !isEditing && styles.TextInputDisabled,
                ]}
                value={address}
                onChangeText={setAddress}
                placeholder="Address"
                placeholderTextColor={COLORS.primaryLightGreyHex}
                multiline
                numberOfLines={3}
                editable={isEditing}
              />
            </View>

            {/* Preferences */}
            <Text style={styles.SectionTitle}>Preferences</Text>

            <TouchableOpacity
              style={styles.PreferenceContainer}
              onPress={() => isEditing && setNotifications(!notifications)}>
              <View style={styles.PreferenceLeft}>
                <CustomIcon
                  name="notifications"
                  color={COLORS.primaryOrangeHex}
                  size={FONTSIZE.size_20}
                />
                <Text style={styles.PreferenceText}>Push Notifications</Text>
              </View>
              <View
                style={[
                  styles.ToggleContainer,
                  notifications && styles.ToggleActive,
                ]}>
                <View
                  style={[
                    styles.ToggleCircle,
                    notifications && styles.ToggleCircleActive,
                  ]}
                />
              </View>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                style={styles.SaveButton}
                onPress={handleSaveProfile}>
                <Text style={styles.SaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.SignOutButton}
            onPress={handleSignOut}>
            <CustomIcon
              name="log-out"
              color={COLORS.primaryRedHex}
              size={FONTSIZE.size_20}
            />
            <Text style={styles.SignOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
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
  },
  NotAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  NotAuthenticatedText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginVertical: SPACING.space_20,
  },
  SignInButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: SPACING.space_10,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
  },
  SignInButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  ProfileContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: 100,
  },
  ProfileHeaderContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_36,
  },
  ProfileName: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_16,
  },
  ProfileEmail: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_16,
  },
  EditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: SPACING.space_20,
  },
  EditButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_8,
  },
  ProfileInfoContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_20,
    padding: SPACING.space_20,
    marginBottom: SPACING.space_20,
  },
  SectionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
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
  TextInputContainer: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: SPACING.space_10,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  TextInputDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryLightGreyHex,
  },
  PreferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.space_12,
  },
  PreferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  PreferenceText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_12,
  },
  ToggleContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryGreyHex,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  ToggleActive: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  ToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryWhiteHex,
    alignSelf: 'flex-start',
  },
  ToggleCircleActive: {
    alignSelf: 'flex-end',
  },
  SaveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: SPACING.space_10,
    paddingVertical: SPACING.space_12,
    alignItems: 'center',
    marginTop: SPACING.space_20,
  },
  SaveButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  SignOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_10,
    paddingVertical: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryRedHex,
  },
  SignOutButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryRedHex,
    marginLeft: SPACING.space_8,
  },
});

export default ProfileScreen;
