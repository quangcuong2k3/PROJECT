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

const LoginScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {signIn, isAuthLoading, authError} = useStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await signIn(email, password);
      if (!authError) {
        navigation.replace('Tab');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
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
              name="cafe"
              color={COLORS.primaryOrangeHex}
              size={FONTSIZE.size_30}
            />
            <Text style={styles.HeaderText}>Welcome Back</Text>
            <Text style={styles.SubHeaderText}>
              Sign in to your coffee account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.FormContainer}>
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
                  placeholder="Enter your password"
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

            {/* Error Message */}
            {authError && (
              <View style={styles.ErrorContainer}>
                <Text style={styles.ErrorText}>{authError}</Text>
              </View>
            )}

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.ForgotPasswordContainer}
              onPress={navigateToForgotPassword}>
              <Text style={styles.ForgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.LoginButton,
                isAuthLoading && styles.LoginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isAuthLoading}>
              <Text style={styles.LoginButtonText}>
                {isAuthLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.RegisterContainer}>
              <Text style={styles.RegisterText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.RegisterLink}>Sign Up</Text>
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
  InputContainer: {
    marginBottom: SPACING.space_20,
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
  ForgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.space_24,
  },
  ForgotPasswordText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
  },
  LoginButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: SPACING.space_10,
    paddingVertical: SPACING.space_16,
    alignItems: 'center',
    marginBottom: SPACING.space_24,
  },
  LoginButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  LoginButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  RegisterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  RegisterText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  RegisterLink: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
  },
});

export default LoginScreen;
