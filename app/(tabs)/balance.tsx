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
import { carrierApi } from '../../src/api/client';
import { EntryDto, EntryType, WalletDto } from '../../src/api/types';
import {
  EmptyState,
  ErrorBanner,
  Money,
  PrimaryButton,
  Screen,
} from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { formatDateTime, formatMoney } from '../../src/utils/format';

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
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      // Fallback
      Linking.openURL(url);
    }
  };

  const renderEntryTypeBadge = (type: EntryType) => {
    switch (type) {
      case 'TOPUP':
        return {
          label: uz.wallet.types.TOPUP,
          color: '#166534',
          bg: '#dcfce7',
          prefix: '+',
          isPositive: true,
        };
      case 'COMMISSION':
        return {
          label: uz.wallet.types.COMMISSION,
          color: '#991b1b',
          bg: '#fee2e2',
          prefix: '-',
          isPositive: false,
        };
      case 'REFUND':
        return {
          label: uz.wallet.types.REFUND,
          color: '#166534',
          bg: '#dcfce7',
          prefix: '+',
          isPositive: true,
        };
      case 'ADJUSTMENT':
      default:
        return {
          label: uz.wallet.types.ADJUSTMENT,
          color: '#1e40af',
          bg: '#dbeafe',
          prefix: '',
          isPositive: false,
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
          <View style={[styles.entryBadge, { backgroundColor: config.bg }]}>
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
              { color: item.amount >= 0 ? '#16a34a' : '#dc2626' },
            ]}
          >
            {formattedAmount}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1a56db"
          colors={['#1a56db']}
        />
      }
    >
      <ErrorBanner message={error} onRetry={fetchWallet} />

      {/* Main Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{uz.wallet.currentBalance}</Text>
        <Money
          amount={wallet?.balance ?? 0}
          size="xl"
          color="#ffffff"
          style={styles.balanceAmount}
        />
        <Text style={styles.currencyNotice}>O‘zbekiston so‘mi</Text>
      </View>

      {/* Topup Info & Admin Call Action */}
      <View style={styles.topupBox}>
        <View style={styles.topupTextRow}>
          <Text style={styles.topupIcon}>ℹ️</Text>
          <View style={styles.topupTextContainer}>
            <Text style={styles.topupTitle}>{uz.wallet.topUpInstruction}</Text>
            <Text style={styles.topupPhone}>{ADMIN_PHONE_DISPLAY}</Text>
          </View>
        </View>

        <PrimaryButton
          title={uz.wallet.callAdmin}
          onPress={handleCallAdmin}
          style={styles.callButton}
          accessibilityLabel={`${uz.wallet.callAdmin}: ${ADMIN_PHONE_DISPLAY}`}
        />
      </View>

      {/* Entries Title */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>{uz.wallet.entriesTitle}</Text>
      </View>

      {/* Entries List or Empty */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#1a56db" size="large" />
          <Text style={styles.loadingText}>{uz.common.loading}</Text>
        </View>
      ) : !wallet?.entries || wallet.entries.length === 0 ? (
        <EmptyState
          title={uz.wallet.emptyEntries}
          description="Balans to‘ldirilganda yoki reys komissiyasi yechilganda hisob yozuvlari shu yerda ko‘rinadi."
          icon="💳"
        />
      ) : (
        <View style={styles.entriesList}>
          {wallet.entries.map((entry) => (
            <React.Fragment key={entry.id}>
              {renderEntryItem({ item: entry })}
            </React.Fragment>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: '#1a56db',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#bfdbfe',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  currencyNotice: {
    fontSize: 13,
    color: '#93c5fd',
    fontWeight: '500',
  },
  topupBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  topupTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topupIcon: {
    fontSize: 22,
    marginRight: 10,
    marginTop: 2,
  },
  topupTextContainer: {
    flex: 1,
  },
  topupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
    lineHeight: 20,
  },
  topupPhone: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a56db',
    marginTop: 2,
  },
  callButton: {
    minHeight: 48,
    borderRadius: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  entriesList: {
    paddingBottom: 24,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLeft: {
    flex: 1,
    paddingRight: 12,
  },
  entryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  entryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryComment: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  entryDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
