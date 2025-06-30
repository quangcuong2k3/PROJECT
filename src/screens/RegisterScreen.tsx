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
  const successAnim = useRef(new Animated.Value(0)).current;

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
                <GradientBGIcon
                  name="person-add"
                  color={COLORS.primaryOrangeHex}
                  size={FONTSIZE.size_30}
                />
                <View style={styles.WelcomeRing} />
              </View>
              
              <Text style={styles.WelcomeText}>Join Coffee Shop</Text>
              <Text style={styles.SubHeaderText}>
                Create your account and start your personalized coffee journey
              </Text>

              {/* Form Progress Indicator */}
              <View style={styles.ProgressContainer}>
                <View style={styles.ProgressHeader}>
                  <Text style={styles.ProgressText}>
                    Profile Completion
                  </Text>
                  <Text style={styles.ProgressPercentage}>
                    {Math.round(formProgress * 100)}%
                  </Text>
                </View>
                <View style={styles.ProgressBar}>
                  <Animated.View
                    style={[
                      styles.ProgressFill,
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
                  styles.AvatarPreviewContainer,
                  {
                    opacity: avatarAnim,
                    transform: [
                      {
                        scale: avatarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.AvatarPreviewLabel}>Your Avatar Preview</Text>
                <View style={styles.AvatarContainer}>
                  <UserAvatar 
                    firstName={sanitizeNameForAvatar(firstName)}
                    lastName={sanitizeNameForAvatar(lastName)}
                    size="large"
                  />
                  <View style={styles.AvatarGlow} />
                </View>
                <Text style={styles.AvatarPreviewText}>
                  Initials: "{getPreviewInitials()}"
                </Text>
                <Text style={styles.AvatarPreviewSubtext}>
                  {firstName} {lastName}
                </Text>
              </Animated.View>
            </View>

            {/* Form Section */}
            <View style={styles.FormContainer}>
              {/* Name Inputs */}
              <View style={styles.RowContainer}>
                <View style={styles.HalfWidthContainer}>
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
                    showCharacterCount
                    validationState={getValidationState(firstName, firstNameError)}
                  />
                </View>
                <View style={styles.HalfWidthContainer}>
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
                    showCharacterCount
                    validationState={getValidationState(lastName, lastNameError)}
                  />
                </View>
              </View>

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
                helpText="We'll send order confirmations and special offers to this email"
                validationState={getValidationState(email, emailError)}
              />

              {/* Password Input */}
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
                helpText="Must be at least 8 characters with uppercase, lowercase, numbers, and symbols"
                validationState={getValidationState(password, passwordError)}
              />

              {/* Confirm Password Input */}
              <EnhancedInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                error={confirmPasswordError}
                icon="shield-checkmark"
                required
                helpText="Re-enter your password to confirm"
                validationState={getValidationState(confirmPassword, confirmPasswordError)}
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
                      Please check your information and try again
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Terms & Privacy Info */}
              <View style={styles.TermsContainer}>
                <CustomIcon 
                  name="information-circle" 
                  size={FONTSIZE.size_16} 
                  color={COLORS.primaryOrangeHex} 
                />
                <Text style={styles.TermsText}>
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </Text>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.RegisterButton,
                  isButtonDisabled && styles.RegisterButtonDisabled,
                  isFormValid && styles.RegisterButtonValid,
                ]}
                onPress={handleRegister}
                disabled={isButtonDisabled}
                activeOpacity={0.8}
              >
                <Animated.View style={[
                  styles.ButtonContent,
                  {
                    transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }],
                  },
                ]}>
                  {isAuthLoading ? (
                    <>
                      <Animated.View style={styles.LoadingSpinner} />
                      <Text style={styles.RegisterButtonText}>Creating Account...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.RegisterButtonText}>Create Account</Text>
                      <CustomIcon 
                        name="checkmark" 
                        size={FONTSIZE.size_18} 
                        color={COLORS.primaryWhiteHex} 
                      />
                    </>
                  )}
                </Animated.View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.DividerContainer}>
                <View style={styles.DividerLine} />
                <Text style={styles.DividerText}>or</Text>
                <View style={styles.DividerLine} />
              </View>

              {/* Login Link */}
              <TouchableOpacity
                style={styles.LoginContainer}
                onPress={navigateToLogin}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Text style={styles.LoginText}>
                  Already have an account? 
                </Text>
                <Text style={styles.LoginLink}> Sign In</Text>
                <CustomIcon 
                  name="log-in" 
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
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_20,
  },
  InnerViewContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  HeaderContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_32,
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
  ProgressContainer: {
    width: '100%',
    marginBottom: SPACING.space_24,
  },
  ProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  ProgressText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  ProgressPercentage: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
  },
  ProgressBar: {
    height: 6,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  AvatarPreviewContainer: {
    alignItems: 'center',
    backgroundColor: `${COLORS.primaryOrangeHex}10`,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_20,
    marginBottom: SPACING.space_16,
    borderWidth: 1,
    borderColor: `${COLORS.primaryOrangeHex}30`,
  },
  AvatarPreviewLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_12,
  },
  AvatarContainer: {
    position: 'relative',
    marginBottom: SPACING.space_12,
  },
  AvatarGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 40,
    backgroundColor: `${COLORS.primaryOrangeHex}20`,
    zIndex: -1,
  },
  AvatarPreviewText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  AvatarPreviewSubtext: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  FormContainer: {
    width: '100%',
  },
  RowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.space_12,
  },
  HalfWidthContainer: {
    flex: 1,
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
  TermsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.primaryOrangeHex}10`,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_24,
  },
  TermsText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginLeft: SPACING.space_12,
    flex: 1,
    lineHeight: 16,
  },
  RegisterButton: {
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
  RegisterButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
    shadowOpacity: 0,
    elevation: 0,
  },
  RegisterButtonValid: {
    shadowOpacity: 0.4,
    elevation: 10,
  },
  ButtonContent: {
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
  LoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_16,
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
    marginRight: SPACING.space_8,
  },
});

export default RegisterScreen;
