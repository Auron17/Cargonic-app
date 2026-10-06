import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/api/client';
import { ErrorBanner, PrimaryButton, Screen, TextField } from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { cleanPhoneNumber, formatPhoneDisplay } from '../../src/utils/format';
import { colors, radii, shadows } from '../../src/theme';

export default function PhoneScreen() {
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
          icon={<Ionicons name="paper-plane" size={16} color="#FFFFFF" />}
          accessibilityLabel={uz.auth.sendCode}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="cube" size={36} color={colors.primary} />
        </View>
        <Text style={styles.brandTitle}>{uz.app.name}</Text>
        <Text style={styles.brandTagline}>{uz.app.tagline}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{uz.auth.phoneLabel}</Text>
        <Text style={styles.sectionLead}>{uz.auth.phoneLead}</Text>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <TextField
          placeholder="+998 (90) 123-45-67"
          value={phoneInput}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          autoFocus
          maxLength={19}
          leftIcon={<Ionicons name="call-outline" size={18} color={colors.slate400} />}
        />

        <Text style={styles.termsNotice}>{uz.auth.termsNotice}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radii.full,
    backgroundColor: colors.primary50,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadows.subtle,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.slate900,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    color: colors.slate500,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.slate200,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate900,
    marginBottom: 6,
  },
  sectionLead: {
    fontSize: 14,
    color: colors.slate600,
    lineHeight: 20,
    marginBottom: 16,
  },
  termsNotice: {
    fontSize: 12,
    color: colors.slate400,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
