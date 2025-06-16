import React from 'react';
import {StyleSheet, Image, View, Text} from 'react-native';
import {COLORS, SPACING, FONTFAMILY} from '../theme/theme';
import {generateAvatarStyle, shouldShowAvatar} from '../utils/avatarUtils';

interface ProfilePicProps {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: any;
}

const ProfilePic: React.FC<ProfilePicProps> = ({
  firstName = '',
  lastName = '',
  profileImageUrl,
  size = 'small',
  style,
}) => {
  // Size configurations
  const sizeConfig = {
    small: { containerSize: SPACING.space_36, fontSize: 14 },
    medium: { containerSize: 60, fontSize: 20 },
    large: { containerSize: 80, fontSize: 28 },
    xlarge: { containerSize: 120, fontSize: 40 },
  };

  const config = sizeConfig[size];
  const showAvatar = shouldShowAvatar(profileImageUrl);

  if (showAvatar) {
    // Generate avatar with initials
    const avatarData = generateAvatarStyle(firstName, lastName, {
      size: config.containerSize,
      fontSize: config.fontSize,
      borderRadius: config.containerSize / 2,
    });

    return (
      <View style={[styles.ImageContainer, avatarData.containerStyle, style]}>
        <Text style={avatarData.textStyle}>
          {avatarData.initials}
        </Text>
      </View>
    );
  }

  // Show profile image if available
  return (
    <View style={[
      styles.ImageContainer,
      {
        height: config.containerSize,
        width: config.containerSize,
        borderRadius: config.containerSize / 2,
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

const styles = StyleSheet.create({
  ImageContainer: {
    borderWidth: 2,
    borderColor: COLORS.secondaryDarkGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default ProfilePic;
