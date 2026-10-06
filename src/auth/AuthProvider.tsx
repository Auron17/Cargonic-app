import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { carrierApi, meApi, onUnauthorized } from '../api/client';
import { clearTokens, getAccessToken, setAccessToken, setRefreshToken } from '../api/storage';
import { AuthResponse, ProfileDto, UserDto } from '../api/types';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserDto | null;
  profile: ProfileDto | null;
  isCarrier: boolean;
  isVerified: boolean;
  login: (authResponse: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDto | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const segments = useSegments();
  const router = useRouter();

  // Load user info and profile on app start
  const initAuth = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setUser(null);
        setProfile(null);
        return;
      }

      const me = await meApi.getMe();
      setUser(me);

      if (me.role === 'CARRIER') {
        try {
          const carrierProfile = await carrierApi.getProfile();
          setProfile(carrierProfile);
        } catch (profileErr: unknown) {
          // Profile might not exist yet (404)
          const err = profileErr as { status?: number; code?: string };
          if (err?.status === 404 || err?.code === 'NOT_FOUND') {
            setProfile(null);
          }
        }
      }
    } catch {
      await clearTokens();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    // Listen for unauthorized events (e.g. failed refresh token)
    const unsubscribe = onUnauthorized(() => {
      setUser(null);
      setProfile(null);
      router.replace('/(auth)/phone');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    try {
      const carrierProfile = await carrierApi.getProfile();
      setProfile(carrierProfile);
    } catch (refreshErr: unknown) {
      const err = refreshErr as { status?: number; code?: string };
      if (err?.status === 404 || err?.code === 'NOT_FOUND') {
        setProfile(null);
      }
    }
  };

  const refreshUser = async () => {
    try {
      const me = await meApi.getMe();
      setUser(me);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const login = async (authResponse: AuthResponse) => {
    await setAccessToken(authResponse.accessToken);
    if (authResponse.refreshToken) {
      await setRefreshToken(authResponse.refreshToken);
    }
    setUser(authResponse.user);

    if (authResponse.user.role === 'CARRIER') {
      try {
        const carrierProfile = await carrierApi.getProfile();
        setProfile(carrierProfile);
      } catch {
        setProfile(null);
      }
    }
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
    setProfile(null);
    router.replace('/(auth)/phone');
  };

  const isAuthenticated = !!user;
  const isCarrier = user?.role === 'CARRIER';
  const isVerified = profile?.verificationStatus === 'APPROVED';

  // Navigation guard logic
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/phone');
      }
      return;
    }

    // User is authenticated
    if (!isCarrier) {
      // User is SHIPPER or ADMIN
      // If not already in code or wrong role screen, send to code screen (or auth area showing wrong role banner)
      return;
    }

    // Role is CARRIER
    if (!profile || profile.verificationStatus !== 'APPROVED') {
      // Needs onboarding
      if (!inOnboardingGroup) {
        if (!profile) {
          router.replace('/(onboarding)/profile');
        } else if (!profile.vehicle) {
          router.replace('/(onboarding)/vehicle');
        } else {
          router.replace('/(onboarding)/status');
        }
      }
    } else {
      // Approved carrier
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isLoading, isAuthenticated, isCarrier, profile, segments]);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        profile,
        isCarrier,
        isVerified,
        login,
        logout,
        refreshProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
