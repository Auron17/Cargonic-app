import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radii } from '../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
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
  size = 'md',
  icon,
  style,
  textStyle,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const getContainerStyle = () => {
    switch (variant) {
      case 'accent':
        return [styles.accentButton, isDisabled && styles.disabledAccent];
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
      case 'accent':
        return [styles.accentText, isDisabled && styles.disabledAccentText];
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

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.textSm;
      case 'lg':
        return styles.textLg;
      case 'md':
      default:
        return styles.textMd;
    }
  };

  const getIndicatorColor = () => {
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'secondary':
        return colors.slate700;
      default:
        return '#FFFFFF';
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
        getSizeStyle(),
        getContainerStyle(),
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getIndicatorColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.baseText, getTextSizeStyle(), getTextStyle(), textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  sizeSm: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sizeMd: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sizeLg: {
    minHeight: 58,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary, // Highway Cobalt #1D4ED8
  },
  disabledPrimary: {
    backgroundColor: '#93C5FD',
  },
  accentButton: {
    backgroundColor: colors.accentDark, // Safety Amber #D97706
  },
  disabledAccent: {
    backgroundColor: '#FDE68A',
  },
  secondaryButton: {
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  disabledSecondary: {
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabledOutline: {
    borderColor: colors.slate300,
  },
  dangerButton: {
    backgroundColor: colors.dangerDark,
  },
  disabledDanger: {
    backgroundColor: '#FCA5A5',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  baseText: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 14,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 18,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  disabledPrimaryText: {
    color: '#FFFFFF',
  },
  accentText: {
    color: '#FFFFFF',
  },
  disabledAccentText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.slate800,
  },
  disabledSecondaryText: {
    color: colors.slate400,
  },
  outlineText: {
    color: colors.primary,
  },
  disabledOutlineText: {
    color: colors.slate400,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  disabledDangerText: {
    color: '#FFFFFF',
  },
});
