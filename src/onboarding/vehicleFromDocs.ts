import type { DocType } from '../api/types';
import { compactPlate, plateProblem } from '../utils/uzPlate';

export type DocExtract = {
  fullName?: string | null;
  documentNumber?: string | null;
  plateNumber?: string | null;
  grossWeightKg?: number | null;
  unladenWeightKg?: number | null;
  tractorUnit?: boolean | null;
};

export type DocsExtracts = Partial<Record<DocType, DocExtract | undefined>>;

export interface VehicleFromDocs {
  plateNumber: string | null;
  capacityTons: number | null;
  fullName: string | null;
  licenseCardNumber: string | null;
  tractorUnit: boolean;
}

export function payloadTons(
  grossKg?: number | null,
  unladenKg?: number | null,
  tractorUnit?: boolean | null,
): number | null {
  if (tractorUnit) return null;
  if (grossKg == null || unladenKg == null) return null;
  if (grossKg <= unladenKg || unladenKg <= 0) return null;
  const tons = (grossKg - unladenKg) / 1000;
  return Math.round(tons * 10) / 10;
}

function readablePlate(raw?: string | null): string | null {
  if (!raw) return null;
  const compact = compactPlate(raw);
  return plateProblem(compact) == null ? compact : null;
}

function text(raw?: string | null): string | null {
  const t = raw?.trim();
  return t ? t : null;
}

export function extractFromCheck(check: { extracted?: DocExtract | null } | null | undefined): DocExtract | undefined {
  const e = check?.extracted;
  if (!e) return undefined;
  return {
    fullName: e.fullName,
    documentNumber: e.documentNumber,
    plateNumber: e.plateNumber,
    grossWeightKg: e.grossWeightKg,
    unladenWeightKg: e.unladenWeightKg,
    tractorUnit: e.tractorUnit,
  };
}

export function vehicleFromDocs(extracts: DocsExtracts): VehicleFromDocs {
  const front = extracts.TECH_PASSPORT;
  const back = extracts.TECH_PASSPORT_BACK;
  const license = extracts.DRIVER_LICENSE;
  const card = extracts.LICENSE_CARD;
  const tractorUnit = Boolean(back?.tractorUnit || front?.tractorUnit);

  return {
    plateNumber: readablePlate(front?.plateNumber) ?? readablePlate(back?.plateNumber),
    capacityTons: payloadTons(back?.grossWeightKg, back?.unladenWeightKg, tractorUnit),
    fullName: text(license?.fullName),
    licenseCardNumber: text(card?.documentNumber) ?? text(front?.documentNumber) ?? text(back?.documentNumber),
    tractorUnit,
  };
}
