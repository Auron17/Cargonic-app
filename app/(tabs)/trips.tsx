import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../src/api/client';
import { TripListItem } from '../../src/api/types';
import {
  EmptyState,
  ErrorBanner,
  Money,
  Screen,
  StatusBadge,
} from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { isTrackingActive } from '../../src/tracking/backgroundTask';
import { isActiveTrip } from '../../src/trips/nextStatus';
import { formatDate } from '../../src/utils/format';

export default function TripsTabScreen() {
  const router = useRouter();
  const [isGpsActive, setIsGpsActive] = useState(false);

  const {
    data: trips,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsApi.getTrips(),
    refetchInterval: 15000, // har 15 soniyada yangilash
  });

  useEffect(() => {
    let isMounted = true;
    async function checkGps() {
      const active = await isTrackingActive();
      if (isMounted) {
        setIsGpsActive(active);
      }
    }
    checkGps();
    const interval = setInterval(checkGps, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeTrip = trips?.find((t) => isActiveTrip(t.status));
  const historyTrips = trips?.filter((t) => t.id !== activeTrip?.id) || [];

  if (isLoading && !trips) {
    return (
      <Screen style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.loadingText}>{uz.common.loading}</Text>
      </Screen>
    );
  }

  if (error && !trips) {
    return (
      <Screen style={styles.screen}>
        <ErrorBanner
          message={error instanceof Error ? error.message : uz.common.networkError}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  const renderHistoryItem = ({ item }: { item: TripListItem }) => {
    return (
      <Pressable
        onPress={() => router.push(`/trips/${item.id}`)}
        style={({ pressed }) => [styles.historyCard, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Reys ${item.pickupAddress} dan ${item.dropoffAddress} ga`}
      >
        <View style={styles.historyCardHeader}>
          <Text style={styles.historyDate}>{formatDate(item.pickupDate)}</Text>
          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.historyCompany} numberOfLines={1}>
          🏢 {item.companyName || 'Yuk beruvchi'}
        </Text>

        <View style={styles.historyRouteBox}>
          <Text style={styles.routeText} numberOfLines={2}>
            📍 {item.pickupAddress} → {item.dropoffAddress}
          </Text>
        </View>

        <View style={styles.historyCardFooter}>
          <View>
            <Text style={styles.historyPriceLabel}>{uz.tripsScreen.agreedPrice}</Text>
            <Money amount={item.agreedPrice} size="md" color="#111827" weight="bold" />
          </View>
          <Text style={styles.detailsArrow}>Batafsil →</Text>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>{uz.tripsScreen.title}</Text>

        {/* Faol reys kartasi */}
        {activeTrip ? (
          <View style={styles.activeSection}>
            <View style={styles.activeSectionHeader}>
              <Text style={styles.activeSectionTitle}>{uz.tripsScreen.activeTitle}</Text>
              <View
                style={[
                  styles.gpsBadge,
                  isGpsActive ? styles.gpsBadgeActive : styles.gpsBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.gpsBadgeText,
                    isGpsActive ? styles.gpsTextActive : styles.gpsTextInactive,
                  ]}
                >
                  {isGpsActive
                    ? uz.tripsScreen.trackingActive
                    : uz.tripsScreen.trackingInactive}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push(`/trips/${activeTrip.id}`)}
              style={({ pressed }) => [
                styles.activeCard,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${uz.tripsScreen.activeTitle} tafsilotlari`}
            >
              <View style={styles.activeCardTop}>
                <View style={styles.activeCompanyWrap}>
                  <Text style={styles.activeCompany} numberOfLines={1}>
                    🏢 {activeTrip.companyName || 'Yuk beruvchi'}
                  </Text>
                  {activeTrip.plateNumber ? (
                    <Text style={styles.activePlate}>
                      🚛 {activeTrip.plateNumber}
                    </Text>
                  ) : null}
                </View>
                <StatusBadge status={activeTrip.status} />
              </View>

              <View style={styles.activePriceRow}>
                <View>
                  <Text style={styles.activePriceLabel}>{uz.tripsScreen.agreedPrice}</Text>
                  <Money amount={activeTrip.agreedPrice} size="xl" color="#1a56db" weight="bold" />
                </View>
                <Text style={styles.activeDate}>
                  📅 {formatDate(activeTrip.pickupDate)}
                </Text>
              </View>

              {/* Marshrut sxemasi */}
              <View style={styles.routeContainer}>
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, styles.dotPickup]} />
                  <View style={styles.routeTextWrap}>
                    <Text style={styles.routeLabel}>{uz.tripView.pickupAddress}</Text>
                    <Text style={styles.routeValue} numberOfLines={2}>
                      {activeTrip.pickupAddress}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeLine} />

                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, styles.dotDropoff]} />
                  <View style={styles.routeTextWrap}>
                    <Text style={styles.routeLabel}>{uz.tripView.dropoffAddress}</Text>
                    <Text style={styles.routeValue} numberOfLines={2}>
                      {activeTrip.dropoffAddress}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Katta amal tugmasi */}
              <View style={styles.activeButtonWrap}>
                <Pressable
                  onPress={() => router.push(`/trips/${activeTrip.id}`)}
                  style={styles.openTripButton}
                  accessibilityRole="button"
                  accessibilityLabel={uz.tripsScreen.openTrip}
                >
                  <Text style={styles.openTripButtonText}>
                    {uz.tripsScreen.openTrip} →
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* Tarix bo'limi sarlavhasi */}
        <View style={styles.historySectionHeader}>
          <Text style={styles.historySectionTitle}>{uz.tripsScreen.historyTitle}</Text>
          <Text style={styles.historyCountText}>{historyTrips.length} ta</Text>
        </View>
      </View>
    );
  };

  const hasNoTrips = !activeTrip && historyTrips.length === 0;

  return (
    <Screen style={styles.screen}>
      {hasNoTrips ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.screenTitle}>{uz.tripsScreen.title}</Text>
          <EmptyState
            title={uz.tripsScreen.emptyTitle}
            description={uz.tripsScreen.emptyDesc}
            icon="🚚"
          />
        </View>
      ) : (
        <FlatList
          data={historyTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#1a56db']}
              tintColor="#1a56db"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyHistoryBox}>
              <Text style={styles.emptyHistoryText}>
                Oldingi reyslar tarixi hozircha mavjud emas.
              </Text>
            </View>
          }
        />
      )}
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
  emptyContainer: {
    flex: 1,
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 8,
  },
  activeSection: {
    marginBottom: 20,
  },
  activeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  gpsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  gpsBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  gpsBadgeInactive: {
    backgroundColor: '#f3f4f6',
  },
  gpsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gpsTextActive: {
    color: '#166534',
  },
  gpsTextInactive: {
    color: '#6b7280',
  },
  activeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: '#2563eb',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  activeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activeCompanyWrap: {
    flex: 1,
    marginRight: 8,
  },
  activeCompany: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 2,
  },
  activePlate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  activePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  activePriceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  activeDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  routeContainer: {
    marginBottom: 16,
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
    height: 16,
    backgroundColor: '#cbd5e1',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 1,
  },
  routeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  activeButtonWrap: {
    marginTop: 4,
  },
  openTripButton: {
    minHeight: 50,
    backgroundColor: '#1a56db',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  openTripButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  historyCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  historyCompany: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  historyRouteBox: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  routeText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
    lineHeight: 18,
  },
  historyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  historyPriceLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  detailsArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a56db',
  },
  emptyHistoryBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
