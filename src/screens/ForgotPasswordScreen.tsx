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

const ForgotPasswordScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<any>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
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
              <TouchableOpacity
                style={styles.BackButton}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <View style={styles.BackButtonContainer}>
                  <CustomIcon
                    name="arrow-back"
                    color={COLORS.primaryWhiteHex}
                    size={FONTSIZE.size_24}
                  />
                </View>
              </TouchableOpacity>
              
              <View style={styles.LogoContainer}>
                <GradientBGIcon
                  name="lock-open"
                  color={COLORS.primaryOrangeHex}
                  size={FONTSIZE.size_30}
                />
                <View style={styles.IconRing} />
                <View style={styles.IconRingOuter} />
              </View>
              
              <Text style={styles.HeaderText}>Reset Password</Text>
              <Text style={styles.SubHeaderText}>
                Don't worry! Enter your email address and we'll send you secure instructions to reset your password
              </Text>

              {/* Security Badge */}
              <Animated.View style={[
                styles.SecurityBadge,
                { transform: [{ scale: pulseAnim }] }
              ]}>
                <CustomIcon 
                  name="shield-checkmark" 
                  size={FONTSIZE.size_18} 
                  color={COLORS.primaryOrangeHex} 
                />
                <Text style={styles.SecurityText}>256-bit encrypted recovery</Text>
              </Animated.View>
            </View>

            {/* Main Content */}
            <View style={styles.FormContainer}>
              {!isEmailSent ? (
                <>
                  {/* Email Input */}
                  <EnhancedInput
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your registered email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    error={emailError}
                    icon="mail"
                    required
                    maxLength={254}
                    helpText="We'll send reset instructions to this email address"
                    validationState={getEmailValidationState()}
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
                          Please verify your email address and try again
                        </Text>
                      </View>
                    </Animated.View>
                  )}

                  {/* Information Cards */}
                  <View style={styles.InfoCardsContainer}>
                    <View style={styles.InfoCard}>
                      <CustomIcon 
                        name="information-circle" 
                        size={FONTSIZE.size_20} 
                        color={COLORS.primaryOrangeHex} 
                      />
                      <View style={styles.InfoTextContainer}>
                        <Text style={styles.InfoTitle}>What happens next?</Text>
                        <Text style={styles.InfoText}>
                          • We'll email you a secure reset link{'\n'}
                          • Click the link to create a new password{'\n'}
                          • The link expires in 1 hour for security{'\n'}
                          • Sign in with your new password
                        </Text>
                      </View>
                    </View>

                    <View style={styles.InfoCard}>
                      <CustomIcon 
                        name="time" 
                        size={FONTSIZE.size_20} 
                        color="#4ECDC4" 
                      />
                      <View style={styles.InfoTextContainer}>
                        <Text style={styles.InfoTitle}>Can't find the email?</Text>
                        <Text style={styles.InfoText}>
                          • Check your spam/junk folder{'\n'}
                          • Wait 2-3 minutes for delivery{'\n'}
                          • Ensure you entered the correct email{'\n'}
                          • Contact support if still missing
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Send Reset Button */}
                  <TouchableOpacity
                    style={[
                      styles.ResetButton,
                      isButtonDisabled && styles.ResetButtonDisabled,
                      isFormValid && styles.ResetButtonValid,
                    ]}
                    onPress={handleSendResetEmail}
                    disabled={isButtonDisabled}
                    activeOpacity={0.8}
                  >
                    <View style={styles.ButtonContent}>
                      {isAuthLoading ? (
                        <>
                          <Animated.View style={styles.LoadingSpinner} />
                          <Text style={styles.ResetButtonText}>Sending Email...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.ResetButtonText}>Send Reset Email</Text>
                          <CustomIcon 
                            name="mail" 
                            size={FONTSIZE.size_18} 
                            color={COLORS.primaryWhiteHex} 
                          />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                // Success State
                <Animated.View style={[
                  styles.SuccessContainer,
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
                ]}>
                  <View style={styles.SuccessIconContainer}>
                    <CustomIcon
                      name="checkmark-circle"
                      size={FONTSIZE.size_30 * 2}
                      color="#4ECDC4"
                    />
                  </View>
                  
                  <Text style={styles.SuccessTitle}>Email Sent Successfully!</Text>
                  <Text style={styles.SuccessMessage}>
                    We've sent password reset instructions to:
                  </Text>
                  <Text style={styles.SuccessEmail}>{email}</Text>
                  
                  <View style={styles.SuccessStepsContainer}>
                    <Text style={styles.SuccessStepsTitle}>Next Steps:</Text>
                    <View style={styles.SuccessStep}>
                      <View style={styles.StepNumber}>
                        <Text style={styles.StepNumberText}>1</Text>
                      </View>
                      <Text style={styles.StepText}>Check your email inbox</Text>
                    </View>
                    <View style={styles.SuccessStep}>
                      <View style={styles.StepNumber}>
                        <Text style={styles.StepNumberText}>2</Text>
                      </View>
                      <Text style={styles.StepText}>Click the reset link</Text>
                    </View>
                    <View style={styles.SuccessStep}>
                      <View style={styles.StepNumber}>
                        <Text style={styles.StepNumberText}>3</Text>
                      </View>
                      <Text style={styles.StepText}>Create a new password</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.BackToLoginButton}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.BackToLoginText}>Back to Login</Text>
                    <CustomIcon 
                      name="arrow-forward" 
                      size={FONTSIZE.size_16} 
                      color={COLORS.primaryOrangeHex} 
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Support Information */}
              {!isEmailSent && (
                <View style={styles.SupportContainer}>
                  <CustomIcon 
                    name="help-circle" 
                    size={FONTSIZE.size_18} 
                    color={COLORS.primaryLightGreyHex} 
                  />
                  <View style={styles.SupportTextContainer}>
                    <Text style={styles.SupportTitle}>Need Help?</Text>
                    <Text style={styles.SupportText}>
                      Contact our support team if you're having trouble resetting your password
                    </Text>
                  </View>
                </View>
              )}

              {/* Bottom Navigation */}
              {!isEmailSent && (
                <TouchableOpacity
                  style={styles.LoginLinkContainer}
                  onPress={navigateToLogin}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Text style={styles.LoginLinkText}>
                    Remember your password? 
                  </Text>
                  <Text style={styles.LoginLink}> Sign In</Text>
                  <CustomIcon 
                    name="log-in" 
                    size={FONTSIZE.size_16} 
                    color={COLORS.primaryOrangeHex} 
                  />
                </TouchableOpacity>
              )}
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
    marginBottom: SPACING.space_40,
    position: 'relative',
  },
  BackButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  BackButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primaryOrangeHex}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  LogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.space_20,
    position: 'relative',
  },
  IconRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: `${COLORS.primaryOrangeHex}40`,
    zIndex: -1,
  },
  IconRingOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: `${COLORS.primaryOrangeHex}20`,
    zIndex: -2,
  },
  HeaderText: {
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
    paddingHorizontal: SPACING.space_16,
  },
  SecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primaryOrangeHex}15`,
    borderRadius: BORDERRADIUS.radius_20,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderWidth: 1,
    borderColor: `${COLORS.primaryOrangeHex}30`,
  },
  SecurityText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_8,
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
  InfoCardsContainer: {
    marginBottom: SPACING.space_24,
  },
  InfoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primaryOrangeHex}08`,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_12,
    borderWidth: 1,
    borderColor: `${COLORS.primaryOrangeHex}20`,
  },
  InfoTextContainer: {
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
  ResetButton: {
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
  ResetButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
    shadowOpacity: 0,
    elevation: 0,
  },
  ResetButtonValid: {
    shadowOpacity: 0.4,
    elevation: 10,
  },
  ButtonContent: {
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
  LoadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primaryWhiteHex,
    borderTopColor: 'transparent',
    marginRight: SPACING.space_8,
  },
  SuccessContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.space_32,
  },
  SuccessIconContainer: {
    marginBottom: SPACING.space_24,
  },
  SuccessTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_24,
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
  SuccessStepsContainer: {
    width: '100%',
    marginBottom: SPACING.space_32,
  },
  SuccessStepsTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  SuccessStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  StepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  BackToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primaryOrangeHex}20`,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_20,
    borderWidth: 1,
    borderColor: `${COLORS.primaryOrangeHex}40`,
  },
  BackToLoginText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginRight: SPACING.space_8,
  },
  SupportContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.primaryOrangeHex}08`,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_24,
  },
  SupportTextContainer: {
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
  LoginLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_16,
  },
  LoginLinkText: {
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

export default ForgotPasswordScreen;
