// Firebase Mode Toggle Component
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useStore} from '../store/firebaseStore';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';

interface FirebaseModeToggleProps {
  style?: any;
}

const FirebaseModeToggle: React.FC<FirebaseModeToggleProps> = ({style}) => {
  const useFirebase = useStore(state => state.useFirebase);
  const toggleFirebaseMode = useStore(state => state.toggleFirebaseMode);
  const isLoading = useStore(state => state.isLoading);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Data Source:</Text>
      <TouchableOpacity
        style={[
          styles.toggle,
          {
            backgroundColor: useFirebase
              ? COLORS.primaryOrangeHex
              : COLORS.primaryGreyHex,
          },
        ]}
        onPress={toggleFirebaseMode}
        disabled={isLoading}>
        <Text style={styles.toggleText}>
          {isLoading ? 'Loading...' : useFirebase ? 'Firebase' : 'Local'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_8,
  },
  label: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_8,
  },
  toggle: {
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_4,
    borderRadius: SPACING.space_8,
    minWidth: 70,
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
});

export default FirebaseModeToggle;
