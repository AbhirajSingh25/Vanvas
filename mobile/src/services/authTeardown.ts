import { nativeApi } from "./api";
import { secureStorage } from "./storage";
import { offlineDb } from "./db";

export interface AuthTeardownState {
  setToken: (token: string | null) => void;
  setUser: (user: any | null) => void;
}

/**
 * Single-owner account deletion teardown logic.
 * Guarantees that credentials and React state are wiped even if local disk cleanup encounters an error.
 */
export async function executeAccountDeletionTeardown(
  userIdToPurge: string | undefined,
  password: string,
  stateHooks: AuthTeardownState,
  api = nativeApi,
  storage = secureStorage,
  db = offlineDb
): Promise<{ message: string; user_id?: string; status: string }> {
  // 1. Perform authenticated backend deletion request
  const res = await api.deleteAccount(password);

  // 2. Tear down SecureStore session and React authentication state in try/finally
  try {
    await storage.clearSession();
  } finally {
    stateHooks.setToken(null);
    stateHooks.setUser(null);
  }

  // 3. Purge user-owned private SQLite data
  if (userIdToPurge) {
    try {
      await db.purgeUserAccountData(userIdToPurge);
    } catch (localErr) {
      console.warn("[AuthTeardown] Local account cache cleanup error:", localErr);
    }
  }

  return res;
}

