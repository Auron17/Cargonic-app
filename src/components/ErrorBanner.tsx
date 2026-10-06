import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ErrorBannerProps {
  message?: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  style,
}: ErrorBannerProps) {
  if (!message) return null;

  return (
    <View style={[styles.container, style]} accessibilityRole="alert">
      <View style={styles.textContainer}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      <View style={styles.actionsContainer}>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Qayta urinish"
          >
            <Text style={styles.retryText}>Qayta urinish</Text>
          </Pressable>
        ) : null}

        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Yopish"
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    color: '#991b1b',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
