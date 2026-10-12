import React, { useState } from 'react';
import {
  Pressable,
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
  RegistrationLaterButton,
} from '../../src/components';
import { useCopy } from '../../src/i18n';
import { colors } from '../../src/theme';

const REGION_VALUES: Region[] = [
  'TASHKENT_CITY',
  'TASHKENT',
  'ANDIJAN',
  'FERGANA',
  'NAMANGAN',
  'SAMARKAND',
  'BUKHARA',
  'NAVOI',
  'KASHKADARYA',
  'SURKHANDARYA',
  'JIZZAKH',
  'SYRDARYA',
  'KHOREZM',
  'KARAKALPAKSTAN',
];

export default function OnboardingProfileScreen() {
  const uz = useCopy();
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const LEGAL_OPTIONS: SelectOption<LegalType>[] = [
    { label: uz.legalType.YATT, value: 'YATT' },
    { label: uz.legalType.MCHJ, value: 'MCHJ' },
  ];
  const REGION_OPTIONS: SelectOption<Region>[] = REGION_VALUES.map((value) => ({
    label: uz.regions[value],
    value,
  }));

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
      newErrors.fullName = uz.onboarding.errors.fullNameMin;
    }

    if (!legalName.trim()) {
      newErrors.legalName = uz.onboarding.errors.legalNameRequired;
    }

    const cleanStir = stir.replace(/\D/g, '');
    if (cleanStir.length !== 9) {
      newErrors.stir = uz.onboarding.errors.stirDigits;
    }

    if (!licenseNumber.trim()) {
      newErrors.licenseNumber = uz.onboarding.errors.licenseRequired;
    }

    if (!homeRegion) {
      newErrors.homeRegion = uz.onboarding.errors.regionRequired;
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
      if (profile?.verificationStatus === 'APPROVED') {
        router.replace('/(tabs)/profile');
      } else {
        router.push('/(onboarding)/documents');
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setServerError(apiErr?.message || uz.onboarding.errors.profileSaveError);
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
      <View style={styles.topNav}>
        {router.canGoBack() ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={uz.common.back}
          >
            <Text style={styles.backButtonText}>← {uz.common.back}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <RegistrationLaterButton />
      </View>

      {/* Progress & Header */}
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {uz.onboarding.stepOf.replace('{{current}}', '1').replace('{{total}}', '3')}
          </Text>
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
        hint={uz.onboarding.licenseHint}
      />

      <Select<Region>
        label={uz.onboarding.homeRegion}
        placeholder={uz.onboarding.regionPlaceholder}
        value={homeRegion}
        options={REGION_OPTIONS}
        onChange={(val) => {
          setHomeRegion(val);
          if (errors.homeRegion) setErrors((prev) => ({ ...prev, homeRegion: '' }));
        }}
        error={errors.homeRegion}
        hint={uz.onboarding.regionHint}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 32,
  },
  backButton: {
    paddingVertical: 6,
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
    color: colors.primary,
    fontWeight: '700',
  },
});
