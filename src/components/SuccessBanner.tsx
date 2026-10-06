import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';

interface SuccessBannerProps {
  message?: string | null;
  onDismiss?: () => void;
  autoHideMs?: number;
  style?: ViewStyle;
}

export function SuccessBanner({
  message,
  onDismiss,
  autoHideMs = 4000,
  style,
}: SuccessBannerProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!message || !onDismissRef.current || autoHideMs <= 0) return;
    const timer = setTimeout(() => {
      onDismissRef.current?.();
    }, autoHideMs);
    return () => clearTimeout(timer);
  }, [message, autoHideMs]);

  if (!message) return null;

  return (
    <View style={[styles.container, style]} accessibilityRole="alert">
      <Ionicons
        name="checkmark-circle"
        size={20}
        color={colors.successDark}
        style={styles.icon}
      />
      <Text style={styles.messageText}>{message}</Text>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel="Yopish"
        >
          <Ionicons name="close" size={18} color={colors.successDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.success50,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#065F46',
    lineHeight: 19,
  },
  dismissButton: {
    padding: 6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
