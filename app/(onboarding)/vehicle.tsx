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
import { uz } from '../../src/i18n/uz';

const BODY_TYPE_OPTIONS: SelectOption<BodyType>[] = [
  { label: uz.bodyType.TENT, value: 'TENT', subtitle: 'Tentli yarim tirkama yoki yuk mashinasi' },
  { label: uz.bodyType.REFRIGERATOR, value: 'REFRIGERATOR', subtitle: 'Muzlatkichli / harorat nazorati' },
  { label: uz.bodyType.FLATBED, value: 'FLATBED', subtitle: 'Ochiq bortli platforma' },
  { label: uz.bodyType.ISOTHERMAL, value: 'ISOTHERMAL', subtitle: 'Termo izolyatsiyalangan furgon' },
  { label: uz.bodyType.TIPPER, value: 'TIPPER', subtitle: 'Ag‘darma kuzov (samosval)' },
  { label: uz.bodyType.CONTAINER, value: 'CONTAINER', subtitle: 'Konteyner tashuvchi platforma' },
];

export default function OnboardingVehicleScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
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
      newErrors.plateNumber = 'Davlat raqamini kiriting';
    } else if (plateNumber.trim().length < 5) {
      newErrors.plateNumber = 'Davlat raqamini to‘liq kiriting (masalan: 01 A 777 AA)';
    }

    if (!bodyType) {
      newErrors.bodyType = 'Mashina turini tanlang';
    }

    const capNum = parseFloat(capacityTons.replace(',', '.'));
    if (!capacityTons.trim() || isNaN(capNum)) {
      newErrors.capacityTons = 'Yuk ko‘tarish sig‘imini kiriting (tonna)';
    } else if (capNum < 0.5) {
      newErrors.capacityTons = 'Sig‘im kamida 0.5 tonna bo‘lishi kerak';
    } else if (capNum > 60) {
      newErrors.capacityTons = 'Sig‘im ko‘pi bilan 60 tonna bo‘lishi kerak';
    }

    if (volumeM3.trim()) {
      const volNum = parseFloat(volumeM3.replace(',', '.'));
      if (isNaN(volNum)) {
        newErrors.volumeM3 = 'Hajmni to‘g‘ri son bilan kiriting';
      } else if (volNum < 1) {
        newErrors.volumeM3 = 'Hajm kamida 1 m³ bo‘lishi kerak';
      } else if (volNum > 150) {
        newErrors.volumeM3 = 'Hajm ko‘pi bilan 150 m³ bo‘lishi kerak';
      }
    }

    if (!licenseCardNumber.trim()) {
      newErrors.licenseCardNumber = 'Litsenziya kartochkasi raqamini kiriting';
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
      router.push('/(onboarding)/documents');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setServerError(apiErr?.message || 'Mashina ma’lumotlarini saqlashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      scrollable
      bottomAction={
        <PrimaryButton
          title={uz.onboarding.saveAndContinue}
          onPress={handleSubmit}
          loading={loading}
          accessibilityLabel={uz.onboarding.saveAndContinue}
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
          accessibilityLabel="Ortga qaytish"
        >
          <Text style={styles.backButtonText}>← Ortga</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>2 / 3-qadam</Text>
        </View>
        <Text style={styles.title}>{uz.onboarding.vehicleTitle}</Text>
        <Text style={styles.lead}>
          Yuklarni qabul qilish uchun asosiy yuk mashinangiz ma’lumotlarini kiriting.
        </Text>
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
        hint="Masalan: 01 A 777 AA yoki 10 123 ABC"
      />

      {/* Body Type */}
      <Select<BodyType>
        label={uz.onboarding.bodyType}
        placeholder="Mashina turini tanlang"
        value={bodyType}
        options={BODY_TYPE_OPTIONS}
        onChange={(val) => {
          setBodyType(val);
          if (errors.bodyType) setErrors((prev) => ({ ...prev, bodyType: '' }));
        }}
        error={errors.bodyType}
        hint="Yuk buyurtmalari kuzov turiga qarab moslashtiriladi"
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
            hint="0.5 – 60 t oralig‘ida"
          />
        </View>

        <View style={styles.halfCol}>
          <TextField
            label={`${uz.onboarding.volumeM3} (${uz.common.optional})`}
            placeholder="86"
            value={volumeM3}
            onChangeText={(text) => {
              setVolumeM3(text);
              if (errors.volumeM3) setErrors((prev) => ({ ...prev, volumeM3: '' }));
            }}
            error={errors.volumeM3}
            keyboardType="decimal-pad"
            hint="1 – 150 m³"
          />
        </View>
      </View>

      {/* License Card Number */}
      <TextField
        label={uz.onboarding.licenseCardNumber}
        placeholder="Masalan: TLC 123456"
        value={licenseCardNumber}
        onChangeText={(text) => {
          setLicenseCardNumber(text);
          if (errors.licenseCardNumber) setErrors((prev) => ({ ...prev, licenseCardNumber: '' }));
        }}
        error={errors.licenseCardNumber}
        autoCapitalize="characters"
        hint="Tashuvchi mashinasiga berilgan litsenziya kartochkasi raqami"
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
    color: '#1a56db',
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
    color: '#1a56db',
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
