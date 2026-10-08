import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BodyType, VehicleDto } from '../api/types';
import { useCopy } from '../i18n';
import { colors } from '../theme';
import { formatUzPlate } from '../utils/uzPlate';
import { Pill, pillToneForStatus } from './Pill';
import { statusBadgeLabel } from './StatusBadge';

/** Kuzov turiga mos rasm (scripts/draw-trucks.py bilan chizilgan) */
const TRUCK_IMAGES: Record<BodyType, ImageSourcePropType> = {
  TENT: require('../../assets/trucks/tent.png'),
  REFRIGERATOR: require('../../assets/trucks/refrigerator.png'),
  ISOTHERMAL: require('../../assets/trucks/isothermal.png'),
  FLATBED: require('../../assets/trucks/flatbed.png'),
  TIPPER: require('../../assets/trucks/tipper.png'),
  CONTAINER: require('../../assets/trucks/container.png'),
  TANKER: require('../../assets/trucks/tanker.png'),
  MANIPULATOR: require('../../assets/trucks/manipulator.png'),
};

/** O'zbekiston davlat raqami ko'rinishida: [01 | A 777 BC  UZ] */
export function UzPlate({ plate }: { plate: string }) {
  const formatted = formatUzPlate(plate);
  const region = formatted.slice(0, 2);
  const rest = formatted.slice(2).trim();
  return (
    <View style={styles.plate} accessible accessibilityLabel={formatted}>
      <Text style={styles.plateText}>{region}</Text>
      <View style={styles.plateDivider} />
      <Text style={styles.plateText}>{rest}</Text>
      <View style={styles.plateCountry}>
        <View style={styles.flag}>
          <View style={[styles.flagStripe, { backgroundColor: '#1EB5E8' }]} />
          <View style={[styles.flagStripe, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.flagStripe, { backgroundColor: '#1EB53A' }]} />
        </View>
        <Text style={styles.uz}>UZ</Text>
      </View>
    </View>
  );
}

/**
 * Profildagi "mening mashinam" kartasi (Yandex Pro uslubida): turi, sig'imi, davlat raqami
 * va kuzov turiga mos rasm. Bosilganda mashina ma'lumotlarini tahrirlash ochiladi.
 */
export function VehicleCard({ vehicle, onPress }: { vehicle?: VehicleDto | null; onPress: () => void }) {
  const uz = useCopy();

  if (!vehicle) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={uz.profileTab.addVehicle}
      >
        <View style={styles.info}>
          <View style={styles.addRow}>
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <Text style={styles.addText}>{uz.profileTab.addVehicle}</Text>
          </View>
        </View>
        <Image source={TRUCK_IMAGES.TENT} style={[styles.truck, styles.truckGhost]} resizeMode="contain" />
      </Pressable>
    );
  }

  const size = `${vehicle.capacityTons} t${vehicle.volumeM3 ? ` · ${vehicle.volumeM3} m³` : ''}`;
  const typeName = uz.bodyType[vehicle.bodyType] ?? vehicle.bodyType;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${typeName}, ${size}, ${formatUzPlate(vehicle.plateNumber)}. ${uz.profileTab.editVehicle}`}
    >
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {typeName}
          <Text style={styles.size}> · {size}</Text>
        </Text>
        {vehicle.verificationStatus !== 'APPROVED' ? (
          <View style={styles.pill}>
            <Pill
              tone={pillToneForStatus(vehicle.verificationStatus)}
              label={statusBadgeLabel(vehicle.verificationStatus, 'verification')}
            />
          </View>
        ) : null}
        <View style={styles.plateWrap}>
          <UzPlate plate={vehicle.plateNumber} />
        </View>
      </View>
      <Image source={TRUCK_IMAGES[vehicle.bodyType]} style={styles.truck} resizeMode="contain" />
      <Ionicons name="chevron-forward" size={18} color={colors.slate400} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 148,
    borderRadius: 18,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    padding: 16,
  },
  pressed: { opacity: 0.92 },
  info: { flex: 1, maxWidth: '62%', justifyContent: 'space-between', zIndex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: colors.slate900 },
  size: { fontWeight: '500', color: colors.textMuted },
  pill: { marginTop: 8, alignSelf: 'flex-start' },
  plateWrap: { marginTop: 'auto', paddingTop: 14, alignSelf: 'flex-start' },
  plate: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.slate900,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingLeft: 6,
    paddingRight: 4,
    height: 32,
  },
  plateText: { fontSize: 18, fontWeight: '800', color: colors.slate900, letterSpacing: 0.5, fontVariant: ['tabular-nums'] },
  plateDivider: { width: 2, alignSelf: 'stretch', backgroundColor: colors.slate900, marginHorizontal: 6 },
  plateCountry: { alignItems: 'center', marginLeft: 6 },
  flag: { width: 14, height: 9, borderRadius: 1, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.slate300 },
  flagStripe: { flex: 1 },
  uz: { fontSize: 8, fontWeight: '800', color: '#1E5AA8', marginTop: 1 },
  truck: { position: 'absolute', right: -64, bottom: 4, width: 240, height: 104 },
  truckGhost: { opacity: 0.35 },
  chevron: { position: 'absolute', top: 16, right: 14 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
