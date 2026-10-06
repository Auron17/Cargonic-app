import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { carrierApi } from '../../src/api/client';
import { BodyType, VehicleRequest } from '../../src/api/types';
import { useAuth } from '../../src/auth/AuthProvider';
import {
  ErrorBanner,
  PrimaryButton,
  Screen,
  Select,
  SelectOption,
  TextField,
} from '../../src/components';
import { useCopy } from '../../src/i18n';
import { colors } from '../../src/theme';

export default function OnboardingVehicleScreen() {
  const uz = useCopy();
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const BODY_TYPE_OPTIONS: SelectOption<BodyType>[] = [
    { label: uz.bodyType.TENT, value: 'TENT', subtitle: uz.bodyTypeHint.TENT },
    { label: uz.bodyType.REFRIGERATOR, value: 'REFRIGERATOR', subtitle: uz.bodyTypeHint.REFRIGERATOR },
    { label: uz.bodyType.FLATBED, value: 'FLATBED', subtitle: uz.bodyTypeHint.FLATBED },
    { label: uz.bodyType.ISOTHERMAL, value: 'ISOTHERMAL', subtitle: uz.bodyTypeHint.ISOTHERMAL },
    { label: uz.bodyType.TIPPER, value: 'TIPPER', subtitle: uz.bodyTypeHint.TIPPER },
    { label: uz.bodyType.CONTAINER, value: 'CONTAINER', subtitle: uz.bodyTypeHint.CONTAINER },
  ];
  const existingVehicle = profile?.vehicle;

  const [plateNumber, setPlateNumber] = useState(existingVehicle?.plateNumber || '');
  const [bodyType, setBodyType] = useState<BodyType>(existingVehicle?.bodyType || 'TENT');
  const [capacityTons, setCapacityTons] = useState(
    existingVehicle?.capacityTons != null ? String(existingVehicle.capacityTons) : ''
  );
  const [volumeM3, setVolumeM3] = useState(
    existingVehicle?.volumeM3 != null ? String(existingVehicle.volumeM3) : ''
  );
  const [licenseCardNumber, setLicenseCardNumber] = useState(
    existingVehicle?.licenseCardNumber || ''
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!plateNumber.trim()) {
      newErrors.plateNumber = uz.onboarding.errors.plateRequired;
    } else if (plateNumber.trim().length < 5) {
      newErrors.plateNumber = uz.onboarding.errors.plateInvalid;
    }

    if (!bodyType) {
      newErrors.bodyType = uz.onboarding.errors.bodyTypeRequired;
    }

    const capNum = parseFloat(capacityTons.replace(',', '.'));
    if (!capacityTons.trim() || isNaN(capNum)) {
      newErrors.capacityTons = uz.onboarding.errors.capacityRequired;
    } else if (capNum < 0.5) {
      newErrors.capacityTons = uz.onboarding.errors.capacityMin;
    } else if (capNum > 60) {
      newErrors.capacityTons = uz.onboarding.errors.capacityMax;
    }

    if (volumeM3.trim()) {
      const volNum = parseFloat(volumeM3.replace(',', '.'));
      if (isNaN(volNum)) {
        newErrors.volumeM3 = uz.onboarding.errors.volumeInvalid;
      } else if (volNum < 1) {
        newErrors.volumeM3 = uz.onboarding.errors.volumeMin;
      } else if (volNum > 150) {
        newErrors.volumeM3 = uz.onboarding.errors.volumeMax;
      }
    }

    if (!licenseCardNumber.trim()) {
      newErrors.licenseCardNumber = uz.onboarding.errors.licenseCardRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    const capNum = parseFloat(capacityTons.replace(',', '.'));
    const volNum = volumeM3.trim() ? parseFloat(volumeM3.replace(',', '.')) : undefined;

    const payload: VehicleRequest = {
      plateNumber: plateNumber.trim().toUpperCase(),
      bodyType,
      capacityTons: capNum,
      volumeM3: volNum,
      licenseCardNumber: licenseCardNumber.trim(),
    };

    try {
      if (existingVehicle?.id) {
        await carrierApi.updateVehicle(payload);
      } else {
        await carrierApi.createVehicle(payload);
      }

      await refreshProfile();
      if (profile?.verificationStatus === 'APPROVED') {
        router.replace('/(tabs)/profile');
      } else {
        router.push('/(onboarding)/documents');
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setServerError(apiErr?.message || uz.onboarding.errors.vehicleSaveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      scrollable
      bottomAction={
        <PrimaryButton
          title={
            profile?.verificationStatus === 'APPROVED'
              ? uz.common.save
              : uz.onboarding.saveAndContinue
          }
          onPress={handleSubmit}
          loading={loading}
          accessibilityLabel={
            profile?.verificationStatus === 'APPROVED'
              ? uz.common.save
              : uz.onboarding.saveAndContinue
          }
        />
      }
    >
      {/* Back button & Header */}
      <View style={styles.topNav}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={uz.common.back}
        >
          <Text style={styles.backButtonText}>← {uz.common.back}</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {uz.onboarding.stepOf.replace('{{current}}', '2').replace('{{total}}', '3')}
          </Text>
        </View>
        <Text style={styles.title}>{uz.onboarding.vehicleTitle}</Text>
        <Text style={styles.lead}>{uz.onboarding.vehicleLead}</Text>
      </View>

      <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />

      {/* Plate Number */}
      <TextField
        label={uz.onboarding.plateNumber}
        placeholder={uz.onboarding.plateNumberPlaceholder}
        value={plateNumber}
        onChangeText={(text) => {
          setPlateNumber(text.toUpperCase());
          if (errors.plateNumber) setErrors((prev) => ({ ...prev, plateNumber: '' }));
        }}
        error={errors.plateNumber}
        autoCapitalize="characters"
        hint={uz.onboarding.plateHint}
      />

      {/* Body Type */}
      <Select<BodyType>
        label={uz.onboarding.bodyType}
        placeholder={uz.onboarding.bodyTypePlaceholder}
        value={bodyType}
        options={BODY_TYPE_OPTIONS}
        onChange={(val) => {
          setBodyType(val);
          if (errors.bodyType) setErrors((prev) => ({ ...prev, bodyType: '' }));
        }}
        error={errors.bodyType}
        hint={uz.onboarding.bodyTypeFieldHint}
      />

      {/* Capacity & Volume */}
      <View style={styles.row}>
        <View style={styles.halfCol}>
          <TextField
            label={uz.onboarding.capacityTons}
            placeholder="20"
            value={capacityTons}
            onChangeText={(text) => {
              setCapacityTons(text);
              if (errors.capacityTons) setErrors((prev) => ({ ...prev, capacityTons: '' }));
            }}
            error={errors.capacityTons}
            keyboardType="decimal-pad"
            hint={uz.onboarding.capacityHint}
          />
        </View>

        <View style={styles.halfCol}>
          <TextField
            label={uz.onboarding.volumeM3}
            placeholder="86"
            value={volumeM3}
            onChangeText={(text) => {
              setVolumeM3(text);
              if (errors.volumeM3) setErrors((prev) => ({ ...prev, volumeM3: '' }));
            }}
            error={errors.volumeM3}
            keyboardType="decimal-pad"
            hint={uz.onboarding.volumeHint}
          />
        </View>
      </View>

      {/* License Card Number */}
      <TextField
        label={uz.onboarding.licenseCardNumber}
        placeholder={uz.onboarding.licenseCardPlaceholder}
        value={licenseCardNumber}
        onChangeText={(text) => {
          setLicenseCardNumber(text);
          if (errors.licenseCardNumber) setErrors((prev) => ({ ...prev, licenseCardNumber: '' }));
        }}
        error={errors.licenseCardNumber}
        autoCapitalize="characters"
        hint={uz.onboarding.licenseCardHint}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topNav: {
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  header: {
    marginBottom: 20,
  },
  stepBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  stepBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  lead: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
});
