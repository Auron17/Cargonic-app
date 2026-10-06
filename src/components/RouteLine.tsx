import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface RouteLineProps {
  from: string;
  to: string;
  /** Ortish nuqtasi ostidagi kichik matn (sana, vaqt) */
  fromHint?: string;
  toHint?: string;
  size?: 'md' | 'lg';
  /** Manzil necha qatorgacha ko'rinadi */
  lines?: number;
  /** To'q fon ustida (oq matn) */
  inverse?: boolean;
}

/** Ortish → topshirish: ikki nuqta va ularni bog'lovchi chiziq */
export function RouteLine({ from, to, fromHint, toHint, size = 'md', lines = 1, inverse }: RouteLineProps) {
  const addressStyle = [size === 'lg' ? styles.addressLg : styles.address, inverse && styles.inverseText];
  const hintStyle = [styles.hint, inverse && styles.inverseHint];
  return (
    <View accessibilityLabel={`${from} dan ${to} gacha`}>
      <View style={styles.row}>
        <View style={styles.rail}>
          <View style={[styles.dot, styles.dotFrom, inverse && styles.inverseDot]} />
          <View style={[styles.line, inverse && styles.inverseLine]} />
        </View>
        <View style={styles.textBlock}>
          <Text style={addressStyle} numberOfLines={lines}>
            {from}
          </Text>
          {fromHint ? <Text style={hintStyle}>{fromHint}</Text> : null}
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.rail}>
          <View style={[styles.dot, styles.dotTo, inverse && styles.inverseDotTo]} />
        </View>
        <View style={[styles.textBlock, styles.last]}>
          <Text style={addressStyle} numberOfLines={lines}>
            {to}
          </Text>
          {toHint ? <Text style={hintStyle}>{toHint}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 20, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  dotFrom: { backgroundColor: colors.slate900 },
  dotTo: { backgroundColor: colors.surface, borderWidth: 2.5, borderColor: colors.accent },
  line: { flex: 1, width: 2, backgroundColor: colors.slate200, marginVertical: 3, borderRadius: 1 },
  textBlock: { flex: 1, paddingLeft: 8, paddingBottom: 14 },
  last: { paddingBottom: 0 },
  address: { fontSize: 16, fontWeight: '600', color: colors.slate900, letterSpacing: -0.2 },
  addressLg: { fontSize: 18, fontWeight: '700', color: colors.slate900, letterSpacing: -0.3 },
  hint: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  inverseText: { color: '#FFFFFF' },
  inverseHint: { color: 'rgba(255,255,255,0.6)' },
  inverseDot: { backgroundColor: '#FFFFFF' },
  inverseLine: { backgroundColor: 'rgba(255,255,255,0.18)' },
  inverseDotTo: { backgroundColor: 'transparent' },
});
