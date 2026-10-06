import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { APP_LANGUAGES, setAppLanguage, useCopy, type AppLanguage } from '../i18n';
import { colors, radii } from '../theme';

/** Login ekrani uchun ixcham Oʻzbekcha / Русский tanlov. */
export function LanguageChips() {
  const uz = useCopy();
  const { i18n } = useTranslation();
  const current = (i18n.language || 'uz').split('-')[0] as AppLanguage;

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {APP_LANGUAGES.map((lang) => {
        const selected = current === lang.code;
        const name = uz.settings[lang.nameKey];
        return (
          <Pressable
            key={lang.code}
            onPress={() => {
              void setAppLanguage(lang.code);
            }}
            style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && styles.pressed]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={name}
          >
            <Text style={[styles.label, selected && styles.labelOn]}>{name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 20,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.slate100,
  },
  chipOn: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate700,
  },
  labelOn: {
    color: '#FFFFFF',
  },
});
