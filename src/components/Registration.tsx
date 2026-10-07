import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthProvider';
import { useCopy } from '../i18n';
import { RegistrationStepKey, registrationProgress } from '../onboarding/registrationProgress';
import { colors, ink } from '../theme';
import { BottomSheet } from './BottomSheet';
import { EmptyState } from './EmptyState';
import { PrimaryButton } from './PrimaryButton';

/** Joriy haydovchining ro'yxatdan o'tish holati */
export function useRegistration() {
  const { profile } = useAuth();
  return registrationProgress(profile);
}

/**
 * Lenta va profil tepasidagi eslatma: tasdiqlanmagan haydovchiga qancha qadam qolganini
 * ko'rsatadi va keyingi ekranga olib boradi. Tasdiqlangan haydovchida ko'rinmaydi.
 */
export function RegistrationBanner() {
  const uz = useCopy();
  const router = useRouter();
  const reg = useRegistration();
  if (reg.state === 'approved') return null;

  const rejected = reg.state === 'rejected';
  const review = reg.state === 'review';
  const title = rejected
    ? uz.registration.bannerRejectedTitle
    : review
      ? uz.registration.bannerReviewTitle
      : uz.registration.bannerTitle;
  const desc = rejected
    ? uz.registration.bannerRejectedDesc
    : review
      ? uz.registration.bannerReviewDesc
      : uz.registration.bannerProgress
          .replace('{{done}}', String(reg.doneCount))
          .replace('{{total}}', String(reg.total));

  return (
    <Pressable
      onPress={() => router.push(reg.nextHref)}
      style={({ pressed }) => [styles.banner, rejected && styles.bannerRejected, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${desc}`}
    >
      <View style={[styles.bannerIcon, rejected && styles.bannerIconRejected]}>
        <Ionicons
          name={rejected ? 'alert-circle' : review ? 'time' : 'id-card'}
          size={20}
          color={rejected ? colors.dangerDark : '#FFFFFF'}
        />
      </View>
      <View style={styles.bannerText}>
        <Text style={[styles.bannerTitle, rejected && styles.bannerTitleRejected]}>{title}</Text>
        <Text style={[styles.bannerDesc, rejected && styles.bannerDescRejected]} numberOfLines={2}>
          {desc}
        </Text>
        {reg.state === 'incomplete' ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(reg.doneCount / reg.total) * 100}%` }]} />
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={rejected ? colors.dangerDark : ink.muted} />
    </Pressable>
  );
}

/** Profili hali yo'q haydovchi uchun Reyslar/Balans tablari o'rnida */
export function RegistrationLocked() {
  const uz = useCopy();
  const router = useRouter();
  const reg = useRegistration();
  return (
    <View style={styles.locked}>
      <EmptyState
        iconName="lock-closed-outline"
        title={uz.registration.lockedTabTitle}
        description={uz.registration.lockedTabDesc}
        actionTitle={uz.registration.continue}
        onAction={() => router.push(reg.nextHref)}
      />
    </View>
  );
}

/** Ro'yxatdan o'tish ekranlaridagi "Keyinroq": kiritilganlar saqlanadi, haydovchi lentaga qaytadi */
export function RegistrationLaterButton() {
  const uz = useCopy();
  const router = useRouter();
  const reg = useRegistration();
  if (reg.state === 'approved') return null;
  return (
    <Pressable
      onPress={() => router.dismissTo('/(tabs)')}
      hitSlop={12}
      style={({ pressed }) => [styles.later, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={uz.registration.later}
    >
      <Text style={styles.laterText}>{uz.registration.later}</Text>
    </Pressable>
  );
}

/**
 * "Olaman" / "Taklif" bosilganda tasdiqlanmagan haydovchiga chiqadigan oyna:
 * qadamlar ro'yxati va davom etish tugmasi.
 */
export function RegistrationSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const uz = useCopy();
  const router = useRouter();
  const reg = useRegistration();
  const waiting = reg.state === 'review';

  const labels: Record<RegistrationStepKey, string> = {
    profile: uz.registration.stepProfile,
    vehicle: uz.registration.stepVehicle,
    documents: uz.registration.stepDocuments,
    review: uz.registration.stepReview,
  };
  const firstOpen = reg.steps.find((s) => !s.done)?.key;

  const go = () => {
    onClose();
    // Modal yopilib bo'lgach o'tamiz, aks holda iOS yangi ekranni oyna ostida ochadi
    setTimeout(() => router.push(reg.nextHref), 350);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={uz.registration.sheetTitle}
      subtitle={waiting ? uz.registration.sheetReviewSubtitle : uz.registration.sheetSubtitle}
    >
      <View style={styles.steps}>
        {reg.steps.map((step, i) => {
          const current = step.key === firstOpen;
          return (
            <View key={step.key} style={styles.step}>
              <View style={[styles.stepDot, step.done && styles.stepDotDone, current && styles.stepDotCurrent]}>
                {step.done ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepNum, current && styles.stepNumCurrent]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, step.done && styles.stepLabelDone, current && styles.stepLabelCurrent]}>
                {labels[step.key]}
              </Text>
            </View>
          );
        })}
      </View>
      <PrimaryButton
        title={waiting ? uz.registration.viewStatus : uz.registration.continue}
        onPress={go}
        accessibilityLabel={waiting ? uz.registration.viewStatus : uz.registration.continue}
      />
      <PrimaryButton title={uz.registration.later} variant="secondary" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },
  locked: { paddingTop: 40 },
  later: { paddingVertical: 6, paddingHorizontal: 4 },
  laterText: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: ink[900],
  },
  bannerRejected: { backgroundColor: colors.danger50, borderWidth: 1, borderColor: colors.dangerLight },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  bannerIconRejected: { backgroundColor: colors.dangerLight },
  bannerText: { flex: 1, minWidth: 0 },
  bannerTitle: { fontSize: 15.5, fontWeight: '700', color: '#FFFFFF' },
  bannerTitleRejected: { color: colors.dangerDark },
  bannerDesc: { marginTop: 2, fontSize: 13, lineHeight: 18, color: ink.muted },
  bannerDescRejected: { color: colors.slate700 },
  progressTrack: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },

  steps: { gap: 12, marginBottom: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slate100,
  },
  stepDotDone: { backgroundColor: colors.success },
  stepDotCurrent: { backgroundColor: colors.primaryLight },
  stepNum: { fontSize: 13, fontWeight: '700', color: colors.slate500 },
  stepNumCurrent: { color: colors.primary },
  stepLabel: { fontSize: 15.5, color: colors.slate700 },
  stepLabelDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  stepLabelCurrent: { color: colors.slate900, fontWeight: '700' },
});
