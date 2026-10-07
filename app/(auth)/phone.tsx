import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthProvider';
import { useTelegramLogin } from '../../src/auth/useTelegramLogin';
import { ErrorBanner, PrimaryButton, Screen, TextField } from '../../src/components';
import { useCopy } from '../../src/i18n';
import { cleanPhoneNumber, formatPhoneDisplay } from '../../src/utils/format';
import { colors } from '../../src/theme';

const TELEGRAM_BLUE = '#2AABEE';

export default function PhoneScreen() {
  const uz = useCopy();
  const { login } = useAuth();
  const telegram = useTelegramLogin(async (auth) => {
    if (auth.user.role !== 'CARRIER') {
      setError(uz.telegramLogin.wrongRole);
      return;
    }
    await login(auth);
  });
  const [phoneInput, setPhoneInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let localDigits = digits;
    if (localDigits.startsWith('998')) {
      localDigits = localDigits.slice(3);
    }
    localDigits = localDigits.slice(0, 9);

    if (localDigits.length === 0) {
      setPhoneInput('');
    } else {
      setPhoneInput(formatPhoneDisplay(localDigits));
    }
    if (error) setError(null);
  };

  const getRawLocalDigits = () => {
    const digits = phoneInput.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      return digits.slice(3);
    }
    return digits;
  };

  const isPhoneValid = getRawLocalDigits().length === 9;

  const handleSendCode = async () => {
    const rawLocal = getRawLocalDigits();
    if (rawLocal.length !== 9) {
      setError(uz.auth.invalidPhone);
      return;
    }

    const fullPhone = cleanPhoneNumber(rawLocal);
    setIsLoading(true);
    setError(null);

    try {
      await authApi.requestOtp(fullPhone);
      router.push({
        pathname: '/(auth)/code',
        params: { phone: fullPhone },
      });
    } catch (err: unknown) {
      console.error('Failed to send OTP', err);
      const apiErr = err as { message?: string };
      setError(apiErr?.message || uz.common.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const telegramError =
    telegram.error === 'expired'
      ? uz.telegramLogin.expired
      : telegram.error === 'noTelegram'
        ? uz.telegramLogin.noTelegram
        : telegram.error === 'network'
          ? telegram.serverMessage || uz.common.networkError
          : null;

  if (telegram.phase === 'waiting') {
    return (
      <Screen
        scrollable
        bottomAction={
          <View style={styles.waitActions}>
            <PrimaryButton
              title={uz.telegramLogin.reopen}
              onPress={telegram.reopen}
              icon={<Ionicons name="paper-plane" size={16} color="#FFFFFF" />}
            />
            <PrimaryButton title={uz.telegramLogin.cancel} variant="secondary" onPress={telegram.cancel} />
          </View>
        }
      >
        <View style={styles.waitIcon}>
          <Ionicons name="paper-plane" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {uz.telegramLogin.waitingTitle}
        </Text>
        <View style={styles.steps}>
          {[uz.telegramLogin.step1, uz.telegramLogin.step2, uz.telegramLogin.step3].map((step, i) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
        <View style={styles.waitingRow}>
          <ActivityIndicator color={TELEGRAM_BLUE} />
          <Text style={styles.waitingText}>{uz.telegramLogin.waiting}</Text>
        </View>
      </Screen>
    );
  }

  const telegramButton = (
    <Pressable
      onPress={telegram.start}
      disabled={telegram.phase === 'starting'}
      style={({ pressed }) => [styles.tgButton, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={uz.telegramLogin.button}
    >
      {telegram.phase === 'starting' ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
      )}
      <Text style={styles.tgButtonText}>{uz.telegramLogin.button}</Text>
    </Pressable>
  );

  return (
    <Screen
      scrollable
      bottomAction={
        <PrimaryButton
          title={isLoading ? uz.auth.sendingCode : uz.auth.sendCode}
          onPress={handleSendCode}
          loading={isLoading}
          disabled={!isPhoneValid}
          accessibilityLabel={uz.auth.sendCode}
        />
      }
    >
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.brandLogo}
          accessible
          accessibilityRole="image"
          accessibilityLabel={uz.app.name}
        />
        <Text style={styles.brandName}>{uz.app.name}</Text>
      </View>

      <Text style={styles.title} accessibilityRole="header">
        {uz.auth.title}
      </Text>
      <Text style={styles.lead}>{uz.telegramLogin.hint}</Text>

      <ErrorBanner
        message={error ?? telegramError}
        onDismiss={() => {
          setError(null);
          telegram.clearError();
        }}
      />

      {telegramButton}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{uz.telegramLogin.orSms}</Text>
        <View style={styles.dividerLine} />
      </View>
      <TextField
        placeholder="+998 (90) 123-45-67"
        value={phoneInput}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        maxLength={19}
        style={styles.phoneInput}
        leftIcon={<Text style={styles.flag}>🇺🇿</Text>}
      />

      <Text style={styles.termsNotice}>{uz.auth.termsNotice}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 36 },
  brandLogo: { width: 40, height: 40, borderRadius: 11 },
  brandName: { fontSize: 20, fontWeight: '800', color: colors.slate900, letterSpacing: -0.4 },
  title: { fontSize: 30, fontWeight: '800', color: colors.slate900, letterSpacing: -0.8 },
  lead: { marginTop: 8, marginBottom: 24, fontSize: 16, lineHeight: 22, color: colors.textMuted },
  phoneInput: { fontSize: 20, fontWeight: '600', letterSpacing: 0.3 },
  flag: { fontSize: 20 },
  pressed: { opacity: 0.85 },
  tgButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: TELEGRAM_BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  tgButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28, marginBottom: 16 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.slate300 },
  dividerText: { fontSize: 13, color: colors.textMuted },
  waitIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: TELEGRAM_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  steps: { marginTop: 20, gap: 14 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  stepText: { flex: 1, fontSize: 16, lineHeight: 22, color: colors.slate800 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28 },
  waitingText: { fontSize: 15, color: colors.textMuted },
  waitActions: { gap: 10 },
  termsNotice: { marginTop: 16, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
});
