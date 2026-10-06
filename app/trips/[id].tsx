import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../src/api/client';
import {
  ErrorBanner,
  Money,
  Screen,
  StatusBadge,
} from '../../src/components';
import { formatDate, formatMoney } from '../../src/utils/format';
import { uz } from '../../src/i18n/uz';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const tripId = Array.isArray(id) ? id[0] : id;

  const {
    data: trip,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getTrip(tripId),
    enabled: !!tripId,
  });

  if (isLoading) {
    return (
      <Screen style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.loadingText}>{uz.common.loading}</Text>
      </Screen>
    );
  }

  if (error || !trip) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={uz.common.back}
          >
            <Text style={styles.backButtonText}>← {uz.common.back}</Text>
          </Pressable>
        </View>
        <ErrorBanner
          message={error instanceof Error ? error.message : uz.common.networkError}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      {/* Top Header */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={uz.common.back}
        >
          <Text style={styles.backButtonText}>← {uz.common.back}</Text>
        </Pressable>

        <StatusBadge status={trip.status} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Trip Overview */}
        <View style={styles.card}>
          <Text style={styles.companyName}>
            🏢 {trip.companyName || 'Yuk beruvchi zavod'}
          </Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.label}>Kelishilgan narx</Text>
              <Money amount={trip.agreedPrice} size="xl" color="#1a56db" weight="bold" />
            </View>

            {trip.commissionAmount != null ? (
              <View style={styles.commissionBox}>
                <Text style={styles.commissionLabel}>Komissiya</Text>
                <Text style={styles.commissionValue}>
                  {formatMoney(trip.commissionAmount)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Route Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{uz.loadDetails.route}</Text>

          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.dotPickup]} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.label}>{uz.loadDetails.pickupAddress}</Text>
                <Text style={styles.valueText}>{trip.load?.pickupAddress}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.dotDropoff]} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.label}>{uz.loadDetails.dropoffAddress}</Text>
                <Text style={styles.valueText}>{trip.load?.dropoffAddress}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cargo specs */}
        {trip.load ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{uz.loadDetails.cargoInfo}</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>{uz.loadDetails.cargoType}</Text>
                <Text style={styles.valueText}>{trip.load.cargoType}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>Og‘irlik</Text>
                <Text style={styles.valueText}>{trip.load.weightTons} {uz.common.tons}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>Ortish sanasi</Text>
                <Text style={styles.valueText}>{formatDate(trip.load.pickupDate)}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>Marshrut</Text>
                <Text style={styles.valueText}>{Math.round(trip.load.routeKm)} {uz.common.km}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Status transition notice for M4 */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>ℹ️ Reys kuzatuvi</Text>
          <Text style={styles.noticeText}>
            Reys faol holatda. Reys holatlarini bosqichma-bosqich o‘zgartirish va navigatsiya boshqaruvi M4 bosqichida to‘liq ochiladi.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  commissionBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  commissionLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  commissionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  routeContainer: {
    marginBottom: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 4,
  },
  dotPickup: {
    backgroundColor: '#16a34a',
  },
  dotDropoff: {
    backgroundColor: '#dc2626',
  },
  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: '#d1d5db',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeTextWrap: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
  },
  noticeCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 18,
  },
});
