import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bidsApi, carrierApi, loadsApi } from '../../src/api/client';
import { MyBid } from '../../src/api/types';
import {
  BottomSheet,
  Card,
  DETAIL_EDGES,
  ErrorBanner,
  HeaderBackButton,
  Money,
  Pill,
  PrimaryButton,
  RegistrationSheet,
  RouteLine,
  Screen,
  SectionTitle,
  SkeletonCard,
  SuccessBanner,
  SummaryRow,
  TextField,
  pillToneForStatus,
  statusBadgeLabel,
  useRegistration,
} from '../../src/components';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney, formatPickupWindow } from '../../src/utils/format';
import { useCopy } from '../../src/i18n';
import { colors } from '../../src/theme';

export default function LoadDetailsScreen() {
  const uz = useCopy();
  const { id, action } = useLocalSearchParams<{ id: string; action?: string | string[] }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadId = Array.isArray(id) ? id[0] : id;
  const actionParam = Array.isArray(action) ? action[0] : action;
  const consumedActionRef = useRef<string | null>(null);

  // Local state for modals & forms
  const [showConfirmBookModal, setShowConfirmBookModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPriceInput, setBidPriceInput] = useState('');
  const [bidCommentInput, setBidCommentInput] = useState('');
  const [isEditingBid, setIsEditingBid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Ro'yxatdan to'liq o'tmagan haydovchi yukni ko'radi, lekin olish/taklif o'rniga ro'yxatdan o'tish oynasi chiqadi
  const approved = useRegistration().state === 'approved';
  const [showRegistration, setShowRegistration] = useState(false);

  // 1. Fetch load details
  const {
    data: load,
    isLoading: isLoadingLoad,
    error: loadError,
    refetch: refetchLoad,
  } = useQuery({
    queryKey: ['load', loadId],
    queryFn: () => loadsApi.getLoad(loadId),
    enabled: !!loadId,
  });

  // 2. Fetch carrier's bids to check if already placed a bid on this load
  const { data: myBids, isFetched: bidsFetched } = useQuery({
    queryKey: ['myBids'],
    queryFn: carrierApi.getMyBids,
    enabled: approved,
  });

  const existingBid: MyBid | undefined = myBids?.find(
    (b) => b.loadId === loadId && b.status === 'PENDING'
  );

  // 3. Book load mutation (Fixed price)
  const bookMutation = useMutation({
    mutationFn: () => loadsApi.bookLoad(loadId),
    onSuccess: (trip) => {
      setShowConfirmBookModal(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      router.replace({
        pathname: '/trips/[id]',
        params: { id: trip.id },
      });
    },
    onError: (err: unknown) => {
      setShowConfirmBookModal(false);
      handleApiError(err);
    },
  });

  // 4. Place new bid mutation
  const placeBidMutation = useMutation({
    mutationFn: (data: { price: number; comment?: string }) =>
      bidsApi.placeBid(loadId, data),
    onSuccess: () => {
      setShowBidModal(false);
      setBidPriceInput('');
      setBidCommentInput('');
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      refetchLoad();
      setSuccessMessage(uz.loadDetails.successBidPlaced);
    },
    onError: (err: unknown) => {
      handleApiError(err);
    },
  });

  // 5. Update existing bid mutation
  const updateBidMutation = useMutation({
    mutationFn: ({ bidId, data }: { bidId: string; data: { price: number; comment?: string } }) =>
      bidsApi.updateBid(bidId, data),
    onSuccess: () => {
      setShowBidModal(false);
      setBidPriceInput('');
      setBidCommentInput('');
      setIsEditingBid(false);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      refetchLoad();
      setSuccessMessage(uz.loadDetails.successBidUpdated);
    },
    onError: (err: unknown) => {
      handleApiError(err);
    },
  });

  // 6. Withdraw bid mutation
  const withdrawBidMutation = useMutation({
    mutationFn: (bidId: string) => bidsApi.withdrawBid(bidId),
    onSuccess: () => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      refetchLoad();
      setSuccessMessage(uz.loadDetails.successBidWithdrawn);
    },
    onError: (err: unknown) => {
      handleApiError(err);
    },
  });

  const handleApiError = (err: unknown) => {
    const errorObj = err as {
      code?: string;
      message?: string;
      details?: Record<string, unknown>;
    };

    if (errorObj?.code === 'LOAD_ALREADY_BOOKED') {
      setErrorMessage(uz.loadDetails.errors.ALREADY_BOOKED);
    } else if (errorObj?.code === 'INSUFFICIENT_BALANCE') {
      const required = errorObj.details?.required as number | undefined;
      if (required != null) {
        setErrorMessage(
          uz.loadDetails.errors.INSUFFICIENT_BALANCE.replace(
            '{{required}}',
            formatMoney(required)
          )
        );
      } else {
        setErrorMessage(errorObj.message || uz.loadDetails.errors.INSUFFICIENT_BALANCE);
      }
    } else if (errorObj?.code === 'VEHICLE_MISMATCH') {
      setErrorMessage(uz.loadDetails.errors.VEHICLE_MISMATCH);
    } else if (errorObj?.code === 'NOT_VERIFIED') {
      setErrorMessage(uz.loadDetails.errors.NOT_VERIFIED);
    } else {
      setErrorMessage(errorObj?.message || uz.loadDetails.errors.GENERIC);
    }
  };

  const handleOpenPlaceBid = () => {
    setIsEditingBid(false);
    setBidPriceInput('');
    setBidCommentInput('');
    setErrorMessage(null);
    setShowBidModal(true);
  };

  const handleOpenEditBid = () => {
    if (!existingBid) return;
    setIsEditingBid(true);
    setBidPriceInput(String(existingBid.price));
    setBidCommentInput(existingBid.comment || '');
    setErrorMessage(null);
    setShowBidModal(true);
  };

  useEffect(() => {
    if (!load || load.status !== 'OPEN' || !actionParam) return;
    if (approved && actionParam === 'bid' && !bidsFetched) return;
    if (consumedActionRef.current === `${loadId}:${actionParam}`) return;

    // iOS sahifa o'tish animatsiyasi paytida Modal ochilmaydi — animatsiya tugashini kutamiz
    const timer = setTimeout(() => {
      consumedActionRef.current = `${loadId}:${actionParam}`;
      if (!approved) {
        setShowRegistration(true);
        return;
      }

      if (actionParam === 'book' && load.priceMode === 'FIXED') {
        setShowConfirmBookModal(true);
      } else if (actionParam === 'bid' && load.priceMode === 'BIDDING') {
        if (existingBid) {
          setIsEditingBid(true);
          setBidPriceInput(String(existingBid.price));
          setBidCommentInput(existingBid.comment || '');
          setErrorMessage(null);
          setShowBidModal(true);
        } else {
          setIsEditingBid(false);
          setBidPriceInput('');
          setBidCommentInput('');
          setErrorMessage(null);
          setShowBidModal(true);
        }
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [load, loadId, actionParam, existingBid, bidsFetched, approved]);

  const handleSubmitBidForm = () => {
    const numericPrice = Number(bidPriceInput.replace(/\D/g, ''));
    if (!numericPrice || numericPrice <= 0) {
      setErrorMessage('Iltimos, taklif narxini to‘g‘ri kiriting');
      return;
    }

    if (isEditingBid && existingBid) {
      updateBidMutation.mutate({
        bidId: existingBid.id,
        data: {
          price: numericPrice,
          comment: bidCommentInput.trim() || undefined,
        },
      });
    } else {
      placeBidMutation.mutate({
        price: numericPrice,
        comment: bidCommentInput.trim() || undefined,
      });
    }
  };

  const handleWithdrawBid = () => {
    if (!existingBid) return;
    Alert.alert(
      uz.loadDetails.confirmWithdrawTitle,
      uz.loadDetails.confirmWithdrawBody,
      [
        { text: uz.common.cancel, style: 'cancel' },
        {
          text: uz.loadDetails.confirmWithdrawAction,
          style: 'destructive',
          onPress: () => withdrawBidMutation.mutate(existingBid.id),
        },
      ]
    );
  };

  if (isLoadingLoad) {
    return (
      <Screen edges={DETAIL_EDGES} contentContainerStyle={styles.pad}>
        <SkeletonCard />
        <View style={styles.gap} />
        <SkeletonCard />
      </Screen>
    );
  }

  if (loadError || !load) {
    return (
      <Screen edges={DETAIL_EDGES} contentContainerStyle={styles.pad}>
        <ErrorBanner
          message={loadError instanceof Error ? loadError.message : uz.loadDetails.errors.GENERIC}
          onRetry={refetchLoad}
        />
      </Screen>
    );
  }

  const isFixed = load.priceMode === 'FIXED';
  const isOpen = load.status === 'OPEN';
  const bodyTypeName = uz.bodyType[load.requiredBodyType] || load.requiredBodyType;
  const estimatedCommission = isFixed && load.price ? Math.round(load.price * 0.03) : null;
  const facts: { label: string; value: string }[] = [
    { label: uz.loadDetails.cargoType, value: load.cargoType },
    { label: 'Og‘irlik', value: `${load.weightTons} ${uz.common.tons}` },
    ...(load.volumeM3 ? [{ label: 'Hajm', value: `${load.volumeM3} ${uz.common.m3}` }] : []),
    { label: uz.loadDetails.requiredBody, value: bodyTypeName },
  ];

  const bottomAction = !isOpen ? (
    <View style={styles.closedBar}>
      <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
      <Text style={styles.closedText}>Bu yuk endi ochiq emas</Text>
    </View>
  ) : !approved ? (
    <PrimaryButton
      title={isFixed ? `${uz.loadDetails.bookButton} · ${formatMoney(load.price)}` : uz.loadDetails.placeBidButton}
      variant={isFixed ? 'primary' : 'accent'}
      onPress={() => setShowRegistration(true)}
      size="lg"
      accessibilityLabel={isFixed ? uz.loadDetails.bookButton : uz.loadDetails.placeBidButton}
    />
  ) : isFixed ? (
    <PrimaryButton
      title={`${uz.loadDetails.bookButton} · ${formatMoney(load.price)}`}
      onPress={() => setShowConfirmBookModal(true)}
      loading={bookMutation.isPending}
      size="lg"
      accessibilityLabel={uz.loadDetails.bookButton}
    />
  ) : !existingBid ? (
    <PrimaryButton
      title={uz.loadDetails.placeBidButton}
      variant="accent"
      onPress={handleOpenPlaceBid}
      loading={placeBidMutation.isPending}
      size="lg"
      accessibilityLabel={uz.loadDetails.placeBidButton}
    />
  ) : (
    <PrimaryButton
      title={uz.loadDetails.editBid}
      variant="outline"
      onPress={handleOpenEditBid}
      size="lg"
      accessibilityLabel={uz.loadDetails.editBid}
    />
  );

  return (
    <Screen edges={DETAIL_EDGES} scrollable contentContainerStyle={styles.pad} bottomAction={bottomAction}>
      <Stack.Screen options={{ title: '', headerLeft: () => <HeaderBackButton /> }} />

      <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      {errorMessage && !showBidModal ? (
        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      ) : null}

      {/* Narx va asosiy holat */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>{isFixed ? uz.loadDetails.fixedPrice : uz.loadDetails.biddingPrice}</Text>
          <Pill tone={pillToneForStatus(load.status)} label={statusBadgeLabel(load.status, 'load')} />
        </View>
        {isFixed && load.price != null ? (
          <Money amount={load.price} size="xl" weight="800" style={styles.heroPrice} />
        ) : (
          <Text style={styles.heroBidding}>Narxni siz taklif qilasiz</Text>
        )}
        {estimatedCommission != null ? (
          <Text style={styles.heroHint}>Platforma komissiyasi taxminan {formatMoney(estimatedCommission)} (3%)</Text>
        ) : null}
        {load.companyName ? (
          <View style={styles.companyRow}>
            <View style={styles.companyIcon}>
              <Ionicons name="business" size={14} color={colors.slate700} />
            </View>
            <Text style={styles.companyText} numberOfLines={1}>
              {load.companyName}
            </Text>
          </View>
        ) : !approved ? (
          <View style={styles.companyRow}>
            <View style={styles.companyIcon}>
              <Ionicons name="lock-closed" size={13} color={colors.slate500} />
            </View>
            <Text style={styles.companyHidden} numberOfLines={1}>
              {uz.registration.hiddenCompany}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Marshrut */}
      <Card>
        <RouteLine
          size="lg"
          lines={3}
          from={load.pickupAddress}
          to={load.dropoffAddress}
          fromHint={formatPickupWindow(load.pickupDate, load.pickupTimeFrom, load.pickupTimeTo)}
          toHint={`${Math.round(load.routeKm)} ${uz.common.km} yo‘l`}
        />
      </Card>

      {/* Yuk haqida */}
      <SectionTitle title={uz.loadDetails.cargoInfo} />
      <Card>
        <View style={styles.factsGrid}>
          {facts.map((f) => (
            <View key={f.label} style={styles.fact}>
              <Text style={styles.factLabel}>{f.label}</Text>
              <Text style={styles.factValue}>{f.value}</Text>
            </View>
          ))}
        </View>
      </Card>

      {load.insuranceRequired ? (
        <View style={styles.notice}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <View style={styles.noticeTexts}>
            <Text style={styles.noticeTitle}>{uz.loadDetails.insuranceSection}</Text>
            <Text style={styles.noticeBody}>
              {uz.loadDetails.insuranceRequired}
              {load.cargoValue != null
                ? ` ${uz.loadDetails.cargoValue.replace('{{amount}}', formatMoney(load.cargoValue))}`
                : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {load.notes ? (
        <>
          <SectionTitle title={uz.loadDetails.shipperNotes} />
          <Card>
            <Text style={styles.notes}>{load.notes}</Text>
          </Card>
        </>
      ) : null}

      {!isFixed && existingBid ? (
        <>
          <SectionTitle
            title={uz.loadDetails.myBidSection}
            right={<Pill tone={pillToneForStatus(existingBid.status)} label={statusBadgeLabel(existingBid.status, 'bid')} />}
          />
          <Card>
            <Money amount={existingBid.price} size="lg" weight="800" />
            {existingBid.comment ? <Text style={styles.bidComment}>“{existingBid.comment}”</Text> : null}
            <View style={styles.bidActions}>
              <Pressable onPress={handleOpenEditBid} style={styles.linkBtn} accessibilityRole="button">
                <Ionicons name="pencil" size={15} color={colors.primary} />
                <Text style={styles.linkText}>{uz.loadDetails.editBid}</Text>
              </Pressable>
              <Pressable onPress={handleWithdrawBid} style={styles.linkBtn} accessibilityRole="button">
                <Ionicons name="close-circle" size={16} color={colors.danger} />
                <Text style={[styles.linkText, styles.linkDanger]}>{uz.loadDetails.withdrawBid}</Text>
              </Pressable>
            </View>
          </Card>
        </>
      ) : null}

      <RegistrationSheet visible={showRegistration} onClose={() => setShowRegistration(false)} />

      {/* Band qilishni tasdiqlash */}
      <BottomSheet
        visible={showConfirmBookModal}
        onClose={() => setShowConfirmBookModal(false)}
        locked={bookMutation.isPending}
        title={uz.loadDetails.confirmBookingTitle}
        subtitle="Band qilsangiz, balansingizdan komissiya yechiladi va reys darhol boshlanadi."
      >
        <View style={styles.summaryBox}>
          <SummaryRow label="Yuk narxi" value={formatMoney(load.price)} />
          {estimatedCommission != null ? (
            <SummaryRow label="Komissiya (3%)" value={`−${formatMoney(estimatedCommission)}`} />
          ) : null}
        </View>
        <PrimaryButton
          title={uz.loadDetails.confirmBookingAction}
          onPress={() => bookMutation.mutate()}
          loading={bookMutation.isPending}
          size="lg"
        />
        <PrimaryButton
          title={uz.common.cancel}
          variant="secondary"
          onPress={() => setShowConfirmBookModal(false)}
          disabled={bookMutation.isPending}
        />
      </BottomSheet>

      {/* Taklif berish / tahrirlash */}
      <BottomSheet
        visible={showBidModal}
        onClose={() => setShowBidModal(false)}
        locked={placeBidMutation.isPending || updateBidMutation.isPending}
        title={isEditingBid ? uz.loadDetails.editBidModalTitle : uz.loadDetails.bidModalTitle}
        subtitle="Zavod barcha takliflarni ko‘radi va bittasini tanlaydi."
      >
        {errorMessage ? <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} /> : null}
        <TextField
          label={uz.loadDetails.bidPriceLabel}
          placeholder={uz.loadDetails.bidPricePlaceholder}
          value={bidPriceInput}
          onChangeText={setBidPriceInput}
          keyboardType="number-pad"
          autoFocus
        />
        <TextField
          label={uz.loadDetails.bidCommentLabel}
          placeholder={uz.loadDetails.bidCommentPlaceholder}
          value={bidCommentInput}
          onChangeText={setBidCommentInput}
          multiline
          numberOfLines={3}
        />
        <PrimaryButton
          title={isEditingBid ? uz.loadDetails.saveBid : uz.loadDetails.sendBid}
          variant="accent"
          onPress={handleSubmitBidForm}
          loading={placeBidMutation.isPending || updateBidMutation.isPending}
          size="lg"
        />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  gap: { height: 12 },
  hero: { paddingTop: 4, paddingBottom: 18 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  heroPrice: { marginTop: 6, fontSize: 34, letterSpacing: -1 },
  heroBidding: { marginTop: 6, fontSize: 26, fontWeight: '800', color: colors.accentDark, letterSpacing: -0.6 },
  heroHint: { marginTop: 4, fontSize: 13.5, color: colors.textMuted },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  companyIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.slate800 },
  companyHidden: { flex: 1, fontSize: 14, color: colors.textMuted },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  fact: { width: '50%', paddingRight: 8 },
  factLabel: { fontSize: 13, color: colors.textMuted },
  factValue: { marginTop: 3, fontSize: 16, fontWeight: '700', color: colors.slate900 },
  notice: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.primary50,
  },
  noticeTexts: { flex: 1 },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: colors.slate900 },
  noticeBody: { marginTop: 3, fontSize: 14, lineHeight: 20, color: colors.slate700 },
  notes: { fontSize: 15, lineHeight: 22, color: colors.slate800 },
  bidComment: { marginTop: 8, fontSize: 14.5, fontStyle: 'italic', color: colors.slate700 },
  bidActions: { flexDirection: 'row', gap: 20, marginTop: 14 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  linkText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  linkDanger: { color: colors.danger },
  closedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.slate100,
  },
  closedText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  summaryBox: { padding: 14, borderRadius: 14, backgroundColor: colors.slate50, gap: 4 },
});
