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

export default function MyBidsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Edit Bid modal state
  const [editingBid, setEditingBid] = useState<MyBid | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [editCommentInput, setEditCommentInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch carrier's bids
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

  // 2. Update bid mutation
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

  // 3. Withdraw bid mutation
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
          <StatusBadge status={item.status} />
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
          <Text style={styles.pickupDateText}>
            📅 {uz.loadsTab.pickupDate.replace('{{date}}', formatDate(item.pickupDate))}
          </Text>
        </View>

        {/* Price & Comment */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>{uz.bidsScreen.myPrice}</Text>
          <Money amount={item.price} size="lg" color="#1a56db" weight="bold" />

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
            <Text style={styles.viewLoadBtnText}>📦 {uz.bidsScreen.viewLoad}</Text>
          </Pressable>

          {isPending ? (
            <>
              <Pressable
                onPress={() => handleOpenEdit(item)}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel={uz.bidsScreen.editBid}
              >
                <Text style={styles.editBtnText}>✏️ {uz.bidsScreen.editBid}</Text>
              </Pressable>

              <Pressable
                onPress={() => handleConfirmWithdraw(item)}
                style={styles.withdrawBtn}
                accessibilityRole="button"
                accessibilityLabel={uz.bidsScreen.withdrawBid}
              >
                <Text style={styles.withdrawBtnText}>✕</Text>
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
          <Text style={styles.backButtonText}>← {uz.common.back}</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || (isLoading && !bids)}
            onRefresh={refetch}
            colors={['#1a56db']}
            tintColor="#1a56db"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="📑"
              title={uz.bidsScreen.emptyTitle}
              description={uz.bidsScreen.emptyDesc}
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
    backgroundColor: '#f9fafb',
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  navRightPlaceholder: {
    width: 60,
  },
  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  createdDateText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  routeContainer: {
    marginBottom: 10,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  pickupDateRow: {
    marginBottom: 10,
  },
  pickupDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  priceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 6,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewLoadBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  viewLoadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a56db',
  },
  editBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  withdrawBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991b1b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    gap: 10,
    marginTop: 8,
  },
  modalPrimaryBtn: {
    minHeight: 48,
  },
  modalSecondaryBtn: {
    minHeight: 48,
  },
});
