import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { uz } from '../../src/i18n/uz';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '800',
          color: '#111827',
        },
        headerShadowVisible: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1a56db',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: uz.nav.loads,
          tabBarLabel: uz.nav.loads,
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>📦</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: uz.nav.trips,
          tabBarLabel: uz.nav.trips,
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>🚚</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: uz.nav.balance,
          tabBarLabel: uz.nav.balance,
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>💳</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: uz.nav.profile,
          tabBarLabel: uz.nav.profile,
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  tabIcon: {
    fontSize: 22,
  },
});
