import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { tripsApi } from '../../src/api/client';
import { TripListItem } from '../../src/api/types';
import {
  EmptyState,
  ErrorBanner,
  Money,
  Pill,
  RouteLine,
  Screen,
  ScreenTitle,
  SectionTitle,
  SkeletonList,
  TAB_EDGES_NO_HEADER,
  pillToneForStatus,
  statusBadgeLabel,
} from '../../src/components';
import { useCopy } from '../../src/i18n';
import { usePullToRefresh } from '../../src/hooks/usePullToRefresh';
import { isTrackingActive } from '../../src/tracking/backgroundTask';
import { isActiveTrip } from '../../src/trips/nextStatus';
import { formatDate, formatMoney } from '../../src/utils/format';
import { colors, ink } from '../../src/theme';

/** "Toshkent, Sergeli sanoat zonasi" → "Toshkent" */
function city(address: string): string {
  return address.split(',')[0].trim();
}

function ActiveTripCard({ trip, gpsActive, onPress }: { trip: TripListItem; gpsActive: boolean; onPress: () => void }) {
  const uz = useCopy();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.active, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${uz.tripsScreen.activeTitle}: ${trip.pickupAddress} dan ${trip.dropoffAddress} gacha`}
    >
      <View style={styles.activeTop}>
        <View style={styles.statusChip}>
          <View style={styles.statusDot} />
          <Text style={styles.statusChipText}>{statusBadgeLabel(trip.status, 'trip')}</Text>
        </View>
        <View style={styles.gps}>
          <Ionicons name={gpsActive ? 'radio' : 'radio-outline'} size={14} color={gpsActive ? '#4ADE80' : ink.muted} />
          <Text style={[styles.gpsText, gpsActive && styles.gpsTextOn]}>
            {gpsActive ? uz.tripsScreen.trackingActive : uz.tripsScreen.trackingInactive}
          </Text>
        </View>
      </View>

      <Money amount={trip.agreedPrice} size="xl" weight="800" color="#FFFFFF" style={styles.activePrice} />
      <Text style={styles.activeMeta} numberOfLines={1}>
        {[trip.companyName, trip.plateNumber, formatDate(trip.pickupDate)].filter(Boolean).join(' · ')}
      </Text>

      <View style={styles.activeRoute}>
        <RouteLine inverse lines={2} from={trip.pickupAddress} to={trip.dropoffAddress} />
      </View>

      <View style={styles.activeButton}>
        <Text style={styles.activeButtonText}>{uz.tripsScreen.openTrip}</Text>
        <Ionicons name="arrow-forward" size={18} color={ink[900]} />
      </View>
    </Pressable>
  );
}

function HistoryRow({ trip, onPress, last }: { trip: TripListItem; onPress: () => void; last: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${trip.pickupAddress} dan ${trip.dropoffAddress} gacha, ${formatMoney(trip.agreedPrice)}`}
    >
      <View style={styles.rowIcon}>
        <Ionicons name="cube-outline" size={18} color={colors.slate700} />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowRoute} numberOfLines={1}>
          {city(trip.pickupAddress)} → {city(trip.dropoffAddress)}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {formatDate(trip.pickupDate)}
          {trip.companyName ? ` · ${trip.companyName}` : ''}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{formatMoney(trip.agreedPrice)}</Text>
        <Pill tone={pillToneForStatus(trip.status)} label={statusBadgeLabel(trip.status, 'trip')} />
      </View>
    </Pressable>
  );
}

export default function TripsTabScreen() {
  const uz = useCopy();
  const router = useRouter();
  const [isGpsActive, setIsGpsActive] = useState(false);

  const { data: trips, isLoading, error, refetch } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsApi.getTrips(),
    refetchInterval: 15000,
  });
  const pull = usePullToRefresh(refetch);

  useEffect(() => {
    let isMounted = true;
    async function checkGps() {
      const active = await isTrackingActive();
      if (isMounted) setIsGpsActive(active);
    }
    checkGps();
    const interval = setInterval(checkGps, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeTrip = trips?.find((t) => isActiveTrip(t.status));
  const history = trips?.filter((t) => t.id !== activeTrip?.id) ?? [];
  const openTrip = (id: string) => router.push(`/trips/${id}`);

  return (
    <Screen edges={TAB_EDGES_NO_HEADER} contentContainerStyle={styles.content}>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.slate500} colors={[colors.primary]} />
        }
      >
            <ScreenTitle
              title={uz.tripsScreen.title}
              subtitle={activeTrip ? uz.tripsScreen.activeCount : trips ? uz.tripsScreen.historyCount.replace('{{count}}', String(history.length)) : undefined}
            />
            {error ? (
              <ErrorBanner message={error instanceof Error ? error.message : uz.common.networkError} onRetry={refetch} />
            ) : null}
            {isLoading ? <SkeletonList count={2} /> : null}

            {activeTrip ? (
              <ActiveTripCard trip={activeTrip} gpsActive={isGpsActive} onPress={() => openTrip(activeTrip.id)} />
            ) : null}

            {trips && !activeTrip && history.length === 0 ? (
              <View style={styles.empty}>
                <EmptyState
                  iconName="navigate-outline"
                  title={uz.tripsScreen.emptyTitle}
                  description={uz.tripsScreen.emptyDesc}
                  actionTitle="Yuklarni ko‘rish"
                  onAction={() => router.push('/(tabs)')}
                />
              </View>
            ) : null}

            {history.length > 0 ? (
              <>
                <SectionTitle title={uz.tripsScreen.historyTitle} />
                <View style={styles.historyCard}>
                  {history.map((t, i) => (
                    <HistoryRow key={t.id} trip={t} last={i === history.length - 1} onPress={() => openTrip(t.id)} />
                  ))}
                </View>
              </>
            ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0 },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  empty: { paddingTop: 40 },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },

  active: { backgroundColor: ink[900], borderRadius: 22, padding: 18 },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  statusChipText: { fontSize: 12.5, fontWeight: '600', color: '#FFFFFF' },
  gps: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gpsText: { fontSize: 12.5, fontWeight: '600', color: ink.muted },
  gpsTextOn: { color: '#4ADE80' },
  activePrice: { marginTop: 16, fontSize: 32, letterSpacing: -1 },
  activeMeta: { marginTop: 2, fontSize: 13.5, color: ink.muted },
  activeRoute: { marginTop: 18 },
  activeButton: {
    marginTop: 20,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  activeButtonText: { fontSize: 16, fontWeight: '700', color: ink[900] },

  historyCard: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.slate200 },
  rowPressed: { backgroundColor: colors.slate50 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowRoute: { fontSize: 15.5, fontWeight: '600', color: colors.slate900 },
  rowMeta: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 5 },
  rowPrice: { fontSize: 15, fontWeight: '700', color: colors.slate900, fontVariant: ['tabular-nums'] },
});
