import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { shouldStopIdleGps } from './idleGps';
import { stopTracking } from './backgroundTask';

/** Yuk topshirilgach yoki faol reys qolmagach fon GPS ni o'chiradi (ilova qayta ochilganda ham). */
export function useStopIdleGps() {
  const { isAuthenticated, isCarrier } = useAuth();
  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsApi.getTrips(),
    enabled: isAuthenticated && isCarrier,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (shouldStopIdleGps(trips)) {
      void stopTracking();
    }
  }, [trips]);
}
