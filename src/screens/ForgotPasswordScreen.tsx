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

const ForgotPasswordScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {sendPasswordReset, isAuthLoading, authError} = useStore();

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const success = await sendPasswordReset(email);
      if (success) {
        setIsEmailSent(true);
        Alert.alert(
          'Email Sent',
          'Password reset email has been sent to your email address. Please check your inbox and follow the instructions.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ],
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
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
            <TouchableOpacity
              style={styles.BackButton}
              onPress={() => navigation.goBack()}>
              <CustomIcon
                name="arrow-back"
                color={COLORS.primaryWhiteHex}
                size={FONTSIZE.size_24}
              />
            </TouchableOpacity>
            <GradientBGIcon
              name="lock-open"
              color={COLORS.primaryOrangeHex}
              size={FONTSIZE.size_30}
            />
            <Text style={styles.HeaderText}>Reset Password</Text>
            <Text style={styles.SubHeaderText}>
              Enter your email address and we'll send you a link to reset your
              password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.FormContainer}>
            {!isEmailSent ? (
              <>
                {/* Email Input */}
                <View style={styles.InputContainer}>
                  <Text style={styles.InputLabel}>Email Address</Text>
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

                {/* Error Message */}
                {authError && (
                  <View style={styles.ErrorContainer}>
                    <Text style={styles.ErrorText}>{authError}</Text>
                  </View>
                )}

                {/* Send Reset Email Button */}
                <TouchableOpacity
                  style={[
                    styles.ResetButton,
                    isAuthLoading && styles.ResetButtonDisabled,
                  ]}
                  onPress={handleSendResetEmail}
                  disabled={isAuthLoading}>
                  <Text style={styles.ResetButtonText}>
                    {isAuthLoading ? 'Sending...' : 'Send Reset Email'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.SuccessContainer}>
                <GradientBGIcon
                  name="check-circle"
                  color={COLORS.primaryOrangeHex}
                  size={FONTSIZE.size_30}
                />
                <Text style={styles.SuccessTitle}>Email Sent!</Text>
                <Text style={styles.SuccessText}>
                  We've sent a password reset link to{' '}
                  <Text style={styles.EmailText}>{email}</Text>
                </Text>
                <Text style={styles.InstructionText}>
                  Please check your inbox and click the link to reset your
                  password.
                </Text>
              </View>
            )}

            {/* Back to Login */}
            <View style={styles.LoginContainer}>
              <Text style={styles.LoginText}>Remember your password? </Text>
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
  },
  InnerViewContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  HeaderContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_36,
    position: 'relative',
  },
  BackButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: SPACING.space_8,
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
    marginTop: SPACING.space_8,
    lineHeight: FONTSIZE.size_20,
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
  ErrorContainer: {
    marginBottom: SPACING.space_16,
  },
  ErrorText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryRedHex,
    textAlign: 'center',
  },
  ResetButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: SPACING.space_10,
    paddingVertical: SPACING.space_16,
    alignItems: 'center',
    marginBottom: SPACING.space_24,
  },
  ResetButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  ResetButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  SuccessContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_36,
  },
  SuccessTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  SuccessText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: FONTSIZE.size_20,
    marginBottom: SPACING.space_12,
  },
  EmailText: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  InstructionText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: FONTSIZE.size_18,
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

export default ForgotPasswordScreen;
