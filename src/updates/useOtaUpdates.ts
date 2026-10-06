import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

export type OtaStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'ready'
  | 'upToDate'
  | 'error'
  | 'disabled';

export interface OtaState {
  isEnabled: boolean;
  status: OtaStatus;
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateReady: boolean;
  lastCheckedAt: Date | null;
  errorMessage: string | null;
  currentUpdateId: string | null;
  runtimeVersion: string | null;
  channel: string | null;
  checkForUpdate: (manual?: boolean) => Promise<boolean>;
  applyUpdate: () => Promise<void>;
  dismissBanner: () => void;
  isBannerVisible: boolean;
  // Dev-only helper to preview/test the in-app OTA flow
  simulateUpdateReadyForTesting: () => void;
}

/** Simulyatorda banner ko‘rish. Ko‘rib bo‘lgach false qiling. */
const DEV_PREVIEW_OTA_BANNER = __DEV__;

export function useOtaUpdates(): OtaState {
  const isEnabled = Updates.isEnabled;
  const [status, setStatus] = useState<OtaStatus>(
    DEV_PREVIEW_OTA_BANNER ? 'ready' : isEnabled ? 'idle' : 'disabled'
  );
  const [isBannerVisible, setIsBannerVisible] = useState(DEV_PREVIEW_OTA_BANNER);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isCheckingRef = useRef(false);

  const currentUpdateId = Updates.updateId ?? null;
  const runtimeVersion = typeof Updates.runtimeVersion === 'string' ? Updates.runtimeVersion : null;
  const channel = Updates.channel ?? null;

  const checkForUpdate = useCallback(
    async (manual = false): Promise<boolean> => {
      if (!isEnabled) {
        setStatus('disabled');
        return false;
      }

      if (isCheckingRef.current) return false;
      isCheckingRef.current = true;
      setStatus('checking');
      setErrorMessage(null);

      try {
        const checkResult = await Updates.checkForUpdateAsync();
        setLastCheckedAt(new Date());

        if (checkResult.isAvailable) {
          setStatus('downloading');
          const fetchResult = await Updates.fetchUpdateAsync();
          if (fetchResult.isNew) {
            setStatus('ready');
            setIsBannerVisible(true);
            return true;
          } else {
            setStatus('upToDate');
            return false;
          }
        } else {
          setStatus('upToDate');
          return false;
        }
      } catch (err: unknown) {
        const errObj = err as Error;
        const msg = errObj?.message || 'Yangilanishni tekshirishda xatolik';
        console.warn('[OTA Updates] Tekshirishda xatolik:', msg);
        setStatus('error');
        setErrorMessage(msg);
        return false;
      } finally {
        isCheckingRef.current = false;
      }
    },
    [isEnabled]
  );

  const applyUpdate = useCallback(async () => {
    try {
      if (isEnabled) {
        await Updates.reloadAsync();
      } else {
        // Dev fallback
        setIsBannerVisible(false);
        setStatus('idle');
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error('[OTA Updates] Qayta yuklashda xatolik:', errObj?.message);
      setErrorMessage(errObj?.message || 'Ilovani qayta yuklashda xatolik');
    }
  }, [isEnabled]);

  const dismissBanner = useCallback(() => {
    setIsBannerVisible(false);
  }, []);

  const simulateUpdateReadyForTesting = useCallback(() => {
    setStatus('ready');
    setIsBannerVisible(true);
  }, []);

  // 1. Initial check when app opens
  useEffect(() => {
    if (!isEnabled) return;

    // Small delay to let the UI mount smoothly before network check
    const timeout = setTimeout(() => {
      checkForUpdate(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [checkForUpdate, isEnabled]);

  // 2. Check when coming back from background
  useEffect(() => {
    if (!isEnabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForUpdate(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkForUpdate, isEnabled]);

  return {
    isEnabled,
    status,
    isChecking: status === 'checking',
    isDownloading: status === 'downloading',
    isUpdateReady: status === 'ready',
    lastCheckedAt,
    errorMessage,
    currentUpdateId,
    runtimeVersion,
    channel,
    checkForUpdate,
    applyUpdate,
    dismissBanner,
    isBannerVisible,
    simulateUpdateReadyForTesting,
  };
}
