import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCopy } from '../i18n';
import { colors, radii, shadows } from '../theme';

type Props = {
  isDownloading: boolean;
  isUpdateReady: boolean;
  isBannerVisible: boolean;
  onInstall: () => void;
};

export function OtaUpdateBanner({
  isDownloading,
  isUpdateReady,
  isBannerVisible,
  onInstall,
}: Props) {
  const uz = useCopy();
  const insets = useSafeAreaInsets();

  if (!isDownloading && (!isUpdateReady || !isBannerVisible)) {
    return null;
  }

  const bottomPad = Math.max(insets.bottom, 10);

  if (isDownloading) {
    return (
      <View style={[styles.dock, { paddingBottom: bottomPad }]}>
        <View
          style={styles.bar}
          accessibilityRole="progressbar"
          accessibilityLabel={uz.ota.downloading}
        >
          <View style={styles.iconCircle}>
            <ActivityIndicator size="small" color={colors.textWhite} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>{uz.ota.downloading}</Text>
            <Text style={styles.subtitle}>{uz.ota.downloadingHint}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.dock, { paddingBottom: bottomPad }]}>
      <View style={styles.bar} accessibilityRole="alert">
        <View style={styles.iconCircle}>
          <Ionicons name="download-outline" size={22} color={colors.textWhite} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{uz.ota.readyTitle}</Text>
          <Text style={styles.subtitle}>{uz.ota.readyHint}</Text>
        </View>
        <Pressable
          onPress={onInstall}
          style={({ pressed }) => [styles.installBtn, pressed && styles.installBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={uz.ota.install}
        >
          <Text style={styles.installText}>{uz.ota.install}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.floating,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  installBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  installBtnPressed: {
    opacity: 0.88,
  },
  installText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
