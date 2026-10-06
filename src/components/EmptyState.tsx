import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  description,
  icon = '📦',
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}

      {actionTitle && onAction ? (
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={actionTitle}
            onPress={onAction}
            variant="outline"
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
    marginTop: 40,
  },
  icon: {
    fontSize: 54,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 240,
    marginTop: 8,
  },
});
