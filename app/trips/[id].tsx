import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../../src/api/client';
import {
  AuthImage,
  ErrorBanner,
  Money,
  PhotoPicker,
  PrimaryButton,
  SAFE_EDGES_WITH_HEADER,
  Screen,
  StatusBadge,
  SuccessBanner,
} from '../../src/components';
import { uz } from '../../src/i18n/uz';
import {
  checkLocationPermissions,
  isTrackingActive,
  requestLocationPermissions,
  startTracking,
  stopTracking,
} from '../../src/tracking/backgroundTask';
import {
  cancellableByCarrier,
  getNextStatus,
  getStatusActionLabel,
  isActiveTrip,
  requiresPhoto,
} from '../../src/trips/nextStatus';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatDateTime, formatMoney } from '../../src/utils/format';
import { colors } from '../../src/theme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const tripId = Array.isArray(id) ? id[0] : id;

  const [uploadedPhotoKey, setUploadedPhotoKey] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [foregroundGranted, setForegroundGranted] = useState(true);
  const [backgroundGranted, setBackgroundGranted] = useState(true);
  const [canAskForegroundAgain, setCanAskForegroundAgain] = useState(true);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);

  const {
    data: trip,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getTrip(tripId),
    enabled: !!tripId,
    refetchInterval: 10000, // har 10 soniyada yangilash
  });

  // GPS va ruxsatlarni tekshirish
  useEffect(() => {
    let isMounted = true;
    async function checkPermsAndGps() {
      const perms = await checkLocationPermissions();
      const active = await isTrackingActive();
      if (isMounted) {
        setForegroundGranted(perms.foreground);
        setBackgroundGranted(perms.background);
        setCanAskForegroundAgain(perms.canAskForegroundAgain);
        setIsGpsActive(active);
      }
    }

    if (trip && isActiveTrip(trip.status)) {
      checkPermsAndGps();
    }

    return () => {
      isMounted = false;
    };
  }, [trip]);

  // Agar reys ASSIGNED yoki undan keyingi faol holatda bo'lsa va tracking hali boshlanmagan bo'lsa, boshlashga urinish
  useEffect(() => {
    if (trip && isActiveTrip(trip.status) && !isGpsActive && foregroundGranted) {
      startTracking(trip.id).then((started) => {
        if (started) setIsGpsActive(true);
      });
    }
  }, [trip, isGpsActive, foregroundGranted]);

  const applyPermissionResult = (res: {
    foreground: boolean;
    background: boolean;
    canAskForegroundAgain: boolean;
  }) => {
    setForegroundGranted(res.foreground);
    setBackgroundGranted(res.background);
    setCanAskForegroundAgain(res.canAskForegroundAgain);
  };

  const handleGrantPermissions = async () => {
    const res = await requestLocationPermissions();
    applyPermissionResult(res);
    if (res.foreground && trip) {
      const started = await startTracking(trip.id);
      setIsGpsActive(started);
      return;
    }
    if (!res.canAskForegroundAgain) {
      await Linking.openSettings();
    }
  };

  const handleOpenAppSettings = () => {
    Linking.openSettings();
  };

  const handleCallShipper = () => {
    if (!trip?.shipperPhone) {
      setErrorMessage(uz.tripView.noShipperPhone);
      return;
    }
    Linking.openURL(`tel:${trip.shipperPhone}`);
  };

  const handleOpenNavigator = async () => {
    if (!trip?.load) return;

    // Ortishga ketayotganda ortish manziliga, ortilgach esa topshirish manziliga yo'naltirish
    const isHeadingToPickup =
      trip.status === 'ASSIGNED' || trip.status === 'EN_ROUTE_TO_PICKUP';

    const targetLat = isHeadingToPickup ? trip.load.pickupLat : trip.load.dropoffLat;
    const targetLng = isHeadingToPickup ? trip.load.pickupLng : trip.load.dropoffLng;

    const naviUrl = `yandexnavi://build_route_on_map?lat_to=${targetLat}&lon_to=${targetLng}`;
    const webMapsUrl = `https://yandex.uz/maps/?rtext=~${targetLat},${targetLng}&rtt=auto`;

    try {
      const canOpen = await Linking.canOpenURL(naviUrl);
      if (canOpen) {
        await Linking.openURL(naviUrl);
      } else {
        await Linking.openURL(webMapsUrl);
      }
    } catch {
      await Linking.openURL(webMapsUrl);
    }
  };

  const handleNextStatus = async () => {
    if (!trip) return;

    const nextStatus = getNextStatus(trip.status);
    if (!nextStatus) return;

    const photoRequired = requiresPhoto(nextStatus);
    if (photoRequired && !uploadedPhotoKey) {
      setErrorMessage(
        nextStatus === 'LOADED'
          ? uz.tripView.photoRequiredLoaded
          : uz.tripView.photoRequiredDelivered
      );
      return;
    }

    setIsUpdatingStatus(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (posErr) {
        console.warn('Could not determine current position for status update', posErr);
      }

      await tripsApi.updateStatus(trip.id, {
        status: nextStatus,
        photoKey: uploadedPhotoKey || undefined,
        lat,
        lng,
      });

      // Agar reys boshlansa, fonda tracking boshlash
      if (nextStatus === 'EN_ROUTE_TO_PICKUP') {
        await startTracking(trip.id);
        setIsGpsActive(true);
      }

      // Agar reys topshirilsa, fonda tracking to'xtatish
      if (nextStatus === 'DELIVERED') {
        await stopTracking();
        setIsGpsActive(false);
      }

      setUploadedPhotoKey(null);
      await queryClient.invalidateQueries({ queryKey: ['trip', trip.id] });
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      refetch();
    } catch (err: unknown) {
      console.error('Failed to update trip status', err);
      const apiErr = err as { message?: string };
      setErrorMessage(apiErr.message || uz.tripView.statusUpdateError);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!trip) return;
    if (!cancelReason.trim()) {
      setCancelReasonError(uz.tripView.cancelReasonLabel);
      return;
    }
    setCancelReasonError(null);

    setIsCancelling(true);
    try {
      await tripsApi.cancelTrip(trip.id, { reason: cancelReason.trim() });
      await stopTracking();
      setIsGpsActive(false);
      setCancelModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: ['trip', trip.id] });
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      refetch();
      setSuccessMessage(uz.tripView.cancelSuccess);
    } catch (err: unknown) {
      console.error('Failed to cancel trip', err);
      const apiErr = err as { message?: string };
      setErrorMessage(apiErr.message || uz.tripView.cancelTrip);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <Screen edges={SAFE_EDGES_WITH_HEADER} style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.loadingText}>{uz.common.loading}</Text>
      </Screen>
    );
  }

  if (error || !trip) {
    return (
      <Screen edges={SAFE_EDGES_WITH_HEADER} style={styles.screen}>
        <ErrorBanner
          message={error instanceof Error ? error.message : uz.common.networkError}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  const nextStatus = getNextStatus(trip.status);
  const nextActionLabel = getStatusActionLabel(nextStatus);
  const isPhotoRequired = nextStatus ? requiresPhoto(nextStatus) : false;
  const canCancel = cancellableByCarrier(trip.status);

  return (
    <Screen edges={SAFE_EDGES_WITH_HEADER} style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ paddingRight: 8 }}>
              <StatusBadge kind="trip" status={trip.status} />
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SuccessBanner
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
        {errorMessage ? (
          <ErrorBanner
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        ) : null}

        {isActiveTrip(trip.status) ? (
          <View style={styles.workPanel} accessibilityLabel={uz.tripView.workPanel}>
            <View
              style={[
                styles.gpsBadge,
                isGpsActive ? styles.gpsBadgeActive : styles.gpsBadgeInactive,
              ]}
            >
              <Ionicons
                name={isGpsActive ? 'navigate' : 'navigate-outline'}
                size={14}
                color={isGpsActive ? colors.successDark : colors.slate500}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.gpsBadgeText,
                  isGpsActive ? styles.gpsTextActive : styles.gpsTextInactive,
                ]}
              >
                {isGpsActive ? uz.tripsScreen.trackingActive : uz.tripsScreen.trackingInactive}
              </Text>
            </View>

            <View style={styles.workActions}>
              <Pressable
                onPress={handleOpenNavigator}
                style={({ pressed }) => [styles.workNavBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={uz.tripView.openInYandexNavi}
              >
                <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.workBtnText}>{uz.tripView.openInYandexNavi}</Text>
              </Pressable>
              <Pressable
                onPress={handleCallShipper}
                disabled={!trip.shipperPhone}
                style={({ pressed }) => [
                  styles.workCallBtn,
                  !trip.shipperPhone && styles.disabledBtn,
                  pressed && trip.shipperPhone && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={uz.tripView.callLogistics}
                accessibilityState={{ disabled: !trip.shipperPhone }}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.workBtnText}>{uz.tripView.callShort}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* GPS ruxsati banneri — foreground yetarli, Always ixtiyoriy */}
        {isActiveTrip(trip.status) && !foregroundGranted ? (
          <View style={styles.permissionBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="warning" size={18} color={colors.dangerDark} style={{ marginRight: 6 }} />
              <Text style={styles.permissionTitle}>
                {uz.tripView.locationPermissionBannerTitle}
              </Text>
            </View>
            <Text style={styles.permissionDesc}>
              {uz.tripView.locationPermissionBannerDesc}
            </Text>
            <Pressable
              onPress={handleGrantPermissions}
              style={styles.permissionButton}
              accessibilityRole="button"
              accessibilityLabel={
                canAskForegroundAgain
                  ? uz.tripView.grantPermission
                  : uz.tripView.openAppSettings
              }
            >
              <Text style={styles.permissionButtonText}>
                {canAskForegroundAgain
                  ? uz.tripView.grantPermission
                  : uz.tripView.openAppSettings}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isActiveTrip(trip.status) && foregroundGranted && !backgroundGranted ? (
          <View style={styles.permissionBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="navigate" size={18} color={colors.dangerDark} style={{ marginRight: 6 }} />
              <Text style={styles.permissionTitle}>
                {uz.tripView.backgroundPermissionTitle}
              </Text>
            </View>
            <Text style={styles.permissionDesc}>
              {uz.tripView.backgroundPermissionDesc}
            </Text>
            <Pressable
              onPress={handleOpenAppSettings}
              style={styles.permissionButton}
              accessibilityRole="button"
              accessibilityLabel={uz.tripView.openAppSettings}
            >
              <Text style={styles.permissionButtonText}>
                {uz.tripView.openAppSettings}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Reys ma'lumotlari va narxi */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="business-outline" size={17} color={colors.slate700} style={{ marginRight: 6 }} />
            <Text style={styles.companyName}>
              {trip.companyName || uz.tripView.companySection}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.label}>{uz.tripView.agreedPrice}</Text>
              <Money amount={trip.agreedPrice} size="xl" color={colors.primary} weight="800" />
            </View>

            {trip.commissionAmount != null ? (
              <View style={styles.commissionBox}>
                <Text style={styles.commissionLabel}>{uz.tripView.commission}</Text>
                <Text style={styles.commissionValue}>
                  {formatMoney(trip.commissionAmount)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Logist bilan aloqa kartasi */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{uz.tripView.shipperContact}</Text>
          <View style={styles.contactRow}>
            <View style={styles.contactInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="person-outline" size={14} color={colors.slate600} style={{ marginRight: 6 }} />
                <Text style={styles.contactName}>
                  {trip.shipperContactName || 'Zavod logisti'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="call-outline" size={14} color={colors.slate600} style={{ marginRight: 6 }} />
                <Text style={styles.contactPhone} selectable>
                  {trip.shipperPhone || 'Raqam kiritilmagan'}
                </Text>
              </View>
            </View>

            {trip.shipperPhone && !isActiveTrip(trip.status) ? (
              <Pressable
                onPress={handleCallShipper}
                style={styles.callButton}
                accessibilityRole="button"
                accessibilityLabel={uz.tripView.callLogistics}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.callButtonText}>{uz.tripView.callShort}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Marshrut va Navigatsiya */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{uz.tripView.routeSection}</Text>
            {!isActiveTrip(trip.status) ? (
              <Pressable
                onPress={handleOpenNavigator}
                style={styles.naviButton}
                accessibilityRole="button"
                accessibilityLabel={uz.tripView.openInMaps}
              >
                <Text style={styles.naviButtonText}>
                  {uz.tripView.openInMaps}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.dotPickup]} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.label}>{uz.tripView.pickupAddress}</Text>
                <Text style={styles.valueText} selectable>
                  {trip.load?.pickupAddress}
                </Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.dotDropoff]} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.label}>{uz.tripView.dropoffAddress}</Text>
                <Text style={styles.valueText} selectable>
                  {trip.load?.dropoffAddress}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Yuk parametrlari */}
        {trip.load ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{uz.tripView.cargoSection}</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>{uz.tripView.cargoType}</Text>
                <Text style={styles.valueText}>{trip.load.cargoType}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>{uz.tripView.weight}</Text>
                <Text style={styles.valueText}>
                  {trip.load.weightTons} {uz.common.tons}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>{uz.tripView.pickupDate}</Text>
                <Text style={styles.valueText}>
                  {formatDate(trip.load.pickupDate)}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>{uz.tripView.routeLength}</Text>
                <Text style={styles.valueText}>
                  {Math.round(trip.load.routeKm)} {uz.common.km}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Fotosurat yuklash (agar keyingi bosqichda rasm talab qilinsa) */}
        {isPhotoRequired ? (
          <View style={styles.photoUploadCard}>
            <Text style={styles.photoSectionTitle}>{uz.tripView.photoRequiredTitle}</Text>
            <Text style={styles.photoSectionDesc}>
              {nextStatus === 'LOADED'
                ? uz.tripView.photoRequiredLoaded
                : uz.tripView.photoRequiredDelivered}
            </Text>
            <PhotoPicker
              label={uz.tripView.photoConfirmLabel}
              required
              value={uploadedPhotoKey}
              onUploaded={(key) => setUploadedPhotoKey(key)}
            />
          </View>
        ) : null}

        {/* Reys hodisalari tarixi */}
        {trip.events && trip.events.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{uz.tripView.eventsHistory}</Text>
            <View style={styles.timeline}>
              {trip.events.map((ev, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineMarker} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineType}>{ev.type}</Text>
                      <Text style={styles.timelineTime}>
                        {formatDateTime(ev.occurredAt)}
                      </Text>
                    </View>
                    {ev.comment ? (
                      <Text style={styles.timelineComment}>{ev.comment}</Text>
                    ) : null}
                    {ev.photoKey ? (
                      <View style={styles.timelineImageBox}>
                        <AuthImage
                          fileKey={ev.photoKey}
                          style={styles.timelineImage}
                          accessibilityLabel={uz.tripView.eventsHistory}
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Bekor qilish tugmasi (LOADED gacha) */}
        {canCancel ? (
          <View style={styles.cancelWrap}>
            <Pressable
              onPress={() => setCancelModalVisible(true)}
              style={styles.cancelTripButton}
              accessibilityRole="button"
              accessibilityLabel={uz.tripView.cancelTrip}
            >
              <Ionicons name="warning-outline" size={16} color="#b91c1c" style={{ marginRight: 6 }} />
              <Text style={styles.cancelTripButtonText}>
                {uz.tripView.cancelTrip}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Yakunlangan yoki bekor qilingan xabarnoma */}
        {trip.status === 'COMPLETED' ? (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#065f46" style={{ marginBottom: 6 }} />
            <Text style={styles.completedText}>
              {uz.tripView.completedNotice}
            </Text>
          </View>
        ) : trip.status === 'CANCELLED' ? (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={20} color="#991b1b" style={{ marginBottom: 6 }} />
            <Text style={styles.cancelledText}>
              {uz.tripView.cancelledNotice}
            </Text>
            {trip.cancelReason ? (
              <Text style={styles.cancelReasonDisplay}>
                Sabab: {trip.cancelReason}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Ekranning eng pastida bitta katta amal tugmasi */}
      {nextStatus ? (
        <View style={styles.bottomBar}>
          <PrimaryButton
            title={nextActionLabel}
            onPress={handleNextStatus}
            loading={isUpdatingStatus}
            accessibilityLabel={nextActionLabel}
          />
        </View>
      ) : null}

      {/* Bekor qilish modali */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{uz.tripView.cancelModalTitle}</Text>
            <Text style={styles.modalDesc}>{uz.tripView.cancelModalDesc}</Text>

            <Text style={styles.modalInputLabel}>
              {uz.tripView.cancelReasonLabel} *
            </Text>
            <TextInput
              value={cancelReason}
              onChangeText={(text) => {
                setCancelReason(text);
                if (cancelReasonError) setCancelReasonError(null);
              }}
              placeholder={uz.tripView.cancelReasonPlaceholder}
              placeholderTextColor="#9ca3af"
              style={styles.modalTextInput}
              multiline
              numberOfLines={3}
            />
            {cancelReasonError ? (
              <Text style={styles.cancelReasonError}>{cancelReasonError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCancelModalVisible(false)}
                style={styles.modalCancelBtn}
                accessibilityRole="button"
                accessibilityLabel={uz.common.cancel}
              >
                <Text style={styles.modalCancelBtnText}>{uz.common.cancel}</Text>
              </Pressable>

              <Pressable
                onPress={handleCancelTrip}
                disabled={isCancelling}
                style={[
                  styles.modalConfirmBtn,
                  isCancelling && styles.disabledBtn,
                ]}
                accessibilityRole="button"
                accessibilityLabel={uz.tripView.confirmCancelAction}
              >
                {isCancelling ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>
                    {uz.tripView.confirmCancelAction}
                  </Text>
                )}
              </Pressable>
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
  centerContainer: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  workPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 12,
  },
  workActions: {
    flexDirection: 'row',
    gap: 10,
  },
  workNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a56db',
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  workCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  workBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gpsBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  gpsBadgeInactive: {
    backgroundColor: '#fee2e2',
  },
  gpsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gpsTextActive: {
    color: '#166534',
  },
  gpsTextInactive: {
    color: '#991b1b',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 110,
  },
  permissionBanner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  permissionDesc: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  commissionBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  commissionLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  commissionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginRight: 10,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  naviButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  naviButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a56db',
  },
  routeContainer: {
    marginBottom: 4,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
  },
  photoUploadCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4,
  },
  photoSectionDesc: {
    fontSize: 13,
    color: '#1e3a8a',
    marginBottom: 12,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a56db',
    marginTop: 5,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  timelineTime: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  timelineComment: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 4,
  },
  timelineImageBox: {
    marginTop: 8,
    width: 120,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timelineImage: {
    width: '100%',
    height: '100%',
  },
  cancelWrap: {
    alignItems: 'center',
    marginVertical: 6,
  },
  cancelTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  cancelTripButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b91c1c',
  },
  completedBanner: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065f46',
  },
  cancelledBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  cancelledText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  cancelReasonDisplay: {
    fontSize: 13,
    color: '#7f1d1d',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 8,
  },
  cancelReasonError: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b91c1c',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  modalConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    minWidth: 130,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
