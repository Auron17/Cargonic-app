import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { OtaProvider } from '../src/updates';
import { usePushNotifications } from '../src/notifications/usePushNotifications';
import { useForegroundLocation } from '../src/tracking/useForegroundLocation';
import '../src/i18n';

export { AppErrorBoundary as ErrorBoundary } from '../src/components/AppErrorBoundary';

function AppServices() {
  usePushNotifications();
  useForegroundLocation();
  return null;
}

function RootNavigator() {
  const { isLoading, isAuthenticated, isCarrier, profile } = useAuth();
  const showAuth = isLoading || !isAuthenticated || !isCarrier;
  const showApp =
    !isLoading &&
    isAuthenticated &&
    isCarrier &&
    profile?.verificationStatus === 'APPROVED';
  // Tasdiqlangan haydovchi ham profil/mashina/hujjatni tahrirlay olishi uchun
  // onboarding marshrutlari app bilan birga ochiq qoladi.
  const showOnboarding = !isLoading && isAuthenticated && isCarrier;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Protected guard={showAuth}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={showApp}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="loads/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="bids" options={{ headerShown: false }} />
        <Stack.Screen name="trips/[id]" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={showOnboarding}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 1000 * 30,
          },
        },
      })
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OtaProvider>
            <AppServices />
            <RootNavigator />
          </OtaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
