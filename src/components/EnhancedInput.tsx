import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS} from '../theme/theme';
import CustomIcon from './CustomIcon';

const {width} = Dimensions.get('window');

interface EnhancedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'given-name' | 'family-name' | 'off';
  error?: {
    message: string;
    suggestion?: string;
    severity?: 'error' | 'warning' | 'info';
  };
  showPasswordStrength?: boolean;
  passwordStrength?: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  passwordScore?: number;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  icon?: any;
  helpText?: string;
  showCharacterCount?: boolean;
  validationState?: 'valid' | 'invalid' | 'neutral';
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  error,
  showPasswordStrength = false,
  passwordStrength,
  passwordScore = 0,
  disabled = false,
  required = false,
  maxLength,
  onFocus,
  onBlur,
  icon,
  helpText,
  showCharacterCount = false,
  validationState = 'neutral',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const errorSlideAnim = useRef(new Animated.Value(-20)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    
    // Focus animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Blur animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    onBlur?.();
  };

  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateError = () => {
    Animated.parallel([
      Animated.timing(errorSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animateSuccess = () => {
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Effect for error animations
  useEffect(() => {
    if (error) {
      shakeInput();
      animateError();
    } else {
      Animated.timing(errorSlideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [error]);

  // Effect for success animations
  useEffect(() => {
    if (validationState === 'valid' && value.length > 0 && !error) {
      animateSuccess();
    }
  }, [validationState, value, error]);

  // Effect for password strength animation
  useEffect(() => {
    if (showPasswordStrength && passwordScore !== undefined) {
      Animated.timing(progressAnim, {
        toValue: passwordScore / 100,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [passwordScore, showPasswordStrength]);

  const getPasswordStrengthColor = (strength?: string) => {
    switch (strength) {
      case 'weak':
        return '#DC3535';
      case 'fair':
        return '#FF6B6B';
      case 'good':
        return '#FFA500';
      case 'strong':
        return '#4ECDC4';
      case 'excellent':
        return '#45B7D1';
      default:
        return COLORS.primaryGreyHex;
    }
  };

  const getPasswordStrengthWidth = (strength?: string) => {
    switch (strength) {
      case 'weak':
        return '20%';
      case 'fair':
        return '40%';
      case 'good':
        return '60%';
      case 'strong':
        return '80%';
      case 'excellent':
        return '100%';
      default:
        return '0%';
    }
  };

  const getBorderColor = () => {
    if (error && error.severity === 'error') return COLORS.primaryRedHex;
    if (error && error.severity === 'warning') return '#FFA500';
    if (validationState === 'valid' && value.length > 0) return '#4ECDC4';
    if (isFocused) return COLORS.primaryOrangeHex;
    return COLORS.primaryGreyHex;
  };

  const getLabelColor = () => {
    if (error && error.severity === 'error') return COLORS.primaryRedHex;
    if (error && error.severity === 'warning') return '#FFA500';
    if (validationState === 'valid' && value.length > 0) return '#4ECDC4';
    if (isFocused) return COLORS.primaryOrangeHex;
    return COLORS.primaryLightGreyHex;
  };

  const getIconColor = () => {
    if (error && error.severity === 'error') return COLORS.primaryRedHex;
    if (error && error.severity === 'warning') return '#FFA500';
    if (validationState === 'valid' && value.length > 0) return '#4ECDC4';
    if (isFocused) return COLORS.primaryOrangeHex;
    return COLORS.primaryLightGreyHex;
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }
      ]}
    >
      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: getLabelColor() }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {showCharacterCount && maxLength && (
          <Text style={[
            styles.characterCount,
            { color: value.length > maxLength * 0.9 ? COLORS.primaryRedHex : COLORS.primaryLightGreyHex }
          ]}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>

      {/* Input Container */}
      <Animated.View style={[
        styles.inputContainer,
        { borderColor: getBorderColor() },
        isFocused && styles.inputContainerFocused,
        error && error.severity === 'error' && styles.inputContainerError,
        error && error.severity === 'warning' && styles.inputContainerWarning,
        validationState === 'valid' && value.length > 0 && styles.inputContainerValid,
        disabled && styles.inputContainerDisabled,
      ]}>
        {/* Leading Icon */}
        {icon && (
          <View style={styles.iconContainer}>
            <CustomIcon
              name={icon}
              size={FONTSIZE.size_20}
              color={getIconColor()}
            />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.textInput,
            { color: disabled ? COLORS.primaryLightGreyHex : COLORS.primaryWhiteHex },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.primaryLightGreyHex}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          maxLength={maxLength}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={COLORS.primaryOrangeHex}
        />

        {/* Trailing Icons */}
        <View style={styles.trailingIconsContainer}>
          {/* Success Icon */}
          {validationState === 'valid' && value.length > 0 && !error && (
            <Animated.View style={[
              styles.successIconContainer,
              { opacity: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }
            ]}>
              <CustomIcon
                name="checkmark-circle"
                size={FONTSIZE.size_20}
                color="#4ECDC4"
              />
            </Animated.View>
          )}

          {/* Password Toggle */}
          {secureTextEntry && (
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CustomIcon
                name={showPassword ? 'eye-off' : 'eye'}
                size={FONTSIZE.size_20}
                color={getIconColor()}
              />
            </TouchableOpacity>
          )}

          {/* Error/Warning Icon */}
          {error && (
            <View style={styles.errorIconContainer}>
              <CustomIcon
                name={error.severity === 'warning' ? 'warning' : 'alert-circle'}
                size={FONTSIZE.size_20}
                color={error.severity === 'warning' ? '#FFA500' : COLORS.primaryRedHex}
              />
            </View>
          )}
        </View>
      </Animated.View>

      {/* Password Strength Indicator */}
      {showPasswordStrength && value.length > 0 && (
        <View style={styles.passwordStrengthContainer}>
          <View style={styles.passwordStrengthBar}>
            <Animated.View
              style={[
                styles.passwordStrengthProgress,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: getPasswordStrengthColor(passwordStrength),
                },
              ]}
            />
          </View>
          <View style={styles.passwordStrengthInfo}>
            <Text style={[
              styles.passwordStrengthText,
              { color: getPasswordStrengthColor(passwordStrength) }
            ]}>
              {passwordStrength ? passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1) : 'Weak'}
            </Text>
            <Text style={styles.passwordScoreText}>
              {Math.round(passwordScore)}%
            </Text>
          </View>
        </View>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}

      {/* Error Message */}
      {error && (
        <Animated.View style={[
          styles.errorContainer,
          { transform: [{ translateY: errorSlideAnim }] }
        ]}>
          <Text style={[
            styles.errorText,
            { color: error.severity === 'warning' ? '#FFA500' : COLORS.primaryRedHex }
          ]}>
            {error.message}
          </Text>
          {error.suggestion && (
            <Text style={styles.errorSuggestion}>
              💡 {error.suggestion}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Focus Indicator */}
      <Animated.View
        style={[
          styles.focusIndicator,
          {
            opacity: fadeAnim,
            backgroundColor: getBorderColor(),
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.space_20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  label: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  required: {
    color: COLORS.primaryRedHex,
  },
  characterCount: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderWidth: 2,
    borderRadius: BORDERRADIUS.radius_15,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: Platform.OS === 'ios' ? SPACING.space_16 : SPACING.space_12,
    minHeight: 56,
  },
  inputContainerFocused: {
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainerError: {
    shadowColor: COLORS.primaryRedHex,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainerWarning: {
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainerValid: {
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainerDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.primaryGreyHex,
  },
  iconContainer: {
    marginRight: SPACING.space_12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  trailingIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  successIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggle: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_4,
  },
  errorIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordStrengthContainer: {
    marginTop: SPACING.space_8,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthProgress: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.space_4,
  },
  passwordStrengthText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
  },
  passwordScoreText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
  },
  helpText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_8,
    lineHeight: 16,
  },
  errorContainer: {
    marginTop: SPACING.space_8,
  },
  errorText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    lineHeight: 16,
  },
  errorSuggestion: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_4,
    lineHeight: 16,
  },
  focusIndicator: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
});

export default EnhancedInput; 