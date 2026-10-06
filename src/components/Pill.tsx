import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type PillTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';

const TONES: Record<PillTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.slate100, fg: colors.slate700 },
  primary: { bg: colors.primary50, fg: colors.primary },
  success: { bg: '#E8F7EF', fg: '#0F7A45' },
  warning: { bg: '#FFF4E0', fg: '#9A5B00' },
  danger: { bg: '#FDECEC', fg: '#B42318' },
  accent: { bg: colors.accent50, fg: colors.accentDark },
};

interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: ReactNode;
}

/** Kichik yozuvli belgi: chegarasiz, och fonli */
export function Pill({ label, tone = 'neutral', icon }: PillProps) {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function pillToneForStatus(status: string): PillTone {
  switch (status) {
    case 'APPROVED':
    case 'OPEN':
    case 'ACCEPTED':
    case 'ACTIVE':
      return 'success';
    case 'PENDING':
    case 'EN_ROUTE_TO_PICKUP':
    case 'AT_PICKUP':
      return 'warning';
    case 'REJECTED':
    case 'CANCELLED':
    case 'BLOCKED':
      return 'danger';
    case 'ASSIGNED':
    case 'BOOKED':
    case 'LOADED':
    case 'IN_TRANSIT':
      return 'primary';
    case 'DELIVERED':
      return 'accent';
    default:
      return 'neutral';
  }
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  icon: { marginRight: 5 },
  text: { fontSize: 12.5, fontWeight: '600' },
});
