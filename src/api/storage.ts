import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'yuk_carrier_access_token';
const REFRESH_TOKEN_KEY = 'yuk_carrier_refresh_token';

/** iOS fon GPS/refresh tokenni qurilma qulflanganda ham o‘qishi uchun. */
export const TOKEN_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token, TOKEN_STORE_OPTIONS);
  } catch (error) {
    console.error('Failed to save access token', error);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, TOKEN_STORE_OPTIONS);
  } catch (error) {
    console.error('Failed to save refresh token', error);
  }
}

/** Eski WHEN_UNLOCKED yozuvlarni AFTER_FIRST_UNLOCK ga qayta yozadi. */
export async function rewriteStoredTokens(): Promise<void> {
  const access = await getAccessToken();
  if (access) {
    await setAccessToken(access);
  }
  try {
    const refresh = await getRefreshToken();
    if (refresh) {
      await setRefreshToken(refresh);
    }
  } catch {
    // Qurilma qulflangan bo‘lsa keyinroq qayta yoziladi.
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  } catch {}
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {}
}
