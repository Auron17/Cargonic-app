import { TripStatus } from '../api/types';

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
 * Keyingi holat uchun haydovchi tugmasi matnini qaytaradi.
 */
export function getStatusActionLabel(nextStatus: TripStatus | null): string {
  switch (nextStatus) {
    case 'EN_ROUTE_TO_PICKUP':
      return 'Yo‘lga chiqdim';
    case 'AT_PICKUP':
      return 'Yetib keldim';
    case 'LOADED':
      return 'Yuk ortildi';
    case 'DELIVERED':
      return 'Topshirdim';
    default:
      return '';
  }
}
