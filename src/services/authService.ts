import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, firestore } from '../../firebaseconfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateInitials, generateAvatarColor, sanitizeNameForAvatar } from '../utils/avatarUtils';

// Enhanced validation patterns and constraints
export const AUTH_CONSTRAINTS = {
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    patterns: {
      uppercase: /[A-Z]/,
      lowercase: /[a-z]/,
      numbers: /\d/,
      specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      commonPasswords: [
        'password', '123456', '123456789', 'qwerty', 'abc123', 
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
      ],
    },
  },
  email: {
    maxLength: 254,
    pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    domains: {
      blocked: [
        'tempmail.com', '10minutemail.com', 'guerrillamail.com', 
        'mailinator.com', 'temp-mail.org', 'throwaway.email',
        'getnada.com', 'maildrop.cc', 'yopmail.com'
      ],
      preferred: ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'],
    },
  },
  name: {
    minLength: 2,
    maxLength: 50,
    allowedChars: /^[a-zA-Z\s'-\.]+$/,
    forbiddenPatterns: [
      /^\s+|\s+$/, // Leading/trailing spaces
      /\s{2,}/, // Multiple consecutive spaces
      /^['-\.]+|['-\.]+$/, // Leading/trailing special chars
    ],
  },
  phone: {
    minLength: 10,
    maxLength: 15,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
  },
  session: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    progressiveLockout: [
      { attempts: 3, duration: 5 * 60 * 1000 }, // 5 minutes after 3 attempts
      { attempts: 5, duration: 15 * 60 * 1000 }, // 15 minutes after 5 attempts
      { attempts: 10, duration: 60 * 60 * 1000 }, // 1 hour after 10 attempts
    ],
  },
};

// Enhanced error types with user-friendly messages and actionable suggestions
export const AUTH_ERRORS = {
  // Email validation errors
  EMAIL_INVALID: {
    code: 'EMAIL_INVALID',
    message: 'Please enter a valid email address',
    suggestion: 'Make sure your email follows the format: example@domain.com',
    severity: 'error' as const,
  },
  EMAIL_BLOCKED_DOMAIN: {
    code: 'EMAIL_BLOCKED_DOMAIN',
    message: 'This email provider is not supported',
    suggestion: 'Please use a different email provider like Gmail, Yahoo, or Outlook',
    severity: 'warning' as const,
  },
  EMAIL_TOO_LONG: {
    code: 'EMAIL_TOO_LONG',
    message: 'Email address is too long',
    suggestion: 'Please use an email address with fewer than 254 characters',
    severity: 'error' as const,
  },
  
  // Password validation errors
  PASSWORD_TOO_SHORT: {
    code: 'PASSWORD_TOO_SHORT',
    message: 'Password must be at least 8 characters long',
    suggestion: 'Create a stronger password with at least 8 characters',
    severity: 'error' as const,
  },
  PASSWORD_TOO_LONG: {
    code: 'PASSWORD_TOO_LONG',
    message: 'Password is too long',
    suggestion: 'Please use a password with fewer than 128 characters',
    severity: 'error' as const,
  },
  PASSWORD_WEAK: {
    code: 'PASSWORD_WEAK',
    message: 'Password is too weak',
    suggestion: 'Include uppercase, lowercase, numbers, and special characters (!@#$%^&*)',
    severity: 'warning' as const,
  },
  PASSWORD_NO_UPPERCASE: {
    code: 'PASSWORD_NO_UPPERCASE',
    message: 'Password must contain at least one uppercase letter',
    suggestion: 'Add at least one uppercase letter (A-Z)',
    severity: 'error' as const,
  },
  PASSWORD_NO_LOWERCASE: {
    code: 'PASSWORD_NO_LOWERCASE',
    message: 'Password must contain at least one lowercase letter',
    suggestion: 'Add at least one lowercase letter (a-z)',
    severity: 'error' as const,
  },
  PASSWORD_NO_NUMBERS: {
    code: 'PASSWORD_NO_NUMBERS',
    message: 'Password must contain at least one number',
    suggestion: 'Add at least one number (0-9)',
    severity: 'error' as const,
  },
  PASSWORD_NO_SPECIAL: {
    code: 'PASSWORD_NO_SPECIAL',
    message: 'Password must contain at least one special character',
    suggestion: 'Add at least one special character (!@#$%^&*)',
    severity: 'error' as const,
  },
  PASSWORD_COMMON: {
    code: 'PASSWORD_COMMON',
    message: 'This password is too common and easily guessable',
    suggestion: 'Choose a unique password that\'s not in common password lists',
    severity: 'warning' as const,
  },
  
  // Name validation errors
  NAME_TOO_SHORT: {
    code: 'NAME_TOO_SHORT',
    message: 'Name must be at least 2 characters long',
    suggestion: 'Please enter your full name',
    severity: 'error' as const,
  },
  NAME_TOO_LONG: {
    code: 'NAME_TOO_LONG',
    message: 'Name is too long',
    suggestion: 'Please use a name with fewer than 50 characters',
    severity: 'error' as const,
  },
  NAME_INVALID_CHARS: {
    code: 'NAME_INVALID_CHARS',
    message: 'Name contains invalid characters',
    suggestion: 'Use only letters, spaces, hyphens, apostrophes, and periods',
    severity: 'error' as const,
  },
  NAME_INVALID_FORMAT: {
    code: 'NAME_INVALID_FORMAT',
    message: 'Name format is invalid',
    suggestion: 'Remove extra spaces and ensure proper formatting',
    severity: 'warning' as const,
  },
  
  // Authentication errors
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'No account found with this email',
    suggestion: 'Check your email or create a new account',
    severity: 'error' as const,
  },
  WRONG_PASSWORD: {
    code: 'WRONG_PASSWORD',
    message: 'Incorrect password',
    suggestion: 'Check your password or use "Forgot Password" to reset it',
    severity: 'error' as const,
  },
  EMAIL_ALREADY_IN_USE: {
    code: 'EMAIL_ALREADY_IN_USE',
    message: 'An account with this email already exists',
    suggestion: 'Try signing in instead, or use "Forgot Password" if needed',
    severity: 'warning' as const,
  },
  TOO_MANY_REQUESTS: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many failed attempts',
    suggestion: 'Please wait 15 minutes before trying again',
    severity: 'error' as const,
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection error',
    suggestion: 'Check your internet connection and try again',
    severity: 'error' as const,
  },
  INVALID_API_KEY: {
    code: 'INVALID_API_KEY',
    message: 'Configuration error',
    suggestion: 'Please contact support for assistance',
    severity: 'error' as const,
  },
  ACCOUNT_LOCKED: {
    code: 'ACCOUNT_LOCKED',
    message: 'Account temporarily locked',
    suggestion: 'Too many failed attempts. Please try again later or reset your password',
    severity: 'error' as const,
  },
  
  // Generic errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'Something went wrong',
    suggestion: 'Please try again or contact support if the problem persists',
    severity: 'error' as const,
  },
};

export interface ValidationResult {
  isValid: boolean;
  error?: {
    code: string;
    message: string;
    suggestion: string;
    severity: 'error' | 'warning' | 'info';
  };
  strength?: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  score?: number; // 0-100 for password strength
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  // Avatar data for users without profile images
  avatarInitials?: string;
  avatarBackgroundColor?: string;
  favoriteItems: string[];
  cartItems: any[];
  orderHistory: string[];
  orders?: string[]; // Alternative field name for orders (for compatibility)
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: string;
    defaultPaymentMethod?: string;
  };
  // Security and session management
  lastLoginAt?: any;
  loginAttempts?: number;
  lockedUntil?: any;
  emailVerified?: boolean;
  createdAt: any;
  updatedAt: any;
}

class AuthService {
  // Enhanced email validation with comprehensive checks
  validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
      return {
        isValid: false,
        error: AUTH_ERRORS.EMAIL_INVALID,
      };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Length check
    if (trimmedEmail.length > AUTH_CONSTRAINTS.email.maxLength) {
      return {
        isValid: false,
        error: AUTH_ERRORS.EMAIL_TOO_LONG,
      };
    }

    // Format validation using comprehensive regex
    if (!AUTH_CONSTRAINTS.email.pattern.test(trimmedEmail)) {
      return {
        isValid: false,
        error: AUTH_ERRORS.EMAIL_INVALID,
      };
    }

    // Domain validation
    const domain = trimmedEmail.split('@')[1];
    if (AUTH_CONSTRAINTS.email.domains.blocked.includes(domain)) {
      return {
        isValid: false,
        error: AUTH_ERRORS.EMAIL_BLOCKED_DOMAIN,
      };
    }

    return { isValid: true };
  }

  // Enhanced password validation with strength assessment and security checks
  validatePassword(password: string): ValidationResult {
    if (!password) {
      return {
        isValid: false,
        error: AUTH_ERRORS.PASSWORD_TOO_SHORT,
        strength: 'weak',
        score: 0,
      };
    }

    const constraints = AUTH_CONSTRAINTS.password;

    // Length checks
    if (password.length < constraints.minLength) {
      return {
        isValid: false,
        error: AUTH_ERRORS.PASSWORD_TOO_SHORT,
        strength: 'weak',
        score: Math.min(20, (password.length / constraints.minLength) * 20),
      };
    }

    if (password.length > constraints.maxLength) {
      return {
        isValid: false,
        error: AUTH_ERRORS.PASSWORD_TOO_LONG,
        strength: 'weak',
        score: 0,
      };
    }

    // Check for common passwords
    if (constraints.patterns.commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase()))) {
      return {
        isValid: false,
        error: AUTH_ERRORS.PASSWORD_COMMON,
        strength: 'weak',
        score: 15,
      };
    }

    // Character requirements
    const hasUppercase = constraints.patterns.uppercase.test(password);
    const hasLowercase = constraints.patterns.lowercase.test(password);
    const hasNumbers = constraints.patterns.numbers.test(password);
    const hasSpecialChars = constraints.patterns.specialChars.test(password);

    if (constraints.requireUppercase && !hasUppercase) {
      return {
        isValid: false,
        error: AUTH_ERRORS.PASSWORD_NO_UPPERCASE,
        strength: 'weak',
        score: 25,
      };
    }

    if (constraints.requireLowercase && !hasLowercase) {
      return {
        isValid: false,
        error: AUTH_ERRORS.PASSWORD_NO_LOWERCASE,
        strength: 'weak',
        score: 25,
      };
    }

    if (constraints.requireNumbers && !hasNumbers) {
      return {
        isValid: false,
        error: AUTH_ERRORS.PASSWORD_NO_NUMBERS,
        strength: 'fair',
        score: 40,
      };
    }

    if (constraints.requireSpecialChars && !hasSpecialChars) {
      return {
        isValid: false,
        error: AUTH_ERRORS.PASSWORD_NO_SPECIAL,
        strength: 'fair',
        score: 50,
      };
    }

    // Calculate comprehensive password strength score
    let strengthScore = 0;
    let strengthLevel: 'weak' | 'fair' | 'good' | 'strong' | 'excellent' = 'weak';

    // Length scoring (30 points max)
    if (password.length >= 8) strengthScore += 10;
    if (password.length >= 12) strengthScore += 10;
    if (password.length >= 16) strengthScore += 10;

    // Character variety scoring (40 points max)
    if (hasUppercase) strengthScore += 10;
    if (hasLowercase) strengthScore += 10;
    if (hasNumbers) strengthScore += 10;
    if (hasSpecialChars) strengthScore += 10;

    // Complexity scoring (30 points max)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 8) strengthScore += 10;
    if (uniqueChars >= 12) strengthScore += 10;
    
    // Check for patterns and repetition
    const hasRepeatingChars = /(.)\1{2,}/.test(password);
    const hasSequentialChars = this.hasSequentialChars(password);
    if (!hasRepeatingChars) strengthScore += 5;
    if (!hasSequentialChars) strengthScore += 5;

    // Determine strength level
    if (strengthScore >= 85) strengthLevel = 'excellent';
    else if (strengthScore >= 70) strengthLevel = 'strong';
    else if (strengthScore >= 55) strengthLevel = 'good';
    else if (strengthScore >= 40) strengthLevel = 'fair';
    else strengthLevel = 'weak';

    return { 
      isValid: true, 
      strength: strengthLevel,
      score: strengthScore 
    };
  }

  // Helper method to detect sequential characters
  private hasSequentialChars(password: string): boolean {
    const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    for (const seq of sequences) {
      for (let i = 0; i < seq.length - 2; i++) {
        const subseq = seq.substring(i, i + 3);
        if (password.toLowerCase().includes(subseq) || password.toLowerCase().includes(subseq.split('').reverse().join(''))) {
          return true;
        }
      }
    }
    return false;
  }

  // Enhanced name validation with comprehensive formatting checks
  validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        error: {
          code: 'NAME_REQUIRED',
          message: `${fieldName} is required`,
          suggestion: `Please enter your ${fieldName.toLowerCase()}`,
          severity: 'error' as const,
        },
      };
    }

    const trimmedName = name.trim();
    const constraints = AUTH_CONSTRAINTS.name;

    // Length validation
    if (trimmedName.length < constraints.minLength) {
      return {
        isValid: false,
        error: {
          ...AUTH_ERRORS.NAME_TOO_SHORT,
          message: `${fieldName} must be at least ${constraints.minLength} characters long`,
        },
      };
    }

    if (trimmedName.length > constraints.maxLength) {
      return {
        isValid: false,
        error: {
          ...AUTH_ERRORS.NAME_TOO_LONG,
          message: `${fieldName} must be less than ${constraints.maxLength} characters`,
        },
      };
    }

    // Character validation
    if (!constraints.allowedChars.test(trimmedName)) {
      return {
        isValid: false,
        error: {
          ...AUTH_ERRORS.NAME_INVALID_CHARS,
          message: `${fieldName} contains invalid characters`,
        },
      };
    }

    // Format validation (forbidden patterns)
    for (const pattern of constraints.forbiddenPatterns) {
      if (pattern.test(trimmedName)) {
        return {
          isValid: false,
          error: {
            ...AUTH_ERRORS.NAME_INVALID_FORMAT,
            message: `${fieldName} format is invalid`,
          },
        };
      }
    }

    return { isValid: true };
  }

  // Enhanced error mapping for Firebase errors with contextual suggestions
  mapFirebaseError(firebaseError: any): { code: string; message: string; suggestion: string; severity: 'error' | 'warning' | 'info' } {
    const errorCode = firebaseError.code || firebaseError.message || '';
    
    switch (errorCode) {
      case 'auth/user-not-found':
        return AUTH_ERRORS.USER_NOT_FOUND;
      case 'auth/wrong-password':
        return AUTH_ERRORS.WRONG_PASSWORD;
      case 'auth/email-already-in-use':
        return AUTH_ERRORS.EMAIL_ALREADY_IN_USE;
      case 'auth/too-many-requests':
        return AUTH_ERRORS.TOO_MANY_REQUESTS;
      case 'auth/network-request-failed':
        return AUTH_ERRORS.NETWORK_ERROR;
      case 'auth/invalid-api-key':
        return AUTH_ERRORS.INVALID_API_KEY;
      case 'auth/invalid-email':
        return AUTH_ERRORS.EMAIL_INVALID;
      case 'auth/weak-password':
        return AUTH_ERRORS.PASSWORD_WEAK;
      case 'auth/user-disabled':
        return AUTH_ERRORS.ACCOUNT_LOCKED;
      default:
        return {
          ...AUTH_ERRORS.UNKNOWN_ERROR,
          message: firebaseError.message || AUTH_ERRORS.UNKNOWN_ERROR.message,
        };
    }
  }

  // Register new user with comprehensive validation and enhanced security
  async registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
<<<<<<< HEAD
  ): Promise<{ success: boolean; user?: User; error?: string }> {
=======
  ): Promise<{success: boolean; user?: User; error?: any}> {
>>>>>>> 1aaca72e2b61d6dee7d00e13971af89fa0c9d1dd
    try {
      // Comprehensive validation
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.isValid) {
        return {success: false, error: emailValidation.error};
      }

      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.isValid) {
        return {success: false, error: passwordValidation.error};
      }

      const firstNameValidation = this.validateName(firstName, 'First name');
      if (!firstNameValidation.isValid) {
        return {success: false, error: firstNameValidation.error};
      }

      const lastNameValidation = this.validateName(lastName, 'Last name');
      if (!lastNameValidation.isValid) {
        return {success: false, error: lastNameValidation.error};
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      const user = userCredential.user;

      // Process names for avatar generation
      const sanitizedFirstName = sanitizeNameForAvatar(firstName);
      const sanitizedLastName = sanitizeNameForAvatar(lastName);
      const avatarInitials = generateInitials(sanitizedFirstName, sanitizedLastName);
      const avatarBackgroundColor = generateAvatarColor(avatarInitials);

      // Update user profile
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      // Create comprehensive user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarInitials,
        avatarBackgroundColor,
        favoriteItems: [],
        cartItems: [],
        orderHistory: [],
        orders: [],
        preferences: {
          notifications: true,
          theme: 'dark',
          language: 'en',
        },
        lastLoginAt: serverTimestamp(),
        loginAttempts: 0,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'users', user.uid), userProfile);

      // Secure session caching
      await AsyncStorage.setItem('userToken', user.uid);
      await AsyncStorage.setItem('userEmail', user.email!);
      await AsyncStorage.setItem('sessionTimestamp', Date.now().toString());

      console.log(`✅ User registered successfully: ${avatarInitials} (${avatarBackgroundColor})`);

      return { success: true, user };
    } catch (error: any) {
      console.error('Registration error:', error);
<<<<<<< HEAD
      return { success: false, error: error.message };
=======
      const mappedError = this.mapFirebaseError(error);
      return {success: false, error: mappedError};
>>>>>>> 1aaca72e2b61d6dee7d00e13971af89fa0c9d1dd
    }
  }

  // Login user with enhanced security and session management
  async loginUser(
    email: string,
    password: string,
<<<<<<< HEAD
  ): Promise<{ success: boolean; user?: User; error?: string }> {
=======
  ): Promise<{success: boolean; user?: User; error?: any}> {
>>>>>>> 1aaca72e2b61d6dee7d00e13971af89fa0c9d1dd
    try {
      // Pre-validation
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.isValid) {
        return {success: false, error: emailValidation.error};
      }

      if (!password || password.length === 0) {
        return {
          success: false,
          error: {
            code: 'PASSWORD_REQUIRED',
            message: 'Password is required',
            suggestion: 'Please enter your password',
            severity: 'error' as const,
          },
        };
      }

      // Check for account lockout
      const isLocked = await this.checkAccountLockout(email);
      if (isLocked) {
        return {
          success: false,
          error: AUTH_ERRORS.ACCOUNT_LOCKED,
        };
      }

      // Attempt login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      const user = userCredential.user;

      // Secure session setup
      await AsyncStorage.setItem('userToken', user.uid);
      await AsyncStorage.setItem('userEmail', user.email!);
      await AsyncStorage.setItem('sessionTimestamp', Date.now().toString());

      // Update user profile with successful login info
      await updateDoc(doc(firestore, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        loginAttempts: 0,
        lockedUntil: null,
        updatedAt: serverTimestamp(),
      });

      return { success: true, user };
    } catch (error: any) {
      console.error('Login error:', error);
<<<<<<< HEAD
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logoutUser(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      // Clear cached session
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userProfile');

      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordReset(
    email: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
=======
      
      // Track failed attempt for progressive lockout
      await this.trackFailedLoginAttempt(email);
      
      const mappedError = this.mapFirebaseError(error);
      return {success: false, error: mappedError};
    }
  }

  // Enhanced password reset with comprehensive validation
  async sendPasswordReset(
    email: string,
  ): Promise<{success: boolean; error?: any}> {
    try {
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.isValid) {
        return {success: false, error: emailValidation.error};
      }

      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return {success: true};
    } catch (error: any) {
      console.error('Password reset error:', error);
      const mappedError = this.mapFirebaseError(error);
      return {success: false, error: mappedError};
    }
  }

  // Enhanced logout with session cleanup
  async logoutUser(): Promise<{success: boolean; error?: any}> {
    try {
      await signOut(auth);
      
      // Clear any stored session data
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userEmail');
      
      return {success: true};
    } catch (error: any) {
      console.error('Logout error:', error);
      const mappedError = this.mapFirebaseError(error);
      return {success: false, error: mappedError};
    }
  }

  // Helper method to check account lockout status
  private async checkAccountLockout(email: string): Promise<boolean> {
    try {
      const attempts = await AsyncStorage.getItem(`loginAttempts_${email}`);
      const lockoutUntil = await AsyncStorage.getItem(`lockoutUntil_${email}`);
      
      if (lockoutUntil) {
        const lockoutTime = parseInt(lockoutUntil);
        if (Date.now() < lockoutTime) {
          return true; // Still locked
        } else {
          // Lockout expired, clear data
          await AsyncStorage.removeItem(`loginAttempts_${email}`);
          await AsyncStorage.removeItem(`lockoutUntil_${email}`);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return false;
    }
  }

  // Helper method to track failed login attempts with progressive lockout
  private async trackFailedLoginAttempt(email: string): Promise<void> {
    try {
      const attemptsKey = `loginAttempts_${email}`;
      const lockoutKey = `lockoutUntil_${email}`;
      
      const currentAttempts = await AsyncStorage.getItem(attemptsKey);
      const attemptCount = currentAttempts ? parseInt(currentAttempts) + 1 : 1;
      
      await AsyncStorage.setItem(attemptsKey, attemptCount.toString());
      
      // Apply progressive lockout
      const lockoutRule = AUTH_CONSTRAINTS.session.progressiveLockout.find(
        rule => attemptCount >= rule.attempts
      );
      
      if (lockoutRule) {
        const lockoutUntil = Date.now() + lockoutRule.duration;
        await AsyncStorage.setItem(lockoutKey, lockoutUntil.toString());
      }
    } catch (error) {
      console.error('Error tracking failed login attempt:', error);
>>>>>>> 1aaca72e2b61d6dee7d00e13971af89fa0c9d1dd
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // If firstName or lastName is being updated, regenerate avatar data
      if (updates.firstName || updates.lastName) {
        const currentProfile = await this.getUserProfile(uid);
        const firstName = updates.firstName || currentProfile?.firstName || '';
        const lastName = updates.lastName || currentProfile?.lastName || '';

        // Keep original names but generate avatar from sanitized versions
        const sanitizedFirstName = sanitizeNameForAvatar(firstName);
        const sanitizedLastName = sanitizeNameForAvatar(lastName);
        const avatarInitials = generateInitials(sanitizedFirstName, sanitizedLastName);
        const avatarBackgroundColor = generateAvatarColor(avatarInitials);

        // Store original names, not sanitized ones
        updates.firstName = firstName.trim();
        updates.lastName = lastName.trim();
        updates.avatarInitials = avatarInitials;
        updates.avatarBackgroundColor = avatarBackgroundColor;

        // Update display name with original names
        if (firstName.trim() && lastName.trim()) {
          updates.displayName = `${firstName.trim()} ${lastName.trim()}`;
        }

        console.log(`✅ Avatar updated: ${avatarInitials} (${avatarBackgroundColor}) for ${firstName.trim()} ${lastName.trim()}`);
      }

      await updateDoc(doc(firestore, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user session exists
  async checkUserSession(): Promise<{
    isAuthenticated: boolean;
    userToken?: string;
    userEmail?: string;
  }> {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userEmail = await AsyncStorage.getItem('userEmail');

      if (userToken && userEmail) {
        return {
          isAuthenticated: true,
          userToken,
          userEmail,
        };
      }
      return { isAuthenticated: false };
    } catch (error) {
      console.error('Error checking user session:', error);
      return { isAuthenticated: false };
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Add item to user favorites
  async addToFavorites(
    uid: string,
    itemId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      const updatedFavorites = [...userProfile.favoriteItems];
      if (!updatedFavorites.includes(itemId)) {
        updatedFavorites.push(itemId);
        await this.updateUserProfile(uid, { favoriteItems: updatedFavorites });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Remove item from user favorites
  async removeFromFavorites(
    uid: string,
    itemId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      const updatedFavorites = userProfile.favoriteItems.filter(
        id => id !== itemId,
      );
      await this.updateUserProfile(uid, { favoriteItems: updatedFavorites });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update user cart
  async updateUserCart(
    uid: string,
    cartItems: any[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateUserProfile(uid, { cartItems });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Add order to user's orders subcollection and orderHistory array
  async addOrderToUserCollection(
    uid: string,
    orderId: string,
    orderData: any,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Adding order ${orderId} to user ${uid} subcollection...`);

      // Add order to user's orders subcollection
      const userOrdersCollection = collection(firestore, 'users', uid, 'orders');
      const orderDocRef = doc(userOrdersCollection, orderId);

      await setDoc(orderDocRef, {
        ...orderData,
        orderId: orderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Order ${orderId} added to user ${uid} orders subcollection`);

      // Also add to orderHistory array for backward compatibility
      await this.addOrderToHistory(uid, orderId);

      return { success: true };
    } catch (error: any) {
      console.error(`❌ Error adding order to user collection:`, error);
      return { success: false, error: error.message };
    }
  }

  // Add order to user history (keeps existing functionality)
  async addOrderToHistory(
    uid: string,
    orderId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      const updatedOrderHistory = [...userProfile.orderHistory, orderId];

      // Update both orderHistory array and orders field (if it exists)
      const updateData: any = {
        orderHistory: updatedOrderHistory,
      };

      // Also update 'orders' field if it exists in the user document
      // This handles both the current structure and any legacy 'orders' field
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.orders !== undefined) {
          // If user document has an 'orders' field, update it too
          const currentOrders = Array.isArray(userData.orders) ? userData.orders : [];
          updateData.orders = [...currentOrders, orderId];
        }
      }

      await this.updateUserProfile(uid, updateData);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get user orders from subcollection
  async getUserOrders(uid: string): Promise<any[]> {
    try {
      console.log(`🔄 Fetching orders for user ${uid} from subcollection...`);

      const userOrdersCollection = collection(firestore, 'users', uid, 'orders');
      const ordersQuery = query(userOrdersCollection, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);

      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`✅ Found ${orders.length} orders for user ${uid}`);
      return orders;
    } catch (error) {
      console.error('❌ Error fetching user orders from subcollection:', error);
      return [];
    }
  }
}

export default new AuthService();
