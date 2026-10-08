import type { DocType, ProfileDto } from '../api/types';

/** Backend'dagi CARRIER_REQUIRED_DOCS + VEHICLE_REQUIRED_DOCS bilan bir xil (pasport va litsenziya ixtiyoriy) */
export const REQUIRED_DOC_TYPES: DocType[] = [
  'DRIVER_LICENSE',
  'DRIVER_LICENSE_BACK',
  'DRIVER_PHOTO',
  'TECH_PASSPORT',
  'TECH_PASSPORT_BACK',
  'VEHICLE_PHOTO',
];

export type RegistrationStepKey = 'profile' | 'vehicle' | 'documents' | 'review';

/**
 * incomplete — haydovchi hali biror qadamni to'ldirmagan;
 * review — hammasi yuborilgan, admin tekshiryapti;
 * rejected — admin rad etgan, tuzatish kerak;
 * approved — yuk olish ochiq.
 */
export type RegistrationState = 'incomplete' | 'review' | 'rejected' | 'approved';

export type RegistrationHref =
  | '/(onboarding)/profile'
  | '/(onboarding)/vehicle'
  | '/(onboarding)/documents'
  | '/(onboarding)/status';

export interface RegistrationProgress {
  steps: { key: RegistrationStepKey; done: boolean }[];
  doneCount: number;
  total: number;
  state: RegistrationState;
  /** Haydovchi keyingi bosishda qaysi ekranga borishi kerak */
  nextHref: RegistrationHref;
}

export function registrationProgress(profile: ProfileDto | null | undefined): RegistrationProgress {
  const hasProfile = !!profile;
  const hasVehicle = !!profile?.vehicle;
  const uploaded = new Set((profile?.documents ?? []).map((d) => d.docType));
  const hasDocuments = REQUIRED_DOC_TYPES.every((t) => uploaded.has(t));
  const approved =
    profile?.verificationStatus === 'APPROVED' && profile.vehicle?.verificationStatus === 'APPROVED';
  const rejected =
    profile?.verificationStatus === 'REJECTED' || profile?.vehicle?.verificationStatus === 'REJECTED';

  const steps: RegistrationProgress['steps'] = [
    { key: 'profile', done: hasProfile },
    { key: 'vehicle', done: hasVehicle },
    { key: 'documents', done: hasDocuments },
    { key: 'review', done: approved },
  ];

  let state: RegistrationState;
  if (approved) state = 'approved';
  else if (rejected) state = 'rejected';
  else if (hasProfile && hasVehicle && hasDocuments) state = 'review';
  else state = 'incomplete';

  let nextHref: RegistrationHref;
  if (!hasProfile) nextHref = '/(onboarding)/profile';
  else if (!hasVehicle) nextHref = '/(onboarding)/vehicle';
  else if (!hasDocuments) nextHref = '/(onboarding)/documents';
  else nextHref = '/(onboarding)/status';

  return {
    steps,
    doneCount: steps.filter((s) => s.done).length,
    total: steps.length,
    state,
    nextHref,
  };
}
