import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authApi } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthProvider';
import { ErrorBanner, PrimaryButton, Screen, TextField } from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { formatPhoneDisplay } from '../../src/utils/format';

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
          <Text style={styles.wrongRoleIcon}>🏢</Text>
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
          accessibilityLabel={uz.auth.verify}
        />
      }
    >
      <View style={styles.container}>
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
            <Text style={styles.timerText}>
              {uz.auth.resendIn.replace('{{seconds}}', timer.toString())}
            </Text>
          ) : (
            <Pressable
              onPress={handleResend}
              disabled={isLoading}
              style={({ pressed }) => [pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={uz.auth.resend}
            >
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
          <Text style={styles.backButtonText}>← {uz.auth.changePhone}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  lead: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 24,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
    height: 60,
  },
  timerRow: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  resendButtonText: {
    fontSize: 15,
    color: '#1a56db',
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  wrongRoleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  wrongRoleIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  wrongRoleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  wrongRoleLead: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  wrongRoleSub: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
  },
});
