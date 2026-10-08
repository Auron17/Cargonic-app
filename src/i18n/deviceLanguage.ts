import { NativeModules, Platform } from 'react-native';
import type { AppLanguage } from './copy';

/** Qurilma tili: uz yoki ru. Boshqa tillarda asosiy til — ruscha. */
export function detectDeviceLanguage(): AppLanguage {
  const tag = readDeviceLocale().toLowerCase().replace(/_/g, '-');
  const code = tag.split('-')[0];
  if (code === 'uz') return 'uz';
  if (code === 'ru') return 'ru';
  return 'ru';
}

function readDeviceLocale(): string {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings as
        | { AppleLocale?: string; AppleLanguages?: string[] }
        | undefined;
      const apple = settings?.AppleLocale || settings?.AppleLanguages?.[0];
      if (typeof apple === 'string' && apple.length > 0) return apple;
    }
    const android = NativeModules.I18nManager?.localeIdentifier as string | undefined;
    if (typeof android === 'string' && android.length > 0) return android;
    const intl = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intl) return intl;
  } catch {
    // fallback ru
  }
  return 'ru';
}
