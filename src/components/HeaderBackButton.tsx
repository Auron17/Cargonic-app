import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCopy } from '../i18n';
import { colors, radii, shadows } from '../theme';

type Props = {
  fallback?: Href;
};

export function HeaderBackButton({ fallback = '/(tabs)' }: Props) {
  const uz = useCopy();
  const router = useRouter();

  const onPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallback);
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={uz.common.back}
    >
      <Ionicons name="chevron-back" size={18} color={colors.slate900} />
      <Text style={styles.label}>{uz.common.back}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.slate200,
    ...shadows.subtle,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate900,
  },
});
