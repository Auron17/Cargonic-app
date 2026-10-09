import type { TripStatus } from '../api/types';
import { needsGpsTracking } from '../trips/nextStatus';

/** Ro'yxatda GPS kerak bo'lgan reys yo'q — fon kuzatuvi o'chishi kerak. */
export function shouldStopIdleGps(trips: { status: TripStatus }[] | undefined): boolean {
  if (!trips) {
    return false;
  }
  return !trips.some((t) => needsGpsTracking(t.status));
}
