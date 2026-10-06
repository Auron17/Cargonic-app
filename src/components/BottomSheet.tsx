import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Oyna yopilmasligi kerak bo'lgan holat (so'rov ketayotganda) */
  locked?: boolean;
}

/** Pastdan chiqadigan oyna: tasdiqlash va kiritish formalari uchun */
export function BottomSheet({ visible, onClose, title, subtitle, children, locked }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const close = () => {
    if (!locked) onClose();
  };
  // iOS'da yopiq Modal doim render qilinsa yoki ochiq Modal birdan olib tashlansa, ko'rinmas oyna
  // ekrandagi bosishlarni to'sib qoladi. Shuning uchun yopilishda avval animatsiya o'ynaladi,
  // keyin Modal visible=false bilan yopiladi va shundan keyingina umuman olib tashlanadi.
  const [mounted, setMounted] = useState(visible);
  const [modalVisible, setModalVisible] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setModalVisible(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  }, [visible, progress]);

  useEffect(() => {
    if (modalVisible || !mounted) return;
    // Android'da onDismiss chaqirilmaydi
    const timer = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(timer);
  }, [modalVisible, mounted]);

  if (!mounted) return null;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });
  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={close}
      onDismiss={() => setMounted(false)}
      statusBarTranslucent
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={styles.fill} onPress={close} accessibilityLabel="Yopish" />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8, transform: [{ translateY }] }]}
        >
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Ikki ustunli xulosa qatori: "Yuk narxi ........ 4 200 000 so'm" */
export function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,18,32,0.45)' },
  fill: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.slate300,
    marginBottom: 16,
  },
  title: { fontSize: 21, fontWeight: '800', color: colors.slate900, letterSpacing: -0.4 },
  subtitle: { marginTop: 6, fontSize: 14.5, lineHeight: 20, color: colors.textMuted },
  body: { marginTop: 18, gap: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { fontSize: 15, color: colors.textMuted },
  summaryValue: { fontSize: 15, fontWeight: '600', color: colors.slate900, fontVariant: ['tabular-nums'] },
  summaryStrong: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
});
