import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { OtaProvider } from '../src/updates';
import { usePushNotifications } from '../src/notifications/usePushNotifications';
import { useForegroundLocation } from '../src/tracking/useForegroundLocation';
import { useStopIdleGps } from '../src/tracking/useStopIdleGps';
import { HeaderBackButton } from '../src/components/HeaderBackButton';
import { loadSavedLanguage, useCopy } from '../src/i18n';
import { colors } from '../src/theme';

export { AppErrorBoundary as ErrorBoundary } from '../src/components/AppErrorBoundary';

function AppServices() {
  usePushNotifications();
  useForegroundLocation();
  useStopIdleGps();
  return null;
}

function RootNavigator() {
  const uz = useCopy();
  const { isLoading, isAuthenticated, isCarrier } = useAuth();
  const showAuth = isLoading || !isAuthenticated || !isCarrier;
  // Ro'yxatdan to'liq o'tmagan haydovchi ham ilovaga kiradi: yuklarni ko'radi, olish uchun esa
  // lenta/yuk sahifasidagi eslatma orqali ro'yxatdan o'tishni yakunlaydi (Yandex Pro uslubida).
  const showApp = !isLoading && isAuthenticated && isCarrier;
  // Tasdiqlangan haydovchi ham profil/mashina/hujjatni tahrirlay olishi uchun
  // onboarding marshrutlari app bilan birga ochiq qoladi.
  const showOnboarding = !isLoading && isAuthenticated && isCarrier;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={showAuth}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={showApp}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="loads/[id]"
          options={{
            headerShown: true,
            title: uz.loadDetails.title,
            headerBackVisible: false,
            headerLeft: () => <HeaderBackButton />,
            headerTintColor: colors.slate900,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontSize: 17, fontWeight: '800', color: colors.slate900 },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="bids"
          options={{
            headerShown: true,
            title: uz.bidsScreen.title,
            headerBackVisible: false,
            headerLeft: () => <HeaderBackButton />,
            headerTintColor: colors.slate900,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontSize: 17, fontWeight: '800', color: colors.slate900 },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="trips/[id]"
          options={{
            headerShown: true,
            title: uz.tripView.title,
            headerBackVisible: false,
            headerLeft: () => <HeaderBackButton fallback="/(tabs)/trips" />,
            headerTintColor: colors.slate900,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontSize: 17, fontWeight: '800', color: colors.slate900 },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="trips/map"
          options={{
            headerShown: true,
            title: uz.tripView.mapTitle,
            headerBackVisible: false,
            headerLeft: () => <HeaderBackButton fallback="/(tabs)/trips" />,
            headerTintColor: colors.slate900,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontSize: 17, fontWeight: '800', color: colors.slate900 },
            headerShadowVisible: false,
          }}
        />
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

  useEffect(() => {
    void loadSavedLanguage();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OtaProvider key="ota-preview-primary">
            <AppServices />
            <RootNavigator />
          </OtaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
