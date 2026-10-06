import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme';
import { Card } from './Card';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Ma'lumot kelguncha joy egallab turadigan miltillovchi kulrang blok */
export function Skeleton({ width = '100%', height = 14, radius = 7, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.slate200, opacity }, style]}
    />
  );
}

/** Yuk yoki reys kartasining skelet ko'rinishi */
export function SkeletonCard() {
  return (
    <Card>
      <View style={styles.row}>
        <Skeleton width="40%" height={12} />
        <Skeleton width={70} height={12} />
      </View>
      <Skeleton width="85%" height={18} style={styles.gap} />
      <Skeleton width="65%" height={18} style={styles.gapSm} />
      <View style={[styles.row, styles.gap]}>
        <Skeleton width={110} height={26} radius={13} />
        <Skeleton width={90} height={22} />
      </View>
    </Card>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list} accessibilityLabel="Yuklanmoqda" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gap: { marginTop: 16 },
  gapSm: { marginTop: 8 },
  list: { gap: 12 },
});
