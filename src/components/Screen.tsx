import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Native header yoki tab sarlavhasi yuqorini egallaganda SafeArea faqat yonlardan.
export const SAFE_EDGES_WITH_HEADER: Edge[] = ['left', 'right'];
export const TAB_EDGES_NO_HEADER: Edge[] = ['top', 'left', 'right'];
/** Native header bor, tab paneli yo'q: pastki chegara (home indicator) hisobga olinadi */
export const DETAIL_EDGES: Edge[] = ['left', 'right', 'bottom'];
export const TAB_EDGES_WITH_HEADER: Edge[] = SAFE_EDGES_WITH_HEADER;

interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomAction?: ReactNode;
  edges?: Edge[];
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function Screen({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  bottomAction,
  edges = ['top', 'left', 'right', 'bottom'],
  refreshControl,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  // Pastki panel bo'lsa, u ekranning eng pastigacha oq bo'lib cho'ziladi:
  // pastki chegarani SafeAreaView emas, panelning o'zi hisobga oladi.
  const barOwnsBottom = Boolean(bottomAction) && edges.includes('bottom');
  const safeEdges = barOwnsBottom ? edges.filter((e) => e !== 'bottom') : edges;
  return (
    <SafeAreaView edges={safeEdges} style={[styles.container, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scrollable ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, contentContainerStyle]}>{children}</View>
        )}

        {bottomAction ? (
          <View style={[styles.bottomBar, barOwnsBottom && { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
            {bottomAction}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Slate 50 (#F8FAFC)
  },
  keyboardContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 14 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
});
