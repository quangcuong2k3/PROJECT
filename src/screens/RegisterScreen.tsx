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
import {LinearGradient} from 'expo-linear-gradient';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS} from '../theme/theme';
import GradientBGIcon from '../components/GradientBGIcon';
import CustomIcon from '../components/CustomIcon';
import EnhancedInput from '../components/EnhancedInput';
import UserAvatar from '../components/UserAvatar';
import {useStore} from '../store/firebaseStore';
import authService from '../services/authService';
import {generateInitials, sanitizeNameForAvatar} from '../utils/avatarUtils';

const {width, height} = Dimensions.get('window');

const RegisterScreen = ({navigation}: any) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Error states
  const [firstNameError, setFirstNameError] = useState<any>(null);
  const [lastNameError, setLastNameError] = useState<any>(null);
  const [emailError, setEmailError] = useState<any>(null);
  const [passwordError, setPasswordError] = useState<any>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<any>(null);
  
  // Form validation
  const [isFormValid, setIsFormValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'good' | 'strong' | 'excellent' | undefined>(undefined);
  const [passwordScore, setPasswordScore] = useState(0);
  const [formProgress, setFormProgress] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(1)).current;

  const {registerUser, isAuthLoading, authError} = useStore();

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
    ]).start();
  }, []);

  // Real-time validation with enhanced feedback
  useEffect(() => {
    // Validate first name
    if (firstName.length > 0) {
      const firstNameValidation = authService.validateName(firstName, 'First name');
      setFirstNameError(firstNameValidation.isValid ? null : firstNameValidation.error);
    } else {
      setFirstNameError(null);
    }

    // Validate last name
    if (lastName.length > 0) {
      const lastNameValidation = authService.validateName(lastName, 'Last name');
      setLastNameError(lastNameValidation.isValid ? null : lastNameValidation.error);
    } else {
      setLastNameError(null);
    }

    // Validate email
    if (email.length > 0) {
      const emailValidation = authService.validateEmail(email);
      setEmailError(emailValidation.isValid ? null : emailValidation.error);
    } else {
      setEmailError(null);
    }

    // Validate password with comprehensive checks
    if (password.length > 0) {
      const passwordValidation = authService.validatePassword(password);
      setPasswordError(passwordValidation.isValid ? null : passwordValidation.error);
      setPasswordStrength(passwordValidation.strength);
      setPasswordScore(passwordValidation.score || 0);
    } else {
      setPasswordError(null);
      setPasswordStrength(undefined);
      setPasswordScore(0);
    }

    // Validate confirm password
    if (confirmPassword.length > 0) {
      if (password !== confirmPassword) {
        setConfirmPasswordError({
          message: 'Passwords do not match',
          suggestion: 'Make sure both passwords are identical',
          severity: 'error',
        });
      } else {
        setConfirmPasswordError(null);
      }
    } else {
      setConfirmPasswordError(null);
    }

    // Animate avatar when name changes
    if ((firstName || lastName) && firstName.length > 0 && lastName.length > 0) {
      Animated.spring(avatarAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(avatarAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }

    // Calculate form progress
    let progress = 0;
    const fields = [firstName, lastName, email, password, confirmPassword];
    const validFields = [
      !firstNameError && firstName.length > 0,
      !lastNameError && lastName.length > 0,
      !emailError && email.length > 0,
      !passwordError && password.length > 0,
      !confirmPasswordError && confirmPassword.length > 0 && password === confirmPassword,
    ];
    
    progress = validFields.filter(Boolean).length / fields.length;
    setFormProgress(progress);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Check overall form validity
    const allFieldsValid = 
      firstName.length > 0 && !firstNameError &&
      lastName.length > 0 && !lastNameError &&
      email.length > 0 && !emailError &&
      password.length > 0 && !passwordError &&
      confirmPassword.length > 0 && !confirmPasswordError &&
      password === confirmPassword;

    setIsFormValid(allFieldsValid);
  }, [firstName, lastName, email, password, confirmPassword, firstNameError, lastNameError, emailError, passwordError, confirmPasswordError]);

  const handleRegister = async () => {
    // Comprehensive final validation
    const firstNameValidation = authService.validateName(firstName, 'First name');
    const lastNameValidation = authService.validateName(lastName, 'Last name');
    const emailValidation = authService.validateEmail(email);
    const passwordValidation = authService.validatePassword(password);

    if (!firstNameValidation.isValid) {
      setFirstNameError(firstNameValidation.error);
      return;
    }

    if (!lastNameValidation.isValid) {
      setLastNameError(lastNameValidation.error);
      return;
    }

    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return;
    }

    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError({
        message: 'Passwords do not match',
        suggestion: 'Make sure both passwords are identical',
        severity: 'error',
      });
      return;
    }

    try {
      await registerUser(email, password, firstName, lastName);
      
      if (!authError) {
        // Generate display data for success message
        const sanitizedFirstName = sanitizeNameForAvatar(firstName);
        const sanitizedLastName = sanitizeNameForAvatar(lastName);
        const initials = generateInitials(sanitizedFirstName, sanitizedLastName);

        // Success animation sequence
        Animated.sequence([
          Animated.timing(successAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
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
          Alert.alert(
            'Welcome to Coffee Shop! ☕',
            `Account created successfully!\n\nProfile: ${firstName} ${lastName}\nAvatar: "${initials}"\nEmail: ${email}\n\nEnjoy your personalized coffee experience with:\n• Personalized recommendations\n• Order history tracking\n• Loyalty rewards\n• Express checkout`,
            [
              {
                text: 'Get Started',
                onPress: () => navigation.replace('Tab'),
              },
            ],
          );
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const navigateToLogin = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('Login');
    });
  };

  // Generate preview initials for display
  const getPreviewInitials = () => {
    if (!firstName && !lastName) return '';
    const sanitizedFirst = sanitizeNameForAvatar(firstName);
    const sanitizedLast = sanitizeNameForAvatar(lastName);
    return generateInitials(sanitizedFirst, sanitizedLast);
  };

  const getValidationState = (value: string, error: any) => {
    if (value.length === 0) return 'neutral';
    return error ? 'invalid' : 'valid';
  };

  const getProgressColor = () => {
    if (formProgress < 0.3) return COLORS.primaryRedHex;
    if (formProgress < 0.6) return '#FFA500';
    if (formProgress < 0.8) return COLORS.primaryOrangeHex;
    return '#4ECDC4';
  };

  const isButtonDisabled = !isFormValid || isAuthLoading;

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.KeyboardContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ScrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Animated Background Gradient */}
          <LinearGradient
            colors={[COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex]}
            style={styles.BackgroundGradient}
          />

          {/* Header Card */}
          <Animated.View 
            style={[
              styles.HeaderCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.primaryGreyHex + '40', COLORS.primaryDarkGreyHex + '20']}
              style={styles.HeaderCardGradient}
            >
              <View style={styles.LogoSection}>
                <View style={styles.LogoContainer}>
                  <LinearGradient
                    colors={[COLORS.primaryOrangeHex, COLORS.primaryOrangeHex + '80']}
                    style={styles.LogoGradient}
                  >
                    <CustomIcon name="person-add" size={FONTSIZE.size_30} color={COLORS.primaryWhiteHex} />
                  </LinearGradient>
                </View>
                <Text style={styles.WelcomeTitle}>Join Coffee Club</Text>
                <Text style={styles.WelcomeSubtitle}>Create your personalized coffee experience</Text>
              </View>

              {/* Progress Indicator */}
              <View style={styles.ProgressSection}>
                <View style={styles.ProgressHeader}>
                  <Text style={styles.ProgressLabel}>Profile Setup</Text>
                  <Text style={styles.ProgressPercent}>{Math.round(formProgress * 100)}%</Text>
                </View>
                <View style={styles.ProgressTrack}>
                  <Animated.View
                    style={[
                      styles.ProgressBar,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: getProgressColor(),
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Avatar Preview */}
              <Animated.View 
                style={[
                  styles.AvatarSection,
                  {
                    opacity: avatarAnim,
                    transform: [{ scale: avatarAnim }],
                  },
                ]}
              >
                <Text style={styles.AvatarLabel}>Your Avatar</Text>
                <View style={styles.AvatarWrapper}>
                  <UserAvatar 
                    firstName={sanitizeNameForAvatar(firstName)}
                    lastName={sanitizeNameForAvatar(lastName)}
                    size="large"
                  />
                  <LinearGradient
                    colors={[COLORS.primaryOrangeHex + '30', 'transparent']}
                    style={styles.AvatarGlow}
                  />
                </View>
                <Text style={styles.AvatarText}>
                  {firstName || lastName ? `${firstName} ${lastName}` : 'Your Name Here'}
                </Text>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Form Card */}
          <Animated.View 
            style={[
              styles.FormCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.primaryGreyHex + '40', COLORS.primaryDarkGreyHex + '20']}
              style={styles.FormCardGradient}
            >
              {/* Name Row */}
              <View style={styles.NameRow}>
                <View style={styles.NameInputLeft}>
                  <EnhancedInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    autoCapitalize="words"
                    autoComplete="given-name"
                    error={firstNameError}
                    icon="person"
                    required
                    maxLength={50}
                    validationState={getValidationState(firstName, firstNameError)}
                  />
                </View>
                <View style={styles.NameInputRight}>
                  <EnhancedInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    autoCapitalize="words"
                    autoComplete="family-name"
                    error={lastNameError}
                    icon="person"
                    required
                    maxLength={50}
                    validationState={getValidationState(lastName, lastNameError)}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.InputSection}>
                <EnhancedInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={emailError}
                  icon="mail"
                  required
                  maxLength={254}
                  helpText="We'll use this for order updates and special offers"
                  validationState={getValidationState(email, emailError)}
                />
              </View>

              {/* Password Input */}
              <View style={styles.InputSection}>
                <EnhancedInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a strong password"
                  secureTextEntry
                  autoComplete="password"
                  error={passwordError}
                  icon="lock-closed"
                  required
                  showPasswordStrength
                  passwordStrength={passwordStrength}
                  passwordScore={passwordScore}
                  helpText="8+ characters with uppercase, lowercase, numbers & symbols"
                  validationState={getValidationState(password, passwordError)}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.InputSection}>
                <EnhancedInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                  error={confirmPasswordError}
                  icon="shield-checkmark"
                  required
                  helpText="Must match the password above"
                  validationState={getValidationState(confirmPassword, confirmPasswordError)}
                />
              </View>

              {/* Global Error */}
              {authError && (
                <Animated.View style={styles.ErrorCard}>
                  <LinearGradient
                    colors={[COLORS.primaryRedHex + '20', COLORS.primaryRedHex + '10']}
                    style={styles.ErrorGradient}
                  >
                    <CustomIcon name="alert-circle" size={FONTSIZE.size_20} color={COLORS.primaryRedHex} />
                    <View style={styles.ErrorContent}>
                      <Text style={styles.ErrorTitle}>Registration Failed</Text>
                      <Text style={styles.ErrorMessage}>{authError}</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Terms Notice */}
              <View style={styles.TermsCard}>
                <LinearGradient
                  colors={[COLORS.primaryOrangeHex + '15', COLORS.primaryOrangeHex + '05']}
                  style={styles.TermsGradient}
                >
                  <CustomIcon name="information-circle" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
                  <Text style={styles.TermsText}>
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                  </Text>
                </LinearGradient>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.RegisterButton, isButtonDisabled && styles.RegisterButtonDisabled]}
                onPress={handleRegister}
                disabled={isButtonDisabled}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isButtonDisabled
                      ? [COLORS.primaryGreyHex, COLORS.primaryDarkGreyHex]
                      : [COLORS.primaryOrangeHex, COLORS.primaryOrangeHex + 'CC']
                  }
                  style={styles.RegisterButtonGradient}
                >
                  <View style={styles.RegisterButtonContent}>
                    {isAuthLoading ? (
                      <>
                        <Animated.View style={styles.LoadingIndicator} />
                        <Text style={styles.RegisterButtonText}>Creating Account...</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.RegisterButtonText}>Create Account</Text>
                        <CustomIcon name="chevron-forward" size={FONTSIZE.size_18} color={COLORS.primaryWhiteHex} />
                      </>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.DividerSection}>
                <View style={styles.DividerLine} />
                <Text style={styles.DividerText}>or</Text>
                <View style={styles.DividerLine} />
              </View>

              {/* Sign In Link */}
              <TouchableOpacity
                style={styles.SignInButton}
                onPress={navigateToLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.SignInText}>Already have an account? </Text>
                <Text style={styles.SignInLink}>Sign In</Text>
                <CustomIcon name="log-in" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* Trust Indicators */}
          <View style={styles.TrustSection}>
            <View style={styles.TrustIndicator}>
              <CustomIcon name="shield-checkmark" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
              <Text style={styles.TrustText}>Secure & Encrypted</Text>
            </View>
            <View style={styles.TrustIndicator}>
              <CustomIcon name="mail" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
              <Text style={styles.TrustText}>No Spam Guarantee</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  KeyboardContainer: {
    flex: 1,
  },
  ScrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
  },
  BackgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // Header Card Styles
  HeaderCard: {
    marginBottom: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  HeaderCardGradient: {
    padding: SPACING.space_24,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex + '30',
  },
  LogoSection: {
    alignItems: 'center',
    marginBottom: SPACING.space_24,
  },
  LogoContainer: {
    marginBottom: SPACING.space_16,
    elevation: 4,
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  LogoGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  WelcomeTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_8,
  },
  WelcomeSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.space_16,
  },
  
  // Progress Section
  ProgressSection: {
    marginBottom: SPACING.space_20,
  },
  ProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  ProgressLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  ProgressPercent: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
  },
  ProgressTrack: {
    height: 6,
    backgroundColor: COLORS.primaryGreyHex + '40',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Avatar Section
  AvatarSection: {
    alignItems: 'center',
  },
  AvatarLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_12,
  },
  AvatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.space_8,
  },
  AvatarGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 40,
    zIndex: -1,
  },
  AvatarText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
  },
  
  // Form Card Styles
  FormCard: {
    marginBottom: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  FormCardGradient: {
    padding: SPACING.space_24,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex + '30',
  },
  
  // Form Input Sections
  NameRow: {
    flexDirection: 'row',
    gap: SPACING.space_12,
    marginBottom: SPACING.space_20,
  },
  NameInputLeft: {
    flex: 1,
  },
  NameInputRight: {
    flex: 1,
  },
  InputSection: {
    marginBottom: SPACING.space_20,
  },
  
  // Error Card
  ErrorCard: {
    marginBottom: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
  },
  ErrorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.space_16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryRedHex,
  },
  ErrorContent: {
    flex: 1,
    marginLeft: SPACING.space_12,
  },
  ErrorTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryRedHex,
    marginBottom: SPACING.space_4,
  },
  ErrorMessage: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    lineHeight: 16,
  },
  
  // Terms Card
  TermsCard: {
    marginBottom: SPACING.space_24,
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
  },
  TermsGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.space_16,
  },
  TermsText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginLeft: SPACING.space_12,
    flex: 1,
    lineHeight: 16,
  },
  
  // Register Button
  RegisterButton: {
    marginBottom: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  RegisterButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  RegisterButtonGradient: {
    paddingVertical: SPACING.space_18,
    paddingHorizontal: SPACING.space_24,
  },
  RegisterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  RegisterButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_8,
  },
  LoadingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primaryWhiteHex,
    borderTopColor: 'transparent',
    marginRight: SPACING.space_8,
  },
  
  // Divider
  DividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  DividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.primaryGreyHex + '50',
  },
  DividerText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginHorizontal: SPACING.space_16,
  },
  
  // Sign In Button
  SignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_16,
    marginBottom: SPACING.space_16,
  },
  SignInText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  SignInLink: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginRight: SPACING.space_8,
  },
  
  // Trust Section
  TrustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.space_24,
    paddingVertical: SPACING.space_12,
  },
  TrustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  TrustText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
  },
});

export default RegisterScreen;
