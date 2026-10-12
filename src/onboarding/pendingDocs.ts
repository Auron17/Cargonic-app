import type { DocType } from '../api/types';
import { FRAMED_DOC_TYPES } from './documentFrame';
import { type DocExtract, type DocsExtracts } from './vehicleFromDocs';

export const VEHICLE_OWNED_DOCS: readonly DocType[] = [
  'TECH_PASSPORT',
  'TECH_PASSPORT_BACK',
  'LICENSE_CARD',
  'VEHICLE_PHOTO',
];

export interface PendingDoc {
  docType: DocType;
  fileKey: string;
  extracted?: DocExtract;
}

export function upsertPending(list: PendingDoc[], next: PendingDoc): PendingDoc[] {
  return [...list.filter((d) => d.docType !== next.docType), next];
}

export function extractsOf(list: PendingDoc[]): DocsExtracts {
  const out: DocsExtracts = {};
  for (const d of list) {
    if (d.extracted) out[d.docType] = d.extracted;
  }
  return out;
}

export function framedCaptured(list: PendingDoc[]): boolean {
  const types = new Set(list.map((d) => d.docType));
  return FRAMED_DOC_TYPES.every((t) => types.has(t));
}

export function canOpenVehicle(list: PendingDoc[]): boolean {
  return framedCaptured(list);
}
