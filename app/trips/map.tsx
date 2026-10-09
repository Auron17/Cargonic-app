import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { tripsApi } from '../../src/api/client';
import { HeaderBackButton } from '../../src/components';
import { RouteMap } from '../../src/components/RouteMap';
import { openExternalNavigator } from '../../src/geo/openNavigator';
import { fetchDrivingRoute, tripNavTarget, type LatLng } from '../../src/geo/route';
import { useCopy } from '../../src/i18n';
import { colors, ink } from '../../src/theme';

export default function TripMapScreen() {
  const uz = useCopy();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Array.isArray(id) ? id[0] : id;

  const [user, setUser] = useState<LatLng | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [follow, setFollow] = useState(true);

  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getTrip(tripId),
    enabled: !!tripId,
  });

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      const current = await Location.getForegroundPermissionsAsync();
      let status = current.status;
      if (status !== 'granted') {
        status = (await Location.requestForegroundPermissionsAsync()).status;
      }
      if (status !== 'granted' || cancelled) return;
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1500,
          distanceInterval: 5,
        },
        (pos) => {
          setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setHeading(typeof pos.coords.heading === 'number' ? pos.coords.heading : null);
        },
      );
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  const load = trip?.load;
  const pickup = load ? { lat: load.pickupLat, lng: load.pickupLng } : null;
  const dropoff = load ? { lat: load.dropoffLat, lng: load.dropoffLng } : null;
  const target = load && trip ? tripNavTarget(trip.status, load) : null;
  const from = user ?? pickup;
  const to = target ?? dropoff;

  const { data: route = [] } = useQuery({
    queryKey: ['driving-route', from?.lat, from?.lng, to?.lat, to?.lng],
    queryFn: () => fetchDrivingRoute(from!, to!),
    enabled: !!from && !!to,
    staleTime: 60 * 1000,
  });

  const headingToPickup =
    trip?.status === 'ASSIGNED' ||
    trip?.status === 'EN_ROUTE_TO_PICKUP' ||
    trip?.status === 'AT_PICKUP';
  const targetAddress = headingToPickup ? load?.pickupAddress : load?.dropoffAddress;

  const openYandex = () => {
    if (target) void openExternalNavigator(target);
  };

  if (!pickup || !dropoff) {
    return (
      <View style={styles.missing}>
        <Stack.Screen
          options={{
            title: uz.tripView.mapTitle,
            headerLeft: () => <HeaderBackButton fallback="/(tabs)/trips" />,
          }}
        />
        <Text style={styles.missingText}>{uz.tripView.mapLoading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: uz.tripView.mapTitle,
          headerBackVisible: false,
          headerLeft: () => (
            <HeaderBackButton fallback={tripId ? `/trips/${tripId}` : '/(tabs)/trips'} />
          ),
        }}
      />
      <RouteMap
        style={styles.map}
        pickup={pickup}
        dropoff={dropoff}
        route={route}
        user={user}
        heading={heading}
        follow={follow}
        interactive
      />
      <View style={styles.sheet}>
        <Text style={styles.sheetLabel}>
          {headingToPickup ? uz.tripView.toPickup : uz.tripView.toDropoff}
        </Text>
        <Text style={styles.sheetAddress} numberOfLines={2}>
          {targetAddress ?? '—'}
        </Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => setFollow((v) => !v)}
            style={({ pressed }) => [styles.followBtn, follow && styles.followOn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={uz.tripView.followMe}
          >
            <Ionicons name="navigate" size={18} color={follow ? '#FFFFFF' : colors.slate900} />
            <Text style={[styles.followText, follow && styles.followTextOn]}>{uz.tripView.followMe}</Text>
          </Pressable>
          <Pressable
            onPress={() => void openYandex()}
            style={({ pressed }) => [styles.yandexBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={uz.tripView.openInYandexNavi}
          >
            <Text style={styles.yandexText}>{uz.tripView.openInYandexNavi}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  missingText: { fontSize: 15, color: colors.textMuted },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: ink[900],
    borderRadius: 20,
    padding: 16,
  },
  sheetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ink.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sheetAddress: { marginTop: 6, fontSize: 17, fontWeight: '700', color: '#FFFFFF', lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  followBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  followOn: { backgroundColor: colors.primary },
  followText: { fontSize: 15, fontWeight: '700', color: colors.slate900 },
  followTextOn: { color: '#FFFFFF' },
  yandexBtn: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yandexText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
});
