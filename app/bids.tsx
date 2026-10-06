import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { bidsApi, carrierApi } from '../src/api/client';
import { MyBid } from '../src/api/types';
import {
  EmptyState,
  ErrorBanner,
  Money,
  PrimaryButton,
  Screen,
  StatusBadge,
  TextField,
} from '../src/components';
import { formatDate, formatDateTime } from '../src/utils/format';
import { uz } from '../src/i18n/uz';
import { colors, radii, shadows } from '../src/theme';

export default function MyBidsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editingBid, setEditingBid] = useState<MyBid | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [editCommentInput, setEditCommentInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: bids,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['myBids'],
    queryFn: carrierApi.getMyBids,
  });

  const updateBidMutation = useMutation({
    mutationFn: ({ id, price, comment }: { id: string; price: number; comment?: string }) =>
      bidsApi.updateBid(id, { price, comment }),
    onSuccess: () => {
      setEditingBid(null);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      Alert.alert('Muvaffaqiyatli', uz.loadDetails.successBidUpdated);
    },
    onError: (err: unknown) => {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj?.message || uz.loadDetails.errors.GENERIC);
    },
  });

  const withdrawBidMutation = useMutation({
    mutationFn: (id: string) => bidsApi.withdrawBid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      Alert.alert('Muvaffaqiyatli', uz.loadDetails.successBidWithdrawn);
    },
    onError: (err: unknown) => {
      const errorObj = err as { message?: string };
      Alert.alert('Xatolik', errorObj?.message || uz.loadDetails.errors.GENERIC);
    },
  });

  const handleOpenLoad = (loadId: string) => {
    router.push({
      pathname: '/loads/[id]',
      params: { id: loadId },
    });
  };

  const handleOpenEdit = (bid: MyBid) => {
    setEditingBid(bid);
    setEditPriceInput(String(bid.price));
    setEditCommentInput(bid.comment || '');
    setErrorMessage(null);
  };

  const handleSubmitEdit = () => {
    if (!editingBid) return;
    const numericPrice = Number(editPriceInput.replace(/\D/g, ''));
    if (!numericPrice || numericPrice <= 0) {
      setErrorMessage('Iltimos, taklif narxini to‘g‘ri kiriting');
      return;
    }

    updateBidMutation.mutate({
      id: editingBid.id,
      price: numericPrice,
      comment: editCommentInput.trim() || undefined,
    });
  };

  const handleConfirmWithdraw = (bid: MyBid) => {
    Alert.alert(
      uz.loadDetails.confirmWithdrawTitle,
      uz.loadDetails.confirmWithdrawBody,
      [
        { text: uz.common.cancel, style: 'cancel' },
        {
          text: uz.loadDetails.confirmWithdrawAction,
          style: 'destructive',
          onPress: () => withdrawBidMutation.mutate(bid.id),
        },
      ]
    );
  };

  const renderBidItem = ({ item }: { item: MyBid }) => {
    const isPending = item.status === 'PENDING';

    return (
      <View style={styles.card}>
        {/* Top header: Status & date */}
        <View style={styles.cardHeader}>
          <StatusBadge status={item.status} size="sm" />
          <Text style={styles.createdDateText}>
            {formatDateTime(item.createdAt)}
          </Text>
        </View>

        {/* Route info */}
        <Pressable
          onPress={() => handleOpenLoad(item.loadId)}
          style={styles.routeContainer}
          accessibilityRole="button"
          accessibilityLabel={`${item.pickupAddress} dan ${item.dropoffAddress} gacha yuk`}
        >
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
        </Pressable>

        {/* Pickup date */}
        <View style={styles.pickupDateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.slate500} style={styles.dateIcon} />
          <Text style={styles.pickupDateText}>
            {formatDate(item.pickupDate)}
          </Text>
        </View>

        {/* Price & Comment */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>{uz.bidsScreen.myPrice}</Text>
          <Money amount={item.price} size="lg" color={colors.primary} weight="800" />

          {item.comment ? (
            <Text style={styles.commentText}>“{item.comment}”</Text>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <Pressable
            onPress={() => handleOpenLoad(item.loadId)}
            style={styles.viewLoadBtn}
            accessibilityRole="button"
            accessibilityLabel={uz.bidsScreen.viewLoad}
          >
            <Ionicons name="cube-outline" size={14} color={colors.slate700} style={styles.btnIcon} />
            <Text style={styles.viewLoadBtnText}>{uz.bidsScreen.viewLoad}</Text>
          </Pressable>

          {isPending ? (
            <>
              <Pressable
                onPress={() => handleOpenEdit(item)}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel={uz.bidsScreen.editBid}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.primary} style={styles.btnIcon} />
                <Text style={styles.editBtnText}>{uz.bidsScreen.editBid}</Text>
              </Pressable>

              <Pressable
                onPress={() => handleConfirmWithdraw(item)}
                style={styles.withdrawBtn}
                accessibilityRole="button"
                accessibilityLabel={uz.bidsScreen.withdrawBid}
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Screen style={styles.screen}>
      {/* Top Header */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={uz.common.back}
        >
          <Ionicons name="arrow-back" size={20} color={colors.slate800} />
        </Pressable>
        <Text style={styles.screenTitle}>{uz.bidsScreen.title}</Text>
        <View style={styles.navRightPlaceholder} />
      </View>

      {error ? (
        <ErrorBanner
          message={error instanceof Error ? error.message : uz.common.networkError}
          onRetry={refetch}
        />
      ) : null}

      <FlatList
        data={bids || []}
        keyExtractor={(item) => item.id}
        renderItem={renderBidItem}
        contentContainerStyle={[
          styles.listContent,
          (!bids || bids.length === 0) && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || (isLoading && !bids)}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              iconName="receipt-outline"
              title={uz.bidsScreen.emptyTitle}
              description={uz.bidsScreen.emptyDesc}
              actionTitle="Yuklar lentasini ko‘rish"
              onAction={() => router.push('/(tabs)')}
            />
          ) : null
        }
      />

      {/* Edit Bid Modal */}
      <Modal
        visible={!!editingBid}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingBid(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{uz.loadDetails.editBidModalTitle}</Text>

            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            <TextField
              label={uz.loadDetails.bidPriceLabel}
              placeholder={uz.loadDetails.bidPricePlaceholder}
              value={editPriceInput}
              onChangeText={setEditPriceInput}
              keyboardType="number-pad"
            />

            <TextField
              label={uz.loadDetails.bidCommentLabel}
              placeholder={uz.loadDetails.bidCommentPlaceholder}
              value={editCommentInput}
              onChangeText={setEditCommentInput}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <PrimaryButton
                title={uz.loadDetails.saveBid}
                onPress={handleSubmitEdit}
                loading={updateBidMutation.isPending}
                style={styles.modalPrimaryBtn}
              />
              <PrimaryButton
                title={uz.common.cancel}
                variant="secondary"
                onPress={() => setEditingBid(null)}
                disabled={updateBidMutation.isPending}
                style={styles.modalSecondaryBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    backgroundColor: colors.background,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
  },
  navRightPlaceholder: {
    width: 36,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  createdDateText: {
    fontSize: 12,
    color: colors.slate400,
  },
  routeContainer: {
    marginBottom: 10,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginRight: 10,
  },
  dotPickup: {
    backgroundColor: colors.successDark,
  },
  dotDropoff: {
    backgroundColor: colors.dangerDark,
  },
  routeLine: {
    width: 2,
    height: 14,
    backgroundColor: colors.slate300,
    marginLeft: 3,
    marginVertical: 2,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate900,
    flex: 1,
    lineHeight: 19,
  },
  pickupDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateIcon: {
    marginRight: 5,
  },
  pickupDateText: {
    fontSize: 12.5,
    color: colors.slate600,
    fontWeight: '500',
  },
  priceContainer: {
    backgroundColor: colors.primary50,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: colors.slate700,
    fontStyle: 'italic',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    paddingTop: 10,
  },
  btnIcon: {
    marginRight: 4,
  },
  viewLoadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.sm,
  },
  viewLoadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate700,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary50,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.sm,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  withdrawBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: 20,
    paddingBottom: 36,
    ...shadows.floating,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
    marginBottom: 16,
  },
  modalButtons: {
    marginTop: 12,
    gap: 10,
  },
  modalPrimaryBtn: {
    width: '100%',
  },
  modalSecondaryBtn: {
    width: '100%',
  },
});
