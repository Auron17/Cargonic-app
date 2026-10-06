import React, { useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { PrimaryButton, Screen, StatusBadge } from '../../src/components';
import { uz } from '../../src/i18n/uz';

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
          tintColor="#1a56db"
          colors={['#1a56db']}
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
                accessibilityLabel={uz.onboarding.fixDocuments}
              />
              <PrimaryButton
                title={uz.onboarding.refreshStatus}
                onPress={handleRefresh}
                loading={refreshing}
                variant="outline"
                accessibilityLabel={uz.onboarding.refreshStatus}
              />
            </>
          ) : isApproved ? (
            <PrimaryButton
              title={uz.onboarding.goToLoads}
              onPress={() => router.replace('/(tabs)')}
              accessibilityLabel={uz.onboarding.goToLoads}
            />
          ) : (
            <>
              <PrimaryButton
                title={uz.onboarding.refreshStatus}
                onPress={handleRefresh}
                loading={refreshing}
                accessibilityLabel={uz.onboarding.refreshStatus}
              />
              <PrimaryButton
                title="Hujjatlarni ko‘rish"
                onPress={() => router.push('/(onboarding)/documents')}
                variant="outline"
                accessibilityLabel="Hujjatlarni ko‘rish"
              />
            </>
          )}

          <PrimaryButton
            title={uz.auth.logout}
            onPress={logout}
            variant="secondary"
            accessibilityLabel={uz.auth.logout}
          />
        </View>
      }
    >
      <View style={styles.centerBox}>
        {isRejected ? (
          <>
            <Text style={styles.statusEmoji}>⚠️</Text>
            <StatusBadge status="REJECTED" style={styles.badge} />
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
            <Text style={styles.statusEmoji}>✅</Text>
            <StatusBadge status="APPROVED" style={styles.badge} />
            <Text style={styles.title}>{uz.onboarding.approvedTitle}</Text>
            <Text style={styles.lead}>
              Tabriklaymiz! Sizning tashuvchi profilingiz muvaffaqiyatli tasdiqlandi.
              Endi ochiq yuklarni ko‘rishingiz va band qilishingiz mumkin.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.statusEmoji}>⏳</Text>
            <StatusBadge status="PENDING" style={styles.badge} />
            <Text style={styles.title}>
              {uz.onboarding.pendingVerificationTitle}
            </Text>
            <Text style={styles.lead}>
              {uz.onboarding.pendingVerificationLead}
            </Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📋 Tekshiruv bosqichlari:</Text>
              <Text style={styles.infoItem}>1. Yuridik shaxs / YaTT rekvizitlari</Text>
              <Text style={styles.infoItem}>2. Yuk mashinasi va litsenziya kartochkasi</Text>
              <Text style={styles.infoItem}>3. Haydovchilik guvohnomasi va pasport</Text>
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
    paddingVertical: 32,
  },
  centerBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  statusEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  badge: {
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  lead: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 320,
  },
  reasonCard: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
    fontWeight: '500',
  },
  rejectedDocsList: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  rejectedDocsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9a3412',
    marginBottom: 6,
  },
  rejectedDocItem: {
    marginBottom: 4,
  },
  rejectedDocName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c2410c',
  },
  rejectedDocSubReason: {
    fontSize: 12,
    color: '#9a3412',
    marginLeft: 12,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 4,
  },
  pullHint: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomButtons: {
    gap: 10,
  },
});
