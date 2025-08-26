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
import {useStore} from '../store/firebaseStore';
import authService from '../services/authService';

const {width, height} = Dimensions.get('window');

const ForgotPasswordScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<any>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const successAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const {sendPasswordReset, isAuthLoading, authError} = useStore();

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

    // Pulse animation for security badge
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  // Real-time validation
  useEffect(() => {
    if (email.length > 0) {
      const emailValidation = authService.validateEmail(email);
      setEmailError(emailValidation.isValid ? null : emailValidation.error);
      setIsFormValid(emailValidation.isValid);
    } else {
      setEmailError(null);
      setIsFormValid(false);
    }
  }, [email]);

  const handleSendResetEmail = async () => {
    // Final validation
    const emailValidation = authService.validateEmail(email);
    
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return;
    }

    try {
      const success = await sendPasswordReset(email);
      if (success) {
        setIsEmailSent(true);
        
        // Success animation sequence
        Animated.spring(successAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();

        // Show comprehensive success message
        setTimeout(() => {
          Alert.alert(
            'Reset Email Sent Successfully! 📧',
            `Password reset instructions have been sent to:\n\n${email}\n\nNext steps:\n• Check your inbox (and spam folder)\n• Click the reset link in the email\n• Create a new secure password\n• Sign in with your new password\n\nThe reset link will expire in 1 hour for security.`,
            [
              {
                text: 'Check Email App',
                style: 'default',
              },
              {
                text: 'Back to Login',
                onPress: () => navigation.navigate('Login'),
                style: 'cancel',
              },
            ],
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
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

  const getEmailValidationState = () => {
    if (email.length === 0) return 'neutral';
    return emailError ? 'invalid' : 'valid';
  };

  const isButtonDisabled = !isFormValid || isAuthLoading || isEmailSent;

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
              {/* Back Button */}
              <TouchableOpacity
                style={styles.BackButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.primaryGreyHex + '60', COLORS.primaryGreyHex + '40']}
                  style={styles.BackButtonGradient}
                >
                  <CustomIcon name="arrow-back" color={COLORS.primaryWhiteHex} size={FONTSIZE.size_20} />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.LogoSection}>
                <View style={styles.LogoContainer}>
                  <LinearGradient
                    colors={[COLORS.primaryOrangeHex, COLORS.primaryOrangeHex + '80']}
                    style={styles.LogoGradient}
                  >
                    <CustomIcon name="lock-open" size={FONTSIZE.size_30} color={COLORS.primaryWhiteHex} />
                  </LinearGradient>
                </View>
                <Text style={styles.WelcomeTitle}>Reset Password</Text>
                <Text style={styles.WelcomeSubtitle}>
                  {isEmailSent 
                    ? "Check your email for reset instructions"
                    : "Enter your email to receive reset instructions"
                  }
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Main Content Card */}
          <Animated.View 
            style={[
              styles.ContentCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.primaryGreyHex + '40', COLORS.primaryDarkGreyHex + '20']}
              style={styles.ContentCardGradient}
            >
              {!isEmailSent ? (
                <>
                  {/* Email Input Form */}
                  <View style={styles.FormSection}>
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
                      helpText="Enter the email associated with your account"
                      validationState={getEmailValidationState()}
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
                          <Text style={styles.ErrorTitle}>Reset Failed</Text>
                          <Text style={styles.ErrorMessage}>{authError}</Text>
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  )}

                  {/* Info Cards */}
                  <View style={styles.InfoSection}>
                    <View style={styles.InfoCard}>
                      <LinearGradient
                        colors={[COLORS.primaryOrangeHex + '15', COLORS.primaryOrangeHex + '05']}
                        style={styles.InfoGradient}
                      >
                        <CustomIcon name="mail" size={FONTSIZE.size_18} color={COLORS.primaryOrangeHex} />
                        <View style={styles.InfoContent}>
                          <Text style={styles.InfoTitle}>Check Your Email</Text>
                          <Text style={styles.InfoText}>Instructions will be sent to your inbox</Text>
                        </View>
                      </LinearGradient>
                    </View>

                    <View style={styles.InfoCard}>
                      <LinearGradient
                        colors={[COLORS.primaryOrangeHex + '15', COLORS.primaryOrangeHex + '05']}
                        style={styles.InfoGradient}
                      >
                        <CustomIcon name="time" size={FONTSIZE.size_18} color={COLORS.primaryOrangeHex} />
                        <View style={styles.InfoContent}>
                          <Text style={styles.InfoTitle}>Reset Link Expires</Text>
                          <Text style={styles.InfoText}>Link is valid for 24 hours</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  </View>

                  {/* Reset Button */}
                  <TouchableOpacity
                    style={[styles.ResetButton, isButtonDisabled && styles.ResetButtonDisabled]}
                    onPress={handleSendResetEmail}
                    disabled={isButtonDisabled}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        isButtonDisabled
                          ? [COLORS.primaryGreyHex, COLORS.primaryDarkGreyHex]
                          : [COLORS.primaryOrangeHex, COLORS.primaryOrangeHex + 'CC']
                      }
                      style={styles.ResetButtonGradient}
                    >
                      <View style={styles.ResetButtonContent}>
                        {isAuthLoading ? (
                          <>
                            <Animated.View style={styles.LoadingIndicator} />
                            <Text style={styles.ResetButtonText}>Sending...</Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.ResetButtonText}>Send Reset Email</Text>
                            <CustomIcon name="mail" size={FONTSIZE.size_18} color={COLORS.primaryWhiteHex} />
                          </>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Sign In Link */}
                  <TouchableOpacity
                    style={styles.SignInButton}
                    onPress={navigateToLogin}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.SignInText}>Remember your password? </Text>
                    <Text style={styles.SignInLink}>Sign In</Text>
                    <CustomIcon name="log-in" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
                  </TouchableOpacity>
                </>
              ) : (
                /* Success State */
                <Animated.View 
                  style={[
                    styles.SuccessSection,
                    {
                      opacity: successAnim,
                      transform: [{ scale: successAnim }],
                    },
                  ]}
                >
                  <View style={styles.SuccessIconWrapper}>
                    <LinearGradient
                      colors={['#4ECDC4', '#44A08D']}
                      style={styles.SuccessIconGradient}
                    >
                      <CustomIcon name="checkmark-circle" size={FONTSIZE.size_30 * 2} color={COLORS.primaryWhiteHex} />
                    </LinearGradient>
                  </View>
                  
                  <Text style={styles.SuccessTitle}>Email Sent!</Text>
                  <Text style={styles.SuccessMessage}>
                    Password reset instructions have been sent to:
                  </Text>
                  <Text style={styles.SuccessEmail}>{email}</Text>
                  
                  <View style={styles.StepsSection}>
                    <Text style={styles.StepsTitle}>Next Steps:</Text>
                    
                    <View style={styles.StepItem}>
                      <View style={styles.StepNumber}>
                        <Text style={styles.StepNumberText}>1</Text>
                      </View>
                      <Text style={styles.StepText}>Check your email inbox</Text>
                    </View>
                    
                    <View style={styles.StepItem}>
                      <View style={styles.StepNumber}>
                        <Text style={styles.StepNumberText}>2</Text>
                      </View>
                      <Text style={styles.StepText}>Click the reset link</Text>
                    </View>
                    
                    <View style={styles.StepItem}>
                      <View style={styles.StepNumber}>
                        <Text style={styles.StepNumberText}>3</Text>
                      </View>
                      <Text style={styles.StepText}>Create your new password</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.BackToLoginButton}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[COLORS.primaryOrangeHex + '30', COLORS.primaryOrangeHex + '20']}
                      style={styles.BackToLoginGradient}
                    >
                      <Text style={styles.BackToLoginText}>Back to Login</Text>
                      <CustomIcon name="arrow-forward" size={FONTSIZE.size_16} color={COLORS.primaryWhiteHex} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Support Section */}
              {!isEmailSent && (
                <View style={styles.SupportSection}>
                  <LinearGradient
                    colors={[COLORS.primaryGreyHex + '30', COLORS.primaryGreyHex + '20']}
                    style={styles.SupportGradient}
                  >
                    <CustomIcon name="help-circle" size={FONTSIZE.size_18} color={COLORS.primaryLightGreyHex} />
                    <View style={styles.SupportContent}>
                      <Text style={styles.SupportTitle}>Need Help?</Text>
                      <Text style={styles.SupportText}>
                        Contact support if you're having trouble
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Trust Indicators */}
          <View style={styles.TrustSection}>
            <View style={styles.TrustIndicator}>
              <CustomIcon name="shield-checkmark" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
              <Text style={styles.TrustText}>Secure Reset Process</Text>
            </View>
            <View style={styles.TrustIndicator}>
              <CustomIcon name="time" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
              <Text style={styles.TrustText}>24-Hour Valid Link</Text>
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
  BackButton: {
    position: 'absolute',
    top: SPACING.space_16,
    left: SPACING.space_16,
    zIndex: 10,
  },
  BackButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  LogoSection: {
    alignItems: 'center',
    paddingTop: SPACING.space_20,
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
  
  // Content Card Styles
  ContentCard: {
    marginBottom: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ContentCardGradient: {
    padding: SPACING.space_24,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex + '30',
  },
  
  // Form Section
  FormSection: {
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
  
  // Info Section
  InfoSection: {
    marginBottom: SPACING.space_24,
    gap: SPACING.space_12,
  },
  InfoCard: {
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
  },
  InfoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.space_16,
  },
  InfoContent: {
    flex: 1,
    marginLeft: SPACING.space_12,
  },
  InfoTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  InfoText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    lineHeight: 16,
  },
  
  // Reset Button
  ResetButton: {
    marginBottom: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  ResetButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  ResetButtonGradient: {
    paddingVertical: SPACING.space_18,
    paddingHorizontal: SPACING.space_24,
  },
  ResetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ResetButtonText: {
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
  
  // Success Section
  SuccessSection: {
    alignItems: 'center',
    paddingVertical: SPACING.space_20,
  },
  SuccessIconWrapper: {
    marginBottom: SPACING.space_20,
    elevation: 4,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  SuccessIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  SuccessTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_8,
  },
  SuccessMessage: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginBottom: SPACING.space_8,
  },
  SuccessEmail: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
    textAlign: 'center',
    marginBottom: SPACING.space_24,
  },
  
  // Steps Section
  StepsSection: {
    width: '100%',
    marginBottom: SPACING.space_24,
  },
  StepsTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  StepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  StepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryOrangeHex,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.space_12,
  },
  StepNumberText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  StepText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    flex: 1,
  },
  
  // Back to Login Button
  BackToLoginButton: {
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  BackToLoginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_20,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex + '40',
  },
  BackToLoginText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginRight: SPACING.space_8,
  },
  
  // Support Section
  SupportSection: {
    marginBottom: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
  },
  SupportGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.space_16,
  },
  SupportContent: {
    flex: 1,
    marginLeft: SPACING.space_12,
  },
  SupportTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  SupportText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    lineHeight: 16,
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

export default ForgotPasswordScreen;
