import { statusBadgeLabel } from './StatusBadge';

describe('statusBadgeLabel', () => {
  it('uses bid copy for PENDING, not verification copy', () => {
    expect(statusBadgeLabel('PENDING', 'bid')).toBe('Kutilmoqda');
    expect(statusBadgeLabel('PENDING', 'verification')).toBe('Tekshiruvda');
  });

  it('uses bid copy for REJECTED independently of verification', () => {
    expect(statusBadgeLabel('REJECTED', 'bid')).toBe('Rad etilgan');
    expect(statusBadgeLabel('REJECTED', 'verification')).toBe('Rad etilgan');
  });

  it('labels trip and load DELIVERED', () => {
    expect(statusBadgeLabel('DELIVERED', 'trip')).toBe('Topshirildi');
    expect(statusBadgeLabel('DELIVERED', 'load')).toBe('Topshirildi');
  });

  it('falls back to the raw status when unknown', () => {
    expect(statusBadgeLabel('UNKNOWN', 'trip')).toBe('UNKNOWN');
  });
});
