import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { formatMoney } from '../utils/format';
import { colors } from '../theme';

interface MoneyProps {
  amount: number | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: TextStyle;
  color?: string;
  weight?: 'normal' | '500' | '600' | '700' | '800' | 'bold';
  /** Standart: so'm */
  currency?: 'UZS' | 'USD';
}

export function Money({
  amount,
  size = 'md',
  style,
  color,
  weight = '700',
  currency,
}: MoneyProps) {
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 22;
      case 'xl':
        return 28;
      case 'md':
      default:
        return 17;
    }
  };

  return (
    <Text
      style={[
        styles.text,
        {
          fontSize: getFontSize(),
          fontWeight: weight,
          color: color || colors.slate900,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={formatMoney(amount, currency)}
    >
      {formatMoney(amount, currency)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
});
