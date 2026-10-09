export type RefreshFailure = {
  hadRefreshToken: boolean;
  keychainUnavailable?: boolean;
  status?: number;
};

export type InitAuthError = {
  code?: string;
  status?: number;
};

/** Refresh faqat server tokenni rad etganda yoki token umuman yo‘q bo‘lganda sessiyani yopadi. */
export function shouldLogoutOnRefreshFailure(failure: RefreshFailure): boolean {
  if (failure.keychainUnavailable) {
    return false;
  }
  if (!failure.hadRefreshToken) {
    return true;
  }
  return failure.status === 401 || failure.status === 403;
}

/** /me xatosi faqat 401/403 bo‘lsa tokenlarni o‘chiradi; tarmoq/keychain xatosi sessiya saqlaydi. */
export function shouldClearSessionOnInitError(err: InitAuthError | null | undefined): boolean {
  if (!err) {
    return false;
  }
  return err.status === 401 || err.status === 403;
}
