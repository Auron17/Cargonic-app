import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface ScreenTitleProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

/** iOS uslubidagi katta sarlavha: tab ekranlarining tepasida */
export function ScreenTitle({ title, subtitle, right }: ScreenTitleProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.texts}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionText} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 14,
  },
  texts: { flex: 1 },
  title: { fontSize: 30, fontWeight: '800', color: colors.slate900, letterSpacing: -0.8 },
  subtitle: { marginTop: 2, fontSize: 14, color: colors.textMuted },
  right: { marginLeft: 12, paddingBottom: 4 },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionText: { fontSize: 17, fontWeight: '700', color: colors.slate900, letterSpacing: -0.3 },
});
