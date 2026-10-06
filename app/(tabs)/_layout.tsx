import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCopy } from '../../src/i18n';
import { colors } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} size={24} color={color} />;
  };
}

export default function TabLayout() {
  const uz = useCopy();
  // Android edge-to-edge rejimida tizim tugmalari (yoki gesture paneli) ilova ustida turadi,
  // shuning uchun tab paneli pastki chegaraga qarab balandlashadi.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);

  return (
    <Tabs
      screenOptions={{
        // Har bir tab o'z katta sarlavhasini (ScreenTitle) chizadi
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: 58 + bottomInset, paddingBottom: bottomInset }],
        tabBarActiveTintColor: colors.slate900,
        tabBarInactiveTintColor: colors.slate400,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: uz.nav.loads, tabBarIcon: tabIcon('cube', 'cube-outline') }}
      />
      <Tabs.Screen
        name="trips"
        options={{ title: uz.nav.trips, tabBarIcon: tabIcon('navigate', 'navigate-outline') }}
      />
      <Tabs.Screen
        name="balance"
        options={{ title: uz.nav.balance, tabBarIcon: tabIcon('wallet', 'wallet-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: uz.nav.profile, tabBarIcon: tabIcon('person-circle', 'person-circle-outline') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.slate200,
    elevation: 0,
  },
  tabBarLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
});
