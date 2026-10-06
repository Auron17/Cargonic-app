import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOta } from './OtaContext';
import { colors, radii, shadows } from '../theme';

export function OtaUpdateBanner() {
  const {
    isUpdateReady,
    isDownloading,
    isBannerVisible,
    applyUpdate,
    dismissBanner,
  } = useOta();

  if (isDownloading) {
    return (
      <View style={styles.downloadingPill} pointerEvents="none">
        <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
        <Text style={styles.downloadingText}>
          Yangi talqin yuklanmoqda…
        </Text>
      </View>
    );
  }

  if (!isUpdateReady || !isBannerVisible) {
    return null;
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={18} color="#D97706" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Yangi yangilanish tayyor!</Text>
            <Text style={styles.description}>
              Ilovadagi yangi imkoniyatlar va tuzatishlarni faollashtirish uchun ilovani qayta ishga tushiring.
            </Text>
          </View>
          <Pressable
            onPress={dismissBanner}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Yopish"
          >
            <Ionicons name="close" size={20} color={colors.slate400} />
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={dismissBanner}
            style={({ pressed }) => [
              styles.dismissBtn,
              pressed && styles.dismissBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Keyinroq"
          >
            <Text style={styles.dismissBtnText}>Keyinroq</Text>
          </Pressable>

          <Pressable
            onPress={applyUpdate}
            style={({ pressed }) => [
              styles.updateBtn,
              pressed && styles.updateBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Hoziroq qayta yuklash"
          >
            <Ionicons name="refresh" size={16} color="#ffffff" style={styles.btnIcon} />
            <Text style={styles.updateBtnText}>Qayta ishga tushirish</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#0F172A', // Deep Industrial Slate
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    ...shadows.floating,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  dismissBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  dismissBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D4ED8', // Highway Cobalt
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  updateBtnPressed: {
    backgroundColor: '#1E40AF',
  },
  btnIcon: {
    marginRight: 6,
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  downloadingPill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 32,
    alignSelf: 'center',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#334155',
    ...shadows.subtle,
  },
  spinner: {
    marginRight: 8,
  },
  downloadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
});
