import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { filesApi } from '../api/client';
import { getAccessToken } from '../api/storage';
import { uz } from '../i18n/uz';
import { colors } from '../theme';

interface AuthImageProps {
  fileKey?: string | null;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  accessibilityLabel?: string;
}

export function AuthImage({
  fileKey,
  style,
  containerStyle,
  placeholder,
  accessibilityLabel,
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

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [fileKey]);

  const imageLabel = accessibilityLabel || uz.common.image;
  const errorLabel = uz.common.imageUnavailable;

  if (!fileKey) {
    return (
      <View
        style={[styles.placeholderContainer, containerStyle]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={errorLabel}
      >
        {placeholder || <Text style={styles.fallbackText}>{errorLabel}</Text>}
      </View>
    );
  }

  const imageUrl = filesApi.getFileContentUrl(fileKey);

  return (
    <View
      style={[styles.container, containerStyle]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={hasError ? errorLabel : imageLabel}
      accessibilityState={{ busy: isLoading }}
    >
      <Image
        source={{
          uri: imageUrl,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }}
        style={[styles.image, style]}
        accessible={false}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {isLoading ? (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : null}
      {hasError ? (
        <View style={[StyleSheet.absoluteFill, styles.errorOverlay]}>
          {placeholder || <Text style={styles.fallbackText}>{errorLabel}</Text>}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.slate100,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    backgroundColor: colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  loadingOverlay: {
    backgroundColor: 'rgba(241, 245, 249, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    backgroundColor: colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
