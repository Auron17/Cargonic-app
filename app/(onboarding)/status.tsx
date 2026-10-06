import React, { useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthProvider';
import { PrimaryButton, Screen, StatusBadge } from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { colors, radii, shadows } from '../../src/theme';

export default function OnboardingStatusScreen() {
  const { profile, refreshProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const status = profile?.verificationStatus;
  const isRejected = status === 'REJECTED';
  const isApproved = status === 'APPROVED';

  // Find any rejected documents to help user pinpoint issues
  const rejectedDocs = (profile?.documents || []).filter(
    (d) => d.status === 'REJECTED'
  );

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      contentContainerStyle={styles.scrollContainer}
      bottomAction={
        <View style={styles.bottomButtons}>
          {isRejected ? (
            <>
              <PrimaryButton
                title={uz.onboarding.fixDocuments}
                onPress={() => router.push('/(onboarding)/documents')}
                icon={<Ionicons name="construct-outline" size={16} color="#FFFFFF" />}
                accessibilityLabel={uz.onboarding.fixDocuments}
              />
              <PrimaryButton
                title={uz.onboarding.refreshStatus}
                onPress={handleRefresh}
                loading={refreshing}
                variant="outline"
                icon={<Ionicons name="refresh" size={16} color={colors.primary} />}
                accessibilityLabel={uz.onboarding.refreshStatus}
              />
            </>
          ) : isApproved ? (
            <PrimaryButton
              title={uz.onboarding.goToLoads}
              onPress={() => router.replace('/(tabs)')}
              icon={<Ionicons name="cube" size={16} color="#FFFFFF" />}
              accessibilityLabel={uz.onboarding.goToLoads}
            />
          ) : (
            <>
              <PrimaryButton
                title={uz.onboarding.refreshStatus}
                onPress={handleRefresh}
                loading={refreshing}
                icon={<Ionicons name="refresh" size={16} color="#FFFFFF" />}
                accessibilityLabel={uz.onboarding.refreshStatus}
              />
              <PrimaryButton
                title="Hujjatlarni ko‘rish"
                onPress={() => router.push('/(onboarding)/documents')}
                variant="outline"
                icon={<Ionicons name="document-text-outline" size={16} color={colors.primary} />}
                accessibilityLabel="Hujjatlarni ko‘rish"
              />
            </>
          )}

          <PrimaryButton
            title={uz.auth.logout}
            onPress={() => {
              Alert.alert(uz.auth.logoutConfirmTitle, uz.auth.logoutConfirmBody, [
                { text: uz.common.cancel, style: 'cancel' },
                { text: uz.auth.logout, style: 'destructive', onPress: () => { void logout(); } },
              ]);
            }}
            variant="secondary"
            icon={<Ionicons name="log-out-outline" size={16} color={colors.slate700} />}
            accessibilityLabel={uz.auth.logout}
          />
        </View>
      }
    >
      <View style={styles.centerBox}>
        {isRejected ? (
          <>
            <View style={[styles.iconBox, styles.iconBoxDanger]}>
              <Ionicons name="alert-circle" size={42} color={colors.danger} />
            </View>
            <StatusBadge kind="verification" status="REJECTED" style={styles.badge} />
            <Text style={styles.title}>{uz.onboarding.rejectedTitle}</Text>

            <View style={styles.reasonCard}>
              <Text style={styles.reasonLabel}>Sabab:</Text>
              <Text style={styles.reasonText}>
                {profile?.rejectReason ||
                  'Hujjatlaringizda kamchiliklar aniqlandi. Iltimos, belgilangan hujjatlarni qayta yuklang.'}
              </Text>
            </View>

            {rejectedDocs.length > 0 ? (
              <View style={styles.rejectedDocsList}>
                <Text style={styles.rejectedDocsTitle}>Rad etilgan hujjatlar:</Text>
                {rejectedDocs.map((doc) => (
                  <View key={doc.id} style={styles.rejectedDocItem}>
                    <Text style={styles.rejectedDocName}>
                      • {uz.docTypes[doc.docType] || doc.docType}
                    </Text>
                    {doc.rejectReason ? (
                      <Text style={styles.rejectedDocSubReason}>
                        — {doc.rejectReason}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={styles.pullHint}>
              Hujjatlarni tuzatgach, pastga tortib holatni yangilang.
            </Text>
          </>
        ) : isApproved ? (
          <>
            <View style={[styles.iconBox, styles.iconBoxSuccess]}>
              <Ionicons name="checkmark-circle" size={44} color={colors.success} />
            </View>
            <StatusBadge kind="verification" status="APPROVED" style={styles.badge} />
            <Text style={styles.title}>{uz.onboarding.approvedTitle}</Text>
            <Text style={styles.lead}>
              Tabriklaymiz! Sizning tashuvchi profilingiz muvaffaqiyatli tasdiqlandi.
              Endi ochiq yuklarni ko‘rishingiz va band qilishingiz mumkin.
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.iconBox, styles.iconBoxPending]}>
              <Ionicons name="hourglass" size={40} color={colors.accentDark} />
            </View>
            <StatusBadge kind="verification" status="PENDING" style={styles.badge} />
            <Text style={styles.title}>
              {uz.onboarding.pendingVerificationTitle}
            </Text>
            <Text style={styles.lead}>
              {uz.onboarding.pendingVerificationLead}
            </Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Tekshiruv bosqichlari:</Text>
              <View style={styles.stepItem}>
                <Ionicons name="checkmark-done" size={16} color={colors.primary} style={styles.stepIcon} />
                <Text style={styles.infoItem}>1. Yuridik shaxs / YaTT rekvizitlari</Text>
              </View>
              <View style={styles.stepItem}>
                <Ionicons name="checkmark-done" size={16} color={colors.primary} style={styles.stepIcon} />
                <Text style={styles.infoItem}>2. Yuk mashinasi va litsenziya kartochkasi</Text>
              </View>
              <View style={styles.stepItem}>
                <Ionicons name="checkmark-done" size={16} color={colors.primary} style={styles.stepIcon} />
                <Text style={styles.infoItem}>3. Haydovchilik guvohnomasi va pasport</Text>
              </View>
            </View>

            <Text style={styles.pullHint}>
              Holatni tekshirish uchun ekranni pastga torting yoki pastdagi tugmani bosing.
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  centerBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBoxDanger: {
    backgroundColor: '#FEE2E2',
  },
  iconBoxSuccess: {
    backgroundColor: '#ECFDF5',
  },
  iconBoxPending: {
    backgroundColor: '#FEF3C7',
  },
  badge: {
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.slate900,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  lead: {
    fontSize: 14.5,
    color: colors.slate600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 320,
  },
  reasonCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.lg,
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerDark,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
    fontWeight: '500',
  },
  rejectedDocsList: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: radii.lg,
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  rejectedDocsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 6,
  },
  rejectedDocItem: {
    marginBottom: 4,
  },
  rejectedDocName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C2410C',
  },
  rejectedDocSubReason: {
    fontSize: 12,
    color: '#9A3412',
    marginLeft: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radii.lg,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    ...shadows.card,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIcon: {
    marginRight: 8,
  },
  infoItem: {
    fontSize: 13.5,
    color: colors.slate600,
  },
  pullHint: {
    fontSize: 12.5,
    color: colors.slate500,
    textAlign: 'center',
  },
  bottomButtons: {
    gap: 10,
  },
});
