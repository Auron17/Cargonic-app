import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { carrierApi, tripsApi } from '../../src/api/client';
import { EntryDto, EntryType, TripEarningDto, WalletDto } from '../../src/api/types';
import {
  EmptyState,
  ErrorBanner,
  Money,
  RegistrationLocked,
  Screen,
  ScreenTitle,
  SectionTitle,
  Skeleton,
  TAB_EDGES_NO_HEADER,
} from '../../src/components';
import { useAuth } from '../../src/auth/AuthProvider';
import { useCopy } from '../../src/i18n';
import { formatDateTime, formatMoney } from '../../src/utils/format';
import { colors, ink } from '../../src/theme';

const ADMIN_PHONE = '+998900000001';
const ADMIN_PHONE_DISPLAY = '+998 90 000 00 01';

const ENTRY_ICON: Record<EntryType, keyof typeof Ionicons.glyphMap> = {
  TOPUP: 'arrow-down',
  COMMISSION: 'arrow-up',
  REFUND: 'refresh',
  ADJUSTMENT: 'swap-horizontal',
};

function city(address: string): string {
  return address.split(',')[0].trim();
}

function EntryRow({ entry, route, last }: { entry: EntryDto; route?: string; last: boolean }) {
  const uz = useCopy();
  const positive = entry.amount > 0;
  const title = uz.wallet.types[entry.type] ?? entry.type;
  const subtitle = entry.comment || route || formatDateTime(entry.createdAt);
  return (
    <View style={[styles.row, !last && styles.rowDivider]} accessibilityRole="text">
      <View style={[styles.rowIcon, positive ? styles.rowIconIn : styles.rowIconOut]}>
        <Ionicons name={ENTRY_ICON[entry.type] ?? 'swap-horizontal'} size={17} color={positive ? '#0F7A45' : colors.slate700} />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {subtitle}
        </Text>
        {entry.comment || route ? <Text style={styles.rowDate}>{formatDateTime(entry.createdAt)}</Text> : null}
      </View>
      <Text style={[styles.rowAmount, positive && styles.rowAmountIn]}>
        {positive ? '+' : '−'}
        {formatMoney(Math.abs(entry.amount))}
      </Text>
    </View>
  );
}

function EarningRow({ item, last, onPress }: { item: TripEarningDto; last: boolean; onPress: () => void }) {
  const uz = useCopy();
  const route = `${city(item.pickupAddress)} → ${city(item.dropoffAddress)}`;
  const statusLabel = uz.status.trip[item.status] ?? item.status;
  const pending = item.status === 'DELIVERED';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.earningRow, !last && styles.rowDivider, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${route}, ${statusLabel}, ${formatMoney(item.netUzs)}`}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {route}
        </Text>
        <Text style={styles.rowSub}>
          {statusLabel}
          {item.completedAt ? ` · ${formatDateTime(item.completedAt)}` : ''}
        </Text>
        <Text style={styles.earningMeta}>
          {formatMoney(item.agreedPrice, item.currency)} · {uz.wallet.commissionLine} {formatMoney(item.commissionAmount)}
        </Text>
      </View>
      <View style={styles.earningRight}>
        <Text style={[styles.rowAmount, !pending && styles.rowAmountIn]}>{formatMoney(item.netUzs)}</Text>
        {pending ? <Text style={styles.pendingChip}>{uz.wallet.pendingEarned}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function BalanceTabScreen() {
  const uz = useCopy();
  const router = useRouter();
  const { profile } = useAuth();
  // Profil yaratilmaguncha hamyon yo'q — o'rniga ro'yxatdan o'tish taklifi
  const locked = !profile;
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hisob yozuvidagi reys kodi o'rniga yo'nalishni ko'rsatish uchun
  const { data: trips } = useQuery({ queryKey: ['trips'], queryFn: () => tripsApi.getTrips(), enabled: !locked });
  const routeByTrip = useMemo(() => {
    const map = new Map<string, string>();
    trips?.forEach((t) => map.set(t.id, `${city(t.pickupAddress)} → ${city(t.dropoffAddress)}`));
    return map;
  }, [trips]);

  const fetchWallet = useCallback(async () => {
    try {
      setError(null);
      setWallet(await carrierApi.getWallet());
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || uz.wallet.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uz.wallet.loadError]);

  useEffect(() => {
    if (!locked) fetchWallet();
  }, [fetchWallet, locked]);

  const entries = useMemo(() => wallet?.entries ?? [], [wallet]);
  const earnings = wallet?.earnings ?? [];
  const earnedThisMonth = wallet?.earnedThisMonth ?? 0;
  const commissionThisMonth = wallet?.commissionThisMonth ?? 0;
  const netThisMonth = wallet?.netThisMonth ?? 0;
  const pendingEarned = wallet?.pendingEarned ?? 0;

  return (
    <Screen edges={TAB_EDGES_NO_HEADER} contentContainerStyle={styles.content}>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (locked) return;
              setRefreshing(true);
              fetchWallet();
            }}
            tintColor={colors.slate500}
            colors={[colors.primary]}
          />
        }
      >
        <ScreenTitle title={uz.wallet.title} />
        {locked ? <RegistrationLocked /> : null}
        {!locked ? (
          <>
            {error && !wallet ? <ErrorBanner message={error} onRetry={fetchWallet} /> : null}

            <View style={styles.hero}>
              <Text style={styles.heroLabel}>{uz.wallet.earnedThisMonth}</Text>
              {loading && !wallet ? (
                <Skeleton width={200} height={38} radius={10} style={styles.heroSkeleton} />
              ) : (
                <Money amount={earnedThisMonth} size="xl" weight="800" color="#FFFFFF" style={styles.heroAmount} />
              )}
              <Text style={styles.heroSub}>{uz.wallet.earnedHint}</Text>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>{uz.wallet.commissionThisMonth}</Text>
                  <Text style={styles.heroStatValue}>{formatMoney(commissionThisMonth)}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>{uz.wallet.netThisMonth}</Text>
                  <Text style={styles.heroStatValue}>{formatMoney(netThisMonth)}</Text>
                </View>
              </View>

              {pendingEarned > 0 ? (
                <View style={styles.pendingBox}>
                  <Text style={styles.pendingLabel}>{uz.wallet.pendingEarned}</Text>
                  <Text style={styles.pendingAmount}>{formatMoney(pendingEarned)}</Text>
                  <Text style={styles.pendingHint}>{uz.wallet.pendingHint}</Text>
                </View>
              ) : null}

              <View style={styles.heroDivider} />
              <Text style={styles.heroLabel}>{uz.wallet.currentBalance}</Text>
              <Text style={styles.balanceAmount}>{formatMoney(wallet?.balance ?? 0)}</Text>
              <Text style={styles.heroHint}>{uz.wallet.balanceHint}</Text>
              <Text style={[styles.heroHint, styles.topUpHint]}>{uz.wallet.topUpInstruction}</Text>
              <Pressable
                onPress={() => Linking.openURL(`tel:${ADMIN_PHONE}`).catch(() => undefined)}
                style={({ pressed }) => [styles.topUp, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={uz.wallet.callAdmin}
              >
                <Ionicons name="call" size={17} color={ink[900]} />
                <Text style={styles.topUpText}>
                  {uz.wallet.topUpButton} · {ADMIN_PHONE_DISPLAY}
                </Text>
              </Pressable>
            </View>

            <SectionTitle
              title={uz.wallet.earningsTitle}
              right={earnings.length > 0 ? <Text style={styles.count}>{earnings.length} ta</Text> : undefined}
            />
            {loading && !wallet ? (
              <View style={styles.listCard}>
                {[0, 1].map((i) => (
                  <View key={i} style={[styles.earningRow, i < 1 && styles.rowDivider]}>
                    <View style={styles.rowMain}>
                      <Skeleton width="60%" height={13} />
                      <Skeleton width="40%" height={11} style={styles.skeletonGap} />
                    </View>
                  </View>
                ))}
              </View>
            ) : earnings.length > 0 ? (
              <View style={styles.listCard}>
                {earnings.map((item, i) => (
                  <EarningRow
                    key={item.tripId}
                    item={item}
                    last={i === earnings.length - 1}
                    onPress={() => router.push(`/trips/${item.tripId}`)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                iconName="cube-outline"
                title={uz.wallet.emptyEarnings}
                description={uz.wallet.emptyEarningsHint}
              />
            )}

            <SectionTitle
              title={uz.wallet.entriesTitle}
              right={entries.length > 0 ? <Text style={styles.count}>{entries.length} ta</Text> : undefined}
            />
            {loading && !wallet ? (
              <View style={styles.listCard}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.row, i < 2 && styles.rowDivider]}>
                    <Skeleton width={38} height={38} radius={12} />
                    <View style={styles.rowMain}>
                      <Skeleton width="50%" height={13} />
                      <Skeleton width="70%" height={11} style={styles.skeletonGap} />
                    </View>
                  </View>
                ))}
              </View>
            ) : entries.length > 0 ? (
              <View style={styles.listCard}>
                {entries.map((e, i) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    route={e.tripId ? routeByTrip.get(e.tripId) : undefined}
                    last={i === entries.length - 1}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                iconName="wallet-outline"
                title={uz.wallet.emptyEntries}
                description={uz.wallet.emptyEntriesHint}
              />
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0 },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  pressed: { opacity: 0.85 },
  hero: { backgroundColor: ink[900], borderRadius: 22, padding: 20 },
  heroLabel: { fontSize: 14, fontWeight: '600', color: ink.muted },
  heroAmount: { marginTop: 6, fontSize: 36, letterSpacing: -1 },
  heroSkeleton: { marginTop: 8, opacity: 0.2 },
  heroSub: { marginTop: 6, fontSize: 13.5, lineHeight: 19, color: ink.muted },
  heroStats: { flexDirection: 'row', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 12 },
  heroStat: { flex: 1, paddingHorizontal: 14 },
  heroStatDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)' },
  heroStatLabel: { fontSize: 12.5, fontWeight: '600', color: ink.muted },
  heroStatValue: { marginTop: 4, fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  pendingBox: {
    marginTop: 14,
    backgroundColor: 'rgba(249,115,22,0.16)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pendingLabel: { fontSize: 12.5, fontWeight: '700', color: '#FDBA74' },
  pendingAmount: { marginTop: 2, fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  pendingHint: { marginTop: 4, fontSize: 12.5, lineHeight: 17, color: ink.muted },
  balanceAmount: { marginTop: 4, fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  heroDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  heroHint: { fontSize: 13.5, lineHeight: 19, color: ink.muted },
  topUpHint: { marginTop: 6 },
  earningRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  earningMeta: { marginTop: 3, fontSize: 12.5, color: colors.textMuted },
  earningRight: { alignItems: 'flex-end' },
  pendingChip: { marginTop: 3, fontSize: 11.5, fontWeight: '700', color: colors.accent },
  topUp: {
    marginTop: 12,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  topUpText: { fontSize: 15.5, fontWeight: '700', color: ink[900] },
  count: { fontSize: 14, color: colors.textMuted },
  listCard: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.slate200 },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowIconIn: { backgroundColor: '#E8F7EF' },
  rowIconOut: { backgroundColor: colors.slate100 },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15.5, fontWeight: '600', color: colors.slate900 },
  rowSub: { marginTop: 2, fontSize: 13.5, color: colors.slate700 },
  rowDate: { marginTop: 1, fontSize: 12.5, color: colors.textMuted },
  rowAmount: { fontSize: 15.5, fontWeight: '700', color: colors.slate900, fontVariant: ['tabular-nums'] },
  rowAmountIn: { color: '#0F7A45' },
  skeletonGap: { marginTop: 6 },
});
