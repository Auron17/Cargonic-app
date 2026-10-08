import dayjs from 'dayjs';
import type { FeedSort, Region, SavedSearch, SavedSearchRequest } from '../api/types';

export const SEARCH_PAGE_SIZE = 20;

/** Viloyatlar tanlash ro'yxatidagi tartib (ro'yxatdan o'tishdagi kabi) */
export const REGIONS: Region[] = [
  'TASHKENT_CITY',
  'TASHKENT',
  'ANDIJAN',
  'FERGANA',
  'NAMANGAN',
  'SAMARKAND',
  'BUKHARA',
  'NAVOI',
  'KASHKADARYA',
  'SURKHANDARYA',
  'JIZZAKH',
  'SYRDARYA',
  'KHOREZM',
  'KARAKALPAKSTAN',
];

export const SORTS: FeedSort[] = ['DISTANCE', 'PRICE', 'PRICE_PER_KM', 'DATE'];

export type DatePreset = 'ANY' | 'TODAY' | 'TOMORROW' | 'DAYS_3' | 'WEEK';

export const DATE_PRESETS: DatePreset[] = ['ANY', 'TODAY', 'TOMORROW', 'DAYS_3', 'WEEK'];

/**
 * Lentadagi yo'nalish filtri. "Qayerdan" bo'sh — haydovchi atrofi (server standart radius bilan),
 * "Qayerga" bo'sh — istalgan joy. Narxlar so'mda: dollar narxli yuklarni server kurs bilan o'giradi.
 */
export interface RouteFilter {
  fromRegions: Region[];
  toRegions: Region[];
  sort: FeedSort;
  datePreset: DatePreset;
  minPrice?: number;
  minPricePerKm?: number;
}

export const EMPTY_FILTER: RouteFilter = {
  fromRegions: [],
  toRegions: [],
  sort: 'DISTANCE',
  datePreset: 'ANY',
};

/** Filtr bo'sh bo'lsa lenta oddiy /feed dan olinadi (har daqiqada yangilanadi). */
export function isFilterActive(f: RouteFilter): boolean {
  return (
    f.fromRegions.length > 0 ||
    f.toRegions.length > 0 ||
    f.minPrice != null ||
    f.minPricePerKm != null ||
    f.datePreset !== 'ANY' ||
    f.sort !== 'DISTANCE'
  );
}

/** {@code today} — 'YYYY-MM-DD'; natija serverdagi dateFrom/dateTo (ikkalasi ham kiradi). */
export function dateRange(preset: DatePreset, today: string): { dateFrom?: string; dateTo?: string } {
  const start = dayjs(today);
  const days: Record<Exclude<DatePreset, 'ANY'>, [number, number]> = {
    TODAY: [0, 0],
    TOMORROW: [1, 1],
    DAYS_3: [0, 2],
    WEEK: [0, 6],
  };
  if (preset === 'ANY') return {};
  const [from, to] = days[preset];
  return {
    dateFrom: start.add(from, 'day').format('YYYY-MM-DD'),
    dateTo: start.add(to, 'day').format('YYYY-MM-DD'),
  };
}

/**
 * GET /feed/search parametrlari. Viloyatlar vergul bilan birlashtiriladi — axios massivni
 * `a[]=..` ko'rinishida yuboradi, Spring esa `a=X,Y` ni kutadi.
 * {@code coords} — ro'yxatdan o'tmagan haydovchi uchun qurilma joylashuvi.
 */
export function toSearchParams(
  f: RouteFilter,
  today: string,
  page: number,
  coords?: { lat: number; lng: number },
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (f.fromRegions.length > 0) params.fromRegions = f.fromRegions.join(',');
  if (f.toRegions.length > 0) params.toRegions = f.toRegions.join(',');
  if (f.minPrice != null) params.minPrice = f.minPrice;
  if (f.minPricePerKm != null) params.minPricePerKm = f.minPricePerKm;
  Object.assign(params, dateRange(f.datePreset, today));
  params.sort = f.sort;
  if (coords) {
    params.lat = coords.lat;
    params.lng = coords.lng;
  }
  params.page = page;
  params.size = SEARCH_PAGE_SIZE;
  return params;
}

/** Server kamida bitta yo'nalishni talab qiladi; mobil faqat viloyatli yo'nalish saqlaydi. */
export function canSave(f: RouteFilter): boolean {
  return f.fromRegions.length > 0 || f.toRegions.length > 0;
}

export function toSavedSearchRequest(f: RouteFilter): SavedSearchRequest {
  const req: SavedSearchRequest = {
    fromRegions: f.fromRegions,
    toRegions: f.toRegions,
    notificationsEnabled: true,
  };
  if (f.minPrice != null) req.minPrice = f.minPrice;
  if (f.minPricePerKm != null) req.minPricePerKm = f.minPricePerKm;
  return req;
}

export function fromSavedSearch(s: SavedSearch): RouteFilter {
  const f: RouteFilter = { ...EMPTY_FILTER, fromRegions: s.fromRegions, toRegions: s.toRegions };
  if (s.minPrice != null) f.minPrice = s.minPrice;
  if (s.minPricePerKm != null) f.minPricePerKm = s.minPricePerKm;
  return f;
}

/** "Samarqand", "Samarqand +2" yoki bo'sh tanlov nomi */
export function sideLabel(regions: Region[], short: Record<string, string>, empty: string): string {
  if (regions.length === 0) return empty;
  const first = short[regions[0]] ?? regions[0];
  return regions.length > 1 ? `${first} +${regions.length - 1}` : first;
}

/** "Toshkent sh. → Samarqand +1" */
export function routeLabel(
  from: Region[],
  to: Region[],
  short: Record<string, string>,
  labels: { anywhere: string; aroundMe: string },
): string {
  return `${sideLabel(from, short, labels.aroundMe)} → ${sideLabel(to, short, labels.anywhere)}`;
}
