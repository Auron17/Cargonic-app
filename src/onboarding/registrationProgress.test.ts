import type { DocumentDto, ProfileDto, VehicleDto } from '../api/types';
import { REQUIRED_DOC_TYPES, registrationProgress } from './registrationProgress';

const vehicle = (status: VehicleDto['verificationStatus'] = 'PENDING'): VehicleDto => ({
  id: 'v1',
  plateNumber: '01A123AA',
  bodyType: 'TENT',
  capacityTons: 20,
  licenseCardNumber: 'LK-1',
  verificationStatus: status,
});

const docs = (types = REQUIRED_DOC_TYPES): DocumentDto[] =>
  types.map((docType, i) => ({ id: `d${i}`, docType, fileKey: `k${i}`, status: 'PENDING', createdAt: '2026-10-07' }) as DocumentDto);

const profile = (overrides: Partial<ProfileDto> = {}): ProfileDto =>
  ({
    id: 'c1',
    phone: '+998900000000',
    legalType: 'INDIVIDUAL',
    legalName: 'Test',
    stir: '123456789',
    licenseNumber: 'AA1',
    homeRegion: 'TASHKENT_CITY',
    verificationStatus: 'PENDING',
    ratingAvg: 0,
    ratingCount: 0,
    completedTrips: 0,
    ...overrides,
  }) as ProfileDto;

describe('registrationProgress', () => {
  it('starts at the profile step when nothing is filled', () => {
    const p = registrationProgress(null);
    expect(p.state).toBe('incomplete');
    expect(p.doneCount).toBe(0);
    expect(p.total).toBe(4);
    expect(p.nextHref).toBe('/(onboarding)/profile');
  });

  it('sends to vehicle, then documents', () => {
    expect(registrationProgress(profile()).nextHref).toBe('/(onboarding)/vehicle');
    const withVehicle = registrationProgress(profile({ vehicle: vehicle(), documents: docs(['PASSPORT']) }));
    expect(withVehicle.nextHref).toBe('/(onboarding)/documents');
    expect(withVehicle.doneCount).toBe(2);
  });

  it('is in review when everything is submitted', () => {
    const p = registrationProgress(profile({ vehicle: vehicle(), documents: docs() }));
    expect(p.state).toBe('review');
    expect(p.doneCount).toBe(3);
    expect(p.nextHref).toBe('/(onboarding)/status');
  });

  it('is rejected when the carrier or vehicle is rejected', () => {
    expect(registrationProgress(profile({ verificationStatus: 'REJECTED', vehicle: vehicle() })).state).toBe('rejected');
    expect(registrationProgress(profile({ vehicle: vehicle('REJECTED'), documents: docs() })).state).toBe('rejected');
  });

  it('is approved only when both carrier and vehicle are approved', () => {
    expect(
      registrationProgress(profile({ verificationStatus: 'APPROVED', vehicle: vehicle('PENDING'), documents: docs() })).state,
    ).toBe('review');
    const p = registrationProgress(profile({ verificationStatus: 'APPROVED', vehicle: vehicle('APPROVED'), documents: docs() }));
    expect(p.state).toBe('approved');
    expect(p.doneCount).toBe(4);
  });
});
