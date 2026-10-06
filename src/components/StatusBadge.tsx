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

type StatusType =
  | LoadStatus
  | TripStatus
  | VerificationStatus
  | UserStatus
  | BidStatus
  | string;

interface StatusBadgeProps {
  status: StatusType;
  style?: ViewStyle;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const getBadgeConfig = (): { label: string; bg: string; text: string } => {
    // 1. Verification status
    if (status === 'PENDING') {
      return { label: uz.status.verification.PENDING, bg: '#fef3c7', text: '#92400e' };
    }
    if (status === 'APPROVED') {
      return { label: uz.status.verification.APPROVED, bg: '#dcfce7', text: '#166534' };
    }
    if (status === 'REJECTED') {
      return { label: uz.status.verification.REJECTED, bg: '#fee2e2', text: '#991b1b' };
    }

    // 2. Load status
    if (status === 'OPEN') {
      return { label: uz.status.load.OPEN, bg: '#dcfce7', text: '#166534' };
    }
    if (status === 'BOOKED') {
      return { label: uz.status.load.BOOKED, bg: '#e0e7ff', text: '#3730a3' };
    }
    if (status === 'IN_TRANSIT') {
      return { label: uz.status.load.IN_TRANSIT, bg: '#dbeafe', text: '#1e40af' };
    }
    if (status === 'DELIVERED') {
      return { label: uz.status.load.DELIVERED, bg: '#ede9fe', text: '#5b21b6' };
    }
    if (status === 'COMPLETED') {
      return { label: uz.status.load.COMPLETED, bg: '#f3f4f6', text: '#374151' };
    }
    if (status === 'CANCELLED') {
      return { label: uz.status.load.CANCELLED, bg: '#fee2e2', text: '#991b1b' };
    }
    if (status === 'EXPIRED') {
      return { label: uz.status.load.EXPIRED, bg: '#f3f4f6', text: '#6b7280' };
    }

    // 3. Trip status
    if (status === 'ASSIGNED') {
      return { label: uz.status.trip.ASSIGNED, bg: '#e0e7ff', text: '#3730a3' };
    }
    if (status === 'EN_ROUTE_TO_PICKUP') {
      return { label: uz.status.trip.EN_ROUTE_TO_PICKUP, bg: '#fef3c7', text: '#92400e' };
    }
    if (status === 'AT_PICKUP') {
      return { label: uz.status.trip.AT_PICKUP, bg: '#fef3c7', text: '#92400e' };
    }
    if (status === 'LOADED') {
      return { label: uz.status.trip.LOADED, bg: '#dbeafe', text: '#1e40af' };
    }

    // 4. User status
    if (status === 'ACTIVE') {
      return { label: uz.status.user.ACTIVE, bg: '#dcfce7', text: '#166534' };
    }
    if (status === 'BLOCKED') {
      return { label: uz.status.user.BLOCKED, bg: '#fee2e2', text: '#991b1b' };
    }

    // 5. Bid status
    if (status === 'ACCEPTED') {
      return { label: uz.status.bid.ACCEPTED, bg: '#dcfce7', text: '#166534' };
    }
    if (status === 'WITHDRAWN') {
      return { label: uz.status.bid.WITHDRAWN, bg: '#f3f4f6', text: '#6b7280' };
    }

    return { label: status, bg: '#f3f4f6', text: '#4b5563' };
  };

  const { label, bg, text } = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
