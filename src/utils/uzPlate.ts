/** Hozir berilgan (2026-05) O‘zbekiston davlat raqami hudud kodlari. */
export const ISSUED_REGION_CODES = [
  '01', // Toshkent shahri
  '10', // Toshkent viloyati
  '20', // Sirdaryo
  '25', // Jizzax
  '30', // Samarqand
  '40', // Farg‘ona
  '50', // Namangan
  '60', // Andijon
  '70', // Qashqadaryo
  '75', // Surxondaryo
  '80', // Buxoro
  '85', // Navoiy
  '90', // Xorazm
  '95', // Qoraqalpog‘iston
] as const;

const ISSUED = new Set<string>(ISSUED_REGION_CODES);

const PHYSICAL = /^\d{2}[A-Z]\d{3}[A-Z]{2}$/;
const LEGAL = /^\d{2}\d{3}[A-Z]{3}$/;

export type PlateProblem = 'empty' | 'region' | 'invalid';

export function compactPlate(raw: string): string {
  return sanitizeCompact(raw);
}

export function applyPlateInput(raw: string): string {
  return formatUzPlate(sanitizeCompact(raw));
}

export function formatUzPlate(raw: string): string {
  const compact = sanitizeCompact(raw);
  if (!compact) return '';
  if (compact.length <= 2) return compact;
  const region = compact.slice(0, 2);
  const rest = compact.slice(2);
  if (/[A-Z]/.test(rest[0])) {
    const letter = rest[0];
    const digits = rest.slice(1, 4);
    const tail = rest.slice(4, 6);
    return [region, letter, digits, tail].filter(Boolean).join(' ');
  }
  const digits = rest.slice(0, 3);
  const letters = rest.slice(3, 6);
  return [region, digits, letters].filter(Boolean).join(' ');
}

export function plateProblem(raw: string): PlateProblem | null {
  const compact = sanitizeCompact(raw);
  if (!compact) return 'empty';
  if (compact.length >= 2 && !ISSUED.has(compact.slice(0, 2))) return 'region';
  if (compact.length !== 8 || (!PHYSICAL.test(compact) && !LEGAL.test(compact))) {
    return 'invalid';
  }
  return null;
}

function sanitizeCompact(raw: string): string {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let out = '';
  for (const ch of chars) {
    if (out.length >= 8) break;
    const i = out.length;
    if (i < 2) {
      if (/\d/.test(ch)) out += ch;
      continue;
    }
    if (i === 2) {
      if (/[A-Z0-9]/.test(ch)) out += ch;
      continue;
    }
    const physical = /[A-Z]/.test(out[2]);
    if (physical) {
      if (i <= 5 && /\d/.test(ch)) out += ch;
      else if (i >= 6 && /[A-Z]/.test(ch)) out += ch;
    } else if (i <= 4 && /\d/.test(ch)) {
      out += ch;
    } else if (i >= 5 && /[A-Z]/.test(ch)) {
      out += ch;
    }
  }
  return out;
}
