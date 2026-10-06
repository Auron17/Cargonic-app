import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="vehicle" options={{ headerShown: false }} />
      <Stack.Screen name="documents" options={{ headerShown: false }} />
      <Stack.Screen name="status" options={{ headerShown: false }} />
    </Stack>
  );
}
