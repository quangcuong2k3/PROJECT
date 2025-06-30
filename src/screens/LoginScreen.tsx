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
} from 'react-native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS} from '../theme/theme';
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
    <View style={styles.ScreenContainer}>
      <StatusBar 
        backgroundColor={COLORS.primaryBlackHex} 
        barStyle="light-content"
        translucent={false}
      />
      
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
            {/* Header Section */}
            <View style={styles.HeaderContainer}>
              <View style={styles.LogoContainer}>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: logoRotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <GradientBGIcon
                    name="cafe"
                    color={COLORS.primaryOrangeHex}
                    size={FONTSIZE.size_30}
                  />
                </Animated.View>
                <View style={styles.WelcomeRing} />
                <View style={styles.WelcomeRingOuter} />
              </View>
              
              <Text style={styles.WelcomeText}>Welcome Back</Text>
              <Text style={styles.SubHeaderText}>
                Sign in to your coffee account and enjoy your personalized experience
              </Text>

              {/* Quick Stats */}
              <Animated.View 
                style={[
                  styles.StatsContainer,
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
                <View style={styles.StatItem}>
                  <View style={styles.StatIconContainer}>
                    <CustomIcon name="heart" size={16} color={COLORS.primaryOrangeHex} />
                  </View>
                  <Text style={styles.StatText}>Your favorites await</Text>
                </View>
                <View style={styles.StatItem}>
                  <View style={styles.StatIconContainer}>
                    <CustomIcon name="trophy" size={16} color={COLORS.primaryOrangeHex} />
                  </View>
                  <Text style={styles.StatText}>Loyalty rewards</Text>
                </View>
                <View style={styles.StatItem}>
                  <View style={styles.StatIconContainer}>
                    <CustomIcon name="time" size={16} color={COLORS.primaryOrangeHex} />
                  </View>
                  <Text style={styles.StatText}>Fast ordering</Text>
                </View>
              </Animated.View>
            </View>

            {/* Form Section */}
            <View style={styles.FormContainer}>
              {/* Email Input */}
              <EnhancedInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={emailError}
                icon="mail"
                required
                maxLength={254}
                helpText="We'll keep your account secure and send important updates"
                validationState={getEmailValidationState()}
              />

              {/* Password Input */}
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
                helpText="Your password is encrypted and secure"
                validationState={getPasswordValidationState()}
              />

              {/* Global Error Message */}
              {authError && (
                <Animated.View style={styles.GlobalErrorContainer}>
                  <View style={styles.ErrorIconContainer}>
                    <CustomIcon
                      name="alert-circle"
                      size={FONTSIZE.size_20}
                      color={COLORS.primaryRedHex}
                    />
                  </View>
                  <View style={styles.ErrorTextContainer}>
                    <Text style={styles.GlobalErrorText}>{authError}</Text>
                    <Text style={styles.ErrorHelpText}>
                      Double-check your credentials or try resetting your password
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.ForgotPasswordContainer}
                onPress={navigateToForgotPassword}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.ForgotPasswordText}>Forgot Password?</Text>
                <CustomIcon 
                  name="chevron-forward" 
                  size={FONTSIZE.size_16} 
                  color={COLORS.primaryOrangeHex} 
                />
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.LoginButton,
                  isButtonDisabled && styles.LoginButtonDisabled,
                  isFormValid && styles.LoginButtonValid,
                ]}
                onPress={handleLogin}
                disabled={isButtonDisabled}
                activeOpacity={0.8}
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
                      <Text style={styles.LoginButtonText}>Signing In...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.LoginButtonText}>Sign In</Text>
                      <CustomIcon 
                        name="arrow-forward" 
                        size={FONTSIZE.size_18} 
                        color={COLORS.primaryWhiteHex} 
                      />
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.DividerContainer}>
                <View style={styles.DividerLine} />
                <Text style={styles.DividerText}>or</Text>
                <View style={styles.DividerLine} />
              </View>

              {/* Register Link */}
              <TouchableOpacity
                style={styles.RegisterContainer}
                onPress={navigateToRegister}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Text style={styles.RegisterText}>
                  Don't have an account? 
                </Text>
                <Text style={styles.RegisterLink}> Create Account</Text>
                <CustomIcon 
                  name="person-add" 
                  size={FONTSIZE.size_16} 
                  color={COLORS.primaryOrangeHex} 
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  KeyboardAvoidingView: {
    flex: 1,
  },
  ScrollViewFlex: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_40,
  },
  InnerViewContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  HeaderContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_40,
  },
  LogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.space_20,
    position: 'relative',
  },
  WelcomeRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: `${COLORS.primaryOrangeHex}40`,
    zIndex: -1,
  },
  WelcomeRingOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: `${COLORS.primaryOrangeHex}20`,
    zIndex: -2,
  },
  WelcomeText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_28,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_8,
  },
  SubHeaderText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.space_24,
    paddingHorizontal: SPACING.space_20,
  },
  StatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.space_20,
  },
  StatItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: SPACING.space_8,
  },
  StatIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primaryOrangeHex}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.space_8,
  },
  StatText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  FormContainer: {
    width: '100%',
  },
  GlobalErrorContainer: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primaryRedHex}15`,
    borderRadius: BORDERRADIUS.radius_15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryRedHex,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_20,
  },
  ErrorIconContainer: {
    marginRight: SPACING.space_12,
    paddingTop: SPACING.space_2,
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
  ForgotPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_12,
    marginBottom: SPACING.space_20,
  },
  ForgotPasswordText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginRight: SPACING.space_8,
  },
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
  LoginButtonValid: {
    shadowOpacity: 0.4,
    elevation: 10,
  },
  ButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  LoginButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_8,
  },
  LoadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primaryWhiteHex,
    borderTopColor: 'transparent',
    marginRight: SPACING.space_8,
  },
  DividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_24,
  },
  DividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.primaryGreyHex,
  },
  DividerText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginHorizontal: SPACING.space_16,
  },
  RegisterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_16,
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
    marginRight: SPACING.space_8,
  },
});

export default LoginScreen;
