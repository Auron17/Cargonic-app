import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './PrimaryButton';
import { colors, radii } from '../theme';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  description,
  icon,
  iconName = 'cube-outline',
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        {icon ? (
          <Text style={styles.emojiText}>{icon}</Text>
        ) : (
          <Ionicons name={iconName} size={36} color={colors.slate400} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}

      {actionTitle && onAction ? (
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={actionTitle}
            onPress={onAction}
            variant="outline"
            size="sm"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emojiText: {
    fontSize: 34,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate800,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: 280,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 220,
    marginTop: 4,
  },
});
