import {
  cleanPhoneNumber,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPhoneDisplay,
} from './format';

describe('format utilities', () => {
  describe('formatMoney', () => {
    it('formats numbers with spaces and so‘m suffix', () => {
      expect(formatMoney(6000000)).toBe('6 000 000 so‘m');
      expect(formatMoney(150000)).toBe('150 000 so‘m');
      expect(formatMoney(500)).toBe('500 so‘m');
    });

    it('rounds floating point amounts', () => {
      expect(formatMoney(1234.56)).toBe('1 235 so‘m');
      expect(formatMoney(1234.2)).toBe('1 234 so‘m');
    });

    it('handles null, undefined, or zero', () => {
      expect(formatMoney(0)).toBe('0 so‘m');
      expect(formatMoney(null)).toBe('0 so‘m');
      expect(formatMoney(undefined)).toBe('0 so‘m');
    });
  });

  describe('formatNumber', () => {
    it('formats plain numbers without currency suffix', () => {
      expect(formatNumber(1250000)).toBe('1 250 000');
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(null)).toBe('0');
    });
  });

  describe('phone formatting', () => {
    it('cleans 9-digit local phone to full +998 format', () => {
      expect(cleanPhoneNumber('901234567')).toBe('+998901234567');
      expect(cleanPhoneNumber('998901234567')).toBe('+998901234567');
      expect(cleanPhoneNumber('+998 90 123 45 67')).toBe('+998901234567');
    });

    it('formats display phone number visually', () => {
      expect(formatPhoneDisplay('901234567')).toBe('+998 (90) 123-45-67');
      expect(formatPhoneDisplay('+998901234567')).toBe('+998 (90) 123-45-67');
      expect(formatPhoneDisplay('90')).toBe('+998 (90');
      expect(formatPhoneDisplay('90123')).toBe('+998 (90) 123');
    });
  });

  describe('dates', () => {
    it('formats valid dates correctly', () => {
      expect(formatDate('2026-10-05T12:00:00Z')).toBe('05.10.2026');
      expect(formatDateTime('2026-10-05T12:30:00Z')).toContain('05.10.2026');
    });

    it('returns dash on invalid or missing dates', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate('')).toBe('—');
      expect(formatDate('invalid-date')).toBe('—');
    });
  });
});
