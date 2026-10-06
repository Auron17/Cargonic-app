import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { formatMoney } from '../utils/format';

interface MoneyProps {
  amount: number | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: TextStyle;
  color?: string;
  weight?: 'normal' | '500' | '600' | '700' | 'bold';
}

export function Money({
  amount,
  size = 'md',
  style,
  color,
  weight = '700',
}: MoneyProps) {
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 22;
      case 'xl':
        return 30;
      case 'md':
      default:
        return 18;
    }
  };

  return (
    <Text
      style={[
        styles.text,
        {
          fontSize: getFontSize(),
          fontWeight: weight,
          color: color || '#111827',
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={formatMoney(amount)}
    >
      {formatMoney(amount)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    letterSpacing: 0.3,
  },
});
