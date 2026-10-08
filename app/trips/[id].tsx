import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../../src/api/client';
import {
  AuthImage,
  BottomSheet,
  Card,
  DETAIL_EDGES,
  ErrorBanner,
  HeaderBackButton,
  Money,
  PhotoPicker,
  Pill,
  PrimaryButton,
  RouteLine,
  RouteMap,
  Screen,
  SectionTitle,
  SkeletonCard,
  SuccessBanner,
  TextField,
  pillToneForStatus,
  statusBadgeLabel,
} from '../../src/components';
import { TripStatus } from '../../src/api/types';
import { getCopy, useCopy } from '../../src/i18n';
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
import { formatDateTime, formatMoney, formatPickupWindow } from '../../src/utils/format';
import { openExternalNavigator } from '../../src/geo/openNavigator';
import { fetchDrivingRoute, tripNavTarget } from '../../src/geo/route';
import { ReturnLoadsCard } from '../../src/trips/ReturnLoadsCard';
import { colors, ink } from '../../src/theme';

export default function TripDetailScreen() {
  const uz = useCopy();
  const router = useRouter();
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

  const pickup = trip?.load
    ? { lat: trip.load.pickupLat, lng: trip.load.pickupLng }
    : null;
  const dropoff = trip?.load
    ? { lat: trip.load.dropoffLat, lng: trip.load.dropoffLng }
    : null;
  const { data: tripRoute = [] } = useQuery({
    queryKey: ['driving-route', pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng],
    queryFn: () => fetchDrivingRoute(pickup!, dropoff!),
    enabled: !!pickup && !!dropoff,
    staleTime: 10 * 60 * 1000,
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

  const handleOpenInAppMap = () => {
    if (!tripId) return;
    router.push({ pathname: '/trips/map', params: { id: tripId } });
  };

  const handleOpenNavigator = () => {
    if (!trip?.load) return;
    void openExternalNavigator(tripNavTarget(trip.status, trip.load));
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
      <Screen edges={DETAIL_EDGES} contentContainerStyle={styles.pad}>
        <SkeletonCard />
        <View style={styles.gap} />
        <SkeletonCard />
      </Screen>
    );
  }

  if (error || !trip) {
    return (
      <Screen edges={DETAIL_EDGES} contentContainerStyle={styles.pad}>
        <ErrorBanner message={error instanceof Error ? error.message : uz.common.networkError} onRetry={refetch} />
      </Screen>
    );
  }

  const nextStatus = getNextStatus(trip.status);
  const nextActionLabel = getStatusActionLabel(nextStatus);
  const isPhotoRequired = nextStatus ? requiresPhoto(nextStatus) : false;
  const canCancel = cancellableByCarrier(trip.status);
  const active = isActiveTrip(trip.status);
  const headingToPickup = trip.status === 'ASSIGNED' || trip.status === 'EN_ROUTE_TO_PICKUP' || trip.status === 'AT_PICKUP';
  const targetAddress = headingToPickup ? trip.load?.pickupAddress : trip.load?.dropoffAddress;
  const stepIndex = STEPS.indexOf(trip.status);

  const bottomAction = nextStatus ? (
    <PrimaryButton
      title={nextActionLabel}
      onPress={handleNextStatus}
      loading={isUpdatingStatus}
      disabled={isPhotoRequired && !uploadedPhotoKey}
      size="lg"
      accessibilityLabel={nextActionLabel}
    />
  ) : undefined;

  return (
    <Screen edges={DETAIL_EDGES} scrollable contentContainerStyle={styles.pad} bottomAction={bottomAction}>
      <Stack.Screen options={{ title: '', headerLeft: () => <HeaderBackButton fallback="/(tabs)/trips" /> }} />

      <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      {errorMessage ? <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} /> : null}

      {/* Holat va narx */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Pill tone={pillToneForStatus(trip.status)} label={statusBadgeLabel(trip.status, 'trip')} />
          {active ? (
            <View style={styles.gps}>
              <View style={[styles.gpsDot, isGpsActive && styles.gpsDotOn]} />
              <Text style={styles.gpsText}>{isGpsActive ? 'GPS yozilmoqda' : 'GPS o‘chiq'}</Text>
            </View>
          ) : null}
        </View>
        <Money amount={trip.agreedPrice} currency={trip.currency} size="xl" weight="800" style={styles.heroPrice} />
        <Text style={styles.heroMeta} numberOfLines={1}>
          {[trip.companyName, trip.commissionAmount != null ? `komissiya ${formatMoney(trip.commissionAmount)}` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      {/* Joriy maqsad: navigator va qo'ng'iroq */}
      {active && targetAddress ? (
        <View style={styles.target}>
          <Text style={styles.targetLabel}>{headingToPickup ? 'Ortish joyiga' : 'Topshirish manziliga'}</Text>
          <Text style={styles.targetAddress} selectable>
            {targetAddress}
          </Text>
          <View style={styles.targetActions}>
            <Pressable
              onPress={handleOpenInAppMap}
              style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={uz.tripView.openInAppMap}
            >
              <Ionicons name="map" size={18} color="#FFFFFF" />
              <Text style={styles.navBtnText}>{uz.tripView.openInAppMap}</Text>
            </Pressable>
            <Pressable
              onPress={handleCallShipper}
              disabled={!trip.shipperPhone}
              style={({ pressed }) => [styles.callBtn, !trip.shipperPhone && styles.disabled, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={uz.tripView.callLogistics}
            >
              <Ionicons name="call" size={18} color={ink[900]} />
            </Pressable>
          </View>
          <Pressable
            onPress={handleOpenNavigator}
            accessibilityRole="button"
            accessibilityLabel={uz.tripView.openInYandexNavi}
            hitSlop={8}
            style={styles.yandexLink}
          >
            <Text style={styles.yandexLinkText}>{uz.tripView.openInYandexNavi}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Jarayon */}
      {trip.status !== 'CANCELLED' ? (
        <View style={styles.stepper} accessibilityLabel={`Bosqich: ${statusBadgeLabel(trip.status, 'trip')}`}>
          {STEPS.map((st, i) => {
            const done = stepIndex >= 0 && i <= stepIndex;
            return (
              <View key={st} style={styles.step}>
                <View style={[styles.stepBar, done && styles.stepBarDone, i === stepIndex && styles.stepBarCurrent]} />
                <Text style={[styles.stepText, done && styles.stepTextDone]} numberOfLines={1}>
                  {uz.tripView.stepShort[st as keyof typeof uz.tripView.stepShort] ?? st}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* GPS ruxsatlari */}
      {active && !foregroundGranted ? (
        <View style={[styles.notice, styles.noticeDanger]}>
          <Ionicons name="location" size={20} color={colors.dangerDark} />
          <View style={styles.noticeTexts}>
            <Text style={styles.noticeTitle}>{uz.tripView.locationPermissionBannerTitle}</Text>
            <Text style={styles.noticeBody}>{uz.tripView.locationPermissionBannerDesc}</Text>
            <Pressable onPress={handleGrantPermissions} accessibilityRole="button" style={styles.noticeAction}>
              <Text style={styles.noticeActionText}>
                {canAskForegroundAgain ? uz.tripView.grantPermission : uz.tripView.openAppSettings}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {active && foregroundGranted && !backgroundGranted ? (
        <View style={[styles.notice, styles.noticeWarn]}>
          <Ionicons name="navigate-circle" size={20} color="#9A5B00" />
          <View style={styles.noticeTexts}>
            <Text style={styles.noticeTitle}>{uz.tripView.backgroundPermissionTitle}</Text>
            <Text style={styles.noticeBody}>{uz.tripView.backgroundPermissionDesc}</Text>
            <Pressable onPress={handleOpenAppSettings} accessibilityRole="button" style={styles.noticeAction}>
              <Text style={styles.noticeActionText}>{uz.tripView.openAppSettings}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Keyingi bosqich uchun rasm */}
      {isPhotoRequired ? (
        <>
          <SectionTitle title={uz.tripView.photoRequiredTitle} />
          <Card>
            <Text style={styles.photoHint}>
              {nextStatus === 'LOADED' ? uz.tripView.photoRequiredLoaded : uz.tripView.photoRequiredDelivered}
            </Text>
            <PhotoPicker
              label={uz.tripView.photoConfirmLabel}
              required
              value={uploadedPhotoKey}
              onUploaded={(key) => setUploadedPhotoKey(key)}
            />
          </Card>
        </>
      ) : null}

      {/* Yakuniy holat */}
      {trip.status === 'COMPLETED' ? (
        <View style={[styles.notice, styles.noticeSuccess]}>
          <Ionicons name="checkmark-circle" size={20} color="#0F7A45" />
          <Text style={[styles.noticeBody, styles.flex]}>{uz.tripView.completedNotice}</Text>
        </View>
      ) : null}
      {trip.status === 'CANCELLED' ? (
        <View style={[styles.notice, styles.noticeDanger]}>
          <Ionicons name="close-circle" size={20} color={colors.dangerDark} />
          <View style={styles.noticeTexts}>
            <Text style={styles.noticeTitle}>{uz.tripView.cancelledNotice}</Text>
            {trip.cancelReason ? <Text style={styles.noticeBody}>Sabab: {trip.cancelReason}</Text> : null}
          </View>
        </View>
      ) : null}

      {/* Bo'sh qaytmaslik uchun: yuk ortilgandan keyin tugash joyi atrofidagi yuklar */}
      {trip.status === 'LOADED' || trip.status === 'DELIVERED' ? <ReturnLoadsCard tripId={tripId} /> : null}

      {/* Marshrut */}
      <SectionTitle
        title={uz.tripView.routeSection}
        right={
          <Pressable onPress={handleOpenInAppMap} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>{uz.tripView.openInMaps}</Text>
          </Pressable>
        }
      />
      {pickup && dropoff ? (
        <View style={styles.mapPreviewWrap}>
          <RouteMap
            style={styles.mapPreview}
            pickup={pickup}
            dropoff={dropoff}
            route={tripRoute}
            interactive={false}
          />
          <Pressable
            onPress={handleOpenInAppMap}
            accessibilityRole="button"
            accessibilityLabel={uz.tripView.openInAppMap}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      ) : null}
      <Card>
        <RouteLine
          lines={3}
          from={trip.load?.pickupAddress ?? '—'}
          to={trip.load?.dropoffAddress ?? '—'}
          fromHint={trip.load ? formatPickupWindow(trip.load.pickupDate, trip.load.pickupTimeFrom, trip.load.pickupTimeTo) : undefined}
          toHint={trip.load ? `${Math.round(trip.load.routeKm)} ${uz.common.km} yo‘l` : undefined}
        />
        {trip.load ? (
          <View style={styles.cargo}>
            <Text style={styles.cargoText}>
              {[trip.load.cargoType, `${trip.load.weightTons} ${uz.common.tons}`, uz.bodyType[trip.load.requiredBodyType]]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Logist */}
      <SectionTitle title={uz.tripView.shipperContact} />
      <Card style={styles.contactCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(trip.shipperContactName || 'Z').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.contactName}>{trip.shipperContactName || 'Zavod logisti'}</Text>
          <Text style={styles.contactPhone} selectable>
            {trip.shipperPhone || 'Raqam kiritilmagan'}
          </Text>
        </View>
        {trip.shipperPhone ? (
          <Pressable
            onPress={handleCallShipper}
            style={({ pressed }) => [styles.roundCall, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={uz.tripView.callLogistics}
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </Card>

      {/* Tarix */}
      {trip.events && trip.events.length > 0 ? (
        <>
          <SectionTitle title={uz.tripView.eventsHistory} />
          <Card>
            {trip.events.map((ev, index) => (
              <View key={index} style={styles.event}>
                <View style={styles.eventRail}>
                  <View style={[styles.eventDot, index === trip.events.length - 1 && styles.eventDotLast]} />
                  {index < trip.events.length - 1 ? <View style={styles.eventLine} /> : null}
                </View>
                <View style={styles.eventBody}>
                  <View style={styles.eventHead}>
                    <Text style={styles.eventTitle}>{eventLabel(ev.type)}</Text>
                    <Text style={styles.eventTime}>{formatDateTime(ev.occurredAt)}</Text>
                  </View>
                  {ev.comment ? <Text style={styles.eventComment}>{ev.comment}</Text> : null}
                  {ev.photoKey ? (
                    <AuthImage fileKey={ev.photoKey} style={styles.eventImage} accessibilityLabel={eventLabel(ev.type)} />
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {canCancel ? (
        <Pressable
          onPress={() => setCancelModalVisible(true)}
          style={styles.cancelLink}
          accessibilityRole="button"
          accessibilityLabel={uz.tripView.cancelTrip}
        >
          <Text style={styles.cancelLinkText}>{uz.tripView.cancelTrip}</Text>
        </Pressable>
      ) : null}

      <BottomSheet
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        locked={isCancelling}
        title={uz.tripView.cancelModalTitle}
        subtitle={uz.tripView.cancelModalDesc}
      >
        <TextField
          label={`${uz.tripView.cancelReasonLabel} *`}
          placeholder={uz.tripView.cancelReasonPlaceholder}
          value={cancelReason}
          onChangeText={(text) => {
            setCancelReason(text);
            if (cancelReasonError) setCancelReasonError(null);
          }}
          error={cancelReasonError ?? undefined}
          multiline
          numberOfLines={3}
        />
        <PrimaryButton
          title={uz.tripView.confirmCancelAction}
          variant="danger"
          onPress={handleCancelTrip}
          loading={isCancelling}
          size="lg"
        />
        <PrimaryButton
          title={uz.common.cancel}
          variant="secondary"
          onPress={() => setCancelModalVisible(false)}
          disabled={isCancelling}
        />
      </BottomSheet>
    </Screen>
  );
}

const STEPS: TripStatus[] = ['ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'AT_PICKUP', 'LOADED', 'DELIVERED'];

function eventLabel(type: string): string {
  const uz = getCopy();
  const events = uz.tripView.events as Record<string, string>;
  return events[type] ?? statusBadgeLabel(type, 'trip');
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  mapPreviewWrap: { marginBottom: 10, borderRadius: 18, overflow: 'hidden' },
  mapPreview: { height: 200, width: '100%' },
  gap: { height: 12 },
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  hero: { paddingTop: 4, paddingBottom: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroPrice: { marginTop: 10, fontSize: 34, letterSpacing: -1 },
  heroMeta: { marginTop: 2, fontSize: 14, color: colors.textMuted },
  gps: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.slate400 },
  gpsDotOn: { backgroundColor: '#22C55E' },
  gpsText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },

  target: { backgroundColor: ink[900], borderRadius: 22, padding: 18 },
  targetLabel: { fontSize: 13, fontWeight: '600', color: ink.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  targetAddress: { marginTop: 6, fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3, lineHeight: 26 },
  targetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  navBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  callBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yandexLink: { marginTop: 12, alignSelf: 'flex-start' },
  yandexLinkText: { fontSize: 13, fontWeight: '600', color: ink.muted },

  stepper: { flexDirection: 'row', gap: 6, marginTop: 16 },
  step: { flex: 1 },
  stepBar: { height: 5, borderRadius: 3, backgroundColor: colors.slate200 },
  stepBarDone: { backgroundColor: colors.slate900 },
  stepBarCurrent: { backgroundColor: colors.accent },
  stepText: { marginTop: 6, fontSize: 11.5, fontWeight: '600', color: colors.slate400 },
  stepTextDone: { color: colors.slate800 },

  notice: { flexDirection: 'row', gap: 12, marginTop: 14, padding: 14, borderRadius: 16 },
  noticeDanger: { backgroundColor: '#FDECEC' },
  noticeWarn: { backgroundColor: '#FFF4E0' },
  noticeSuccess: { backgroundColor: '#E8F7EF', alignItems: 'center' },
  noticeTexts: { flex: 1 },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: colors.slate900 },
  noticeBody: { marginTop: 3, fontSize: 14, lineHeight: 20, color: colors.slate700 },
  noticeAction: { marginTop: 10, alignSelf: 'flex-start' },
  noticeActionText: { fontSize: 15, fontWeight: '700', color: colors.primary },

  photoHint: { fontSize: 14, lineHeight: 20, color: colors.slate700, marginBottom: 12 },
  link: { fontSize: 15, fontWeight: '600', color: colors.primary },
  cargo: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.slate200 },
  cargoText: { fontSize: 14, fontWeight: '500', color: colors.slate700 },

  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.slate700 },
  contactName: { fontSize: 16, fontWeight: '600', color: colors.slate900 },
  contactPhone: { marginTop: 2, fontSize: 14, color: colors.textMuted },
  roundCall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  event: { flexDirection: 'row' },
  eventRail: { width: 18, alignItems: 'center' },
  eventDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.slate300, marginTop: 5 },
  eventDotLast: { backgroundColor: colors.slate900 },
  eventLine: { flex: 1, width: 2, backgroundColor: colors.slate200, marginVertical: 3 },
  eventBody: { flex: 1, paddingLeft: 8, paddingBottom: 16 },
  eventHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  eventTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.slate900 },
  eventTime: { fontSize: 13, color: colors.textMuted },
  eventComment: { marginTop: 3, fontSize: 14, color: colors.slate700 },
  eventImage: { marginTop: 8, width: '100%', height: 160, borderRadius: 12 },

  cancelLink: { alignSelf: 'center', marginTop: 24, paddingVertical: 8, paddingHorizontal: 16 },
  cancelLinkText: { fontSize: 15, fontWeight: '600', color: colors.danger },
});
