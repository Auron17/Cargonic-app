import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/client';
import { ErrorBanner, LanguageChips, PrimaryButton, Screen, TextField } from '../../src/components';
import { useCopy } from '../../src/i18n';
import { cleanPhoneNumber, formatPhoneDisplay } from '../../src/utils/format';
import { colors } from '../../src/theme';

export default function PhoneScreen() {
  const uz = useCopy();
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
        {uz.auth.phoneTitle}
      </Text>
      <Text style={styles.lead}>{uz.auth.phoneLead}</Text>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <TextField
        placeholder="+998 (90) 123-45-67"
        value={phoneInput}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        autoFocus
        maxLength={19}
        style={styles.phoneInput}
        leftIcon={<Text style={styles.flag}>🇺🇿</Text>}
      />

      <Text style={styles.termsNotice}>{uz.auth.termsNotice}</Text>
      <LanguageChips />
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
  termsNotice: { marginTop: 4, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
});
