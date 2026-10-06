import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthProvider';
import { EmptyState, PrimaryButton, Screen, StatusBadge } from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { formatPhoneDisplay } from '../../src/utils/format';

export default function ProfileTabScreen() {
  const { user, profile, logout } = useAuth();

  return (
    <Screen
      scrollable
      bottomAction={
        <PrimaryButton
          title={uz.auth.logout}
          onPress={logout}
          variant="secondary"
          accessibilityLabel={uz.auth.logout}
        />
      }
    >
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>👤</Text>
        </View>

        <Text style={styles.nameText}>
          {profile?.fullName || user?.fullName || 'Tashuvchi'}
        </Text>

        <Text style={styles.phoneText}>
          {user?.phone ? formatPhoneDisplay(user.phone) : '—'}
        </Text>

        {profile?.verificationStatus ? (
          <View style={styles.badgeRow}>
            <StatusBadge status={profile.verificationStatus} />
          </View>
        ) : null}
      </View>

      <EmptyState
        title={uz.nav.profile}
        description="Profil, mashina ma’lumotlari va hujjatlar (M2 bosqichida ulanadi)."
        icon="📋"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 10,
  },
  badgeRow: {
    marginTop: 4,
  },
});
