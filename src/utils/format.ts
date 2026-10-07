import dayjs from 'dayjs';

/**
 * Pul summasini formatlaydi: `6 000 000 so‘m`
 */
export function formatMoney(amount: number | null | undefined, currency: 'UZS' | 'USD' = 'UZS'): string {
  const unit = currency === 'USD' ? '$' : 'so‘m';
  if (amount == null || isNaN(amount)) {
    return `0 ${unit}`;
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${unit}`;
}

/**
 * Faqat raqamni formatlaydi: `6 000 000`
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return '0';
  }
  const rounded = Math.round(value);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Sanani formatlaydi: `DD.MM.YYYY`
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const parsed = dayjs(dateString);
  if (!parsed.isValid()) return '—';
  return parsed.format('DD.MM.YYYY');
}

/** Server vaqti `08:00:00` → `08:00` */
export function formatTimeShort(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : '';
}

/** Ortish sanasi va (bo'lsa) vaqt oralig'i: `07.10.2026, 08:00–12:00` */
export function formatPickupWindow(date: string, from?: string | null, to?: string | null): string {
  const window = from && to ? `, ${formatTimeShort(from)}–${formatTimeShort(to)}` : '';
  return `${formatDate(date)}${window}`;
}

/**
 * Sana va vaqtni formatlaydi: `DD.MM.YYYY HH:mm`
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const parsed = dayjs(dateString);
  if (!parsed.isValid()) return '—';
  return parsed.format('DD.MM.YYYY HH:mm');
}

/**
 * Telefon raqamini xavfsiz tozalaydi: `+998901234567`
 */
export function cleanPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  return raw.startsWith('+') ? raw : `+${digits}`;
}

/**
 * Telefon raqamini vizual chiroyli formatlaydi: `+998 (90) 123-45-67`
 */
export function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('998')) {
    local = local.slice(3);
  }
  local = local.slice(0, 9);

  let result = '+998';
  if (local.length > 0) {
    result += ` (${local.slice(0, 2)}`;
  }
  if (local.length > 2) {
    result += `) ${local.slice(2, 5)}`;
  }
  if (local.length > 5) {
    result += `-${local.slice(5, 7)}`;
  }
  if (local.length > 7) {
    result += `-${local.slice(7, 9)}`;
  }
  return result;
}
