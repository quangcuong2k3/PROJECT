import React, {useState, useRef, useEffect} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS} from '../theme/theme';
import {LinearGradient} from 'expo-linear-gradient';
import GradientBGIcon from '../components/GradientBGIcon';
import CustomIcon from '../components/CustomIcon';
import EnhancedInput from '../components/EnhancedInput';
import {useStore} from '../store/firebaseStore';
import authService from '../services/authService';

const {width, height} = Dimensions.get('window');

const LoginScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<any>(null);
  const [passwordError, setPasswordError] = useState<any>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  const {signIn, isAuthLoading, authError} = useStore();

  useEffect(() => {
    // Initial animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Delayed animations
      Animated.parallel([
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(statsAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  // Real-time validation with enhanced feedback
  useEffect(() => {
    // Email validation
    if (email.length > 0) {
      const emailValidation = authService.validateEmail(email);
      setEmailError(emailValidation.isValid ? null : emailValidation.error);
    } else {
      setEmailError(null);
    }

    // Password validation (basic check for login)
    if (password.length > 0) {
      setPasswordError(null);
    } else {
      setPasswordError(null);
    }

    // Form validity check
    const emailValidation = authService.validateEmail(email);
    setIsFormValid(
      emailValidation.isValid &&
      password.length > 0 &&
      !emailError &&
      !passwordError
    );
  }, [email, password]);

  const handleLogin = async () => {
    // Final validation before submission
    const emailValidation = authService.validateEmail(email);
    
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return;
    }

    if (!password || password.length === 0) {
      setPasswordError({
        message: 'Password is required',
        suggestion: 'Please enter your password',
        severity: 'error',
      });
      return;
    }

    try {
      await signIn(email, password);
      if (!authError) {
        // Success animation sequence
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          navigation.replace('Tab');
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const navigateToRegister = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('Register');
    });
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const getEmailValidationState = () => {
    if (email.length === 0) return 'neutral';
    return emailError ? 'invalid' : 'valid';
  };

  const getPasswordValidationState = () => {
    if (password.length === 0) return 'neutral';
    return passwordError ? 'invalid' : 'valid';
  };

  const isButtonDisabled = !isFormValid || isAuthLoading;

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <StatusBar 
        backgroundColor={COLORS.primaryBlackHex} 
        barStyle="light-content"
        translucent={false}
      />
      
      <LinearGradient
        colors={[COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
        style={styles.GradientBackground}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.KeyboardAvoidingView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ScrollViewFlex}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              style={[
                styles.InnerViewContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              {/* Floating Header Card */}
              <View style={styles.HeaderCard}>
                <View style={styles.LogoSection}>
                  <Animated.View
                    style={[
                      styles.LogoContainer,
                      {
                        transform: [
                          {
                            rotate: logoRotateAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[COLORS.primaryOrangeHex, '#E67E22']}
                      style={styles.LogoGradient}
                    >
                      <CustomIcon
                        name="cafe"
                        color={COLORS.primaryWhiteHex}
                        size={FONTSIZE.size_28}
                      />
                    </LinearGradient>
                  </Animated.View>
                  
                  <View style={styles.WelcomeSection}>
                    <Text style={styles.WelcomeText}>Welcome Back</Text>
                    <Text style={styles.SubHeaderText}>
                      Your coffee journey continues
                    </Text>
                  </View>
                </View>

                {/* Trust Indicators */}
                <Animated.View 
                  style={[
                    styles.TrustIndicators,
                    {
                      opacity: statsAnim,
                      transform: [
                        {
                          translateY: statsAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.TrustItem}>
                    <CustomIcon name="shield-checkmark" size={14} color={COLORS.primaryOrangeHex} />
                    <Text style={styles.TrustText}>Secure Login</Text>
                  </View>
                  <View style={styles.TrustItem}>
                    <CustomIcon name="time" size={14} color={COLORS.primaryOrangeHex} />
                    <Text style={styles.TrustText}>Quick Access</Text>
                  </View>
                </Animated.View>
              </View>

              {/* Main Form Card */}
              <View style={styles.FormCard}>
                {/* Global Error Message */}
                {authError && (
                  <Animated.View style={styles.GlobalErrorContainer}>
                    <View style={styles.ErrorContent}>
                      <CustomIcon
                        name="alert-circle"
                        size={FONTSIZE.size_18}
                        color={COLORS.primaryRedHex}
                      />
                      <View style={styles.ErrorTextContainer}>
                        <Text style={styles.GlobalErrorText}>
                          {authError.includes('Firebase:') || authError.includes('auth/') 
                            ? 'Incorrect email or password' 
                            : authError}
                        </Text>
                        <Text style={styles.ErrorHelpText}>
                          Please check your credentials and try again
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* Form Fields */}
                <View style={styles.FormFields}>
                  <EnhancedInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    error={emailError}
                    icon="mail"
                    required
                    maxLength={254}
                    validationState={getEmailValidationState()}
                  />

                  <EnhancedInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    autoComplete="password"
                    error={passwordError}
                    icon="lock-closed"
                    required
                    validationState={getPasswordValidationState()}
                  />
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  style={styles.ForgotPasswordLink}
                  onPress={navigateToForgotPassword}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.ForgotPasswordText}>Forgot your password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[
                    styles.SignInButton,
                    isButtonDisabled && styles.SignInButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isButtonDisabled}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      isButtonDisabled 
                        ? [COLORS.primaryGreyHex, COLORS.primaryGreyHex]
                        : [COLORS.primaryOrangeHex, '#E67E22']
                    }
                    style={styles.SignInButtonGradient}
                  >
                    <View style={styles.ButtonContent}>
                      {isAuthLoading ? (
                        <>
                          <Animated.View style={[
                            styles.LoadingSpinner,
                            {
                              transform: [
                                {
                                  rotate: logoRotateAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '360deg'],
                                  }),
                                },
                              ],
                            },
                          ]} />
                          <Text style={styles.SignInButtonText}>Signing In...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.SignInButtonText}>Sign In</Text>
                          <CustomIcon 
                            name="arrow-forward" 
                            size={FONTSIZE.size_16} 
                            color={COLORS.primaryWhiteHex} 
                          />
                        </>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Bottom Action */}
              <View style={styles.BottomSection}>
                <View style={styles.SignUpPrompt}>
                  <Text style={styles.SignUpText}>New to our coffee community?</Text>
                  <TouchableOpacity
                    onPress={navigateToRegister}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.SignUpLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  GradientBackground: {
    flex: 1,
  },
  KeyboardAvoidingView: {
    flex: 1,
  },
  ScrollViewFlex: {
    flexGrow: 1,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_24,
    justifyContent: 'center',
    minHeight: height,
  },
  InnerViewContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.space_24,
  },
  
  // Header Card Styles
  HeaderCard: {
    backgroundColor: `${COLORS.secondaryDarkGreyHex}95`,
    borderRadius: BORDERRADIUS.radius_25,
    padding: SPACING.space_24,
    marginBottom: SPACING.space_16,
    borderWidth: 1,
    borderColor: `${COLORS.primaryOrangeHex}20`,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  LogoSection: {
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  LogoContainer: {
    marginBottom: SPACING.space_16,
  },
  LogoGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  WelcomeSection: {
    alignItems: 'center',
  },
  WelcomeText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_4,
  },
  SubHeaderText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 20,
  },
  TrustIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.space_24,
    marginTop: SPACING.space_16,
  },
  TrustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  TrustText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },

  // Form Card Styles
  FormCard: {
    backgroundColor: `${COLORS.secondaryDarkGreyHex}95`,
    borderRadius: BORDERRADIUS.radius_25,
    padding: SPACING.space_24,
    borderWidth: 1,
    borderColor: `${COLORS.primaryOrangeHex}20`,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  FormFields: {
    gap: SPACING.space_10,
    marginBottom: SPACING.space_20,
  },
  
  // Error Styles
  GlobalErrorContainer: {
    backgroundColor: `${COLORS.primaryRedHex}15`,
    borderRadius: BORDERRADIUS.radius_15,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryRedHex,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_20,
  },
  ErrorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.space_12,
  },
  ErrorTextContainer: {
    flex: 1,
  },
  GlobalErrorText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryRedHex,
    marginBottom: SPACING.space_4,
  },
  ErrorHelpText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    lineHeight: 16,
  },

  // Action Styles
  ForgotPasswordLink: {
    alignItems: 'center',
    paddingVertical: SPACING.space_12,
    marginBottom: SPACING.space_20,
  },
  ForgotPasswordText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
  },
  
  // Button Styles
  SignInButton: {
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  SignInButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  SignInButtonGradient: {
    paddingVertical: SPACING.space_18,
    paddingHorizontal: SPACING.space_24,
  },
  ButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.space_8,
  },
  SignInButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  LoadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primaryWhiteHex,
    borderTopColor: 'transparent',
  },

  // Bottom Section
  BottomSection: {
    alignItems: 'center',
    paddingTop: SPACING.space_16,
  },
  SignUpPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  SignUpText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  SignUpLink: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    textDecorationLine: 'underline',
  },

  // Legacy styles (keeping for compatibility)
  LoginButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingVertical: SPACING.space_18,
    paddingHorizontal: SPACING.space_24,
    marginBottom: SPACING.space_24,
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  LoginButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
    shadowOpacity: 0,
    elevation: 0,
  },
  LoginButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_8,
  },
});

export default LoginScreen;
