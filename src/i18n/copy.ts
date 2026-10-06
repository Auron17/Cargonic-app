import i18n from 'i18next';
import { uz, type TranslationKeys } from './uz';

const catalogs: Partial<Record<string, TranslationKeys>> = {
  uz,
};

export function registerCatalog(lng: string, dict: TranslationKeys): void {
  catalogs[lng] = dict;
  if (i18n.isInitialized) {
    i18n.addResourceBundle(lng, 'translation', dict, true, true);
  }
}

export function getCopy(): TranslationKeys {
  const lng = (i18n.resolvedLanguage || i18n.language || 'uz').split('-')[0];
  return catalogs[lng] ?? uz;
}

export type AppLanguage = 'uz' | 'ru';
export const APP_LANGUAGES: { code: AppLanguage; nameKey: 'languageUz' | 'languageRu' }[] = [
  { code: 'uz', nameKey: 'languageUz' },
  { code: 'ru', nameKey: 'languageRu' },
];
