import {
  EMPTY_FILTER,
  canSave,
  dateRange,
  fromSavedSearch,
  isFilterActive,
  routeLabel,
  toSavedSearchRequest,
  toSearchParams,
} from './routeFilter';
import type { SavedSearch } from '../api/types';

const SHORT = { TASHKENT_CITY: 'Toshkent sh.', SAMARKAND: 'Samarqand', BUKHARA: 'Buxoro' } as Record<string, string>;
const LABELS = { anywhere: 'Istalgan joy', aroundMe: 'Atrofim' };

describe('isFilterActive', () => {
  it('bo‘sh filtr faol emas', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
  });

  it('viloyat, narx, sana yoki saralash tanlansa faol', () => {
    expect(isFilterActive({ ...EMPTY_FILTER, toRegions: ['SAMARKAND'] })).toBe(true);
    expect(isFilterActive({ ...EMPTY_FILTER, minPrice: 1_000_000 })).toBe(true);
    expect(isFilterActive({ ...EMPTY_FILTER, datePreset: 'TOMORROW' })).toBe(true);
    expect(isFilterActive({ ...EMPTY_FILTER, sort: 'PRICE' })).toBe(true);
  });
});

describe('dateRange', () => {
  it('tayyor variantlarni sana oralig‘iga aylantiradi', () => {
    expect(dateRange('ANY', '2026-10-08')).toEqual({});
    expect(dateRange('TODAY', '2026-10-08')).toEqual({ dateFrom: '2026-10-08', dateTo: '2026-10-08' });
    expect(dateRange('TOMORROW', '2026-10-08')).toEqual({ dateFrom: '2026-10-09', dateTo: '2026-10-09' });
    expect(dateRange('DAYS_3', '2026-10-30')).toEqual({ dateFrom: '2026-10-30', dateTo: '2026-11-01' });
    expect(dateRange('WEEK', '2026-10-08')).toEqual({ dateFrom: '2026-10-08', dateTo: '2026-10-14' });
  });
});

describe('toSearchParams', () => {
  it('viloyatlarni vergul bilan birlashtiradi (Spring List<Region> uchun)', () => {
    const params = toSearchParams(
      { ...EMPTY_FILTER, fromRegions: ['TASHKENT_CITY'], toRegions: ['SAMARKAND', 'BUKHARA'], sort: 'PRICE' },
      '2026-10-08',
      0,
    );
    expect(params).toEqual({
      fromRegions: 'TASHKENT_CITY',
      toRegions: 'SAMARKAND,BUKHARA',
      sort: 'PRICE',
      page: 0,
      size: 20,
    });
  });

  it('bo‘sh qiymatlarni yubormaydi, narx, sana va joylashuvni qo‘shadi', () => {
    const params = toSearchParams(
      { ...EMPTY_FILTER, minPrice: 3_000_000, minPricePerKm: 8_000, datePreset: 'TODAY' },
      '2026-10-08',
      2,
      { lat: 41.3, lng: 69.24 },
    );
    expect(params).toEqual({
      minPrice: 3_000_000,
      minPricePerKm: 8_000,
      dateFrom: '2026-10-08',
      dateTo: '2026-10-08',
      sort: 'DISTANCE',
      lat: 41.3,
      lng: 69.24,
      page: 2,
      size: 20,
    });
  });
});

describe('saqlangan yo‘nalishlar', () => {
  const saved: SavedSearch = {
    id: 's1',
    fromRegions: ['TASHKENT_CITY'],
    toRegions: ['SAMARKAND', 'BUKHARA'],
    minPrice: 2_000_000,
    notificationsEnabled: true,
    createdAt: '2026-10-08T09:00:00Z',
  };

  it('faqat viloyat tanlanganda saqlash mumkin', () => {
    expect(canSave(EMPTY_FILTER)).toBe(false);
    expect(canSave({ ...EMPTY_FILTER, minPrice: 1 })).toBe(false);
    expect(canSave({ ...EMPTY_FILTER, toRegions: ['SAMARKAND'] })).toBe(true);
  });

  it('filtrdan so‘rov tanasini yasaydi (sana va saralash saqlanmaydi)', () => {
    expect(
      toSavedSearchRequest({ ...EMPTY_FILTER, toRegions: ['SAMARKAND'], minPrice: 2_000_000, sort: 'PRICE' }),
    ).toEqual({ fromRegions: [], toRegions: ['SAMARKAND'], minPrice: 2_000_000, notificationsEnabled: true });
  });

  it('saqlangan yo‘nalishni filtrga qaytaradi', () => {
    expect(fromSavedSearch(saved)).toEqual({
      ...EMPTY_FILTER,
      fromRegions: ['TASHKENT_CITY'],
      toRegions: ['SAMARKAND', 'BUKHARA'],
      minPrice: 2_000_000,
    });
  });

  it('qisqa nom: birinchi viloyat va qolganlar soni', () => {
    expect(routeLabel(saved.fromRegions, saved.toRegions, SHORT, LABELS)).toBe('Toshkent sh. → Samarqand +1');
    expect(routeLabel([], ['BUKHARA'], SHORT, LABELS)).toBe('Atrofim → Buxoro');
    expect(routeLabel(['SAMARKAND'], [], SHORT, LABELS)).toBe('Samarqand → Istalgan joy');
  });
});
