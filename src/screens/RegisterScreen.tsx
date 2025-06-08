import React, {useState} from 'react';
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
import GradientBGIcon from '../components/GradientBGIcon';
import CustomIcon from '../components/CustomIcon';
import {useStore} from '../store/firebaseStore';

const RegisterScreen = ({navigation}: any) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {registerUser, isAuthLoading, authError} = useStore();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await registerUser(email, password, firstName, lastName);
      if (!authError) {
        Alert.alert(
          'Success',
          'Account created successfully! Welcome to Coffee Shop!',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Tab'),
            },
          ],
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <View style={styles.InnerViewContainer}>
          {/* Header */}
          <View style={styles.HeaderContainer}>
            <GradientBGIcon
              name="person-add"
              color={COLORS.primaryOrangeHex}
              size={FONTSIZE.size_30}
            />
            <Text style={styles.HeaderText}>Create Account</Text>
            <Text style={styles.SubHeaderText}>
              Join us for the best coffee experience
            </Text>
          </View>

          {/* Form */}
          <View style={styles.FormContainer}>
            {/* Name Inputs */}
            <View style={styles.RowContainer}>
              <View style={[styles.InputContainer, styles.HalfWidth]}>
                <Text style={styles.InputLabel}>First Name</Text>
                <TextInput
                  style={styles.TextInputContainer}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor={COLORS.primaryLightGreyHex}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.InputContainer, styles.HalfWidth]}>
                <Text style={styles.InputLabel}>Last Name</Text>
                <TextInput
                  style={styles.TextInputContainer}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor={COLORS.primaryLightGreyHex}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.InputContainer}>
              <Text style={styles.InputLabel}>Email</Text>
              <TextInput
                style={styles.TextInputContainer}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.primaryLightGreyHex}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Password Input */}
            <View style={styles.InputContainer}>
              <Text style={styles.InputLabel}>Password</Text>
              <View style={styles.PasswordContainer}>
                <TextInput
                  style={styles.PasswordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password (min 6 characters)"
                  placeholderTextColor={COLORS.primaryLightGreyHex}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.EyeIcon}
                  onPress={() => setShowPassword(!showPassword)}>
                  <CustomIcon
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={FONTSIZE.size_18}
                    color={COLORS.primaryLightGreyHex}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.InputContainer}>
              <Text style={styles.InputLabel}>Confirm Password</Text>
              <View style={styles.PasswordContainer}>
                <TextInput
                  style={styles.PasswordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={COLORS.primaryLightGreyHex}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.EyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <CustomIcon
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={FONTSIZE.size_18}
                    color={COLORS.primaryLightGreyHex}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {authError && (
              <View style={styles.ErrorContainer}>
                <Text style={styles.ErrorText}>{authError}</Text>
              </View>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.RegisterButton,
                isAuthLoading && styles.RegisterButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isAuthLoading}>
              <Text style={styles.RegisterButtonText}>
                {isAuthLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.LoginContainer}>
              <Text style={styles.LoginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.LoginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingVertical: SPACING.space_20,
  },
  InnerViewContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  HeaderContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_36,
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_28,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_16,
  },
  SubHeaderText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_4,
  },
  FormContainer: {
    width: '100%',
  },
  RowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  InputContainer: {
    marginBottom: SPACING.space_20,
  },
  HalfWidth: {
    width: '48%',
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
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_10,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  PasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_10,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  PasswordInput: {
    flex: 1,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_16,
  },
  EyeIcon: {
    paddingHorizontal: SPACING.space_16,
  },
  ErrorContainer: {
    marginBottom: SPACING.space_16,
  },
  ErrorText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryRedHex,
    textAlign: 'center',
  },
  RegisterButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: SPACING.space_10,
    paddingVertical: SPACING.space_16,
    alignItems: 'center',
    marginBottom: SPACING.space_24,
  },
  RegisterButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  RegisterButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  LoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  LoginText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  LoginLink: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
  },
});

export default RegisterScreen;
