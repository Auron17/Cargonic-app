import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carrierApi } from '../../src/api/client';
import { EntryDto, EntryType, WalletDto } from '../../src/api/types';
import {
  EmptyState,
  ErrorBanner,
  Money,
  Screen,
  TAB_EDGES_WITH_HEADER,
} from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { formatDateTime, formatMoney } from '../../src/utils/format';
import { colors, radii, shadows } from '../../src/theme';

const ADMIN_PHONE = '+998900000001';
const ADMIN_PHONE_DISPLAY = '+998 (90) 000-00-01';

export default function BalanceTabScreen() {
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      setError(null);
      const data = await carrierApi.getWallet();
      setWallet(data);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Balans ma’lumotlarini yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallet();
  };

  const handleCallAdmin = async () => {
    const url = `tel:${ADMIN_PHONE}`;
    try {
      await Linking.openURL(url);
    } catch {
      // Fallback
    }
  };

  const renderEntryTypeBadge = (type: EntryType) => {
    switch (type) {
      case 'TOPUP':
        return {
          label: uz.wallet.types.TOPUP,
          color: colors.successDark,
          bg: '#ECFDF5',
          border: '#A7F3D0',
          prefix: '+',
          isPositive: true,
          icon: 'arrow-down-circle' as const,
        };
      case 'COMMISSION':
        return {
          label: uz.wallet.types.COMMISSION,
          color: colors.dangerDark,
          bg: '#FEF2F2',
          border: '#FECACA',
          prefix: '-',
          isPositive: false,
          icon: 'arrow-up-circle' as const,
        };
      case 'REFUND':
        return {
          label: uz.wallet.types.REFUND,
          color: colors.successDark,
          bg: '#ECFDF5',
          border: '#A7F3D0',
          prefix: '+',
          isPositive: true,
          icon: 'refresh-circle' as const,
        };
      case 'ADJUSTMENT':
      default:
        return {
          label: uz.wallet.types.ADJUSTMENT,
          color: colors.primary,
          bg: colors.primary50,
          border: '#BFDBFE',
          prefix: '',
          isPositive: false,
          icon: 'swap-horizontal' as const,
        };
    }
  };

  const renderEntryItem = ({ item }: { item: EntryDto }) => {
    const config = renderEntryTypeBadge(item.type);
    const isAmountPositive = item.amount > 0;
    const formattedAmount = `${config.prefix ? (isAmountPositive ? '+' : '') : ''}${formatMoney(
      Math.abs(item.amount)
    )}`;

    return (
      <View style={styles.entryCard} accessibilityRole="text">
        <View style={styles.entryLeft}>
          <View style={[styles.entryBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
            <Ionicons name={config.icon} size={13} color={config.color} style={styles.entryBadgeIcon} />
            <Text style={[styles.entryBadgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>

          {item.comment ? (
            <Text style={styles.entryComment} numberOfLines={2}>
              {item.comment}
            </Text>
          ) : item.tripId ? (
            <Text style={styles.entryComment}>
              Reys: {item.tripId.slice(0, 8)}…
            </Text>
          ) : null}

          <Text style={styles.entryDate}>{formatDateTime(item.createdAt)}</Text>
        </View>

        <View style={styles.entryRight}>
          <Text
            style={[
              styles.entryAmount,
              { color: item.amount >= 0 ? colors.successDark : colors.dangerDark },
            ]}
          >
            {formattedAmount}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        {/* Hero Balance Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>{uz.wallet.currentBalance}</Text>
            <View style={styles.statusPill}>
              <View style={styles.activeDot} />
              <Text style={styles.statusPillText}>Hamyon faol</Text>
            </View>
          </View>

          <View style={styles.heroAmountRow}>
            <Money
              amount={wallet?.balance ?? 0}
              size="xl"
              color="#FFFFFF"
              weight="800"
            />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroActionBox}>
            <View style={styles.instructionWrap}>
              <Ionicons name="information-circle-outline" size={16} color="#94A3B8" style={styles.infoIcon} />
              <Text style={styles.heroInstructionText}>
                {uz.wallet.topUpInstruction}
              </Text>
            </View>

            <Pressable
              onPress={handleCallAdmin}
              style={({ pressed }) => [
                styles.topUpButton,
                pressed && styles.topUpButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={uz.wallet.callAdmin}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" style={styles.callIcon} />
              <Text style={styles.topUpButtonText}>{ADMIN_PHONE_DISPLAY}</Text>
            </Pressable>
          </View>
        </View>

        {/* Section title */}
        <View style={styles.entriesSectionHeader}>
          <Text style={styles.entriesTitle}>{uz.wallet.entriesTitle}</Text>
          {wallet?.entries && wallet.entries.length > 0 ? (
            <Text style={styles.entriesCount}>{wallet.entries.length} ta yozuv</Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading && !wallet) {
    return (
      <Screen edges={TAB_EDGES_WITH_HEADER} style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{uz.common.loading}</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={TAB_EDGES_WITH_HEADER} style={styles.screen}>
      {error && !wallet ? (
        <ErrorBanner message={error} onRetry={fetchWallet} />
      ) : null}

      <FlatList
        data={wallet?.entries || []}
        keyExtractor={(item) => item.id}
        renderItem={renderEntryItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              iconName="wallet-outline"
              title={uz.wallet.emptyEntries}
              description="Bajarilgan reyslar va to‘lovlar tarixi shu yerda qayd etiladi."
            />
          ) : null
        }
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 8,
  },
  heroCard: {
    backgroundColor: '#0F172A', // Deep Slate
    borderRadius: radii.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#334155',
    ...shadows.floating,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  heroAmountRow: {
    marginVertical: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 16,
  },
  heroActionBox: {
    gap: 12,
  },
  instructionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 6,
  },
  heroInstructionText: {
    fontSize: 12.5,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 18,
  },
  topUpButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  topUpButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  callIcon: {
    marginRight: 8,
  },
  topUpButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  entriesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
  },
  entriesCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  entryLeft: {
    flex: 1,
    marginRight: 12,
  },
  entryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  entryBadgeIcon: {
    marginRight: 4,
  },
  entryBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  entryComment: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.slate800,
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
