import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { tripsApi } from '../api/client';
import { FeedItem } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Card, SectionTitle } from '../components';
import { useCopy } from '../i18n';
import { colors } from '../theme';
import { formatMoney, formatPickupWindow } from '../utils/format';

/**
 * Reys tugaydigan joy atrofidagi ochiq yuklar — bo'sh qaytmaslik uchun. Server faqat LOADED va
 * DELIVERED holatida beradi; "Uyga" — haydovchining asosiy viloyatiga boradigan yuklar.
 */
export function ReturnLoadsCard({ tripId }: { tripId: string }) {
  const uz = useCopy();
  const router = useRouter();
  const { profile } = useAuth();
  const [toHome, setToHome] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ['returnLoads', tripId, toHome],
    queryFn: () => tripsApi.getReturnLoads(tripId, toHome),
  });

  const home = profile?.homeRegion ? uz.regionsShort[profile.homeRegion] : '';
  const items = data?.content ?? [];

  return (
    <>
      <SectionTitle
        title={uz.returnLoads.title}
        right={
          data ? <Text style={styles.count}>{uz.returnLoads.count.replace('{{count}}', String(data.total))}</Text> : null
        }
      />
      <Card>
        <View style={styles.segment} accessibilityRole="tablist">
          <Segment label={uz.returnLoads.toHome.replace('{{region}}', home)} active={toHome} onPress={() => setToHome(true)} />
          <Segment label={uz.returnLoads.anywhere} active={!toHome} onPress={() => setToHome(false)} />
        </View>

        {isLoading ? <Text style={styles.muted}>…</Text> : null}
        {error ? (
          <Text style={styles.muted}>{error instanceof Error ? error.message : uz.common.networkError}</Text>
        ) : null}
        {!isLoading && !error && items.length === 0 ? <Text style={styles.muted}>{uz.returnLoads.empty}</Text> : null}

        {items.map((item, i) => (
          <ReturnRow
            key={item.loadId}
            item={item}
            last={i === items.length - 1}
            onPress={() => router.push({ pathname: '/loads/[id]', params: { id: item.loadId } })}
          />
        ))}
      </Card>
    </>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.segmentItem, active && styles.segmentActive]}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function ReturnRow({ item, last, onPress }: { item: FeedItem; last: boolean; onPress: () => void }) {
  const uz = useCopy();
  const route = `${item.pickupRegion ? uz.regionsShort[item.pickupRegion] : item.pickupAddress} → ${
    item.dropoffRegion ? uz.regionsShort[item.dropoffRegion] : item.dropoffAddress
  }`;
  const meta = [item.cargoType, `${item.weightTons} ${uz.common.tons}`, formatPickupWindow(item.pickupDate)]
    .filter(Boolean)
    .join(' · ');
  const price =
    item.priceMode === 'FIXED' && item.price != null ? formatMoney(item.price, item.currency) : uz.loadsTab.bidCta;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${route}, ${meta}, ${price}`}
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.route} numberOfLines={1}>
          {route}
        </Text>
        <Text style={styles.muted} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={styles.rowSide}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.muted}>{Math.round(item.distanceKm)} km</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.slate400} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  count: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  segment: { flexDirection: 'row', backgroundColor: colors.slate100, borderRadius: 10, padding: 3, marginBottom: 6 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { fontSize: 13.5, fontWeight: '600', color: colors.textMuted },
  segmentTextActive: { color: colors.slate900 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.slate200 },
  pressed: { opacity: 0.6 },
  rowMain: { flex: 1, gap: 2 },
  rowSide: { alignItems: 'flex-end', gap: 2 },
  route: { fontSize: 15, fontWeight: '600', color: colors.slate900 },
  price: { fontSize: 14.5, fontWeight: '700', color: colors.slate900 },
  muted: { fontSize: 13, color: colors.textMuted, paddingTop: 2 },
});
