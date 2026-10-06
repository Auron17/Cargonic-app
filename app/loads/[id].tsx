import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bidsApi, carrierApi, loadsApi } from '../../src/api/client';
import { MyBid } from '../../src/api/types';
import {
  ErrorBanner,
  Money,
  PrimaryButton,
  Screen,
  StatusBadge,
  TextField,
} from '../../src/components';
import { formatDate, formatMoney } from '../../src/utils/format';
import { uz } from '../../src/i18n/uz';

export default function LoadDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadId = Array.isArray(id) ? id[0] : id;

  // Local state for modals & forms
  const [showConfirmBookModal, setShowConfirmBookModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPriceInput, setBidPriceInput] = useState('');
  const [bidCommentInput, setBidCommentInput] = useState('');
  const [isEditingBid, setIsEditingBid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  const { data: myBids } = useQuery({
    queryKey: ['myBids'],
    queryFn: carrierApi.getMyBids,
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
      Alert.alert('Muvaffaqiyatli', uz.loadDetails.successBidPlaced);
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
      Alert.alert('Muvaffaqiyatli', uz.loadDetails.successBidUpdated);
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
      Alert.alert('Muvaffaqiyatli', uz.loadDetails.successBidWithdrawn);
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
      <Screen style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.loadingText}>{uz.common.loading}</Text>
      </Screen>
    );
  }

  if (loadError || !load) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={uz.common.back}
          >
            <Text style={styles.backButtonText}>← {uz.common.back}</Text>
          </Pressable>
        </View>
        <ErrorBanner
          message={loadError instanceof Error ? loadError.message : uz.loadDetails.errors.GENERIC}
          onRetry={refetchLoad}
        />
      </Screen>
    );
  }

  const isFixed = load.priceMode === 'FIXED';
  const bodyTypeName = uz.bodyType[load.requiredBodyType] || load.requiredBodyType;
  const estimatedCommission = isFixed && load.price ? Math.round(load.price * 0.03) : null;

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

        <StatusBadge status={load.status} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {errorMessage ? (
          <ErrorBanner
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        ) : null}

        {/* Company & Price Banner */}
        <View style={styles.headerCard}>
          {load.companyName ? (
            <Text style={styles.companyTitle}>🏢 {load.companyName}</Text>
          ) : null}

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceModeLabel}>
                {isFixed ? uz.loadDetails.fixedPrice : uz.loadDetails.biddingPrice}
              </Text>
              {isFixed && load.price != null ? (
                <Money amount={load.price} size="xl" color="#1a56db" weight="bold" />
              ) : (
                <Text style={styles.biddingHeadline}>
                  {uz.loadsTab.biddingAwaiting}
                </Text>
              )}
            </View>

            {estimatedCommission != null ? (
              <View style={styles.commissionBadge}>
                <Text style={styles.commissionLabel}>Komissiya (3%)</Text>
                <Text style={styles.commissionAmount}>
                  ~{formatMoney(estimatedCommission)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{uz.loadDetails.route}</Text>

          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.dotPickup]} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.addressRoleLabel}>{uz.loadDetails.pickupAddress}</Text>
                <Text style={styles.addressValueText}>{load.pickupAddress}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.dotDropoff]} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.addressRoleLabel}>{uz.loadDetails.dropoffAddress}</Text>
                <Text style={styles.addressValueText}>{load.dropoffAddress}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Marshrut masofasi</Text>
              <Text style={styles.gridValue}>{Math.round(load.routeKm)} {uz.common.km}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{uz.loadDetails.pickupSchedule}</Text>
              <Text style={styles.gridValue}>
                {formatDate(load.pickupDate)}
                {load.pickupTimeFrom ? ` (${load.pickupTimeFrom})` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Cargo specs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{uz.loadDetails.cargoInfo}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{uz.loadDetails.cargoType}</Text>
              <Text style={styles.gridValue}>{load.cargoType}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{uz.loadDetails.requiredBody}</Text>
              <Text style={styles.gridValue}>{bodyTypeName}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Og‘irlik</Text>
              <Text style={styles.gridValue}>{load.weightTons} {uz.common.tons}</Text>
            </View>

            {load.volumeM3 ? (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Hajm</Text>
                <Text style={styles.gridValue}>{load.volumeM3} {uz.common.m3}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Insurance */}
        {load.insuranceRequired ? (
          <View style={[styles.sectionCard, styles.insuranceSectionCard]}>
            <Text style={styles.insuranceTitle}>🛡 {uz.loadDetails.insuranceSection}</Text>
            <Text style={styles.insuranceDesc}>{uz.loadDetails.insuranceRequired}</Text>
            {load.cargoValue != null ? (
              <Text style={styles.cargoValueText}>
                {uz.loadDetails.cargoValue.replace('{{amount}}', formatMoney(load.cargoValue))}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Logist Notes */}
        {load.notes ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💬 {uz.loadDetails.shipperNotes}</Text>
            <Text style={styles.notesText}>{load.notes}</Text>
          </View>
        ) : null}

        {/* Existing Bid Section (if bidding mode & carrier has bid) */}
        {!isFixed && existingBid ? (
          <View style={[styles.sectionCard, styles.existingBidCard]}>
            <View style={styles.existingBidHeader}>
              <Text style={styles.existingBidTitle}>{uz.loadDetails.myBidSection}</Text>
              <StatusBadge status={existingBid.status} />
            </View>

            <View style={styles.existingBidPriceRow}>
              <Money amount={existingBid.price} size="lg" color="#166534" weight="bold" />
            </View>

            {existingBid.comment ? (
              <Text style={styles.existingBidComment}>
                “{existingBid.comment}”
              </Text>
            ) : null}

            <View style={styles.existingBidActions}>
              <Pressable
                onPress={handleOpenEditBid}
                style={styles.editBidButton}
                accessibilityRole="button"
                accessibilityLabel={uz.loadDetails.editBid}
              >
                <Text style={styles.editBidButtonText}>✏️ {uz.loadDetails.editBid}</Text>
              </Pressable>

              <Pressable
                onPress={handleWithdrawBid}
                style={styles.withdrawBidButton}
                accessibilityRole="button"
                accessibilityLabel={uz.loadDetails.withdrawBid}
              >
                <Text style={styles.withdrawBidButtonText}>✕ {uz.loadDetails.withdrawBid}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Persistent Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {load.status !== 'OPEN' ? (
          <View style={styles.notOpenBanner}>
            <Text style={styles.notOpenText}>Ushbu yuk hozir ochiq emas</Text>
          </View>
        ) : isFixed ? (
          <PrimaryButton
            title={`🚚 ${uz.loadDetails.bookButton}`}
            onPress={() => setShowConfirmBookModal(true)}
            loading={bookMutation.isPending}
            accessibilityLabel={uz.loadDetails.bookButton}
          />
        ) : !existingBid ? (
          <PrimaryButton
            title={`💬 ${uz.loadDetails.placeBidButton}`}
            onPress={handleOpenPlaceBid}
            loading={placeBidMutation.isPending}
            accessibilityLabel={uz.loadDetails.placeBidButton}
          />
        ) : (
          <PrimaryButton
            title={`✏️ ${uz.loadDetails.editBid}`}
            variant="outline"
            onPress={handleOpenEditBid}
            accessibilityLabel={uz.loadDetails.editBid}
          />
        )}
      </View>

      {/* Modal: Confirm Booking (Fixed price) */}
      <Modal
        visible={showConfirmBookModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmBookModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{uz.loadDetails.confirmBookingTitle}</Text>

            <View style={styles.modalSummaryBox}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Yuk narxi:</Text>
                <Text style={styles.modalSummaryValue}>{formatMoney(load.price)}</Text>
              </View>

              {estimatedCommission != null ? (
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Tizim komissiyasi (3%):</Text>
                  <Text style={[styles.modalSummaryValue, styles.commissionHighlight]}>
                    {formatMoney(estimatedCommission)}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.modalExplanation}>
              Yukni band qilsangiz, balansingizdan komissiya yechiladi va reys darhol boshlanadi.
            </Text>

            <View style={styles.modalButtons}>
              <PrimaryButton
                title={uz.loadDetails.confirmBookingAction}
                onPress={() => bookMutation.mutate()}
                loading={bookMutation.isPending}
                style={styles.modalPrimaryBtn}
              />
              <PrimaryButton
                title={uz.common.cancel}
                variant="secondary"
                onPress={() => setShowConfirmBookModal(false)}
                disabled={bookMutation.isPending}
                style={styles.modalSecondaryBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Place / Edit Bid */}
      <Modal
        visible={showBidModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBidModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isEditingBid
                ? uz.loadDetails.editBidModalTitle
                : uz.loadDetails.bidModalTitle}
            </Text>

            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            <TextField
              label={uz.loadDetails.bidPriceLabel}
              placeholder={uz.loadDetails.bidPricePlaceholder}
              value={bidPriceInput}
              onChangeText={setBidPriceInput}
              keyboardType="number-pad"
            />

            <TextField
              label={uz.loadDetails.bidCommentLabel}
              placeholder={uz.loadDetails.bidCommentPlaceholder}
              value={bidCommentInput}
              onChangeText={setBidCommentInput}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <PrimaryButton
                title={
                  isEditingBid
                    ? uz.loadDetails.saveBid
                    : uz.loadDetails.sendBid
                }
                onPress={handleSubmitBidForm}
                loading={placeBidMutation.isPending || updateBidMutation.isPending}
                style={styles.modalPrimaryBtn}
              />
              <PrimaryButton
                title={uz.common.cancel}
                variant="secondary"
                onPress={() => setShowBidModal(false)}
                disabled={placeBidMutation.isPending || updateBidMutation.isPending}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
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
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 14,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceModeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  biddingHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#d97706',
  },
  commissionBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  commissionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
  },
  commissionAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a56db',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  routeContainer: {
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 4,
  },
  dotPickup: {
    backgroundColor: '#16a34a',
  },
  dotDropoff: {
    backgroundColor: '#dc2626',
  },
  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: '#d1d5db',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeTextWrap: {
    flex: 1,
  },
  addressRoleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  addressValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  gridItem: {
    width: '47%',
  },
  gridLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  insuranceSectionCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 6,
  },
  insuranceDesc: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
    fontWeight: '500',
  },
  cargoValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
    marginTop: 6,
  },
  notesText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  existingBidCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  existingBidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  existingBidTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  existingBidPriceRow: {
    marginBottom: 6,
  },
  existingBidComment: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#15803d',
    marginBottom: 12,
  },
  existingBidActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editBidButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editBidButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  withdrawBidButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  withdrawBidButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  notOpenBanner: {
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  notOpenText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6b7280',
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
  modalSummaryBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
    gap: 8,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  modalSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  commissionHighlight: {
    color: '#1a56db',
    fontWeight: '800',
  },
  modalExplanation: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    gap: 10,
  },
  modalPrimaryBtn: {
    minHeight: 48,
  },
  modalSecondaryBtn: {
    minHeight: 48,
  },
});
