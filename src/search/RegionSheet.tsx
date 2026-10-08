import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Region } from '../api/types';
import { BottomSheet, PrimaryButton } from '../components';
import { useCopy } from '../i18n';
import { colors } from '../theme';
import { REGIONS } from './routeFilter';

interface RegionSheetProps {
  visible: boolean;
  title: string;
  /** Hech narsa tanlanmagandagi ma'no: "Atrofim" yoki "Istalgan joy" */
  emptyLabel: string;
  value: Region[];
  onApply: (regions: Region[]) => void;
  onClose: () => void;
}

/** Bir nechta viloyatni tanlash oynasi; tanlov "Qo'llash" bosilgandagina filtrga yoziladi */
export function RegionSheet({ visible, title, emptyLabel, value, onApply, onClose }: RegionSheetProps) {
  const uz = useCopy();
  const [draft, setDraft] = useState<Region[]>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const toggle = (r: Region) =>
    setDraft((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const applyTitle =
    draft.length > 0 ? uz.routeSearch.applyCount.replace('{{count}}', String(draft.length)) : uz.routeSearch.apply;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <Row label={emptyLabel} checked={draft.length === 0} round onPress={() => setDraft([])} />
        {REGIONS.map((r) => (
          <Row key={r} label={uz.regions[r]} checked={draft.includes(r)} onPress={() => toggle(r)} />
        ))}
      </ScrollView>
      <PrimaryButton
        title={applyTitle}
        onPress={() => {
          // Viloyatlar ro'yxatdagi tartibda yuboriladi — saqlangan yo'nalish nomi barqaror bo'ladi
          onApply(REGIONS.filter((r) => draft.includes(r)));
          onClose();
        }}
        size="lg"
      />
    </BottomSheet>
  );
}

function Row({ label, checked, round, onPress }: { label: string; checked: boolean; round?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={round ? 'radio' : 'checkbox'}
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.box, round && styles.round, checked && styles.boxOn]}>
        {checked ? <Ionicons name="checkmark" size={14} color={colors.textWhite} /> : null}
      </View>
      <Text style={[styles.rowText, round && styles.rowTextStrong]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 420 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 46,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.slate200,
  },
  pressed: { opacity: 0.6 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: { borderRadius: 11 },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  rowText: { fontSize: 15.5, color: colors.slate900 },
  rowTextStrong: { fontWeight: '600' },
});
