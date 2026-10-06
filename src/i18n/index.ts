import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { uz } from './uz';
import { ru } from './ru';
import { registerCatalog, type AppLanguage } from './copy';

export const defaultNS = 'translation';
export const LANG_STORAGE_KEY = '@cargonic_lng';

const resources = {
  uz: {
    translation: uz,
  },
  ru: {
    translation: ru,
  },
} as const;

registerCatalog('uz', uz);
registerCatalog('ru', ru);

if (!i18n.isInitialized) {
  // i18next instance method; eslint confuses it with a named export.
  // eslint-disable-next-line import/no-named-as-default-member
  i18n.use(initReactI18next).init({
    lng: 'uz',
    fallbackLng: 'uz',
    resources,
    defaultNS,
    interpolation: {
      escapeValue: false,
    },
  });
}

export async function loadSavedLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'uz' || saved === 'ru') {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // default uz
  }
}

export async function setAppLanguage(code: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANG_STORAGE_KEY, code);
  await i18n.changeLanguage(code);
}

export default i18n;
export { uz };
export { ru };
export type { TranslationKeys } from './uz';
export { useCopy } from './useCopy';
export { getCopy, APP_LANGUAGES, registerCatalog } from './copy';
export type { AppLanguage } from './copy';
