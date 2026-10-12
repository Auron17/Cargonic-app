import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { carrierApi } from '../../src/api/client';
import { AiCheckDto, DocType, DocumentDto } from '../../src/api/types';
import { useAuth } from '../../src/auth/AuthProvider';
import {
  BottomSheet,
  ErrorBanner,
  PhotoPicker,
  PrimaryButton,
  Screen,
  StatusBadge,
  RegistrationLaterButton,
} from '../../src/components';
import { Ionicons } from '@expo/vector-icons';
import { useCopy } from '../../src/i18n';
import { colors } from '../../src/theme';
import { isFramedDocType } from '../../src/onboarding/documentFrame';
import {
  canOpenVehicle,
  upsertPending,
  VEHICLE_OWNED_DOCS,
  type PendingDoc,
} from '../../src/onboarding/pendingDocs';
import { clearPending, loadPending, savePending } from '../../src/onboarding/pendingDocsStorage';
import { extractFromCheck } from '../../src/onboarding/vehicleFromDocs';

interface DocConfig {
  docType: DocType;
  title: string;
  hint: string;
  required: boolean;
}

export default function OnboardingDocumentsScreen() {
  const uz = useCopy();
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const DOCUMENT_CONFIGS: DocConfig[] = [
    { docType: 'DRIVER_LICENSE', title: uz.docTypes.DRIVER_LICENSE, hint: uz.docHint.DRIVER_LICENSE, required: true },
    { docType: 'DRIVER_LICENSE_BACK', title: uz.docTypes.DRIVER_LICENSE_BACK, hint: uz.docHint.DRIVER_LICENSE_BACK, required: true },
    { docType: 'DRIVER_PHOTO', title: uz.docTypes.DRIVER_PHOTO, hint: uz.docHint.DRIVER_PHOTO, required: true },
    { docType: 'TECH_PASSPORT', title: uz.docTypes.TECH_PASSPORT, hint: uz.docHint.TECH_PASSPORT, required: true },
    { docType: 'TECH_PASSPORT_BACK', title: uz.docTypes.TECH_PASSPORT_BACK, hint: uz.docHint.TECH_PASSPORT_BACK, required: true },
    { docType: 'VEHICLE_PHOTO', title: uz.docTypes.VEHICLE_PHOTO, hint: uz.docHint.VEHICLE_PHOTO, required: true },
    { docType: 'PASSPORT', title: uz.docTypes.PASSPORT, hint: uz.docHint.PASSPORT, required: false },
    { docType: 'LICENSE_CARD', title: uz.docTypes.LICENSE_CARD, hint: uz.docHint.LICENSE_CARD, required: false },
    { docType: 'INSURANCE', title: uz.docTypes.INSURANCE, hint: uz.docHint.INSURANCE, required: false },
    { docType: 'INTERNATIONAL_LICENSE', title: uz.docTypes.INTERNATIONAL_LICENSE, hint: uz.docHint.INTERNATIONAL_LICENSE, required: false },
  ];

  const [documents, setDocuments] = useState<DocumentDto[]>(profile?.documents || []);
  const [loading, setLoading] = useState(false);
  const [savingDocType, setSavingDocType] = useState<DocType | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // AI tekshiruvi: qaysi hujjat tekshirilyapti, oxirgi natijalar va haydovchi qaror qilishi kerak bo'lgan rasm
  const [checkingDocType, setCheckingDocType] = useState<DocType | null>(null);
  const [aiChecks, setAiChecks] = useState<Partial<Record<DocType, AiCheckDto>>>({});
  const [review, setReview] = useState<{ docType: DocType; fileKey: string; check: AiCheckDto } | null>(null);
  // "Qayta olish"da PhotoPicker'ni eski holatiga qaytarish uchun
  const [pickerResets, setPickerResets] = useState<Partial<Record<DocType, number>>>({});
  const [pending, setPending] = useState<PendingDoc[]>([]);

  const profileId = profile?.id;
  const fallbackDocs = profile?.documents;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [fresh, stored] = await Promise.all([carrierApi.getProfile(), loadPending()]);
        if (!cancelled) {
          setDocuments(fresh.documents ?? []);
          setPending(stored);
        }
      } catch {
        if (!cancelled && fallbackDocs) {
          setDocuments(fallbackDocs);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // profileId: qayta fetch faqat boshqa profilga o‘tganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  // Build map of latest document by docType
  const documentsMap: Partial<Record<DocType, DocumentDto>> = {};
  for (const doc of documents) {
    const existing = documentsMap[doc.docType];
    if (!existing || new Date(doc.createdAt) >= new Date(existing.createdAt)) {
      documentsMap[doc.docType] = doc;
    }
  }

  // Check required docs count
  const requiredConfigs = DOCUMENT_CONFIGS.filter((c) => c.required);
  const uploadedRequiredCount = requiredConfigs.filter(
    (c) => !!documentsMap[c.docType] || pending.some((p) => p.docType === c.docType)
  ).length;
  const allRequiredUploaded = uploadedRequiredCount === requiredConfigs.length;

  const attachDocument = async (docType: DocType, fileKey: string) => {
    setSavingDocType(docType);
    setServerError(null);

    try {
      const savedDoc = await carrierApi.uploadDocument({ docType, fileKey });
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.docType !== docType);
        return [...filtered, savedDoc];
      });
      await refreshProfile();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setServerError(
        apiErr?.message || uz.onboarding.docAttachError
      );
    } finally {
      setSavingDocType(null);
    }
  };

  const rememberPending = async (docType: DocType, fileKey: string, check: AiCheckDto | null) => {
    const next = upsertPending(pending, {
      docType,
      fileKey,
      extracted: extractFromCheck(check),
    });
    setPending(next);
    await savePending(next);
  };

  const commitDocument = async (docType: DocType, fileKey: string, check: AiCheckDto | null) => {
    await rememberPending(docType, fileKey, check);
    const needsVehicle = (VEHICLE_OWNED_DOCS as readonly string[]).includes(docType);
    if (needsVehicle && !profile?.vehicle) {
      return;
    }
    await attachDocument(docType, fileKey);
    const name = check?.extracted?.fullName?.trim();
    if (docType === 'DRIVER_LICENSE' && name && profile) {
      try {
        await carrierApi.updateProfile({
          fullName: name,
          legalType: profile.legalType,
          legalName: profile.legalName,
          stir: profile.stir,
          licenseNumber: profile.licenseNumber,
          homeRegion: profile.homeRegion,
        });
        await refreshProfile();
      } catch {
        // Ism yangilanmasa ham hujjat saqlanadi
      }
    }
  };

  /** Rasm yuklangach: avval AI tekshiradi, muammo bo'lsa haydovchidan so'raydi, aks holda darhol biriktiradi */
  const handleDocumentUpload = async (docType: DocType, fileKey: string) => {
    setCheckingDocType(docType);
    let check: AiCheckDto | null = null;
    try {
      check = await carrierApi.checkDocument({ docType, fileKey });
    } catch {
      // Tekshiruv ishlamasa ham hujjat yuklanadi — admin baribir ko'radi
    } finally {
      setCheckingDocType(null);
    }
    setAiChecks((prev) => ({ ...prev, [docType]: check ?? undefined }));
    if (check && (check.verdict === 'WARN' || check.verdict === 'FAIL')) {
      setReview({ docType, fileKey, check });
      return;
    }
    await commitDocument(docType, fileKey, check);
  };

  const retake = () => {
    if (!review) return;
    const { docType } = review;
    setReview(null);
    setAiChecks((prev) => ({ ...prev, [docType]: undefined }));
    setPickerResets((prev) => ({ ...prev, [docType]: (prev[docType] ?? 0) + 1 }));
  };

  const uploadAnyway = () => {
    if (!review) return;
    const { docType, fileKey, check } = review;
    setReview(null);
    void commitDocument(docType, fileKey, check);
  };

  const handleFinish = async () => {
    if (!profile?.vehicle) {
      if (!canOpenVehicle(pending)) {
        Alert.alert(uz.onboarding.docsIncompleteTitle, uz.onboarding.vehicleNeedDocs);
        return;
      }
      router.push('/(onboarding)/vehicle');
      return;
    }

    if (!allRequiredUploaded) {
      Alert.alert(
        uz.onboarding.docsIncompleteTitle,
        uz.onboarding.missingRequiredDocs
      );
      return;
    }

    await clearPending();
    await refreshProfile();
    if (profile?.verificationStatus === 'APPROVED') {
      router.replace('/(tabs)/profile');
    } else {
      router.replace('/(onboarding)/status');
    }
  };

  const hasVehicle = !!profile?.vehicle;
  const bottomTitle = !hasVehicle
    ? uz.onboarding.goToVehicle
    : profile?.verificationStatus === 'APPROVED'
      ? uz.common.save
      : uz.onboarding.sendForReview;
  const bottomDisabled = !hasVehicle ? !canOpenVehicle(pending) : !allRequiredUploaded;

  return (
    <Screen
      scrollable
      bottomAction={
        <PrimaryButton
          title={bottomTitle}
          onPress={handleFinish}
          disabled={bottomDisabled}
          accessibilityLabel={bottomTitle}
        />
      }
    >
      {/* Top Navigation */}
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {uz.onboarding.stepOf.replace('{{current}}', '2').replace('{{total}}', '3')}
          </Text>
        </View>
        <Text style={styles.title}>{uz.onboarding.documentsTitle}</Text>
        <Text style={styles.lead}>{uz.onboarding.documentsLead}</Text>

        <View style={styles.progressCounter}>
          <Text style={[styles.counterText, allRequiredUploaded ? styles.counterDone : styles.counterPending]}>
            {uz.onboarding.requiredDocsCount
              .replace('{{uploaded}}', String(uploadedRequiredCount))
              .replace('{{total}}', String(requiredConfigs.length))}
          </Text>
        </View>
      </View>

      <View style={styles.consentBox}>
        <Ionicons name="sparkles-outline" size={16} color={colors.slate500} />
        <Text style={styles.consentText}>{uz.aiCheck.consent}</Text>
      </View>

      <ErrorBanner message={serverError} onDismiss={() => setServerError(null)} />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>{uz.common.loading}</Text>
        </View>
      ) : null}

      {/* Document Items */}
      {DOCUMENT_CONFIGS.map((config) => {
        const doc = documentsMap[config.docType];
        const pendingDoc = pending.find((p) => p.docType === config.docType);
        const isSavingThis = savingDocType === config.docType;
        const isCheckingThis = checkingDocType === config.docType;
        const check = aiChecks[config.docType];
        const needsVehicleFirst = !hasVehicle && config.docType === 'VEHICLE_PHOTO';
        const framed = isFramedDocType(config.docType);

        return (
          <View key={config.docType} style={styles.docCard}>
            <View style={styles.docHeader}>
              <View style={styles.docTitleCol}>
                <Text style={styles.docTitle}>
                  {config.title}{' '}
                  {config.required ? <Text style={styles.requiredStar}>*</Text> : null}
                </Text>
                <Text style={styles.docHint}>{config.hint}</Text>
              </View>

              {doc ? (
                <StatusBadge kind="verification" status={doc.status} />
              ) : pendingDoc ? (
                <View style={[styles.unloadedBadge, styles.pendingBadge]}>
                  <Text style={[styles.unloadedText, styles.pendingText]}>
                    {uz.aiCheck.okLine}
                  </Text>
                </View>
              ) : (
                <View style={styles.unloadedBadge}>
                  <Text style={styles.unloadedText}>
                    {uz.onboarding.docStatus.notUploaded}
                  </Text>
                </View>
              )}
            </View>

            {doc?.status === 'REJECTED' && doc.rejectReason ? (
              <View style={styles.rejectReasonBox}>
                <Text style={styles.rejectReasonTitle}>Rad etish sababi:</Text>
                <Text style={styles.rejectReasonText}>{doc.rejectReason}</Text>
              </View>
            ) : null}

            {isCheckingThis ? (
              <View style={styles.savingBox}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.savingText}>{uz.aiCheck.checking}</Text>
              </View>
            ) : null}

            {!isCheckingThis && check && check.verdict !== 'SKIPPED' && (doc?.fileKey === check.fileKey || pendingDoc?.fileKey === check.fileKey) ? (
              <AiCheckLine check={check} />
            ) : null}

            {isSavingThis ? (
              <View style={styles.savingBox}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.savingText}>Hujjat saqlanmoqda…</Text>
              </View>
            ) : null}

            {needsVehicleFirst ? (
              <Text style={styles.docHint}>{uz.onboarding.waitForVehiclePhoto}</Text>
            ) : (
              <PhotoPicker
                key={`${config.docType}-${pickerResets[config.docType] ?? 0}`}
                label={config.title}
                value={doc?.fileKey || pendingDoc?.fileKey}
                onUploaded={(fileKey) => handleDocumentUpload(config.docType, fileKey)}
                required={config.required}
                mode={framed ? 'framed' : 'any'}
                showLabel={false}
              />
            )}
          </View>
        );
      })}

      <BottomSheet
        visible={!!review}
        onClose={retake}
        title={review?.check.verdict === 'FAIL' ? uz.aiCheck.failTitle : uz.aiCheck.warnTitle}
        subtitle={uz.aiCheck.subtitle}
      >
        <View style={styles.issueList}>
          {review?.check.issues.map((issue) => (
            <View key={issue} style={styles.issueRow}>
              <Ionicons name="alert-circle" size={18} color={colors.warningDark} />
              <Text style={styles.issueText}>{uz.aiCheck.issues[issue]}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton
          title={uz.aiCheck.retake}
          onPress={retake}
          icon={<Ionicons name="camera" size={16} color="#FFFFFF" />}
        />
        <PrimaryButton title={uz.aiCheck.uploadAnyway} variant="secondary" onPress={uploadAnyway} />
      </BottomSheet>
    </Screen>
  );
}

/** Hujjat kartasidagi qisqa AI xulosasi: "✓ Rasm aniq · Raqam 01A202AA · Muddati 12.03.2027" */
function AiCheckLine({ check }: { check: AiCheckDto }) {
  const uz = useCopy();
  if (check.verdict === 'OK') {
    const e = check.extracted;
    const parts = [
      e?.plateNumber ? `${uz.aiCheck.plate} ${e.plateNumber}` : null,
      e?.documentNumber && !e.plateNumber ? `${uz.aiCheck.number} ${e.documentNumber}` : null,
      e?.expiryDate ? `${uz.aiCheck.expiry} ${e.expiryDate.split('-').reverse().join('.')}` : null,
    ].filter(Boolean);
    return (
      <View style={styles.aiLine}>
        <Ionicons name="checkmark-circle" size={16} color={colors.successDark} />
        <Text style={[styles.aiLineText, styles.aiLineOk]} numberOfLines={2}>
          {[uz.aiCheck.okLine, ...parts].join(' · ')}
        </Text>
      </View>
    );
  }
  const first = check.issues[0];
  return (
    <View style={styles.aiLine}>
      <Ionicons name="warning" size={16} color={colors.warningDark} />
      <Text style={[styles.aiLineText, styles.aiLineWarn]} numberOfLines={2}>
        {uz.aiCheck.warnLine.replace('{{issue}}', first ? uz.aiCheck.issues[first] : '')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 12,
  },
  progressCounter: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'flex-start',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  counterPending: {
    color: '#d97706',
    fontWeight: '800',
  },
  counterDone: {
    color: '#16a34a',
    fontWeight: '800',
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  docCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  docTitleCol: {
    flex: 1,
    paddingRight: 10,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  requiredStar: {
    color: '#dc2626',
  },
  docHint: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  unloadedBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unloadedText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#dcfce7',
  },
  pendingText: {
    color: '#166534',
  },
  rejectReasonBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  rejectReasonTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 2,
  },
  rejectReasonText: {
    fontSize: 13,
    color: '#7f1d1d',
  },
  savingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  consentBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
  },
  consentText: { flex: 1, fontSize: 12.5, lineHeight: 17, color: colors.slate600 },
  aiLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiLineText: { flex: 1, fontSize: 13, fontWeight: '600' },
  aiLineOk: { color: colors.successDark },
  aiLineWarn: { color: colors.warningDark },
  issueList: { gap: 10, marginBottom: 4 },
  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  issueText: { flex: 1, fontSize: 15, color: colors.slate800 },
  savingText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});
