import React, { createContext, useContext, ReactNode } from 'react';
import { OtaState, useOtaUpdates } from './useOtaUpdates';
import { OtaUpdateBanner } from './OtaUpdateBanner';

const OtaContext = createContext<OtaState | null>(null);

export function OtaProvider({ children }: { children: ReactNode }) {
  const ota = useOtaUpdates();

  return (
    <OtaContext.Provider value={ota}>
      {children}
      <OtaUpdateBanner />
    </OtaContext.Provider>
  );
}

export function useOta(): OtaState {
  const context = useContext(OtaContext);
  if (!context) {
    throw new Error('useOta must be used within an OtaProvider');
  }
  return context;
}
