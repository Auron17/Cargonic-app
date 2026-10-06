import AsyncStorage from '@react-native-async-storage/async-storage';
import { tripsApi } from '../api/client';
import { LocationPoint } from '../api/types';

export const QUEUE_STORAGE_PREFIX = '@yuk_tracking_queue_';
/** Zavod jonli ko‘rsin: bitta nuqta ham darhol yuboriladi. Offline qolganda navbat yig‘iladi. */
export const MIN_BATCH_SIZE = 1;
export const MAX_BATCH_SIZE = 100;

export function getQueueStorageKey(tripId: string): string {
  return `${QUEUE_STORAGE_PREFIX}${tripId}`;
}

/**
 * Nuqtaning unikal kalitini hisoblash (duplikatlarni aniqlash uchun)
 */
function getPointKey(point: LocationPoint): string {
  return `${point.recordedAt}_${point.lat}_${point.lng}`;
}

/**
 * Sof funksiya: Navbatga yangi koordinata nuqtalarini qo'shish va vaqt bo'yicha saralash.
 */
export function addToQueue(
  currentQueue: LocationPoint[],
  newPoints: LocationPoint[]
): LocationPoint[] {
  if (!newPoints || newPoints.length === 0) {
    return [...currentQueue];
  }

  const existingKeys = new Set(currentQueue.map(getPointKey));
  const uniqueNewPoints: LocationPoint[] = [];

  for (const point of newPoints) {
    const key = getPointKey(point);
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      uniqueNewPoints.push(point);
    }
  }

  const combined = [...currentQueue, ...uniqueNewPoints];

  // recordedAt bo'yicha o'sish tartibida saralash (eng eski nuqta birinchi)
  return combined.sort((a, b) => {
    return new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime();
  });
}

/**
 * Sof funksiya: Navbatdan yuborish uchun ma'lum miqdordagi batchni ajratib olish.
 */
export function takeBatch(
  queue: LocationPoint[],
  batchSize = MAX_BATCH_SIZE
): { batch: LocationPoint[]; remaining: LocationPoint[] } {
  if (queue.length === 0) {
    return { batch: [], remaining: [] };
  }

  const size = Math.max(1, batchSize);
  const batch = queue.slice(0, size);
  const remaining = queue.slice(size);

  return { batch, remaining };
}

/**
 * Sof funksiya: Navbatdan muvaffaqiyatli yuborilgan nuqtalarni olib tashlash.
 */
export function removeFromQueue(
  queue: LocationPoint[],
  sentPoints: LocationPoint[]
): LocationPoint[] {
  if (!sentPoints || sentPoints.length === 0) {
    return [...queue];
  }

  const sentKeys = new Set(sentPoints.map(getPointKey));
  return queue.filter((point) => !sentKeys.has(getPointKey(point)));
}

/**
 * Sof funksiya: Navbat yuborishga tayyorligini tekshirish.
 */
export function isSendableQueue(
  queueLength: number,
  minBatch = MIN_BATCH_SIZE,
  isForce = false
): boolean {
  if (queueLength <= 0) {
    return false;
  }
  return isForce || queueLength >= minBatch;
}

// -------------------------------------------------------------
// AsyncStorage va API bilan ishlash
// -------------------------------------------------------------

export async function loadQueue(tripId: string): Promise<LocationPoint[]> {
  try {
    const json = await AsyncStorage.getItem(getQueueStorageKey(tripId));
    if (!json) {
      return [];
    }
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load tracking queue for trip', tripId, err);
    return [];
  }
}

export async function saveQueue(tripId: string, queue: LocationPoint[]): Promise<void> {
  try {
    const key = getQueueStorageKey(tripId);
    if (queue.length === 0) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(queue));
    }
  } catch (err) {
    console.warn('Failed to save tracking queue for trip', tripId, err);
  }
}

export async function clearQueue(tripId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(getQueueStorageKey(tripId));
  } catch (err) {
    console.warn('Failed to clear tracking queue for trip', tripId, err);
  }
}

/**
 * Yangi nuqtalarni AsyncStorage navbatiga qo'shish va yangilangan navbatni qaytarish.
 */
export async function enqueueLocations(
  tripId: string,
  points: LocationPoint[]
): Promise<LocationPoint[]> {
  const current = await loadQueue(tripId);
  const updated = addToQueue(current, points);
  await saveQueue(tripId, updated);
  return updated;
}

/**
 * Navbatdagi nuqtalarni serverga yuborish (bitta nuqta ham, yoki force).
 * 100 tadan bo'lib yuboriladi va muvaffaqiyatli qabul qilinganlari navbatdan o'chiriladi.
 */
export async function flushQueue(
  tripId: string,
  force = false,
  api: Pick<typeof tripsApi, 'sendLocations'> = tripsApi
): Promise<{ sentCount: number; remainingCount: number }> {
  let queue = await loadQueue(tripId);

  if (!isSendableQueue(queue.length, MIN_BATCH_SIZE, force)) {
    return { sentCount: 0, remainingCount: queue.length };
  }

  let totalSent = 0;

  while (queue.length > 0) {
    if (!force && queue.length < MIN_BATCH_SIZE) {
      break;
    }

    const { batch, remaining } = takeBatch(queue, MAX_BATCH_SIZE);

    try {
      await api.sendLocations(tripId, { points: batch });
      totalSent += batch.length;
      queue = remaining;
      await saveQueue(tripId, queue);
    } catch (err) {
      console.warn('Failed to send location batch for trip', tripId, err);
      // Agar yuborishda xatolik bo'lsa (masalan offline), navbatni saqlab qolamiz va chiqamiz
      break;
    }
  }

  return { sentCount: totalSent, remainingCount: queue.length };
}
