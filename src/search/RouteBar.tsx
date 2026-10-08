import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Region, SavedSearch } from '../api/types';
import { BottomSheet, PrimaryButton } from '../components';
import { useCopy } from '../i18n';
import { colors } from '../theme';
import { FilterChip } from './FilterChip';
import { FilterSheet } from './FilterSheet';
import { RegionSheet } from './RegionSheet';
import { EMPTY_FILTER, RouteFilter, canSave, isFilterActive, routeLabel, sideLabel } from './routeFilter';

interface RouteBarProps {
  filter: RouteFilter;
  onChange: (filter: RouteFilter) => void;
  saved: SavedSearch[];
  onApplySaved: (s: SavedSearch) => void;
  onSave: () => void;
  saving: boolean;
  onDeleteSaved: (s: SavedSearch) => Promise<void>;
}

/** Lenta tepasidagi yo'nalish paneli: saqlangan yo'nalishlar, "Qayerdan → Qayerga", saralash va filtr */
export function RouteBar({ filter, onChange, saved, onApplySaved, onSave, saving, onDeleteSaved }: RouteBarProps) {
  const uz = useCopy();
  const [sheet, setSheet] = useState<'from' | 'to' | 'filters' | null>(null);
  const [toDelete, setToDelete] = useState<SavedSearch | null>(null);
  const [deleting, setDeleting] = useState(false);

  const labels = { anywhere: uz.routeSearch.anywhere, aroundMe: uz.routeSearch.aroundMe };
  const sideText = (regions: Region[], empty: string) => sideLabel(regions, uz.regionsShort, empty);
  const extraCount =
    (filter.minPrice != null ? 1 : 0) + (filter.minPricePerKm != null ? 1 : 0) + (filter.datePreset !== 'ANY' ? 1 : 0);
  const savedLabel = (s: SavedSearch) => routeLabel(s.fromRegions, s.toRegions, uz.regionsShort, labels);
  const isCurrent = (s: SavedSearch) =>
    same(s.fromRegions, filter.fromRegions) &&
    same(s.toRegions, filter.toRegions) &&
    (s.minPrice ?? undefined) === filter.minPrice &&
    (s.minPricePerKm ?? undefined) === filter.minPricePerKm;
  const alreadySaved = saved.some(isCurrent);

  return (
    <View style={styles.wrap}>
      {saved.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bleed}
          contentContainerStyle={styles.row}
        >
          {saved.map((s) => (
            <FilterChip
              key={s.id}
              icon={isCurrent(s) ? 'star' : 'star-outline'}
              label={savedLabel(s)}
              selected={isCurrent(s)}
              onPress={() => onApplySaved(s)}
              onLongPress={() => setToDelete(s)}
            />
          ))}
        </ScrollView>
      ) : null}

      <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bleed}
          contentContainerStyle={styles.row}
        >
        <FilterChip
          label={sideText(filter.fromRegions, uz.routeSearch.aroundMe)}
          selected={filter.fromRegions.length > 0}
          trailingIcon="chevron-down"
          onPress={() => setSheet('from')}
          accessibilityLabel={`${uz.routeSearch.from}: ${sideText(filter.fromRegions, uz.routeSearch.aroundMe)}`}
        />
        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} style={styles.arrow} />
        <FilterChip
          label={sideText(filter.toRegions, uz.routeSearch.anywhere)}
          selected={filter.toRegions.length > 0}
          trailingIcon="chevron-down"
          onPress={() => setSheet('to')}
          accessibilityLabel={`${uz.routeSearch.to}: ${sideText(filter.toRegions, uz.routeSearch.anywhere)}`}
        />
        {canSave(filter) && !alreadySaved ? (
          <FilterChip
            icon="star-outline"
            tone="action"
            label={uz.routeSearch.save}
            onPress={saving ? () => undefined : onSave}
          />
        ) : null}
        <FilterChip
          icon="swap-vertical"
          label={uz.routeSearch.sort[filter.sort]}
          selected={filter.sort !== 'DISTANCE'}
          onPress={() => setSheet('filters')}
        />
        <FilterChip
          icon="options-outline"
          label={extraCount > 0 ? String(extraCount) : uz.routeSearch.filters}
          selected={extraCount > 0}
          onPress={() => setSheet('filters')}
          accessibilityLabel={uz.routeSearch.filtersTitle}
        />
        {isFilterActive(filter) ? (
          <FilterChip
            icon="close"
            label={uz.routeSearch.clear}
            onPress={() => onChange(EMPTY_FILTER)}
          />
        ) : null}
      </ScrollView>

      <RegionSheet
        visible={sheet === 'from'}
        title={uz.routeSearch.from}
        emptyLabel={uz.routeSearch.aroundMe}
        value={filter.fromRegions}
        onApply={(fromRegions) => onChange({ ...filter, fromRegions })}
        onClose={() => setSheet(null)}
      />
      <RegionSheet
        visible={sheet === 'to'}
        title={uz.routeSearch.to}
        emptyLabel={uz.routeSearch.anywhere}
        value={filter.toRegions}
        onApply={(toRegions) => onChange({ ...filter, toRegions })}
        onClose={() => setSheet(null)}
      />
      <FilterSheet visible={sheet === 'filters'} value={filter} onApply={onChange} onClose={() => setSheet(null)} />

      <BottomSheet
        visible={toDelete != null}
        onClose={() => setToDelete(null)}
        title={uz.routeSearch.deleteTitle}
        locked={deleting}
      >
        <Text style={styles.deleteDesc}>
          {toDelete ? uz.routeSearch.deleteDesc.replace('{{route}}', savedLabel(toDelete)) : ''}
        </Text>
        <PrimaryButton
          title={uz.routeSearch.deleteConfirm}
          variant="danger"
          size="lg"
          loading={deleting}
          onPress={async () => {
            if (!toDelete) return;
            setDeleting(true);
            try {
              await onDeleteSaved(toDelete);
              setToDelete(null);
            } finally {
              setDeleting(false);
            }
          }}
        />
      </BottomSheet>
    </View>
  );
}

function same(a: Region[], b: Region[]): boolean {
  return a.length === b.length && a.every((r) => b.includes(r));
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 12 },
  // Ro'yxat 16px chetga ega — qator ekran chetigacha surilsin, lekin birinchi chip joyida qolsin
  bleed: { marginHorizontal: -16 },
  row: { gap: 8, alignItems: 'center', paddingHorizontal: 16 },
  arrow: { marginHorizontal: -2 },
  deleteDesc: { fontSize: 15, color: colors.textSecondary, lineHeight: 21 },
});
