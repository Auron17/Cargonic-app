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

  return (
    <Screen
      scrollable
      contentContainerStyle={styles.scrollContainer}
      bottomAction={
        <View style={styles.bottomButtons}>
          <PrimaryButton
            title={uz.onboarding.refreshStatus}
            onPress={handleRefresh}
            loading={refreshing}
            style={styles.mainButton}
            accessibilityLabel={uz.onboarding.refreshStatus}
          />
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
        {status === 'REJECTED' ? (
          <>
            <Text style={styles.statusEmoji}>⚠️</Text>
            <StatusBadge status="REJECTED" style={styles.badge} />
            <Text style={styles.title}>{uz.onboarding.rejectedTitle}</Text>
            <Text style={styles.lead}>
              {profile?.rejectReason
                ? uz.onboarding.rejectedLead.replace('{{reason}}', profile.rejectReason)
                : 'Hujjatlaringizda kamchiliklar aniqlandi. Iltimos qayta tekshirib yuboring.'}
            </Text>
          </>
        ) : status === 'APPROVED' ? (
          <>
            <Text style={styles.statusEmoji}>✅</Text>
            <StatusBadge status="APPROVED" style={styles.badge} />
            <Text style={styles.title}>{uz.onboarding.approvedTitle}</Text>
            <PrimaryButton
              title={uz.onboarding.goToLoads}
              onPress={() => router.replace('/(tabs)')}
              style={{ marginTop: 20 }}
            />
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
    paddingVertical: 40,
  },
  centerBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  statusEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  badge: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  lead: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 320,
  },
  bottomButtons: {
    gap: 10,
  },
  mainButton: {
    marginBottom: 4,
  },
});
