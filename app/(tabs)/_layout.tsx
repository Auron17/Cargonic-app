import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { uz } from '../../src/i18n/uz';
import { colors } from '../../src/theme';

function LoadsHeaderRight() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/bids')}
      hitSlop={8}
      style={styles.headerAction}
      accessibilityRole="button"
      accessibilityLabel={uz.loadsTab.myBids}
    >
      <Ionicons name="receipt-outline" size={18} color={colors.primary} />
      <Text style={styles.headerActionText}>{uz.loadsTab.myBids}</Text>
    </Pressable>
  );
}

export default function TabLayout() {
  // Android edge-to-edge rejimida tizim tugmalari (yoki gesture paneli) ilova ustida turadi,
  // shuning uchun tab paneli pastki chegaraga qarab balandlashadi.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: 19,
          fontWeight: '800',
          color: colors.slate900,
          letterSpacing: -0.3,
        },
        headerShadowVisible: false,
        tabBarStyle: [styles.tabBar, { height: 60 + bottomInset, paddingBottom: bottomInset }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: uz.nav.loads,
          tabBarLabel: uz.nav.loads,
          headerRight: () => <LoadsHeaderRight />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'cube' : 'cube-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: uz.nav.trips,
          tabBarLabel: uz.nav.trips,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'navigate' : 'navigate-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: uz.nav.balance,
          tabBarLabel: uz.nav.balance,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: uz.nav.profile,
          tabBarLabel: uz.nav.profile,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  tabBarLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    marginRight: 4,
  },
  headerActionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
