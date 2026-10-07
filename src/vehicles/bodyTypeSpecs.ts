import type { BodyType } from '../api/types';

/**
 * Kuzov turiga mos sig'im va hajm (backend BodyType.java bilan bir xil).
 * Chegaralar: maxsus ruxsatsiz eni 2.55 m (refrijerator 2.6 m), balandligi 4 m, avtopoyezd 20 m —
 * standart fura ~86–92 m³, "mega" tent ~120 m³ gacha. volume = null — ochiq bortli, hajm qo'llanmaydi.
 */
export type SizePresetKey =
  | 'gazel'
  | 'small'
  | 'medium'
  | 'fura'
  | 'mega'
  | 'heavy'
  | 'kamaz'
  | 'howo'
  | 'semi'
  | 'c20'
  | 'c40'
  | 'c40hc';

export interface SizePreset {
  key: SizePresetKey;
  capacityTons: number;
  volumeM3?: number;
}

export interface BodyTypeSpec {
  capacity: [number, number];
  volume: [number, number] | null;
  presets: SizePreset[];
}

const VAN_PRESETS: SizePreset[] = [
  { key: 'gazel', capacityTons: 1.5, volumeM3: 9 },
  { key: 'small', capacityTons: 5, volumeM3: 22 },
  { key: 'medium', capacityTons: 10, volumeM3: 40 },
  { key: 'fura', capacityTons: 20, volumeM3: 82 },
];

export const BODY_TYPE_SPECS: Record<BodyType, BodyTypeSpec> = {
  TENT: {
    capacity: [0.5, 25],
    volume: [5, 120],
    presets: [
      { key: 'gazel', capacityTons: 1.5, volumeM3: 12 },
      { key: 'small', capacityTons: 5, volumeM3: 30 },
      { key: 'medium', capacityTons: 10, volumeM3: 45 },
      { key: 'fura', capacityTons: 20, volumeM3: 86 },
      { key: 'mega', capacityTons: 22, volumeM3: 110 },
    ],
  },
  REFRIGERATOR: { capacity: [0.5, 25], volume: [4, 95], presets: VAN_PRESETS },
  ISOTHERMAL: { capacity: [0.5, 25], volume: [4, 95], presets: VAN_PRESETS },
  FLATBED: {
    capacity: [0.5, 30],
    volume: null,
    presets: [
      { key: 'small', capacityTons: 5 },
      { key: 'medium', capacityTons: 10 },
      { key: 'fura', capacityTons: 20 },
      { key: 'heavy', capacityTons: 25 },
    ],
  },
  TIPPER: {
    capacity: [3, 40],
    volume: [4, 40],
    presets: [
      { key: 'kamaz', capacityTons: 15, volumeM3: 10 },
      { key: 'howo', capacityTons: 25, volumeM3: 20 },
      { key: 'heavy', capacityTons: 30, volumeM3: 25 },
      { key: 'semi', capacityTons: 35, volumeM3: 32 },
    ],
  },
  CONTAINER: {
    capacity: [10, 30],
    volume: [25, 80],
    presets: [
      { key: 'c20', capacityTons: 24, volumeM3: 33 },
      { key: 'c40', capacityTons: 26, volumeM3: 67 },
      { key: 'c40hc', capacityTons: 26, volumeM3: 76 },
    ],
  },
};

export type SizeIssue = 'required' | 'invalid' | 'range';

/** Kiritilgan matnni tekshiradi; muammo bo'lmasa undefined */
export function checkCapacity(bodyType: BodyType, raw: string): SizeIssue | undefined {
  if (!raw.trim()) return 'required';
  const n = parseFloat(raw.replace(',', '.'));
  if (isNaN(n)) return 'invalid';
  const [min, max] = BODY_TYPE_SPECS[bodyType].capacity;
  return n < min || n > max ? 'range' : undefined;
}

export function checkVolume(bodyType: BodyType, raw: string): SizeIssue | undefined {
  const range = BODY_TYPE_SPECS[bodyType].volume;
  if (!range) return undefined;
  if (!raw.trim()) return 'required';
  const n = parseFloat(raw.replace(',', '.'));
  if (isNaN(n)) return 'invalid';
  return n < range[0] || n > range[1] ? 'range' : undefined;
}
