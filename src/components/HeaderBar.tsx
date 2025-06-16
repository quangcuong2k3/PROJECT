import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import GradientBGIcon from './GradientBGIcon';
import UserAvatar from './UserAvatar';
import {useStore} from '../store/firebaseStore';

interface HeaderBarProps {
  title?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({title}) => {
  const {userProfile} = useStore();

  return (
    <View style={styles.HeaderContainer}>
      <GradientBGIcon
        name="menu-outline"
        color={COLORS.primaryLightGreyHex}
        size={FONTSIZE.size_16}
      />
      <Text style={styles.HeaderText}>{title}</Text>
      <UserAvatar 
        firstName={userProfile?.firstName}
        lastName={userProfile?.lastName}
        profileImageUrl={userProfile?.profileImageUrl}
        avatarInitials={userProfile?.avatarInitials}
        avatarBackgroundColor={userProfile?.avatarBackgroundColor}
        size="small"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  HeaderContainer: {
    padding: SPACING.space_30,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
});

export default HeaderBar;
