import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Qurilmaning taxminiy joylashuvi (bir marta olinadi). Ro'yxatdan o'tmagan haydovchi serverda
 * joylashuvni saqlay olmaydi, shuning uchun lenta shu koordinatalar bilan so'raladi.
 * Ruxsat berilmasa yoki GPS o'chiq bo'lsa null qaytadi — server Toshkent atrofini ko'rsatadi.
 */
export function useDeviceCoords(enabled: boolean): Coords | null {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          ({ status } = await Location.requestForegroundPermissionsAsync());
        }
        if (status !== 'granted') return;
        const position =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!cancelled && position) {
          // ~1 km aniqlik yetarli va so'rov kalitini barqaror qiladi
          setCoords({
            lat: Math.round(position.coords.latitude * 100) / 100,
            lng: Math.round(position.coords.longitude * 100) / 100,
          });
        }
      } catch {
        // Joylashuvsiz ham lenta ishlaydi
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return coords;
}
