import {
  shouldClearSessionOnInitError,
  shouldLogoutOnRefreshFailure,
} from './sessionKeep';

describe('shouldLogoutOnRefreshFailure', () => {
  it('logs out when the server rejects the refresh token', () => {
    expect(shouldLogoutOnRefreshFailure({ hadRefreshToken: true, status: 401 })).toBe(true);
    expect(shouldLogoutOnRefreshFailure({ hadRefreshToken: true, status: 403 })).toBe(true);
  });

  it('logs out when there is genuinely no refresh token', () => {
    expect(shouldLogoutOnRefreshFailure({ hadRefreshToken: false })).toBe(true);
  });

  it('keeps the session when the keychain cannot be read', () => {
    expect(
      shouldLogoutOnRefreshFailure({
        hadRefreshToken: false,
        keychainUnavailable: true,
      })
    ).toBe(false);
  });

  it('keeps the session when refresh fails due to network or server error', () => {
    expect(shouldLogoutOnRefreshFailure({ hadRefreshToken: true })).toBe(false);
    expect(shouldLogoutOnRefreshFailure({ hadRefreshToken: true, status: 500 })).toBe(false);
    expect(shouldLogoutOnRefreshFailure({ hadRefreshToken: true, status: 0 })).toBe(false);
  });
});

describe('shouldClearSessionOnInitError', () => {
  it('clears the session only when /me is unauthorized', () => {
    expect(shouldClearSessionOnInitError({ status: 401 })).toBe(true);
    expect(shouldClearSessionOnInitError({ status: 403 })).toBe(true);
    expect(shouldClearSessionOnInitError({ code: 'UNAUTHORIZED', status: 401 })).toBe(true);
  });

  it('keeps tokens when the phone is offline or the radio is not ready', () => {
    expect(shouldClearSessionOnInitError({ code: 'NETWORK_ERROR', status: 0 })).toBe(false);
    expect(shouldClearSessionOnInitError({ code: 'TOKEN_STORE_UNAVAILABLE', status: 0 })).toBe(
      false
    );
    expect(shouldClearSessionOnInitError({ status: 500 })).toBe(false);
    expect(shouldClearSessionOnInitError({ code: 'UNKNOWN_ERROR' })).toBe(false);
  });
});
