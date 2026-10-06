import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ErrorBoundaryProps } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCopy } from '../i18n';
import { colors, radii } from '../theme';
import { PrimaryButton } from './PrimaryButton';
import { Screen } from './Screen';

export function AppErrorBoundary({ retry }: ErrorBoundaryProps) {
  const uz = useCopy();
  return (
    <Screen style={styles.screen}>
      <View style={styles.box}>
        <View style={styles.iconBox}>
          <Ionicons name="warning-outline" size={36} color={colors.dangerDark} />
        </View>
        <Text style={styles.title}>{uz.common.errorTitle}</Text>
        <Text style={styles.lead}>{uz.common.unexpectedError}</Text>
        <PrimaryButton title={uz.common.retry} onPress={retry} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.danger50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.slate900,
    textAlign: 'center',
    marginBottom: 8,
  },
  lead: {
    fontSize: 15,
    color: colors.slate600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
});
