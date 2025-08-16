// Avatar generation utilities
import {COLORS, FONTFAMILY, FONTSIZE} from '../theme/theme';

export interface AvatarConfig {
  size: number;
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

// Helper function to get the first meaningful character from a string
const getFirstChar = (str: string): string => {
  const trimmed = str.trim();
  if (!trimmed) return '';
  
  // Get the first character, handling potential Unicode surrogate pairs
  const firstChar = trimmed.charAt(0);
  return firstChar;
};

// Generate initials from name
export const generateInitials = (firstName: string, lastName?: string): string => {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  
  if (!first && !last) {
    return 'CF'; // Default to Coffee
  }
  
  if (!last) {
    // If only one name provided, try to split it into words
    const words = first.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 2) {
      // Take first letter of first two words
      const firstInitial = getFirstChar(words[0]);
      const secondInitial = getFirstChar(words[1]);
      return (firstInitial + secondInitial).toUpperCase();
    } else {
      // Single word, take first two characters
      const firstChar = getFirstChar(first);
      const secondChar = first.length > 1 ? getFirstChar(first.substring(1)) : '';
      return (firstChar + secondChar).toUpperCase();
    }
  }
  
  // Take first letter of first name and first letter of last name
  // Handle cases where names might have multiple words
  const firstWord = first.split(/\s+/)[0] || '';
  const lastWord = last.split(/\s+/)[0] || '';
  
  const firstInitial = getFirstChar(firstWord);
  const lastInitial = getFirstChar(lastWord);
  
  return (firstInitial + lastInitial).toUpperCase();
};

// Generate consistent avatar color based on initials
export const generateAvatarColor = (initials: string): string => {
  const avatarColors = [
    '#FF6B35', // Orange
    '#F7931E', // Golden Orange  
    '#FFD23F', // Yellow
    '#06FFA5', // Mint Green
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Sage Green
    '#FFEAA7', // Light Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Light Gold
    '#BB8FCE', // Light Purple
    '#85C1E9', // Light Blue
    '#F8C471', // Peach
    '#82E0AA', // Light Green
  ];
  
  // Generate consistent index based on initials
  const charSum = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colorIndex = charSum % avatarColors.length;
  
  return avatarColors[colorIndex];
};

// Generate avatar style object for React Native
export const generateAvatarStyle = (
  firstName: string, 
  lastName?: string, 
  config: Partial<AvatarConfig> = {}
) => {
  const initials = generateInitials(firstName, lastName);
  const backgroundColor = config.backgroundColor || generateAvatarColor(initials);
  
  const defaultConfig: AvatarConfig = {
    size: 60,
    fontSize: 24,
    backgroundColor,
    textColor: COLORS.primaryWhiteHex,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.secondaryDarkGreyHex,
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  return {
    initials,
    containerStyle: {
      width: finalConfig.size,
      height: finalConfig.size,
      borderRadius: finalConfig.borderRadius,
      backgroundColor: finalConfig.backgroundColor,
      borderWidth: finalConfig.borderWidth,
      borderColor: finalConfig.borderColor,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      overflow: 'hidden' as const,
    },
    textStyle: {
      fontSize: finalConfig.fontSize,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: finalConfig.textColor,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    },
  };
};

// Generate avatar for different sizes (profile, header, comment, etc.)
export const getAvatarPresets = (firstName: string, lastName?: string) => {
  const initials = generateInitials(firstName, lastName);
  const backgroundColor = generateAvatarColor(initials);
  
  return {
    // Small avatar for header/navigation
    small: generateAvatarStyle(firstName, lastName, {
      size: 36,
      fontSize: 14,
      borderRadius: 18,
      backgroundColor,
    }),
    
    // Medium avatar for profile cards
    medium: generateAvatarStyle(firstName, lastName, {
      size: 60,
      fontSize: 24,
      borderRadius: 30,
      backgroundColor,
    }),
    
    // Large avatar for profile screen
    large: generateAvatarStyle(firstName, lastName, {
      size: 80,
      fontSize: 32,
      borderRadius: 40,
      backgroundColor,
    }),
    
    // Extra large for detailed profile
    xlarge: generateAvatarStyle(firstName, lastName, {
      size: 120,
      fontSize: 48,
      borderRadius: 60,
      backgroundColor,
    }),
    
    // Comment avatar (small, round)
    comment: generateAvatarStyle(firstName, lastName, {
      size: 32,
      fontSize: 12,
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor,
    }),
  };
};

// Validate and sanitize name input for avatar generation only
// This function is used only for generating clean initials, not for storing names
export const sanitizeNameForAvatar = (name: string): string => {
  return name
    .trim()
    // Remove only dangerous characters but keep international letters and diacritics
    .replace(/[<>\"'&\{\}\[\]\\\/\|\`\~\!\@\#\$\%\^\*\(\)\+\=\?\:\;]/g, '')
    // Remove numbers but keep letters with diacritics
    .replace(/[0-9]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Limit length
    .substring(0, 50);
};

// Check if we should show avatar vs profile image
export const shouldShowAvatar = (profileImageUrl?: string): boolean => {
  return !profileImageUrl || profileImageUrl.trim() === '';
};

export default {
  generateInitials,
  generateAvatarColor,
  generateAvatarStyle,
  getAvatarPresets,
  sanitizeNameForAvatar,
  shouldShowAvatar,
}; 