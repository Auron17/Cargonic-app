import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthProvider';
import { ErrorBanner, PrimaryButton, Screen, TextField } from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { formatPhoneDisplay } from '../../src/utils/format';
import { colors, radii, shadows } from '../../src/theme';

export default function CodeScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrongRoleUser, setWrongRoleUser] = useState<string | null>(null);

  const { login, logout } = useAuth();
  const router = useRouter();

  // 60-second countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0 || !phone) return;
    setIsLoading(true);
    setError(null);
    try {
      await authApi.requestOtp(phone);
      setTimer(60);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || uz.common.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!phone || code.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      // Role is set to CARRIER for new user registration
      const authRes = await authApi.verifyOtp(phone, code, 'CARRIER');

      if (authRes.user.role !== 'CARRIER') {
        // User exists but has SHIPPER or ADMIN role
        setWrongRoleUser(authRes.user.role);
        return;
      }

      // Successful carrier login
      await login(authRes);
      // Navigation is automatically handled by AuthProvider based on carrier profile verification
    } catch (err: unknown) {
      console.error('Failed to verify OTP', err);
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Kod noto‘g‘ri yoki muddati o‘tgan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (error) setError(null);
  };

  const handleWrongRoleExit = async () => {
    setWrongRoleUser(null);
    await logout();
    router.replace('/(auth)/phone');
  };

  // If wrong role detected (SHIPPER or ADMIN)
  if (wrongRoleUser) {
    return (
      <Screen
        bottomAction={
          <PrimaryButton
            title={uz.auth.logout}
            onPress={handleWrongRoleExit}
            variant="danger"
          />
        }
      >
        <View style={styles.wrongRoleContainer}>
          <View style={styles.wrongRoleIconBox}>
            <Ionicons name="business" size={42} color={colors.danger} />
          </View>
          <Text style={styles.wrongRoleTitle}>{uz.auth.wrongRoleTitle}</Text>
          <Text style={styles.wrongRoleLead}>
            {uz.auth.wrongRoleLead}
          </Text>
          <Text style={styles.wrongRoleSub}>
            Tizimga {wrongRoleUser === 'SHIPPER' ? 'Zavod' : 'Administrator'} sifatida kiritilgan.
          </Text>
        </View>
      </Screen>
    );
  }

  const formattedPhone = phone ? formatPhoneDisplay(phone) : '';

  return (
    <Screen
      scrollable
      bottomAction={
        <PrimaryButton
          title={isLoading ? uz.auth.verifying : uz.auth.verify}
          onPress={handleVerify}
          loading={isLoading}
          disabled={code.length !== 6}
          icon={<Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />}
          accessibilityLabel={uz.auth.verify}
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{uz.auth.codeTitle}</Text>
          <Text style={styles.lead}>
            {uz.auth.codeLead.replace('{{phone}}', formattedPhone)}
          </Text>

          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <TextField
            label=""
            placeholder={uz.auth.codePlaceholder}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            style={styles.codeInput}
          />

          <View style={styles.timerRow}>
            {timer > 0 ? (
              <View style={styles.timerPill}>
                <Ionicons name="time-outline" size={14} color={colors.slate500} style={styles.timerIcon} />
                <Text style={styles.timerText}>
                  {uz.auth.resendIn.replace('{{seconds}}', timer.toString())}
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={handleResend}
                disabled={isLoading}
                style={({ pressed }) => [styles.resendBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={uz.auth.resend}
              >
                <Ionicons name="refresh" size={15} color={colors.primary} style={styles.timerIcon} />
                <Text style={styles.resendButtonText}>{uz.auth.resend}</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={uz.auth.changePhone}
          >
            <Ionicons name="arrow-back" size={15} color={colors.slate600} style={styles.backIcon} />
            <Text style={styles.backButtonText}>{uz.auth.changePhone}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.slate200,
    ...shadows.card,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.slate900,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  lead: {
    fontSize: 14.5,
    color: colors.slate600,
    lineHeight: 21,
    marginBottom: 20,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
    height: 60,
    color: colors.primary,
  },
  timerRow: {
    alignItems: 'center',
    marginVertical: 14,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  timerIcon: {
    marginRight: 5,
  },
  timerText: {
    fontSize: 13,
    color: colors.slate600,
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary50,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
  },
  resendButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  backIcon: {
    marginRight: 6,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.slate600,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  wrongRoleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  wrongRoleIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wrongRoleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.slate900,
    textAlign: 'center',
    marginBottom: 8,
  },
  wrongRoleLead: {
    fontSize: 15,
    color: colors.slate600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  wrongRoleSub: {
    fontSize: 13.5,
    color: colors.dangerDark,
    fontWeight: '700',
    textAlign: 'center',
  },
});
