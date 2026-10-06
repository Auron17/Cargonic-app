import { useTranslation } from 'react-i18next';
import { getCopy } from './copy';
import type { TranslationKeys } from './uz';

/** Joriy til lug‘ati. Til o‘zgarsa komponent qayta chiziladi. */
export function useCopy(): TranslationKeys {
  const { i18n } = useTranslation();
  void i18n.language;
  void i18n.resolvedLanguage;
  return getCopy();
}
