import React from 'react';
import {
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
import { loadsApi } from '../../src/api/client';
import { FeedItem } from '../../src/api/types';
import {
  EmptyState,
  ErrorBanner,
  Money,
  Screen,
} from '../../src/components';
import { formatDate } from '../../src/utils/format';
import { uz } from '../../src/i18n/uz';
import { colors, radii, shadows } from '../../src/theme';

export default function LoadsFeedScreen() {
  const router = useRouter();

  const {
    data: feedItems,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['feed'],
    queryFn: loadsApi.getFeed,
    refetchInterval: 60000, // Auto refresh every 60 seconds
  });

  const handleOpenLoad = (loadId: string) => {
    router.push({
      pathname: '/loads/[id]',
      params: { id: loadId },
    });
  };

  const handleOpenBids = () => {
    router.push('/bids');
  };

  const renderFeedCard = ({ item }: { item: FeedItem }) => {
    const isFixed = item.priceMode === 'FIXED';
    const bodyTypeName = uz.bodyType[item.requiredBodyType] || item.requiredBodyType;
    const distanceToPickup = Math.round(item.distanceKm);
    const routeDistance = Math.round(item.routeKm);

    return (
      <Pressable
        onPress={() => handleOpenLoad(item.loadId)}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${item.pickupAddress} dan ${item.dropoffAddress} gacha yuk, ${item.weightTons} tonna`}
      >
        {/* Top Header: Proximity Badge & Company Name */}
        <View style={styles.cardHeader}>
          <View style={styles.proximityBadge}>
            <Ionicons name="location-sharp" size={13} color={colors.successDark} style={styles.badgeIcon} />
            <Text style={styles.proximityText}>
              {distanceToPickup} km yaqinlikda
            </Text>
          </View>

          {item.companyName ? (
            <View style={styles.companyWrap}>
              <Ionicons name="business-outline" size={13} color={colors.slate500} style={styles.badgeIcon} />
              <Text style={styles.companyName} numberOfLines={1}>
                {item.companyName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Route Visualizer: Origin to Destination */}
        <View style={styles.routeSection}>
          {/* Pickup */}
          <View style={styles.routeRow}>
            <View style={styles.nodeOriginWrap}>
              <View style={styles.nodeOrigin} />
            </View>
            <View style={styles.addressBlock}>
              <Text style={styles.addressCity} numberOfLines={1}>
                {item.pickupAddress}
              </Text>
              <Text style={styles.dateSubtext}>
                📅 {formatDate(item.pickupDate)}
                {item.pickupTimeFrom && item.pickupTimeTo ? ` (${item.pickupTimeFrom}–${item.pickupTimeTo})` : ''}
              </Text>
            </View>
          </View>

          {/* Connecting Track with Distance Badge */}
          <View style={styles.connectorRow}>
            <View style={styles.connectorLine} />
            <View style={styles.routeDistancePill}>
              <Ionicons name="git-commit-outline" size={12} color={colors.slate500} style={styles.pillIcon} />
              <Text style={styles.routeDistanceText}>{routeDistance} km yo‘nalish</Text>
            </View>
          </View>

          {/* Dropoff */}
          <View style={styles.routeRow}>
            <View style={styles.nodeDestWrap}>
              <View style={styles.nodeDest} />
            </View>
            <View style={styles.addressBlock}>
              <Text style={styles.addressCity} numberOfLines={1}>
                {item.dropoffAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Specifications Chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Ionicons name="cube-outline" size={13} color={colors.slate700} style={styles.chipIcon} />
            <Text style={styles.chipText}>
              {item.cargoType} • {item.weightTons} {uz.common.tons}
              {item.volumeM3 ? ` • ${item.volumeM3} ${uz.common.m3}` : ''}
            </Text>
          </View>

          <View style={styles.chip}>
            <Ionicons name="car-outline" size={13} color={colors.slate700} style={styles.chipIcon} />
            <Text style={styles.chipText}>{bodyTypeName}</Text>
          </View>

          {item.insuranceRequired ? (
            <View style={[styles.chip, styles.insuranceChip]}>
              <Ionicons name="shield-checkmark" size={13} color={colors.primary} style={styles.chipIcon} />
              <Text style={styles.insuranceChipText}>{uz.loadsTab.insuranceBadge}</Text>
            </View>
          ) : null}
        </View>

        {/* Driver's Bid Banner if placed */}
        {item.myBidPrice != null ? (
          <View style={styles.myBidBanner}>
            <Ionicons name="pricetag" size={14} color={colors.accentDark} style={styles.myBidIcon} />
            <Text style={styles.myBidBannerText}>
              Sizning taklifingiz: {item.myBidPrice.toLocaleString()} {uz.common.moneySuffix}
            </Text>
          </View>
        ) : null}

        {/* Card Footer: Price & Action CTA */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceTypeLabel}>
              {isFixed ? uz.priceMode.FIXED : uz.priceMode.BIDDING}
            </Text>
            {isFixed && item.price != null ? (
              <Money amount={item.price} size="lg" color={colors.primary} weight="800" />
            ) : (
              <Text style={styles.biddingAwaitingText}>
                Taklif kiritiladi
              </Text>
            )}
          </View>

          <View style={[styles.actionBtn, isFixed ? styles.actionBtnFixed : styles.actionBtnBid]}>
            <Text style={styles.actionBtnText}>
              {isFixed ? uz.loadDetails.bookButton : uz.loadDetails.placeBidButton}
            </Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" style={styles.actionBtnIcon} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen style={styles.screen}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>{uz.loadsTab.title}</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.screenSubtitle}>Jonli lentalar • Har daqiqa yangilanadi</Text>
          </View>
        </View>

        <Pressable
          onPress={handleOpenBids}
          style={({ pressed }) => [
            styles.bidsButton,
            pressed && styles.bidsButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={uz.loadsTab.myBids}
        >
          <Ionicons name="receipt-outline" size={16} color={colors.primary} style={styles.bidsIcon} />
          <Text style={styles.bidsButtonText}>{uz.loadsTab.myBids}</Text>
        </Pressable>
      </View>

      {error ? (
        <ErrorBanner
          message={error instanceof Error ? error.message : uz.common.networkError}
          onRetry={refetch}
        />
      ) : null}

      <FlatList
        data={feedItems || []}
        keyExtractor={(item) => item.loadId}
        renderItem={renderFeedCard}
        contentContainerStyle={[
          styles.listContent,
          (!feedItems || feedItems.length === 0) && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || (isLoading && !feedItems)}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              iconName="cube-outline"
              title={uz.loadsTab.emptyTitle}
              description={uz.loadsTab.emptyDesc}
              actionTitle="Yangilash"
              onAction={refetch}
            />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 4,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.slate900,
    letterSpacing: -0.4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate500,
  },
  bidsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
  },
  bidsButtonPressed: {
    backgroundColor: '#DBEAFE',
  },
  bidsIcon: {
    marginRight: 5,
  },
  bidsButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingBottom: 28,
    gap: 14,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    ...shadows.card,
  },
  cardPressed: {
    borderColor: colors.primary,
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  proximityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeIcon: {
    marginRight: 4,
  },
  proximityText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.successDark,
  },
  companyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '55%',
  },
  companyName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.slate600,
  },
  routeSection: {
    marginBottom: 14,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeOriginWrap: {
    width: 20,
    alignItems: 'center',
    paddingTop: 3,
  },
  nodeOrigin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.successDark,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  nodeDestWrap: {
    width: 20,
    alignItems: 'center',
    paddingTop: 3,
  },
  nodeDest: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.dangerDark,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.slate300,
    marginLeft: 9,
    marginRight: 10,
  },
  routeDistancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  pillIcon: {
    marginRight: 4,
  },
  routeDistanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate600,
  },
  addressBlock: {
    flex: 1,
    marginLeft: 8,
  },
  addressCity: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.slate900,
    lineHeight: 20,
  },
  dateSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate500,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate100,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate700,
  },
  insuranceChip: {
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  insuranceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  myBidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  myBidIcon: {
    marginRight: 6,
  },
  myBidBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    paddingTop: 12,
    marginTop: 2,
  },
  priceContainer: {
    flex: 1,
  },
  priceTypeLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.slate500,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  biddingAwaitingText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.accentDark,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 40,
  },
  actionBtnFixed: {
    backgroundColor: colors.primary,
  },
  actionBtnBid: {
    backgroundColor: colors.accentDark,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    marginRight: 4,
  },
  actionBtnIcon: {
    marginLeft: 2,
  },
});
