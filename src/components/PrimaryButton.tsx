import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.secondaryButton, isDisabled && styles.disabledSecondary];
      case 'danger':
        return [styles.dangerButton, isDisabled && styles.disabledDanger];
      case 'outline':
        return [styles.outlineButton, isDisabled && styles.disabledOutline];
      case 'primary':
      default:
        return [styles.primaryButton, isDisabled && styles.disabledPrimary];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.secondaryText, isDisabled && styles.disabledSecondaryText];
      case 'danger':
        return [styles.dangerText, isDisabled && styles.disabledDangerText];
      case 'outline':
        return [styles.outlineText, isDisabled && styles.disabledOutlineText];
      case 'primary':
      default:
        return [styles.primaryText, isDisabled && styles.disabledPrimaryText];
    }
  };

  const getIndicatorColor = () => {
    switch (variant) {
      case 'outline':
        return '#1a56db';
      case 'secondary':
        return '#374151';
      default:
        return '#ffffff';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.baseButton,
        getContainerStyle(),
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getIndicatorColor()} size="small" />
      ) : (
        <Text style={[styles.baseText, getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    minHeight: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButton: {
    backgroundColor: '#1a56db', // Strong contrast royal blue
  },
  disabledPrimary: {
    backgroundColor: '#93c5fd',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
  },
  disabledSecondary: {
    backgroundColor: '#f9fafb',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1a56db',
  },
  disabledOutline: {
    borderColor: '#d1d5db',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  disabledDanger: {
    backgroundColor: '#fca5a5',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  baseText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: '#ffffff',
  },
  disabledPrimaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#1f2937',
  },
  disabledSecondaryText: {
    color: '#9ca3af',
  },
  outlineText: {
    color: '#1a56db',
  },
  disabledOutlineText: {
    color: '#9ca3af',
  },
  dangerText: {
    color: '#ffffff',
  },
  disabledDangerText: {
    color: '#ffffff',
  },
});
