import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import {
  BidStatus,
  LoadStatus,
  TripStatus,
  UserStatus,
  VerificationStatus,
} from '../api/types';
import { uz } from '../i18n/uz';
import { radii } from '../theme';

type StatusType =
  | LoadStatus
  | TripStatus
  | VerificationStatus
  | UserStatus
  | BidStatus
  | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function StatusBadge({ status, size = 'md', style }: StatusBadgeProps) {
  const getBadgeConfig = (): {
    label: string;
    bg: string;
    text: string;
    dot: string;
    border: string;
  } => {
    // 1. Verification status
    if (status === 'PENDING') {
      return {
        label: uz.status.verification.PENDING,
        bg: '#FFFBEB',
        text: '#B45309',
        dot: '#F59E0B',
        border: '#FDE68A',
      };
    }
    if (status === 'APPROVED') {
      return {
        label: uz.status.verification.APPROVED,
        bg: '#ECFDF5',
        text: '#047857',
        dot: '#10B981',
        border: '#A7F3D0',
      };
    }
    if (status === 'REJECTED') {
      return {
        label: uz.status.verification.REJECTED,
        bg: '#FEF2F2',
        text: '#B91C1C',
        dot: '#EF4444',
        border: '#FECACA',
      };
    }

    // 2. Load status
    if (status === 'OPEN') {
      return {
        label: uz.status.load.OPEN,
        bg: '#ECFDF5',
        text: '#047857',
        dot: '#10B981',
        border: '#A7F3D0',
      };
    }
    if (status === 'BOOKED') {
      return {
        label: uz.status.load.BOOKED,
        bg: '#EFF6FF',
        text: '#1D4ED8',
        dot: '#3B82F6',
        border: '#BFDBFE',
      };
    }
    if (status === 'IN_TRANSIT') {
      return {
        label: uz.status.load.IN_TRANSIT,
        bg: '#F0F9FF',
        text: '#0369A1',
        dot: '#0EA5E9',
        border: '#BAE6FD',
      };
    }
    if (status === 'DELIVERED') {
      return {
        label: uz.status.load.DELIVERED,
        bg: '#F5F3FF',
        text: '#6D28D9',
        dot: '#8B5CF6',
        border: '#DDD6FE',
      };
    }
    if (status === 'COMPLETED') {
      return {
        label: uz.status.load.COMPLETED,
        bg: '#F8FAFC',
        text: '#334155',
        dot: '#64748B',
        border: '#CBD5E1',
      };
    }
    if (status === 'CANCELLED') {
      return {
        label: uz.status.load.CANCELLED,
        bg: '#FEF2F2',
        text: '#B91C1C',
        dot: '#EF4444',
        border: '#FECACA',
      };
    }
    if (status === 'EXPIRED') {
      return {
        label: uz.status.load.EXPIRED,
        bg: '#F1F5F9',
        text: '#64748B',
        dot: '#94A3B8',
        border: '#E2E8F0',
      };
    }

    // 3. Trip status
    if (status === 'ASSIGNED') {
      return {
        label: uz.status.trip.ASSIGNED,
        bg: '#EFF6FF',
        text: '#1D4ED8',
        dot: '#3B82F6',
        border: '#BFDBFE',
      };
    }
    if (status === 'EN_ROUTE_TO_PICKUP') {
      return {
        label: uz.status.trip.EN_ROUTE_TO_PICKUP,
        bg: '#FFFBEB',
        text: '#B45309',
        dot: '#F59E0B',
        border: '#FDE68A',
      };
    }
    if (status === 'AT_PICKUP') {
      return {
        label: uz.status.trip.AT_PICKUP,
        bg: '#FFFBEB',
        text: '#B45309',
        dot: '#F59E0B',
        border: '#FDE68A',
      };
    }
    if (status === 'LOADED') {
      return {
        label: uz.status.trip.LOADED,
        bg: '#F0F9FF',
        text: '#0369A1',
        dot: '#0EA5E9',
        border: '#BAE6FD',
      };
    }

    // 4. User status
    if (status === 'ACTIVE') {
      return {
        label: uz.status.user.ACTIVE,
        bg: '#ECFDF5',
        text: '#047857',
        dot: '#10B981',
        border: '#A7F3D0',
      };
    }
    if (status === 'BLOCKED') {
      return {
        label: uz.status.user.BLOCKED,
        bg: '#FEF2F2',
        text: '#B91C1C',
        dot: '#EF4444',
        border: '#FECACA',
      };
    }

    // 5. Bid status
    if (status === 'ACCEPTED') {
      return {
        label: uz.status.bid.ACCEPTED,
        bg: '#ECFDF5',
        text: '#047857',
        dot: '#10B981',
        border: '#A7F3D0',
      };
    }
    if (status === 'WITHDRAWN') {
      return {
        label: uz.status.bid.WITHDRAWN,
        bg: '#F1F5F9',
        text: '#64748B',
        dot: '#94A3B8',
        border: '#E2E8F0',
      };
    }

    return {
      label: status,
      bg: '#F1F5F9',
      text: '#475569',
      dot: '#94A3B8',
      border: '#E2E8F0',
    };
  };

  const { label, bg, text, dot, border } = getBadgeConfig();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        isSm && styles.badgeSm,
        { backgroundColor: bg, borderColor: border },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Holat: ${label}`}
    >
      <View style={[styles.dot, isSm && styles.dotSm, { backgroundColor: dot }]} />
      <Text style={[styles.badgeText, isSm && styles.badgeTextSm, { color: text }]}>
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
