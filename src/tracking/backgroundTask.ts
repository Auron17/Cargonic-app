import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LocationPoint } from '../api/types';
import { enqueueLocations, flushQueue } from './queue';

export const BACKGROUND_LOCATION_TASK = 'YUK_PLATFORMA_BACKGROUND_LOCATION';
export const ACTIVE_TRIP_STORAGE_KEY = '@yuk_active_trip_id';

/**
 * Faol reys ID sini saqlash
 */
export async function setActiveTripId(tripId: string | null): Promise<void> {
  try {
    if (tripId) {
      await AsyncStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, tripId);
    } else {
      await AsyncStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to set active trip ID', err);
  }
}

/**
 * Saqlangan faol reys ID sini olish
 */
export async function getActiveTripId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_TRIP_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to get active trip ID', err);
    return null;
  }
}

/**
 * Fon rejimida joylashuv yangilanishlarini qabul qiluvchi TaskManager vazifasi.
 * Bu modul yuklanganda global tarzda ro'yxatdan o'tishi shart.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('Background location task error:', error.message);
    return;
  }

  if (!data) {
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) {
    return;
  }

  const activeTripId = await getActiveTripId();
  if (!activeTripId) {
    // Agar faol reys bo'lmasa, fondagi yangilanishni to'xtatish maqsadga muvofiq
    try {
      const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (isStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch {
      // ignore
    }
    return;
  }

  const points: LocationPoint[] = locations.map((loc) => ({
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    speedKmh:
      loc.coords.speed != null && loc.coords.speed >= 0
        ? Math.round(loc.coords.speed * 3.6 * 10) / 10
        : undefined,
    heading:
      loc.coords.heading != null && loc.coords.heading >= 0
        ? Math.round(loc.coords.heading)
        : undefined,
    recordedAt: new Date(loc.timestamp).toISOString(),
  }));

  const updatedQueue = await enqueueLocations(activeTripId, points);

  // Kamida 5 ta nuqta yig'ilganda serverga yuborish
  if (updatedQueue.length >= 5) {
    await flushQueue(activeTripId, false);
  }
});

/**
 * Joylashuv ruxsatlarini tekshirish
 */
export async function checkLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  try {
    const fg = await Location.getForegroundPermissionsAsync();
    const bg = await Location.getBackgroundPermissionsAsync();
    return {
      foreground: fg.status === 'granted',
      background: bg.status === 'granted',
    };
  } catch (err) {
    console.warn('Failed to check location permissions', err);
    return { foreground: false, background: false };
  }
}

/**
 * Avval foreground, so'ng background ruxsatini so'rash
 */
export async function requestLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  try {
    let fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      fg = await Location.requestForegroundPermissionsAsync();
    }

    if (fg.status !== 'granted') {
      return { foreground: false, background: false };
    }

    let bg = await Location.getBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      bg = await Location.requestBackgroundPermissionsAsync();
    }

    return {
      foreground: fg.status === 'granted',
      background: bg.status === 'granted',
    };
  } catch (err) {
    console.warn('Failed to request location permissions', err);
    return { foreground: false, background: false };
  }
}

/**
 * Fon rejimida kuzatuv faolligini tekshirish
 */
export async function isTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    return false;
  }
}

/**
 * Reys uchun fon kuzatuvini boshlash (ASSIGNED bo'lganda chaqiriladi)
 */
export async function startTracking(tripId: string): Promise<boolean> {
  await setActiveTripId(tripId);

  try {
    const permissions = await checkLocationPermissions();
    if (!permissions.foreground || !permissions.background) {
      const requested = await requestLocationPermissions();
      if (!requested.foreground) {
        console.warn('Foreground location permission not granted, tracking cannot start');
        return false;
      }
    }

    const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (!isStarted) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // har 30 soniya
        distanceInterval: 200, // yoki 200 metr
        foregroundService: {
          notificationTitle: 'yuk-platforma',
          notificationBody: 'Reys kuzatilmoqda',
          notificationColor: '#1a56db',
          killServiceOnDestroy: false,
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });
    }

    // Boshlang'ich nuqtani darhol navbatga qo'shishga harakat qilish
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (current?.coords) {
        await enqueueLocations(tripId, [
          {
            lat: current.coords.latitude,
            lng: current.coords.longitude,
            speedKmh:
              current.coords.speed != null && current.coords.speed >= 0
                ? Math.round(current.coords.speed * 3.6 * 10) / 10
                : undefined,
            heading:
              current.coords.heading != null && current.coords.heading >= 0
                ? Math.round(current.coords.heading)
                : undefined,
            recordedAt: new Date(current.timestamp).toISOString(),
          },
        ]);
      }
    } catch (posErr) {
      console.warn('Could not record initial tracking point', posErr);
    }

    return true;
  } catch (err) {
    console.error('Failed to start background tracking for trip', tripId, err);
    return false;
  }
}

/**
 * Reys yakunlanganda (DELIVERED, COMPLETED, CANCELLED) fon kuzatuvini to'xtatish
 */
export async function stopTracking(): Promise<void> {
  try {
    const activeTripId = await getActiveTripId();
    if (activeTripId) {
      // Qolgan nuqtalarni oxirgi marta serverga yuborishga urinish
      await flushQueue(activeTripId, true);
    }

    const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    await setActiveTripId(null);
  } catch (err) {
    console.warn('Failed to stop background tracking', err);
  }
}
