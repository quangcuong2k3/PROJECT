import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { getFirebaseImageUrl } from '../services/firebaseServices';

interface FirebaseImageProps {
  productId: string;
  imageType: 'square' | 'portrait';
  style?: any;
  fallbackSource?: any; // Local asset fallback
  placeholder?: React.ReactNode;
}

/**
 * FirebaseImage Component
 * Automatically loads images from Firebase Storage with fallback to local assets
 */
export const FirebaseImage: React.FC<FirebaseImageProps> = ({
  productId,
  imageType,
  style,
  fallbackSource,
  placeholder
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = () => {
      try {
        const firebaseUrl = getFirebaseImageUrl(productId, imageType);
        if (firebaseUrl) {
          setImageUrl(firebaseUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.warn(`Failed to load Firebase image for ${productId}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [productId, imageType]);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        {placeholder || <ActivityIndicator size="small" color="#0000ff" />}
      </View>
    );
  }

  if (error || !imageUrl) {
    // Fallback to local asset
    if (fallbackSource) {
      return (
        <Image
          source={fallbackSource}
          style={style}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      );
    }
    
    // Show placeholder if no fallback
    return (
      <View style={[styles.container, style, styles.placeholder]}>
        {placeholder}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    backgroundColor: '#e0e0e0',
  },
});

export default FirebaseImage;
