import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { getCopy } from '../i18n/copy';
import { useCopy } from '../i18n/useCopy';
import { radii } from '../theme';

export type StatusKind = 'verification' | 'load' | 'trip' | 'bid' | 'user';

interface StatusBadgeProps {
  status: string;
  kind: StatusKind;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

type BadgeColors = {
  bg: string;
  text: string;
  dot: string;
  border: string;
};

const PALETTE = {
  green: { bg: '#ECFDF5', text: '#047857', dot: '#10B981', border: '#A7F3D0' },
  amber: { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B', border: '#FDE68A' },
  red: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444', border: '#FECACA' },
  blue: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', border: '#BFDBFE' },
  sky: { bg: '#F0F9FF', text: '#0369A1', dot: '#0EA5E9', border: '#BAE6FD' },
  violet: { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6', border: '#DDD6FE' },
  slate: { bg: '#F8FAFC', text: '#334155', dot: '#64748B', border: '#CBD5E1' },
  muted: { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8', border: '#E2E8F0' },
} as const;

const COLOR_BY_STATUS: Record<string, BadgeColors> = {
  PENDING: PALETTE.amber,
  APPROVED: PALETTE.green,
  REJECTED: PALETTE.red,
  OPEN: PALETTE.green,
  BOOKED: PALETTE.blue,
  IN_TRANSIT: PALETTE.sky,
  DELIVERED: PALETTE.violet,
  COMPLETED: PALETTE.slate,
  CANCELLED: PALETTE.red,
  EXPIRED: PALETTE.muted,
  ASSIGNED: PALETTE.blue,
  EN_ROUTE_TO_PICKUP: PALETTE.amber,
  AT_PICKUP: PALETTE.amber,
  LOADED: PALETTE.sky,
  ACTIVE: PALETTE.green,
  BLOCKED: PALETTE.red,
  ACCEPTED: PALETTE.green,
  WITHDRAWN: PALETTE.muted,
};

export function statusBadgeLabel(status: string, kind: StatusKind): string {
  const table = getCopy().status[kind] as Record<string, string>;
  return table[status] ?? status;
}

export function StatusBadge({ status, kind, size = 'md', style }: StatusBadgeProps) {
  const uz = useCopy();
  const table = uz.status[kind] as Record<string, string>;
  const label = table[status] ?? status;
  const palette = COLOR_BY_STATUS[status] ?? PALETTE.muted;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        isSm && styles.badgeSm,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={uz.common.statusA11y.replace('{{status}}', label)}
    >
      <View
        style={[styles.dot, isSm && styles.dotSm, { backgroundColor: palette.dot }]}
      />
      <Text style={[styles.badgeText, isSm && styles.badgeTextSm, { color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  dot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 4,
    marginRight: 6,
  },
  dotSm: {
    width: 5,
    height: 5,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  badgeTextSm: {
    fontSize: 11,
  },
});
