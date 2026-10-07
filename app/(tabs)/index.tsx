import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { loadsApi } from '../../src/api/client';
import { FeedItem } from '../../src/api/types';
import {
  Card,
  EmptyState,
  ErrorBanner,
  Money,
  Pill,
  PrimaryButton,
  RegistrationBanner,
  RegistrationSheet,
  RouteLine,
  Screen,
  ScreenTitle,
  SkeletonList,
  TAB_EDGES_NO_HEADER,
  useRegistration,
} from '../../src/components';
import { formatMoney, formatPickupWindow } from '../../src/utils/format';
import { useCopy } from '../../src/i18n';
import { usePullToRefresh } from '../../src/hooks/usePullToRefresh';
import { useDeviceCoords } from '../../src/hooks/useDeviceCoords';
import { colors } from '../../src/theme';

function FeedCard({
  item,
  onOpen,
  onAction,
}: {
  item: FeedItem;
  onOpen: () => void;
  onAction: () => void;
}) {
  const uz = useCopy();
  const isFixed = item.priceMode === 'FIXED';
  const bodyTypeName = uz.bodyType[item.requiredBodyType] || item.requiredBodyType;
  const specs = [
    item.cargoType,
    `${item.weightTons} ${uz.common.tons}`,
    item.volumeM3 ? `${item.volumeM3} ${uz.common.m3}` : null,
    bodyTypeName,
  ]
    .filter(Boolean)
    .join(' · ');
  const a11y = `${item.pickupAddress} dan ${item.dropoffAddress} gacha, ${specs}`;
  const ctaTitle = isFixed ? uz.loadDetails.bookButton : uz.loadsTab.bidCta;

  return (
    <Card>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={styles.topRow}>
          {isFixed && item.price != null ? (
            <Money amount={item.price} currency={item.currency} size="xl" weight="800" />
          ) : (
            <View>
              <Text style={styles.biddingTitle}>{uz.priceMode.BIDDING}</Text>
              <Text style={styles.biddingHint}>{uz.loadsTab.bidYourPrice}</Text>
            </View>
          )}
          <View style={styles.nearBox}>
            <Ionicons name="navigate" size={12} color={colors.textMuted} />
            <Text style={styles.nearText}>{Math.round(item.distanceKm)} km</Text>
          </View>
        </View>

        {(item.truckCount ?? 1) > 1 ? (
          <View style={styles.trucksChip}>
            <Pill
              tone="accent"
              label={uz.multiTruck.chip
                .replace('{{total}}', String(item.truckCount))
                .replace('{{free}}', String(item.freeTrucks ?? item.truckCount))}
            />
          </View>
        ) : null}

        <View style={styles.route}>
          <RouteLine
            from={item.pickupAddress}
            to={item.dropoffAddress}
            fromHint={formatPickupWindow(item.pickupDate, item.pickupTimeFrom, item.pickupTimeTo)}
            toHint={uz.loadsTab.routeKmRoad.replace('{{km}}', String(Math.round(item.routeKm)))}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.specs} numberOfLines={1}>
            {specs}
          </Text>
          {item.insuranceRequired ? (
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} accessibilityLabel={uz.loadsTab.insuranceBadge} />
          ) : null}
        </View>

        {item.myBidPrice != null || item.companyName ? (
          <View style={styles.metaRow}>
            {item.companyName ? (
              <Text style={styles.company} numberOfLines={1}>
                {item.companyName}
              </Text>
            ) : (
              <View />
            )}
            {item.myBidPrice != null ? (
              <Pill tone="accent" label={uz.loadsTab.myBidAmount.replace('{{amount}}', formatMoney(item.myBidPrice, item.currency))} />
            ) : null}
          </View>
        ) : null}
      </Pressable>

      <PrimaryButton
        title={ctaTitle}
        variant={isFixed ? 'primary' : 'accent'}
        onPress={onAction}
        size="md"
        style={styles.cta}
        accessibilityLabel={ctaTitle}
      />
    </Card>
  );
}

export default function LoadsFeedScreen() {
  const uz = useCopy();
  const router = useRouter();

  const registration = useRegistration();
  const approved = registration.state === 'approved';
  const [registrationOpen, setRegistrationOpen] = useState(false);
  // Tasdiqlanmagan haydovchi joylashuvini serverga yozmaydi — lentani qurilma joylashuvi bilan so'raymiz
  const coords = useDeviceCoords(!approved);

  const { data: feedItems, isLoading, error, refetch } = useQuery({
    queryKey: ['feed', approved ? null : coords],
    queryFn: () => loadsApi.getFeed(approved ? undefined : coords ?? undefined),
    refetchInterval: 60000,
  });
  const pull = usePullToRefresh(refetch);

  const count = feedItems?.length ?? 0;
  const subtitle = isLoading
    ? uz.loadsTab.searching
    : count > 0
      ? uz.loadsTab.nearbyCount.replace('{{count}}', String(count))
      : uz.loadsTab.autoRefreshInfo;

  const header = (
    <>
      <ScreenTitle
        title={uz.loadsTab.title}
        subtitle={subtitle}
        right={
          approved ? (
            <Pressable
              onPress={() => router.push('/bids')}
              hitSlop={8}
              style={({ pressed }) => [styles.bidsButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={uz.loadsTab.myBids}
            >
              <Ionicons name="pricetags-outline" size={16} color={colors.slate900} />
              <Text style={styles.bidsButtonText}>{uz.loadsTab.myBids}</Text>
            </Pressable>
          ) : undefined
        }
      />
      <RegistrationBanner />
      {error ? (
        <ErrorBanner message={error instanceof Error ? error.message : uz.common.networkError} onRetry={refetch} />
      ) : null}
      {isLoading ? <SkeletonList count={3} /> : null}
    </>
  );

  return (
    <Screen edges={TAB_EDGES_NO_HEADER} style={styles.screen} contentContainerStyle={styles.content}>
      <FlatList
        data={feedItems ?? []}
        keyExtractor={(item) => item.loadId}
        renderItem={({ item }) => (
          <FeedCard
            item={item}
            onOpen={() => router.push({ pathname: '/loads/[id]', params: { id: item.loadId } })}
            onAction={() =>
              !approved
                ? setRegistrationOpen(true)
                : router.push({
                pathname: '/loads/[id]',
                params: {
                  id: item.loadId,
                  action: item.priceMode === 'FIXED' ? 'book' : 'bid',
                },
              })
            }
          />
        )}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.slate500} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.empty}>
              <EmptyState
                iconName="cube-outline"
                title={uz.loadsTab.emptyTitle}
                description={uz.loadsTab.emptyDesc}
                actionTitle="Yangilash"
                onAction={refetch}
              />
            </View>
          ) : null
        }
      />
      <RegistrationSheet visible={registrationOpen} onClose={() => setRegistrationOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingHorizontal: 0, paddingTop: 0 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  separator: { height: 12 },
  empty: { paddingTop: 48 },
  bidsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  bidsButtonText: { fontSize: 14, fontWeight: '600', color: colors.slate900 },
  pressed: { opacity: 0.7 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  biddingTitle: { fontSize: 20, fontWeight: '800', color: colors.accentDark, letterSpacing: -0.4 },
  biddingHint: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  nearBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.slate100,
  },
  nearText: { fontSize: 12.5, fontWeight: '600', color: colors.slate700 },
  route: { marginTop: 16 },
  trucksChip: { marginTop: 10, alignSelf: 'flex-start' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.slate200,
  },
  specs: { flex: 1, fontSize: 14, color: colors.slate700, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  company: { flex: 1, fontSize: 13, color: colors.textMuted },
  cta: { marginTop: 14 },
});
