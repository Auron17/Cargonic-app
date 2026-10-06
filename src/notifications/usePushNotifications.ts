import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { meApi } from '../api/client';
import { useAuth } from '../auth/AuthProvider';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface PushNotificationData {
  type?: string;
  loadId?: string;
  tripId?: string;
  [key: string]: unknown;
}

export function usePushNotifications() {
  const { isAuthenticated, isCarrier } = useAuth();
  const router = useRouter();
  const tokenRegisteredRef = useRef(false);

  // 1. Request permission and register device FCM token
  useEffect(() => {
    if (!isAuthenticated || !isCarrier || tokenRegisteredRef.current) {
      return;
    }

    let isMounted = true;

    async function registerForPushNotificationsAsync() {
      try {
        if (!Device.isDevice) {
          // Push notifications work on physical devices
          return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          return;
        }

        // Fetch native device FCM token (for Android) or APNs token
        const tokenResponse = await Notifications.getDevicePushTokenAsync();
        const fcmToken = tokenResponse.data;

        if (fcmToken && isMounted) {
          await meApi.updateFcmToken(fcmToken);
          tokenRegisteredRef.current = true;
        }
      } catch (error) {
        // Log silently without disrupting UI flow
        console.warn('Failed to register FCM push token:', error);
      }
    }

    registerForPushNotificationsAsync();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isCarrier]);

  // 2. Handle interaction when user taps a push notification
  useEffect(() => {
    const handleNotificationData = (data?: PushNotificationData) => {
      if (!data || !data.type) return;

      switch (data.type) {
        case 'NEW_LOAD':
          if (data.loadId) {
            router.push({
              pathname: '/loads/[id]',
              params: { id: String(data.loadId) },
            });
          }
          break;

        case 'BID_ACCEPTED':
        case 'TRIP_STATUS':
        case 'TRIP_CANCELLED':
        case 'DROPOFF_CHANGED':
          if (data.tripId) {
            router.push({
              pathname: '/trips/[id]',
              params: { id: String(data.tripId) },
            });
          }
          break;

        case 'BID_REJECTED':
          router.push('/bids');
          break;

        default:
          break;
      }
    };

    // Check if the app was launched by tapping a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification.request.content.data) {
        handleNotificationData(
          response.notification.request.content.data as PushNotificationData
        );
      }
    });

    // Listen for taps on incoming notifications while app is active / backgrounded
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as PushNotificationData;
        handleNotificationData(data);
      }
    );

    return () => {
      subscription.remove();
    };
  }, [router]);
}
