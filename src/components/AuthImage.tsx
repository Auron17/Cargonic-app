import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { filesApi } from '../api/client';
import { getAccessToken } from '../api/storage';

interface AuthImageProps {
  fileKey?: string | null;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
}

export function AuthImage({
  fileKey,
  style,
  containerStyle,
  placeholder,
}: AuthImageProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getAccessToken().then((t) => {
      if (isMounted) {
        setToken(t);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!fileKey) {
    return (
      <View style={[styles.placeholderContainer, containerStyle]}>
        {placeholder || <View style={styles.emptyPlaceholder} />}
      </View>
    );
  }

  const imageUrl = filesApi.getFileContentUrl(fileKey);

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={{
          uri: imageUrl,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }}
        style={[styles.image, style]}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {isLoading ? (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator color="#1a56db" size="small" />
        </View>
      ) : null}
      {hasError ? (
        <View style={[StyleSheet.absoluteFill, styles.errorOverlay]}>
          {placeholder || <View style={styles.emptyPlaceholder} />}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPlaceholder: {
    backgroundColor: '#e5e7eb',
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    backgroundColor: 'rgba(243, 244, 246, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
