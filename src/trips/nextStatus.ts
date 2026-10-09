import { TripStatus } from '../api/types';
import { getCopy } from '../i18n/copy';

/**
 * Reys holatlari xaritasi:
 * ASSIGNED -> EN_ROUTE_TO_PICKUP -> AT_PICKUP -> LOADED -> DELIVERED
 * (DELIVERED dan keyin faqat zavod yoki avtomatik COMPLETED ga o'tadi)
 */
export const TRIP_TRANSITIONS: Record<string, TripStatus> = {
  ASSIGNED: 'EN_ROUTE_TO_PICKUP',
  EN_ROUTE_TO_PICKUP: 'AT_PICKUP',
  AT_PICKUP: 'LOADED',
  LOADED: 'DELIVERED',
};

/**
 * Haydovchi amalga oshirishi mumkin bo'lgan keyingi holatni qaytaradi.
 */
export function getNextStatus(currentStatus: TripStatus): TripStatus | null {
  return TRIP_TRANSITIONS[currentStatus] || null;
}

/**
 * Haydovchi berilgan holatga o'ta olishini tekshiradi.
 */
export function canCarrierMove(from: TripStatus, to: TripStatus): boolean {
  return TRIP_TRANSITIONS[from] === to;
}

/**
 * Berilgan holatga o'tish uchun fotosurat talab qilinishini tekshiradi.
 * LOADED va DELIVERED holatlari uchun rasm majburiy.
 */
export function requiresPhoto(toStatus: TripStatus): boolean {
  return toStatus === 'LOADED' || toStatus === 'DELIVERED';
}

export type GeofenceTarget = 'PICKUP' | 'DROPOFF';

/**
 * Geozona yoqilgan yukda holat qaysi manzil yonida o'zgartiriladi (backend GeofenceTarget bilan bir xil):
 * "Yetib keldim" va "Yuk ortildi" — ortish joyida, "Topshirdim" — topshirish manzilida.
 */
export function geofenceTarget(toStatus: TripStatus): GeofenceTarget | null {
  if (toStatus === 'AT_PICKUP' || toStatus === 'LOADED') return 'PICKUP';
  if (toStatus === 'DELIVERED') return 'DROPOFF';
  return null;
}

/** Masofani qisqa ko'rinishda: 850 m, 1,2 km */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

/**
 * Server OUT_OF_ZONE xatosining details qismidan haydovchiga tushunarli xabar yasaydi;
 * details to'liq bo'lmasa null (chaqiruvchi serverning o'z xabarini ko'rsatadi).
 */
export function outOfZoneMessage(details: Record<string, unknown> | undefined): string | null {
  const distance = Number(details?.distanceM);
  const radius = Number(details?.radiusM);
  if (!details || !Number.isFinite(distance) || !Number.isFinite(radius)) return null;
  const copy = getCopy().tripView;
  const template = details.target === 'DROPOFF' ? copy.geofenceOutOfZoneDropoff : copy.geofenceOutOfZonePickup;
  return template.replace('{{distance}}', formatDistance(distance)).replace('{{radius}}', formatDistance(radius));
}

/**
 * Haydovchi reysni bekor qila olishini tekshiradi.
 * Faqat LOADED gacha bo'lgan holatlarda (ASSIGNED, EN_ROUTE_TO_PICKUP, AT_PICKUP) bekor qilish mumkin.
 */
export function cancellableByCarrier(status: TripStatus): boolean {
  return (
    status === 'ASSIGNED' ||
    status === 'EN_ROUTE_TO_PICKUP' ||
    status === 'AT_PICKUP'
  );
}

/**
 * Reys yakuniy holatga yetganini tekshiradi.
 */
export function isFinalStatus(status: TripStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/**
 * Haydovchi uchun reys faol hisoblanishini tekshiradi.
 */
export function isActiveTrip(status: TripStatus): boolean {
  return status !== 'COMPLETED' && status !== 'CANCELLED';
}

/**
 * Fon GPS faqat yuk topshirilgunga qadar. DELIVERED/COMPLETED/CANCELLED da o'chishi kerak —
 * aks holda "Topshirdim"dan keyin ekran kuzatuvni qayta yoqadi.
 */
export function needsGpsTracking(status: TripStatus): boolean {
  return (
    status === 'ASSIGNED' ||
    status === 'EN_ROUTE_TO_PICKUP' ||
    status === 'AT_PICKUP' ||
    status === 'LOADED'
  );
}

/**
 * Keyingi holat uchun haydovchi tugmasi matnini qaytaradi.
 */
export function getStatusActionLabel(nextStatus: TripStatus | null): string {
  const uz = getCopy();
  switch (nextStatus) {
    case 'EN_ROUTE_TO_PICKUP':
      return uz.tripView.actionEnRoute;
    case 'AT_PICKUP':
      return uz.tripView.actionAtPickup;
    case 'LOADED':
      return uz.tripView.actionLoaded;
    case 'DELIVERED':
      return uz.tripView.actionDelivered;
    default:
      return '';
  }
}
