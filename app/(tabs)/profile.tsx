import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthProvider';
import {
  AuthImage,
  ErrorBanner,
  PrimaryButton,
  Screen,
  StatusBadge,
  SuccessBanner,
  TAB_EDGES_WITH_HEADER,
} from '../../src/components';
import { useOta } from '../../src/updates';
import { uz } from '../../src/i18n/uz';
import { formatPhoneDisplay } from '../../src/utils/format';
import { colors, radii, shadows } from '../../src/theme';

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, logout } = useAuth();
  const ota = useOta();
  const [refreshing, setRefreshing] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [otaMessage, setOtaMessage] = useState<string | null>(null);
  const [otaError, setOtaError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleCheckForUpdate = async () => {
    setCheckingUpdate(true);
    setOtaMessage(null);
    setOtaError(null);
    try {
      const hasUpdate = await ota.checkForUpdate(true);
      if (!ota.isEnabled) {
        setOtaMessage(
          'OTA yangilanishlar preview yoki production buildda ishlaydi.'
        );
      } else if (!hasUpdate) {
        setOtaMessage('Sizda eng so‘nggi talqin o‘rnatilgan.');
      }
    } catch {
      setOtaError('Yangilanishlarni tekshirishda xatolik yuz berdi.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const vehicle = profile?.vehicle;
  const documents = profile?.documents || [];
  const driverPhotoDoc = documents.find((d) => d.docType === 'DRIVER_PHOTO');

  return (
    <Screen edges={TAB_EDGES_WITH_HEADER}
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      bottomAction={
        <PrimaryButton
          title={uz.auth.logout}
          onPress={() => {
            Alert.alert(uz.auth.logoutConfirmTitle, uz.auth.logoutConfirmBody, [
              { text: uz.common.cancel, style: 'cancel' },
              { text: uz.auth.logout, style: 'destructive', onPress: () => { void logout(); } },
            ]);
          }}
          variant="secondary"
          icon={<Ionicons name="log-out-outline" size={18} color={colors.slate700} />}
          accessibilityLabel={uz.auth.logout}
        />
      }
    >
      {/* Driver Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarRow}>
          {driverPhotoDoc?.fileKey ? (
            <AuthImage
              fileKey={driverPhotoDoc.fileKey}
              style={styles.avatarImage}
              containerStyle={styles.avatarContainer}
              accessibilityLabel={uz.docTypes.DRIVER_PHOTO}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={34} color={colors.primary} />
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.driverName}>
              {profile?.fullName || user?.fullName || 'Tashuvchi'}
            </Text>
            <Text style={styles.driverPhone} selectable>
              {user?.phone ? formatPhoneDisplay(user.phone) : '—'}
            </Text>
            {profile?.verificationStatus ? (
              <View style={styles.statusBadgeWrap}>
                <StatusBadge kind="verification" status={profile.verificationStatus} />
              </View>
            ) : null}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={18} color="#F59E0B" style={styles.statIcon} />
            <Text style={styles.statValue}>
              {profile?.ratingCount
                ? Number(profile.ratingAvg).toFixed(1)
                : '—'}
            </Text>
            <Text style={styles.statSub}>
              {profile?.ratingCount
                ? uz.profileTab.ratingCount.replace(
                    '{{count}}',
                    String(profile.ratingCount)
                  )
                : uz.profileTab.noRating}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Ionicons name="cube" size={18} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>
              {profile?.completedTrips ?? 0}
            </Text>
            <Text style={styles.statSub}>Bajarilgan reys</Text>
          </View>
        </View>
      </View>

      {/* OTA & App Updates Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="cloud-download-outline" size={19} color={colors.primary} style={styles.sectionHeaderIcon} />
            <Text style={styles.sectionTitle}>Ilova yangilanishlari (OTA)</Text>
          </View>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillText}>v1.0.0</Text>
          </View>
        </View>

        <Text style={styles.otaLeadText}>
          Ilova ishlatilayotgan paytda yangilanishlar avtomatik tekshirilib turiladi. App Store yoki Google Play’siz darhol yangilanadi.
        </Text>

        <SuccessBanner
          message={otaMessage}
          onDismiss={() => setOtaMessage(null)}
        />
        {otaError ? (
          <ErrorBanner message={otaError} onDismiss={() => setOtaError(null)} />
        ) : null}

        <View style={styles.otaStatusBox}>
          <View style={styles.otaStatusLeft}>
            <View
              style={[
                styles.otaStatusBullet,
                {
                  backgroundColor: ota.isUpdateReady
                    ? colors.accent
                    : ota.isEnabled
                    ? colors.success
                    : colors.info,
                },
              ]}
            />
            <View>
              <Text style={styles.otaStatusLabel}>
                {ota.isDownloading
                  ? 'Yangilanish yuklanmoqda…'
                  : ota.isUpdateReady
                  ? 'Yangi yangilanish yuklandi!'
                  : ota.isEnabled
                  ? 'Avtomatik yangilanish yoqilgan'
                  : 'Ishlab chiqish (Dev) rejimida'}
              </Text>
              <Text style={styles.otaStatusSub}>
                {ota.lastCheckedAt
                  ? `Oxirgi tekshiruv: ${ota.lastCheckedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Kutish rejimida'}
              </Text>
            </View>
          </View>

          {ota.isUpdateReady ? (
            <Pressable
              onPress={ota.applyUpdate}
              style={styles.otaApplyBtn}
              accessibilityRole="button"
              accessibilityLabel="Qayta yuklash"
            >
              <Ionicons name="refresh" size={14} color="#FFFFFF" style={styles.otaApplyIcon} />
              <Text style={styles.otaApplyText}>Qayta yuklash</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.otaActionsRow}>
          <PrimaryButton
            title={checkingUpdate || ota.isChecking ? 'Tekshirilmoqda…' : 'Yangilanishni tekshirish'}
            onPress={handleCheckForUpdate}
            loading={checkingUpdate || ota.isChecking}
            variant="outline"
            size="sm"
            icon={<Ionicons name="reload" size={14} color={colors.primary} />}
            style={styles.otaCheckBtn}
          />

          {__DEV__ && !ota.isEnabled && !ota.isUpdateReady ? (
            <Pressable
              onPress={ota.simulateUpdateReadyForTesting}
              style={styles.simulateBtn}
              accessibilityRole="button"
              accessibilityLabel="Sinov yangilanishini ko'rish"
            >
              <Text style={styles.simulateBtnText}>Sinov yangilanishini ko‘rish</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Carrier Legal Information */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="briefcase-outline" size={18} color={colors.slate700} style={styles.sectionHeaderIcon} />
            <Text style={styles.sectionTitle}>{uz.profileTab.driverSection}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(onboarding)/profile')}
            hitSlop={8}
            style={styles.editLink}
            accessibilityRole="button"
            accessibilityLabel="Profilni tahrirlash"
          >
            <Text style={styles.editLinkText}>Tahrirlash</Text>
          </Pressable>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Yuridik shakli:</Text>
          <Text style={styles.infoValue}>
            {profile?.legalType ? uz.legalType[profile.legalType] : '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Yuridik nomi:</Text>
          <Text style={styles.infoValue}>{profile?.legalName || '—'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>STIR (INN):</Text>
          <Text style={styles.infoValue} selectable>
            {profile?.stir || '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Litsenziya raqami:</Text>
          <Text style={styles.infoValue} selectable>
            {profile?.licenseNumber || '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Asosiy viloyat:</Text>
          <Text style={styles.infoValue}>
            {profile?.homeRegion ? uz.regions[profile.homeRegion] : '—'}
          </Text>
        </View>
      </View>

      {/* Vehicle Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="car-outline" size={18} color={colors.slate700} style={styles.sectionHeaderIcon} />
            <Text style={styles.sectionTitle}>{uz.profileTab.vehicleSection}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(onboarding)/vehicle')}
            hitSlop={8}
            style={styles.editLink}
            accessibilityRole="button"
            accessibilityLabel="Mashinani tahrirlash"
          >
            <Text style={styles.editLinkText}>
              {vehicle ? 'Tahrirlash' : 'Qo‘shish'}
            </Text>
          </Pressable>
        </View>

        {vehicle ? (
          <>
            <View style={styles.plateRow}>
              <View style={styles.plateBadge}>
                <Ionicons name="car" size={14} color={colors.slate800} style={styles.plateIcon} />
                <Text style={styles.plateText} selectable>
                  {vehicle.plateNumber}
                </Text>
              </View>
              <StatusBadge kind="verification" status={vehicle.verificationStatus} />
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kuzov turi:</Text>
              <Text style={styles.infoValue}>
                {vehicle.bodyType ? uz.bodyType[vehicle.bodyType] : '—'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Yuk ko‘tarish sig‘imi:</Text>
              <Text style={styles.infoValue}>{vehicle.capacityTons} tonna</Text>
            </View>

            {vehicle.volumeM3 ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kuzov hajmi:</Text>
                <Text style={styles.infoValue}>{vehicle.volumeM3} m³</Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Litsenziya kartochkasi:</Text>
              <Text style={styles.infoValue}>
                {vehicle.licenseCardNumber || '—'}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyVehicleBox}>
            <Text style={styles.emptyVehicleText}>
              {uz.profileTab.noVehicle}
            </Text>
            <PrimaryButton
              title={uz.profileTab.addVehicle}
              onPress={() => router.push('/(onboarding)/vehicle')}
              variant="outline"
              size="sm"
              style={{ marginTop: 10 }}
            />
          </View>
        )}
      </View>

      {/* Documents Overview Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={18} color={colors.slate700} style={styles.sectionHeaderIcon} />
            <Text style={styles.sectionTitle}>{uz.profileTab.documentsSection}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(onboarding)/documents')}
            hitSlop={8}
            style={styles.editLink}
            accessibilityRole="button"
            accessibilityLabel="Hujjatlarni boshqarish"
          >
            <Text style={styles.editLinkText}>Boshqarish</Text>
          </Pressable>
        </View>

        {documents.length > 0 ? (
          <View style={styles.docsList}>
            {documents.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
                <View style={styles.docNameCol}>
                  <Text style={styles.docName}>
                    {uz.docTypes[doc.docType] || doc.docType}
                  </Text>
                  {doc.rejectReason ? (
                    <Text style={styles.docRejectText}>{doc.rejectReason}</Text>
                  ) : null}
                </View>
                <StatusBadge kind="verification" status={doc.status} size="sm" />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyDocsBox}>
            <Text style={styles.emptyDocsText}>Hujjatlar hali yuklanmagan.</Text>
            <PrimaryButton
              title="Hujjatlarni yuklash"
              onPress={() => router.push('/(onboarding)/documents')}
              variant="outline"
              size="sm"
              style={{ marginTop: 10 }}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: 18,
    marginBottom: 16,
    ...shadows.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover' as const,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  headerInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.slate900,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  driverPhone: {
    fontSize: 14,
    color: colors.slate600,
    fontWeight: '500',
    marginBottom: 6,
  },
  statusBadgeWrap: {
    alignSelf: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.slate50,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
    marginTop: 2,
  },
  statSub: {
    fontSize: 11.5,
    color: colors.slate500,
    fontWeight: '500',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.slate200,
    marginVertical: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: 16,
    marginBottom: 16,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slate900,
  },
  versionPill: {
    backgroundColor: colors.primary50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  versionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  otaLeadText: {
    fontSize: 13,
    color: colors.slate500,
    lineHeight: 18,
    marginBottom: 12,
  },
  otaStatusBox: {
    backgroundColor: colors.slate50,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  otaStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  otaStatusBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  otaStatusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate800,
  },
  otaStatusSub: {
    fontSize: 11.5,
    color: colors.slate500,
    marginTop: 2,
  },
  otaApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 44,
    borderRadius: radii.sm,
  },
  otaApplyIcon: {
    marginRight: 4,
  },
  otaApplyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  otaActionsRow: {
    gap: 8,
  },
  otaCheckBtn: {
    width: '100%',
  },
  simulateBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  simulateBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
    textDecorationLine: 'underline',
  },
  editLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  editLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  infoLabel: {
    fontSize: 13.5,
    color: colors.slate500,
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.slate800,
    maxWidth: '60%',
    textAlign: 'right',
  },
  plateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate100,
    borderWidth: 1.5,
    borderColor: colors.slate300,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  plateIcon: {
    marginRight: 6,
  },
  plateText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slate900,
    letterSpacing: 0.5,
  },
  emptyVehicleBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptyVehicleText: {
    fontSize: 14,
    color: colors.slate500,
  },
  docsList: {
    gap: 8,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  docNameCol: {
    flex: 1,
    marginRight: 10,
  },
  docName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.slate800,
  },
  docRejectText: {
    fontSize: 12,
    color: colors.dangerDark,
    marginTop: 2,
  },
  emptyDocsBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptyDocsText: {
    fontSize: 14,
    color: colors.slate500,
  },
});
