import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { authApi } from '../api/client';
import type { AuthResponse } from '../api/types';

const POLL_MS = 2000;

type Phase = 'idle' | 'starting' | 'waiting';

/**
 * Telegram bot orqali kirish: kod olinadi → t.me/<bot>?start=login_<code> ochiladi →
 * haydovchi botda raqamini ulashadi → ilova status so'rab tokenlarni oladi.
 * Haydovchi Telegram'dan qaytganda (AppState active) darhol tekshiriladi.
 */
export function useTelegramLogin(onConfirmed: (auth: AuthResponse) => Promise<void> | void) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<'expired' | 'noTelegram' | 'network' | null>(null);
  // Server aniq sabab qaytarsa (masalan, bot sozlanmagan) — shuni ko'rsatamiz
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const session = useRef<{ code: string; deepLink: string } | null>(null);
  const busy = useRef(false);
  const onConfirmedRef = useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  const poll = useCallback(async () => {
    const s = session.current;
    if (!s || busy.current) return;
    busy.current = true;
    try {
      const res = await authApi.telegramStatus(s.code);
      if (res.status === 'CONFIRMED' && res.auth) {
        session.current = null;
        setPhase('idle');
        await onConfirmedRef.current(res.auth);
      } else if (res.status !== 'PENDING') {
        session.current = null;
        setPhase('idle');
        setError('expired');
      }
    } catch {
      // Tarmoq vaqtincha uzilsa keyingi urinishda qayta so'raymiz
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const timer = setInterval(poll, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void poll();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [phase, poll]);

  const openTelegram = useCallback(async () => {
    const s = session.current;
    if (!s) return;
    try {
      await Linking.openURL(s.deepLink);
    } catch {
      setError('noTelegram');
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setServerMessage(null);
    setPhase('starting');
    try {
      const res = await authApi.telegramStart();
      session.current = { code: res.code, deepLink: res.deepLink };
      setPhase('waiting');
      await openTelegram();
    } catch (err: unknown) {
      setPhase('idle');
      setError('network');
      setServerMessage((err as { message?: string })?.message ?? null);
    }
  }, [openTelegram]);

  const cancel = useCallback(() => {
    session.current = null;
    setPhase('idle');
  }, []);

  const clearError = () => {
    setError(null);
    setServerMessage(null);
  };

  return { phase, error, serverMessage, clearError, start, cancel, reopen: openTelegram };
}
