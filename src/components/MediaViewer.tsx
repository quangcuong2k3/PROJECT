import React from 'react';
import {Modal, View, Text, StyleSheet} from 'react-native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';

export interface MediaItem {
  type: 'image' | 'video' | 'gif';
  url: string;
}

interface MediaViewerProps {
  visible: boolean;
  media: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  visible,
  media,
  initialIndex,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.placeholderText}>Media viewer coming soon...</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_20,
  },
  placeholderText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MediaViewer; 