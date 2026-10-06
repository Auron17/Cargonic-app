import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { carrierApi } from '../api/client';
import { useAuth } from '../auth/AuthProvider';

const LOCATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useForegroundLocation() {
  const { isAuthenticated, isCarrier, isVerified } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only send location if user is an approved active carrier
    if (!isAuthenticated || !isCarrier || !isVerified) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function sendCurrentLocation() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const requested = await Location.requestForegroundPermissionsAsync();
          if (requested.status !== 'granted') {
            return;
          }
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (position?.coords && isMounted) {
          await carrierApi.updateLocation(
            position.coords.latitude,
            position.coords.longitude
          );
        }
      } catch (err) {
        // Location updates can fail if GPS is disabled or network drop occurred;
        // avoid crashing or interrupting user interaction.
        console.warn('Foreground location update error:', err);
      }
    }

    // Send immediately upon mounting/becoming verified
    sendCurrentLocation();

    // Repeat every 5 minutes while the app remains active in foreground
    intervalRef.current = setInterval(() => {
      sendCurrentLocation();
    }, LOCATION_INTERVAL_MS);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, isCarrier, isVerified]);
}
