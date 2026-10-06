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
        {/* Top bar: Distance to pickup & company */}
        <View style={styles.cardHeader}>
          <View style={styles.pickupDistanceBadge}>
            <Text style={styles.pickupDistanceText}>
              📍 {uz.loadsTab.distanceToPickup.replace('{{km}}', String(Math.round(item.distanceKm)))}
            </Text>
          </View>
          {item.companyName ? (
            <Text style={styles.companyName} numberOfLines={1}>
              🏢 {item.companyName}
            </Text>
          ) : null}
        </View>

        {/* Route: From -> To */}
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.dotPickup]} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.pickupAddress}
            </Text>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.dotDropoff]} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.dropoffAddress}
            </Text>
          </View>
        </View>

        {/* Cargo specs badges */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              📦 {item.cargoType} • {item.weightTons} {uz.common.tons}
              {item.volumeM3 ? ` • ${item.volumeM3} ${uz.common.m3}` : ''}
            </Text>
          </View>

          <View style={styles.chip}>
            <Text style={styles.chipText}>🚛 {bodyTypeName}</Text>
          </View>

          <View style={styles.chip}>
            <Text style={styles.chipText}>
              🛣 {uz.loadsTab.routeLength.replace('{{km}}', String(Math.round(item.routeKm)))}
            </Text>
          </View>

          {item.insuranceRequired ? (
            <View style={[styles.chip, styles.insuranceChip]}>
              <Text style={styles.insuranceChipText}>
                🛡 {uz.loadsTab.insuranceBadge}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Date & Time */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            📅 {uz.loadsTab.pickupDate.replace('{{date}}', formatDate(item.pickupDate))}
            {item.pickupTimeFrom && item.pickupTimeTo
              ? ` (${item.pickupTimeFrom} – ${item.pickupTimeTo})`
              : ''}
          </Text>
        </View>

        {/* User's existing bid notice if placed */}
        {item.myBidPrice != null ? (
          <View style={styles.myBidBanner}>
            <Text style={styles.myBidBannerText}>
              🏷 {uz.loadsTab.myBidAmount.replace('{{amount}}', `${item.myBidPrice.toLocaleString()} ${uz.common.moneySuffix}`)}
            </Text>
          </View>
        ) : null}

        {/* Bottom price footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>
              {isFixed ? uz.priceMode.FIXED : uz.priceMode.BIDDING}
            </Text>
            {isFixed && item.price != null ? (
              <Money amount={item.price} size="lg" color="#1a56db" weight="bold" />
            ) : (
              <Text style={styles.biddingAwaitingText}>
                {uz.loadsTab.biddingAwaiting}
              </Text>
            )}
          </View>

          <View style={styles.actionPrompt}>
            <Text style={styles.actionPromptText}>
              {isFixed ? `${uz.loadDetails.bookButton} →` : `${uz.loadDetails.placeBidButton} →`}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen style={styles.screen}>
      {/* Header bar with 'Takliflarim' shortcut */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>{uz.loadsTab.title}</Text>
          <Text style={styles.screenSubtitle}>{uz.loadsTab.autoRefreshInfo}</Text>
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
          <Text style={styles.bidsButtonIcon}>📑</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || (isLoading && !feedItems)}
            onRefresh={refetch}
            colors={['#1a56db']}
            tintColor="#1a56db"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="📦"
              title={uz.loadsTab.emptyTitle}
              description={uz.loadsTab.emptyDesc}
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
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  bidsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  bidsButtonPressed: {
    backgroundColor: '#dbeafe',
  },
  bidsButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  bidsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a56db',
  },
  listContent: {
    paddingBottom: 24,
    gap: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    borderColor: '#1a56db',
    backgroundColor: '#f9fafb',
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickupDistanceBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pickupDistanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  companyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    maxWidth: '55%',
  },
  routeContainer: {
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  dotPickup: {
    backgroundColor: '#16a34a',
  },
  dotDropoff: {
    backgroundColor: '#dc2626',
  },
  routeLine: {
    width: 2,
    height: 14,
    backgroundColor: '#d1d5db',
    marginLeft: 4,
    marginVertical: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  insuranceChip: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  insuranceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a56db',
  },
  dateRow: {
    marginBottom: 10,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  myBidBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  myBidBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  biddingAwaitingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#d97706',
  },
  actionPrompt: {
    backgroundColor: '#1a56db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPromptText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
