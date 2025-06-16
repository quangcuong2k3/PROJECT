import React from 'react';
import {StyleSheet, Image, View, Text, TouchableOpacity} from 'react-native';
import {COLORS, FONTFAMILY, SPACING} from '../theme/theme';
import {generateAvatarStyle, shouldShowAvatar, generateInitials} from '../utils/avatarUtils';
import CustomIcon from './CustomIcon';

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  avatarInitials?: string;
  avatarBackgroundColor?: string;
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';
  style?: any;
  onPress?: () => void;
  showOnlineIndicator?: boolean;
  showEditIcon?: boolean;
  disabled?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  firstName = '',
  lastName = '',
  profileImageUrl,
  avatarInitials,
  avatarBackgroundColor,
  size = 'medium',
  style,
  onPress,
  showOnlineIndicator = false,
  showEditIcon = false,
  disabled = false,
}) => {
  // Size configurations
  const sizeConfig = {
    tiny: { containerSize: 24, fontSize: 10, borderWidth: 1 },
    small: { containerSize: SPACING.space_36, fontSize: 14, borderWidth: 2 },
    medium: { containerSize: 60, fontSize: 20, borderWidth: 2 },
    large: { containerSize: 80, fontSize: 28, borderWidth: 3 },
    xlarge: { containerSize: 120, fontSize: 40, borderWidth: 3 },
  };

  const config = sizeConfig[size];
  const showAvatar = shouldShowAvatar(profileImageUrl);

  // Determine initials and background color
  let displayInitials = avatarInitials;
  let backgroundColor = avatarBackgroundColor;

  if (!displayInitials && (firstName || lastName)) {
    displayInitials = generateInitials(firstName, lastName);
  }

  if (!backgroundColor && displayInitials) {
    const avatarData = generateAvatarStyle(firstName, lastName, {
      size: config.containerSize,
    });
    backgroundColor = avatarData.containerStyle.backgroundColor as string;
  }

  const renderAvatar = () => {
    if (showAvatar) {
      // Generate avatar with initials
      return (
        <View style={[
          styles.AvatarContainer,
          {
            width: config.containerSize,
            height: config.containerSize,
            borderRadius: config.containerSize / 2,
            backgroundColor: backgroundColor || COLORS.primaryOrangeHex,
            borderWidth: config.borderWidth,
          },
          style
        ]}>
          <Text style={[
            styles.AvatarText,
            {
              fontSize: config.fontSize,
              color: COLORS.primaryWhiteHex,
            }
          ]}>
            {displayInitials || 'CF'}
          </Text>
        </View>
      );
    }

    // Show profile image
    return (
      <View style={[
        styles.ImageContainer,
        {
          height: config.containerSize,
          width: config.containerSize,
          borderRadius: config.containerSize / 2,
          borderWidth: config.borderWidth,
        },
        style
      ]}>
        <Image
          source={
            profileImageUrl 
              ? { uri: profileImageUrl }
              : require('../assets/app_images/avatar.png')
          }
          style={{
            height: config.containerSize,
            width: config.containerSize,
            borderRadius: config.containerSize / 2,
          }}
        />
      </View>
    );
  };

  const avatarContent = (
    <View style={styles.AvatarWrapper}>
      {renderAvatar()}
      
      {/* Online Indicator */}
      {showOnlineIndicator && (
        <View style={[
          styles.OnlineIndicator,
          {
            width: Math.max(12, config.containerSize * 0.15),
            height: Math.max(12, config.containerSize * 0.15),
            borderRadius: Math.max(6, config.containerSize * 0.075),
            bottom: size === 'tiny' ? 0 : 2,
            right: size === 'tiny' ? 0 : 2,
          }
        ]} />
      )}
      
      {/* Edit Icon */}
      {showEditIcon && (
        <View style={[
          styles.EditIconContainer,
          {
            width: Math.max(20, config.containerSize * 0.25),
            height: Math.max(20, config.containerSize * 0.25),
            borderRadius: Math.max(10, config.containerSize * 0.125),
            bottom: size === 'tiny' ? -2 : 0,
            right: size === 'tiny' ? -2 : 0,
          }
        ]}>
          <CustomIcon
            name="camera"
            color={COLORS.primaryWhiteHex}
            size={Math.max(10, config.containerSize * 0.15)}
          />
        </View>
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
};

const styles = StyleSheet.create({
  AvatarWrapper: {
    position: 'relative',
  },
  AvatarContainer: {
    borderColor: COLORS.secondaryDarkGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  AvatarText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontWeight: '600',
    textAlign: 'center',
  },
  ImageContainer: {
    borderColor: COLORS.secondaryDarkGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  OnlineIndicator: {
    position: 'absolute',
    backgroundColor: COLORS.primaryOrangeHex,
    borderWidth: 2,
    borderColor: COLORS.primaryDarkGreyHex,
  },
  EditIconContainer: {
    position: 'absolute',
    backgroundColor: COLORS.primaryOrangeHex,
    borderWidth: 1,
    borderColor: COLORS.primaryWhiteHex,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UserAvatar; 