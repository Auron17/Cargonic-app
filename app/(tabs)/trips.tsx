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
import { Ionicons } from '@expo/vector-icons';
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
import { colors, radii, shadows } from '../../src/theme';

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
        <ActivityIndicator size="large" color={colors.primary} />
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
          <View style={styles.historyDateWrap}>
            <Ionicons name="calendar-outline" size={13} color={colors.slate500} style={styles.historyIcon} />
            <Text style={styles.historyDate}>{formatDate(item.pickupDate)}</Text>
          </View>
          <StatusBadge kind="trip" status={item.status} size="sm" />
        </View>

        <View style={styles.historyCompanyRow}>
          <Ionicons name="business-outline" size={14} color={colors.slate600} style={styles.historyIcon} />
          <Text style={styles.historyCompany} numberOfLines={1}>
            {item.companyName || 'Yuk beruvchi'}
          </Text>
        </View>

        <View style={styles.historyRouteBox}>
          <View style={styles.routeBulletRow}>
            <View style={styles.bulletPickup} />
            <Text style={styles.routeBulletText} numberOfLines={1}>
              {item.pickupAddress}
            </Text>
          </View>
          <View style={styles.routeBulletRow}>
            <View style={styles.bulletDropoff} />
            <Text style={styles.routeBulletText} numberOfLines={1}>
              {item.dropoffAddress}
            </Text>
          </View>
        </View>

        <View style={styles.historyCardFooter}>
          <View>
            <Text style={styles.historyPriceLabel}>{uz.tripsScreen.agreedPrice}</Text>
            <Money amount={item.agreedPrice} size="md" color={colors.slate900} weight="800" />
          </View>
          <View style={styles.detailsBtn}>
            <Text style={styles.detailsBtnText}>Batafsil</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
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
              <View style={styles.activeTitleRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.activeSectionTitle}>{uz.tripsScreen.activeTitle}</Text>
              </View>

              <View
                style={[
                  styles.gpsBadge,
                  isGpsActive ? styles.gpsBadgeActive : styles.gpsBadgeInactive,
                ]}
              >
                <Ionicons
                  name={isGpsActive ? 'navigate' : 'navigate-outline'}
                  size={12}
                  color={isGpsActive ? colors.successDark : colors.slate500}
                  style={styles.gpsIcon}
                />
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
                    {activeTrip.companyName || 'Yuk beruvchi'}
                  </Text>
                  {activeTrip.plateNumber ? (
                    <View style={styles.plateBadge}>
                      <Ionicons name="car-outline" size={12} color={colors.slate600} style={styles.plateIcon} />
                      <Text style={styles.activePlate}>
                        {activeTrip.plateNumber}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <StatusBadge kind="trip" status={activeTrip.status} />
              </View>

              <View style={styles.activePriceRow}>
                <View>
                  <Text style={styles.activePriceLabel}>{uz.tripsScreen.agreedPrice}</Text>
                  <Money amount={activeTrip.agreedPrice} size="xl" color={colors.primary} weight="800" />
                </View>
                <View style={styles.pickupDateBadge}>
                  <Ionicons name="calendar-outline" size={13} color={colors.slate600} style={styles.calIcon} />
                  <Text style={styles.activeDate}>
                    {formatDate(activeTrip.pickupDate)}
                  </Text>
                </View>
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

              {/* Amal tugmasi */}
              <View style={styles.activeButtonWrap}>
                <View style={styles.openTripButton}>
                  <Text style={styles.openTripButtonText}>
                    {uz.tripsScreen.openTrip}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={styles.actionArrow} />
                </View>
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* Tarix bo'limi sarlavhasi */}
        <View style={styles.historySectionHeader}>
          <Text style={styles.historySectionTitle}>{uz.tripsScreen.historyTitle}</Text>
          <View style={styles.historyBadge}>
            <Text style={styles.historyCountText}>{historyTrips.length} ta reys</Text>
          </View>
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
            iconName="navigate-outline"
            title={uz.tripsScreen.emptyTitle}
            description={uz.tripsScreen.emptyDesc}
            actionTitle="Yuklar lentasini ko‘rish"
            onAction={() => router.push('/(tabs)')}
          />
        </View>
      ) : (
        <FlatList
          data={historyTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
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
    backgroundColor: colors.background,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate600,
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.slate900,
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 10,
  },
  activeSection: {
    marginBottom: 24,
  },
  activeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 8,
  },
  activeSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  gpsIcon: {
    marginRight: 4,
  },
  gpsBadgeActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  gpsBadgeInactive: {
    backgroundColor: colors.slate100,
    borderColor: colors.slate200,
  },
  gpsBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  gpsTextActive: {
    color: colors.successDark,
  },
  gpsTextInactive: {
    color: colors.slate500,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    ...shadows.card,
  },
  cardPressed: {
    borderColor: colors.primary,
    transform: [{ scale: 0.995 }],
  },
  activeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  activeCompanyWrap: {
    flex: 1,
    marginRight: 10,
  },
  activeCompany: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.slate900,
  },
  plateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  plateIcon: {
    marginRight: 4,
  },
  activePlate: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.slate600,
  },
  activePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: colors.primary50,
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 16,
  },
  activePriceLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  pickupDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calIcon: {
    marginRight: 4,
  },
  activeDate: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.slate700,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  dotPickup: {
    backgroundColor: colors.successDark,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  dotDropoff: {
    backgroundColor: colors.dangerDark,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: colors.slate300,
    marginLeft: 4,
    marginVertical: 2,
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate400,
    textTransform: 'uppercase',
  },
  routeValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.slate900,
    marginTop: 1,
  },
  activeButtonWrap: {
    marginTop: 4,
  },
  openTripButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
  },
  openTripButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  actionArrow: {
    marginLeft: 2,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
  },
  historyBadge: {
    backgroundColor: colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  historyCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate600,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
    ...shadows.card,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    marginRight: 5,
  },
  historyDate: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.slate500,
  },
  historyCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyCompany: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate800,
  },
  historyRouteBox: {
    backgroundColor: colors.slate50,
    borderRadius: radii.sm,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  routeBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletPickup: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.successDark,
    marginRight: 8,
  },
  bulletDropoff: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dangerDark,
    marginRight: 8,
  },
  routeBulletText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate700,
    flex: 1,
  },
  historyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    paddingTop: 10,
  },
  historyPriceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate400,
    textTransform: 'uppercase',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
  emptyHistoryBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: colors.slate500,
  },
});
