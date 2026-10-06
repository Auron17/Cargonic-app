import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { APP_LANGUAGES, setAppLanguage, useCopy, type AppLanguage } from '../i18n';
import { colors, radii } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LanguageSheet({ visible, onClose }: Props) {
  const uz = useCopy();
  const { i18n } = useTranslation();
  const current = (i18n.language || 'uz').split('-')[0] as AppLanguage;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={uz.settings.language}>
      <View style={styles.list}>
        {APP_LANGUAGES.map((lang) => {
          const selected = current === lang.code;
          const name = uz.settings[lang.nameKey];
          return (
            <Pressable
              key={lang.code}
              onPress={() => {
                void setAppLanguage(lang.code);
                onClose();
              }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={name}
            >
              <Text style={[styles.name, selected && styles.nameSelected]}>{name}</Text>
              {selected ? <Ionicons name="checkmark" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 4,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: radii.md,
  },
  pressed: {
    backgroundColor: colors.slate50,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.slate900,
  },
  nameSelected: {
    color: colors.primary,
  },
});
