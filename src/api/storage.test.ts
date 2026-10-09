import * as SecureStore from 'expo-secure-store';
import {
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  TOKEN_STORE_OPTIONS,
} from './storage';

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 1,
  setItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockedStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('token storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes tokens so iOS can read them after the first unlock', async () => {
    expect(TOKEN_STORE_OPTIONS.keychainAccessible).toBe(SecureStore.AFTER_FIRST_UNLOCK);

    await setAccessToken('access');
    await setRefreshToken('refresh');

    expect(mockedStore.setItemAsync).toHaveBeenCalledWith(
      'yuk_carrier_access_token',
      'access',
      expect.objectContaining({ keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK })
    );
    expect(mockedStore.setItemAsync).toHaveBeenCalledWith(
      'yuk_carrier_refresh_token',
      'refresh',
      expect.objectContaining({ keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK })
    );
  });

  it('does not treat a locked keychain as a missing refresh token', async () => {
    mockedStore.getItemAsync.mockRejectedValueOnce(
      new Error('User interaction is not allowed.')
    );

    await expect(getRefreshToken()).rejects.toThrow(/interaction is not allowed/i);
  });
});
