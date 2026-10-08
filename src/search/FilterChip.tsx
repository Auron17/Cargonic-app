import React, { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface FilterChipProps {
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  /** Ajratilgan harakat (masalan, "Saqlash") — ko'k chegara va matn */
  tone?: 'default' | 'action';
  icon?: ComponentProps<typeof Ionicons>['name'];
  trailingIcon?: ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel?: string;
}

/** Lentadagi yo'nalish paneli va filtr oynalari uchun bosiladigan chip */
export function FilterChip({
  label,
  onPress,
  onLongPress,
  selected,
  tone = 'default',
  icon,
  trailingIcon,
  accessibilityLabel,
}: FilterChipProps) {
  const color = selected ? colors.primaryDark : tone === 'action' ? colors.primary : colors.slate900;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        tone === 'action' && !selected && styles.action,
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={color} /> : null}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
      {trailingIcon ? <Ionicons name={trailingIcon} size={14} color={color} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    maxWidth: 240,
  },
  selected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  action: { borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  label: { fontSize: 13.5, fontWeight: '600', flexShrink: 1 },
});
