import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface InfoRowProps {
  label: string;
  value?: string | ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
}

/** Sozlamalar ro'yxatidagi qator: ikonka, nom, qiymat, ixtiyoriy strelka */
export function InfoRow({ label, value, icon, onPress, last, danger }: InfoRowProps) {
  const content = (
    <View style={[styles.row, !last && styles.divider]}>
      {icon ? (
        <View style={[styles.iconBox, danger && styles.iconBoxDanger]}>
          <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.slate700} />
        </View>
      ) : null}
      <Text style={[styles.label, danger && styles.labelDanger]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valueWrap}>
        {typeof value === 'string' ? (
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
        ) : (
          value
        )}
        {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.slate400} /> : null}
      </View>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingVertical: 10 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.slate200 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxDanger: { backgroundColor: '#FDECEC' },
  label: { flexShrink: 1, fontSize: 15.5, color: colors.slate900, fontWeight: '500' },
  labelDanger: { color: colors.danger },
  valueWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginLeft: 12 },
  value: { fontSize: 15, color: colors.textMuted, textAlign: 'right', flexShrink: 1 },
  pressed: { opacity: 0.6 },
});
