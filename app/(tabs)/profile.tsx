import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import {
  AuthImage,
  PrimaryButton,
  Screen,
  StatusBadge,
} from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { formatPhoneDisplay } from '../../src/utils/format';

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const vehicle = profile?.vehicle;
  const documents = profile?.documents || [];

  // Find driver photo document if uploaded
  const driverPhotoDoc = documents.find((d) => d.docType === 'DRIVER_PHOTO');

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#1a56db"
          colors={['#1a56db']}
        />
      }
      bottomAction={
        <PrimaryButton
          title={uz.auth.logout}
          onPress={logout}
          variant="secondary"
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
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.driverName}>
              {profile?.fullName || user?.fullName || 'Tashuvchi'}
            </Text>
            <Text style={styles.driverPhone}>
              {user?.phone ? formatPhoneDisplay(user.phone) : '—'}
            </Text>
            {profile?.verificationStatus ? (
              <View style={styles.statusBadgeWrap}>
                <StatusBadge status={profile.verificationStatus} />
              </View>
            ) : null}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>
              {profile?.ratingAvg ? Number(profile.ratingAvg).toFixed(1) : '5.0'}
            </Text>
            <Text style={styles.statSub}>
              {profile?.ratingCount
                ? `${profile.ratingCount} ta baho`
                : 'Yangi haydovchi'}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🚚</Text>
            <Text style={styles.statValue}>
              {profile?.completedTrips ?? 0}
            </Text>
            <Text style={styles.statSub}>Bajarilgan reys</Text>
          </View>
        </View>
      </View>

      {/* Carrier Legal Information */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{uz.profileTab.driverSection}</Text>
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
          <Text style={styles.infoValue}>{profile?.stir || '—'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Litsenziya raqami:</Text>
          <Text style={styles.infoValue}>{profile?.licenseNumber || '—'}</Text>
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
          <Text style={styles.sectionTitle}>{uz.profileTab.vehicleSection}</Text>
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
                <Text style={styles.plateText}>{vehicle.plateNumber}</Text>
              </View>
              <StatusBadge status={vehicle.verificationStatus} />
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
              style={{ marginTop: 10 }}
            />
          </View>
        )}
      </View>

      {/* Documents Overview Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{uz.profileTab.documentsSection}</Text>
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
                <StatusBadge status={doc.status} />
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#1a56db',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  avatarEmoji: {
    fontSize: 34,
  },
  headerInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '500',
    marginBottom: 6,
  },
  statusBadgeWrap: {
    alignSelf: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  statSub: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  editLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a56db',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1.2,
  },
  plateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
  },
  plateBadge: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  plateText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 1.5,
  },
  emptyVehicleBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyVehicleText: {
    fontSize: 14,
    color: '#6b7280',
  },
  docsList: {
    gap: 8,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  docNameCol: {
    flex: 1,
    paddingRight: 10,
  },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  docRejectText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
  },
  emptyDocsBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyDocsText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
