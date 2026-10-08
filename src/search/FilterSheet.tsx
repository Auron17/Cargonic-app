import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FeedSort } from '../api/types';
import { BottomSheet, PrimaryButton, TextField } from '../components';
import { useCopy } from '../i18n';
import { colors } from '../theme';
import { FilterChip } from './FilterChip';
import { DATE_PRESETS, DatePreset, RouteFilter, SORTS } from './routeFilter';

interface FilterSheetProps {
  visible: boolean;
  value: RouteFilter;
  onApply: (filter: RouteFilter) => void;
  onClose: () => void;
}

const digits = (text: string) => text.replace(/\D/g, '');
const toNumber = (text: string): number | undefined => (digits(text) ? Number(digits(text)) : undefined);

/** Saralash, ortish sanasi va minimal narx. Yo'nalish (viloyatlar) bu yerda o'zgarmaydi. */
export function FilterSheet({ visible, value, onApply, onClose }: FilterSheetProps) {
  const uz = useCopy();
  const [sort, setSort] = useState<FeedSort>(value.sort);
  const [datePreset, setDatePreset] = useState<DatePreset>(value.datePreset);
  const [minPrice, setMinPrice] = useState('');
  const [minPricePerKm, setMinPricePerKm] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSort(value.sort);
    setDatePreset(value.datePreset);
    setMinPrice(value.minPrice != null ? String(value.minPrice) : '');
    setMinPricePerKm(value.minPricePerKm != null ? String(value.minPricePerKm) : '');
  }, [visible, value]);

  const reset = () => {
    setSort('DISTANCE');
    setDatePreset('ANY');
    setMinPrice('');
    setMinPricePerKm('');
  };

  const apply = () => {
    const next: RouteFilter = { fromRegions: value.fromRegions, toRegions: value.toRegions, sort, datePreset };
    const price = toNumber(minPrice);
    const perKm = toNumber(minPricePerKm);
    if (price != null) next.minPrice = price;
    if (perKm != null) next.minPricePerKm = perKm;
    onApply(next);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={uz.routeSearch.filtersTitle}>
      <View style={styles.headerAction}>
        <FilterChip label={uz.routeSearch.clear} icon="refresh" onPress={reset} />
      </View>

      <Text style={styles.label}>{uz.routeSearch.sortTitle}</Text>
      <View style={styles.chips}>
        {SORTS.map((s) => (
          <FilterChip key={s} label={uz.routeSearch.sort[s]} selected={sort === s} onPress={() => setSort(s)} />
        ))}
      </View>

      <Text style={styles.label}>{uz.routeSearch.dateTitle}</Text>
      <View style={styles.chips}>
        {DATE_PRESETS.map((d) => (
          <FilterChip
            key={d}
            label={uz.routeSearch.date[d]}
            selected={datePreset === d}
            onPress={() => setDatePreset(d)}
          />
        ))}
      </View>

      <TextField
        label={uz.routeSearch.minPrice}
        value={minPrice}
        onChangeText={(t) => setMinPrice(digits(t))}
        keyboardType="number-pad"
        placeholder="3000000"
        maxLength={10}
      />
      <TextField
        label={uz.routeSearch.minPricePerKm}
        value={minPricePerKm}
        onChangeText={(t) => setMinPricePerKm(digits(t))}
        keyboardType="number-pad"
        placeholder="8000"
        maxLength={7}
        hint={uz.routeSearch.usdHint}
      />

      <PrimaryButton title={uz.routeSearch.show} onPress={apply} size="lg" />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerAction: { alignItems: 'flex-end', marginTop: -6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: -4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
