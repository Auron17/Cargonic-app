import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';

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
        <Ionicons
          name="alert-circle"
          size={20}
          color={colors.dangerDark}
          style={styles.icon}
        />
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
            hitSlop={10}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Yopish"
          >
            <Ionicons name="close" size={18} color={colors.dangerDark} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.md,
    padding: 12,
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
    marginRight: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#991B1B',
    lineHeight: 19,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: colors.dangerDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    marginRight: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 3,
  },
  pressed: {
    opacity: 0.85,
  },
});
