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
  RegistrationLaterButton,
} from '../../src/components';
import { useCopy } from '../../src/i18n';
import { colors } from '../../src/theme';
import { BODY_TYPE_SPECS, checkCapacity, checkVolume } from '../../src/vehicles/bodyTypeSpecs';
import { applyPlateInput, compactPlate, formatUzPlate, plateProblem } from '../../src/utils/uzPlate';

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

  const [plateNumber, setPlateNumber] = useState(
    existingVehicle?.plateNumber ? formatUzPlate(existingVehicle.plateNumber) : ''
  );
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
  const spec = BODY_TYPE_SPECS[bodyType];
  const rangeText = (template: string, [min, max]: [number, number]) =>
    template.replace('{{min}}', String(min)).replace('{{max}}', String(max));

  const changeBodyType = (val: BodyType) => {
    setBodyType(val);
    // Bortlida hajm yo'q — eski qiymat chalg'itmasin
    if (!BODY_TYPE_SPECS[val].volume) setVolumeM3('');
    setErrors((prev) => ({ ...prev, bodyType: '', capacityTons: '', volumeM3: '' }));
  };

  const applyPreset = (capacity: number, volume?: number) => {
    setCapacityTons(String(capacity));
    setVolumeM3(volume != null ? String(volume) : '');
    setErrors((prev) => ({ ...prev, capacityTons: '', volumeM3: '' }));
  };
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const plateIssue = plateProblem(plateNumber);
    if (plateIssue === 'empty') {
      newErrors.plateNumber = uz.onboarding.errors.plateRequired;
    } else if (plateIssue === 'region') {
      newErrors.plateNumber = uz.onboarding.errors.plateRegionInvalid;
    } else if (plateIssue === 'invalid') {
      newErrors.plateNumber = uz.onboarding.errors.plateInvalid;
    }

    if (!bodyType) {
      newErrors.bodyType = uz.onboarding.errors.bodyTypeRequired;
    }

    // Sig'im va hajm tanlangan kuzov turiga mos bo'lishi kerak
    const capIssue = checkCapacity(bodyType, capacityTons);
    if (capIssue === 'required' || capIssue === 'invalid') {
      newErrors.capacityTons = uz.onboarding.errors.capacityRequired;
    } else if (capIssue === 'range') {
      newErrors.capacityTons = rangeText(uz.vehicleSize.capacityError, spec.capacity);
    }

    const volIssue = checkVolume(bodyType, volumeM3);
    if (volIssue === 'required') {
      newErrors.volumeM3 = uz.vehicleSize.volumeRequired;
    } else if (volIssue === 'invalid') {
      newErrors.volumeM3 = uz.onboarding.errors.volumeInvalid;
    } else if (volIssue === 'range' && spec.volume) {
      newErrors.volumeM3 = rangeText(uz.vehicleSize.volumeError, spec.volume);
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
    const volNum = spec.volume && volumeM3.trim() ? parseFloat(volumeM3.replace(',', '.')) : undefined;

    const payload: VehicleRequest = {
      plateNumber: compactPlate(plateNumber),
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
        <RegistrationLaterButton />
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
          const next = applyPlateInput(text);
          setPlateNumber(next);
          const issue = plateProblem(next);
          if (issue === 'region') {
            setErrors((prev) => ({ ...prev, plateNumber: uz.onboarding.errors.plateRegionInvalid }));
          } else if (errors.plateNumber) {
            setErrors((prev) => ({ ...prev, plateNumber: '' }));
          }
        }}
        error={errors.plateNumber}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={11}
        hint={uz.onboarding.plateHint}
      />

      {/* Body Type */}
      <Select<BodyType>
        label={uz.onboarding.bodyType}
        placeholder={uz.onboarding.bodyTypePlaceholder}
        value={bodyType}
        options={BODY_TYPE_OPTIONS}
        onChange={changeBodyType}
        error={errors.bodyType}
        hint={uz.onboarding.bodyTypeFieldHint}
      />

      {/* Shu kuzov turi uchun odatiy o'lchamlar */}
      <Text style={styles.presetsTitle}>{uz.vehicleSize.presetsTitle}</Text>
      <View style={styles.presets}>
        {spec.presets.map((p) => {
          const selected =
            parseFloat(capacityTons.replace(',', '.')) === p.capacityTons &&
            (p.volumeM3 == null || parseFloat(volumeM3.replace(',', '.')) === p.volumeM3);
          return (
            <Pressable
              key={p.key}
              onPress={() => applyPreset(p.capacityTons, p.volumeM3)}
              style={({ pressed }) => [styles.preset, selected && styles.presetSelected, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.presetName, selected && styles.presetNameSelected]}>
                {uz.vehicleSize.presets[p.key]}
              </Text>
              <Text style={[styles.presetSize, selected && styles.presetSizeSelected]}>
                {p.capacityTons} t{p.volumeM3 != null ? ` · ${p.volumeM3} m³` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
            hint={rangeText(uz.vehicleSize.capacityRange, spec.capacity)}
          />
        </View>

        {spec.volume ? (
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
              hint={rangeText(uz.vehicleSize.volumeRange, spec.volume)}
            />
          </View>
        ) : (
          <View style={[styles.halfCol, styles.noVolume]}>
            <Text style={styles.noVolumeText}>{uz.vehicleSize.flatbedNoVolume}</Text>
          </View>
        )}
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
  pressed: { opacity: 0.8 },
  presetsTitle: { marginTop: -4, marginBottom: 8, fontSize: 13, color: colors.textMuted },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    backgroundColor: colors.surface,
  },
  presetSelected: { borderColor: colors.primary, backgroundColor: colors.primary50 },
  presetName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  presetNameSelected: { color: colors.primary },
  presetSize: { marginTop: 1, fontSize: 12.5, color: colors.textMuted },
  presetSizeSelected: { color: colors.primaryDark },
  noVolume: { justifyContent: 'center', paddingTop: 22 },
  noVolumeText: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
