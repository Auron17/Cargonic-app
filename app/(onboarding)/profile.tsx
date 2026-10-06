import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { carrierApi } from '../../src/api/client';
import { LegalType, ProfileRequest, Region } from '../../src/api/types';
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

const LEGAL_OPTIONS: SelectOption<LegalType>[] = [
  { label: 'YaTT (Yakka tartibdagi tadbirkor)', value: 'YATT' },
  { label: 'MChJ (Mas’uliyati cheklangan jamiyat)', value: 'MCHJ' },
];

const REGION_OPTIONS: SelectOption<Region>[] = [
  { label: uz.regions.TASHKENT_CITY, value: 'TASHKENT_CITY' },
  { label: uz.regions.TASHKENT, value: 'TASHKENT' },
  { label: uz.regions.ANDIJAN, value: 'ANDIJAN' },
  { label: uz.regions.FERGANA, value: 'FERGANA' },
  { label: uz.regions.NAMANGAN, value: 'NAMANGAN' },
  { label: uz.regions.SAMARKAND, value: 'SAMARKAND' },
  { label: uz.regions.BUKHARA, value: 'BUKHARA' },
  { label: uz.regions.NAVOI, value: 'NAVOI' },
  { label: uz.regions.KASHKADARYA, value: 'KASHKADARYA' },
  { label: uz.regions.SURKHANDARYA, value: 'SURKHANDARYA' },
  { label: uz.regions.JIZZAKH, value: 'JIZZAKH' },
  { label: uz.regions.SYRDARYA, value: 'SYRDARYA' },
  { label: uz.regions.KHOREZM, value: 'KHOREZM' },
  { label: uz.regions.KARAKALPAKSTAN, value: 'KARAKALPAKSTAN' },
];

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [legalType, setLegalType] = useState<LegalType>(profile?.legalType || 'YATT');
  const [legalName, setLegalName] = useState(profile?.legalName || '');
  const [stir, setStir] = useState(profile?.stir || '');
  const [licenseNumber, setLicenseNumber] = useState(profile?.licenseNumber || '');
  const [homeRegion, setHomeRegion] = useState<Region>(profile?.homeRegion || 'TASHKENT_CITY');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 3) {
      newErrors.fullName = 'F.I.SH. kamida 3 ta harfdan iborat bo‘lsin';
    }

    if (!legalName.trim()) {
      newErrors.legalName = 'Yuridik nomini kiriting';
    }

    const cleanStir = stir.replace(/\D/g, '');
    if (cleanStir.length !== 9) {
      newErrors.stir = 'STIR aynan 9 ta raqamdan iborat bo‘lishi kerak';
    }

    if (!licenseNumber.trim()) {
      newErrors.licenseNumber = 'Litsenziya raqamini kiriting';
    }

    if (!homeRegion) {
      newErrors.homeRegion = 'Asosiy viloyatni tanlang';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    const payload: ProfileRequest = {
      fullName: fullName.trim(),
      legalType,
      legalName: legalName.trim(),
      stir: stir.replace(/\D/g, ''),
      licenseNumber: licenseNumber.trim(),
      homeRegion,
    };

    try {
      if (profile?.id) {
        await carrierApi.updateProfile(payload);
      } else {
        await carrierApi.createProfile(payload);
      }

      await refreshProfile();
      router.push('/(onboarding)/vehicle');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setServerError(apiErr?.message || 'Profilni saqlashda xatolik yuz berdi. Qayta urinib ko‘ring.');
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
      {/* Progress & Header */}
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>1 / 3-qadam</Text>
        </View>
        <Text style={styles.title}>{uz.onboarding.profileTitle}</Text>
        <Text style={styles.lead}>{uz.onboarding.profileLead}</Text>
      </View>

      <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />

      {/* Form Fields */}
      <TextField
        label={uz.onboarding.fullName}
        placeholder={uz.onboarding.fullNamePlaceholder}
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
        }}
        error={errors.fullName}
        autoCapitalize="words"
      />

      {/* Legal Type Segmented Control */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{uz.onboarding.legalType}</Text>
        <View style={styles.segmentContainer}>
          {LEGAL_OPTIONS.map((opt) => {
            const isSelected = legalType === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setLegalType(opt.value)}
                style={[
                  styles.segmentButton,
                  isSelected && styles.segmentButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextActive,
                  ]}
                >
                  {opt.value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TextField
        label={uz.onboarding.legalName}
        placeholder={uz.onboarding.legalNamePlaceholder}
        value={legalName}
        onChangeText={(text) => {
          setLegalName(text);
          if (errors.legalName) setErrors((prev) => ({ ...prev, legalName: '' }));
        }}
        error={errors.legalName}
      />

      <TextField
        label={uz.onboarding.stir}
        placeholder={uz.onboarding.stirPlaceholder}
        value={stir}
        onChangeText={(text) => {
          const digits = text.replace(/\D/g, '').slice(0, 9);
          setStir(digits);
          if (errors.stir) setErrors((prev) => ({ ...prev, stir: '' }));
        }}
        error={errors.stir}
        keyboardType="number-pad"
        maxLength={9}
        hint="9 xonali soliq to‘lovchi identifikatsiya raqami"
      />

      <TextField
        label={uz.onboarding.licenseNumber}
        placeholder={uz.onboarding.licenseNumberPlaceholder}
        value={licenseNumber}
        onChangeText={(text) => {
          setLicenseNumber(text);
          if (errors.licenseNumber) setErrors((prev) => ({ ...prev, licenseNumber: '' }));
        }}
        error={errors.licenseNumber}
        autoCapitalize="characters"
        hint="Yuk tashish faoliyati uchun litsenziya raqami"
      />

      <Select<Region>
        label={uz.onboarding.homeRegion}
        placeholder="Viloyatni tanlang"
        value={homeRegion}
        options={REGION_OPTIONS}
        onChange={(val) => {
          setHomeRegion(val);
          if (errors.homeRegion) setErrors((prev) => ({ ...prev, homeRegion: '' }));
        }}
        error={errors.homeRegion}
        hint="Yuklar asosan shu hudud atrofida moslashtiriladi"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  segmentTextActive: {
    color: '#1a56db',
    fontWeight: '700',
  },
});
