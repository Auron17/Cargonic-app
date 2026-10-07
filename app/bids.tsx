import React, { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { bidsApi, carrierApi } from '../src/api/client';
import { MyBid } from '../src/api/types';
import {
  BottomSheet,
  Card,
  DETAIL_EDGES,
  EmptyState,
  ErrorBanner,
  Money,
  Pill,
  PrimaryButton,
  RouteLine,
  Screen,
  SkeletonList,
  SuccessBanner,
  TextField,
  pillToneForStatus,
  statusBadgeLabel,
} from '../src/components';
import { usePullToRefresh } from '../src/hooks/usePullToRefresh';
import { formatDate, formatDateTime } from '../src/utils/format';
import { useCopy } from '../src/i18n';
import { colors } from '../src/theme';

export default function MyBidsScreen() {
  const uz = useCopy();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editingBid, setEditingBid] = useState<MyBid | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [editCommentInput, setEditCommentInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: bids,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['myBids'],
    queryFn: carrierApi.getMyBids,
  });
  const pull = usePullToRefresh(refetch);

  const updateBidMutation = useMutation({
    mutationFn: ({ id, price, comment }: { id: string; price: number; comment?: string }) =>
      bidsApi.updateBid(id, { price, comment }),
    onSuccess: () => {
      setEditingBid(null);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setSuccessMessage(uz.loadDetails.successBidUpdated);
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
      setSuccessMessage(uz.loadDetails.successBidWithdrawn);
    },
    onError: (err: unknown) => {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj?.message || uz.loadDetails.errors.GENERIC);
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
      <Card onPress={() => handleOpenLoad(item.loadId)} accessibilityLabel={`${item.pickupAddress} dan ${item.dropoffAddress} gacha yuk`}>
        <View style={styles.cardTop}>
          <Money amount={item.price} currency={item.currency} size="lg" weight="800" />
          <Pill tone={pillToneForStatus(item.status)} label={statusBadgeLabel(item.status, 'bid')} />
        </View>
        <Text style={styles.meta}>Taklif: {formatDateTime(item.createdAt)}</Text>
        <View style={styles.route}>
          <RouteLine from={item.pickupAddress} to={item.dropoffAddress} fromHint={formatDate(item.pickupDate)} />
        </View>
        {item.comment ? <Text style={styles.comment}>“{item.comment}”</Text> : null}
        {isPending ? (
          <View style={styles.actions}>
            <Pressable onPress={() => handleOpenEdit(item)} style={styles.action} accessibilityRole="button" hitSlop={6}>
              <Ionicons name="pencil" size={15} color={colors.primary} />
              <Text style={styles.actionText}>{uz.bidsScreen.editBid}</Text>
            </Pressable>
            <Pressable onPress={() => handleConfirmWithdraw(item)} style={styles.action} accessibilityRole="button" hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={colors.danger} />
              <Text style={[styles.actionText, styles.actionDanger]}>{uz.bidsScreen.withdrawBid}</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <Screen edges={DETAIL_EDGES} contentContainerStyle={styles.content}>
      <FlatList
        data={bids ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderBidItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.slate500} />}
        ListHeaderComponent={
          <>
            <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} />
            {error || (errorMessage && !editingBid) ? (
              <ErrorBanner
                message={errorMessage || (error instanceof Error ? error.message : uz.common.networkError)}
                onRetry={error && !errorMessage ? refetch : undefined}
                onDismiss={errorMessage ? () => setErrorMessage(null) : undefined}
              />
            ) : null}
            {isLoading ? <SkeletonList count={2} /> : null}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <EmptyState
                iconName="pricetags-outline"
                title={uz.bidsScreen.emptyTitle}
                description={uz.bidsScreen.emptyDesc}
                actionTitle="Yuklarni ko‘rish"
                onAction={() => router.push('/(tabs)')}
              />
            </View>
          ) : null
        }
      />

      <BottomSheet
        visible={!!editingBid}
        onClose={() => setEditingBid(null)}
        locked={updateBidMutation.isPending}
        title={uz.loadDetails.editBidModalTitle}
      >
        {errorMessage ? <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} /> : null}
        <TextField
          label={uz.loadDetails.bidPriceLabel}
          placeholder={uz.loadDetails.bidPricePlaceholder}
          value={editPriceInput}
          onChangeText={setEditPriceInput}
          keyboardType="number-pad"
          autoFocus
        />
        <TextField
          label={uz.loadDetails.bidCommentLabel}
          placeholder={uz.loadDetails.bidCommentPlaceholder}
          value={editCommentInput}
          onChangeText={setEditCommentInput}
          multiline
          numberOfLines={3}
        />
        <PrimaryButton title={uz.loadDetails.saveBid} variant="accent" onPress={handleSubmitEdit} loading={updateBidMutation.isPending} size="lg" />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  separator: { height: 12 },
  empty: { paddingTop: 48 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  route: { marginTop: 14 },
  comment: { marginTop: 12, fontSize: 14, fontStyle: 'italic', color: colors.slate700 },
  actions: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.slate200,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  actionDanger: { color: colors.danger },
});
