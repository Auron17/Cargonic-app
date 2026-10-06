import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { uz } from './uz';

export const defaultNS = 'translation';
export const resources = {
  uz: {
    translation: uz,
  },
} as const;

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

export default i18n;
export { uz };
