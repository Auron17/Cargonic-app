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
import { DocType, DocumentDto } from '../../src/api/types';
import { useAuth } from '../../src/auth/AuthProvider';
import {
  ErrorBanner,
  PhotoPicker,
  PrimaryButton,
  Screen,
  StatusBadge,
} from '../../src/components';
import { useCopy } from '../../src/i18n';
import { colors } from '../../src/theme';

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
    { docType: 'PASSPORT', title: uz.docTypes.PASSPORT, hint: uz.docHint.PASSPORT, required: true },
    { docType: 'DRIVER_LICENSE', title: uz.docTypes.DRIVER_LICENSE, hint: uz.docHint.DRIVER_LICENSE, required: true },
    { docType: 'DRIVER_PHOTO', title: uz.docTypes.DRIVER_PHOTO, hint: uz.docHint.DRIVER_PHOTO, required: true },
    { docType: 'TECH_PASSPORT', title: uz.docTypes.TECH_PASSPORT, hint: uz.docHint.TECH_PASSPORT, required: true },
    { docType: 'LICENSE_CARD', title: uz.docTypes.LICENSE_CARD, hint: uz.docHint.LICENSE_CARD, required: true },
    { docType: 'VEHICLE_PHOTO', title: uz.docTypes.VEHICLE_PHOTO, hint: uz.docHint.VEHICLE_PHOTO, required: true },
    { docType: 'INSURANCE', title: uz.docTypes.INSURANCE, hint: uz.docHint.INSURANCE, required: false },
  ];

  const [documents, setDocuments] = useState<DocumentDto[]>(profile?.documents || []);
  const [loading, setLoading] = useState(false);
  const [savingDocType, setSavingDocType] = useState<DocType | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const profileId = profile?.id;
  const fallbackDocs = profile?.documents;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const fresh = await carrierApi.getProfile();
        if (!cancelled) {
          setDocuments(fresh.documents ?? []);
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
    (c) => !!documentsMap[c.docType]
  ).length;
  const allRequiredUploaded = uploadedRequiredCount === requiredConfigs.length;

  const handleDocumentUpload = async (docType: DocType, fileKey: string) => {
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

  const handleFinish = async () => {
    if (!allRequiredUploaded) {
      Alert.alert(
        uz.onboarding.docsIncompleteTitle,
        uz.onboarding.missingRequiredDocs
      );
      return;
    }

    await refreshProfile();
    if (profile?.verificationStatus === 'APPROVED') {
      router.replace('/(tabs)/profile');
    } else {
      router.replace('/(onboarding)/status');
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
              : uz.onboarding.sendForReview
          }
          onPress={handleFinish}
          disabled={!allRequiredUploaded}
          accessibilityLabel={
            profile?.verificationStatus === 'APPROVED'
              ? uz.common.save
              : uz.onboarding.sendForReview
          }
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
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {uz.onboarding.stepOf.replace('{{current}}', '3').replace('{{total}}', '3')}
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
        const isSavingThis = savingDocType === config.docType;

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

            {isSavingThis ? (
              <View style={styles.savingBox}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.savingText}>Hujjat saqlanmoqda…</Text>
              </View>
            ) : null}

            <PhotoPicker
              label=""
              value={doc?.fileKey}
              onUploaded={(fileKey) => handleDocumentUpload(config.docType, fileKey)}
              required={config.required}
            />
          </View>
        );
      })}
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
  savingText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});
