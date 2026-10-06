import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthProvider';
import { ErrorBanner, PrimaryButton, Screen, TextField } from '../../src/components';
import { useCopy } from '../../src/i18n';
import { formatPhoneDisplay } from '../../src/utils/format';
import { colors } from '../../src/theme';

export default function CodeScreen() {
  const uz = useCopy();
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
      setError(apiErr?.message || uz.auth.invalidCode);
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
            {uz.auth.wrongRoleAs.replace(
              '{{role}}',
              wrongRoleUser === 'SHIPPER' ? uz.auth.roleShipper : uz.auth.roleAdmin
            )}
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
      <Text style={styles.title} accessibilityRole="header">
        {uz.auth.codeTitle}
      </Text>
      <Text style={styles.lead}>{uz.auth.codeLead.replace('{{phone}}', formattedPhone)}</Text>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <TextField
        label=""
        placeholder="••••••"
        value={code}
        onChangeText={handleCodeChange}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        style={styles.codeInput}
      />

      <View style={styles.actions}>
        {timer > 0 ? (
          <Text style={styles.timerText}>{uz.auth.resendIn.replace('{{seconds}}', timer.toString())}</Text>
        ) : (
          <Pressable
            onPress={handleResend}
            disabled={isLoading}
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
            accessibilityRole="button"
            accessibilityLabel={uz.auth.resend}
          >
            <Text style={styles.link}>{uz.auth.resend}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
          accessibilityRole="button"
          accessibilityLabel={uz.auth.changePhone}
        >
          <Text style={styles.linkMuted}>{uz.auth.changePhone}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  title: { marginTop: 12, fontSize: 30, fontWeight: '800', color: colors.slate900, letterSpacing: -0.8 },
  lead: { marginTop: 8, marginBottom: 24, fontSize: 16, lineHeight: 22, color: colors.textMuted },
  codeInput: { fontSize: 30, fontWeight: '800', letterSpacing: 14, textAlign: 'center', height: 64, color: colors.slate900 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  timerText: { fontSize: 14.5, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  link: { fontSize: 15, fontWeight: '700', color: colors.primary },
  linkMuted: { fontSize: 15, fontWeight: '600', color: colors.slate700 },
  pressed: { opacity: 0.6 },
});
