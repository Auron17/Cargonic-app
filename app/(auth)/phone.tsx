import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/client';
import { ErrorBanner, PrimaryButton, Screen, TextField } from '../../src/components';
import { uz } from '../../src/i18n/uz';
import { cleanPhoneNumber, formatPhoneDisplay } from '../../src/utils/format';

export default function PhoneScreen() {
  const [phoneInput, setPhoneInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePhoneChange = (text: string) => {
    // Only accept numbers
    const digits = text.replace(/\D/g, '');
    let localDigits = digits;
    if (localDigits.startsWith('998')) {
      localDigits = localDigits.slice(3);
    }
    // Limit to 9 local digits
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
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Text style={styles.truckIcon}>🚛</Text>
        </View>
        <Text style={styles.brandTitle}>{uz.app.name}</Text>
        <Text style={styles.brandTagline}>{uz.app.tagline}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{uz.auth.phoneLabel}</Text>
        <Text style={styles.sectionLead}>{uz.auth.phoneLead}</Text>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <TextField
          label=""
          placeholder="+998 (90) 123-45-67"
          value={phoneInput}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          autoFocus
          maxLength={19}
          style={styles.phoneInput}
        />

        <Text style={styles.termsText}>{uz.auth.termsNotice}</Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  truckIcon: {
    fontSize: 36,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a56db',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 15,
    color: '#4b5563',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  sectionLead: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  phoneInput: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    height: 56,
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
  },
});
