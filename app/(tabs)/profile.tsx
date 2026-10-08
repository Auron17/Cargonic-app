import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthProvider';
import {
  AuthImage,
  InfoRow,
  LanguageSheet,
  Pill,
  RegistrationBanner,
  Screen,
  ScreenTitle,
  SectionTitle,
  TAB_EDGES_NO_HEADER,
  VehicleCard,
  pillToneForStatus,
  statusBadgeLabel,
} from '../../src/components';
import { useCopy } from '../../src/i18n';
import { useTranslation } from 'react-i18next';
import { formatPhoneDisplay } from '../../src/utils/format';
import { formatUzPlate } from '../../src/utils/uzPlate';
import { colors } from '../../src/theme';

function Group({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

export default function ProfileTabScreen() {
  const uz = useCopy();
  const { i18n } = useTranslation();
  const router = useRouter();
  const { user, profile, refreshProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const confirmLogout = () => {
    Alert.alert(uz.auth.logoutConfirmTitle, uz.auth.logoutConfirmBody, [
      { text: uz.common.cancel, style: 'cancel' },
      { text: uz.auth.logout, style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const vehicle = profile?.vehicle;
  const documents = profile?.documents ?? [];
  const driverPhoto = documents.find((d) => d.docType === 'DRIVER_PHOTO');
  const name = profile?.fullName || user?.fullName || uz.settings.carrierFallback;
  const phone = profile?.phone || user?.phone;
  const approvedDocs = documents.filter((d) => d.status === 'APPROVED').length;
  const problemDocs = documents.filter((d) => d.status !== 'APPROVED').length;
  const rating = profile ? Number(profile.ratingAvg || 5).toFixed(1) : '—';

  return (
    <Screen
      edges={TAB_EDGES_NO_HEADER}
      scrollable
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.slate500} />}
    >
      <ScreenTitle title={uz.profileTab.title} />
      <RegistrationBanner />

      {/* Haydovchi */}
      <View style={styles.header}>
        {driverPhoto?.fileKey ? (
          <AuthImage
            fileKey={driverPhoto.fileKey}
            style={styles.avatarImage}
            containerStyle={styles.avatar}
            accessibilityLabel={uz.docTypes.DRIVER_PHOTO}
            placeholder={<Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {phone ? <Text style={styles.phone}>{formatPhoneDisplay(phone)}</Text> : null}
          {profile ? (
            <View style={styles.pillWrap}>
              <Pill
                tone={pillToneForStatus(profile.verificationStatus)}
                label={statusBadgeLabel(profile.verificationStatus, 'verification')}
                icon={
                  profile.verificationStatus === 'APPROVED' ? (
                    <Ionicons name="checkmark-circle" size={13} color="#0F7A45" />
                  ) : undefined
                }
              />
            </View>
          ) : null}
        </View>
      </View>

      {/* Ko'rsatkichlar */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {rating}
            {rating !== '—' ? <Text style={styles.star}> ★</Text> : null}
          </Text>
          <Text style={styles.statLabel}>
            {profile && profile.ratingCount > 0
              ? uz.profileTab.ratingCount.replace('{{count}}', String(profile.ratingCount))
              : uz.profileTab.noRating}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile?.completedTrips ?? 0}</Text>
          <Text style={styles.statLabel}>{uz.profileTab.completedTrips}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue} numberOfLines={1}>
            {vehicle?.plateNumber ? formatUzPlate(vehicle.plateNumber) : '—'}
          </Text>
          <Text style={styles.statLabel}>{uz.settings.vehicleShort}</Text>
        </View>
      </View>

      {profile?.rejectReason ? (
        <View style={styles.rejectBox}>
          <Ionicons name="alert-circle" size={18} color={colors.dangerDark} />
          <Text style={styles.rejectText}>{profile.rejectReason}</Text>
        </View>
      ) : null}

      <SectionTitle title={uz.profileTab.vehicleSection} />
      <VehicleCard vehicle={vehicle} onPress={() => router.push('/(onboarding)/vehicle')} />
      {vehicle ? (
        <View style={styles.vehicleExtra}>
          <Group>
            <InfoRow icon="card-outline" label={uz.onboarding.licenseCardNumber} value={vehicle.licenseCardNumber} last />
          </Group>
        </View>
      ) : null}

      <SectionTitle title={uz.profileTab.driverSection} />
      <Group>
        <InfoRow icon="briefcase-outline" label={uz.settings.legalForm} value={profile?.legalType ? uz.legalType[profile.legalType].split(' (')[0] : '—'} />
        <InfoRow icon="document-text-outline" label={uz.onboarding.stir} value={profile?.stir ?? '—'} />
        <InfoRow icon="ribbon-outline" label={uz.onboarding.licenseNumber} value={profile?.licenseNumber ?? '—'} />
        <InfoRow icon="location-outline" label={uz.onboarding.homeRegion} value={profile?.homeRegion ? uz.regions[profile.homeRegion] : '—'} />
        <InfoRow icon="create-outline" label={uz.profileTab.editProfile} onPress={() => router.push('/(onboarding)/profile')} last />
      </Group>

      <SectionTitle title={uz.profileTab.documentsSection} />
      <Group>
        <InfoRow
          icon="folder-open-outline"
          label={uz.profileTab.documentsSection}
          value={
            problemDocs > 0 ? (
              <Pill tone="warning" label={uz.settings.docsPendingCount.replace('{{count}}', String(problemDocs))} />
            ) : (
              <Text style={styles.okText}>{uz.settings.docsApprovedCount.replace('{{count}}', String(approvedDocs))}</Text>
            )
          }
          onPress={() => router.push('/(onboarding)/documents')}
          last
        />
      </Group>

      <SectionTitle title={uz.settings.section} />
      <Group>
        <InfoRow
          icon="language-outline"
          label={uz.settings.language}
          value={(i18n.language || 'uz').startsWith('ru') ? uz.settings.languageRu : uz.settings.languageUz}
          onPress={() => setLanguageOpen(true)}
        />
        <InfoRow icon="information-circle-outline" label={uz.settings.version} value="1.0.0" />
        <InfoRow icon="log-out-outline" label={uz.auth.logout} onPress={confirmLogout} danger last />
      </Group>

      <Pressable onPress={() => undefined} disabled style={styles.footer}>
        <Text style={styles.footerText}>{uz.settings.footer}</Text>
      </Pressable>

      <LanguageSheet visible={languageOpen} onClose={() => setLanguageOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden' },
  avatarImage: { width: 72, height: 72 },
  avatarFallback: { backgroundColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 28, fontWeight: '800', color: colors.slate700 },
  headerText: { flex: 1 },
  name: { fontSize: 21, fontWeight: '800', color: colors.slate900, letterSpacing: -0.4 },
  phone: { marginTop: 2, fontSize: 14.5, color: colors.textMuted },
  pillWrap: { marginTop: 8 },
  stats: {
    flexDirection: 'row',
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  star: { color: colors.accent, fontSize: 16 },
  statLabel: { marginTop: 2, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.slate200 },
  rejectBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FDECEC',
  },
  rejectText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.slate800 },
  vehicleExtra: { marginTop: 10 },
  group: { backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14 },
  okText: { fontSize: 14, color: '#0F7A45', fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 12.5, color: colors.textLight },
});
