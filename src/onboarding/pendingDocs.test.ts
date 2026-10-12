import { FRAMED_DOC_TYPES } from './documentFrame';
import { canOpenVehicle, extractsOf, framedCaptured, upsertPending, type PendingDoc } from './pendingDocs';

const doc = (docType: PendingDoc['docType'], extra: Partial<PendingDoc> = {}): PendingDoc => ({
  docType,
  fileKey: `k-${docType}`,
  ...extra,
});

describe('upsertPending', () => {
  it('replaces the same doc type and keeps others', () => {
    const first = upsertPending([], doc('TECH_PASSPORT', { fileKey: 'old' }));
    const next = upsertPending(first, doc('TECH_PASSPORT', { fileKey: 'new', extracted: { plateNumber: '01A202AA' } }));
    expect(next).toHaveLength(1);
    expect(next[0].fileKey).toBe('new');
    expect(extractsOf(next).TECH_PASSPORT?.plateNumber).toBe('01A202AA');
  });
});

describe('canOpenVehicle', () => {
  it('needs all four framed sides even if the plate was not read yet', () => {
    const withoutPlate = FRAMED_DOC_TYPES.map((t) => doc(t));
    expect(framedCaptured(withoutPlate)).toBe(true);
    expect(canOpenVehicle(withoutPlate)).toBe(true);
  });

  it('is false until every framed side is captured', () => {
    expect(canOpenVehicle([doc('DRIVER_LICENSE'), doc('TECH_PASSPORT', { extracted: { plateNumber: '01A202AA' } })])).toBe(
      false,
    );
  });
});
