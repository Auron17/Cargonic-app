import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PendingDoc } from './pendingDocs';

const KEY = '@cargonic_pending_docs_v1';

export async function loadPending(): Promise<PendingDoc[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingDoc[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePending(list: PendingDoc[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function clearPending(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
