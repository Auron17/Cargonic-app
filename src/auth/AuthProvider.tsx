import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { carrierApi, meApi, onUnauthorized } from '../api/client';
import {
  clearTokens,
  getAccessToken,
  rewriteStoredTokens,
  setAccessToken,
  setRefreshToken,
} from '../api/storage';
import { AuthResponse, ProfileDto, UserDto } from '../api/types';
import { shouldClearSessionOnInitError } from './sessionKeep';

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

  // Load user info and profile on app start / foreground. iOS radio or keychain
  // xatosi sessiyani yopmasin — faqat server 401/403 bo‘lsa chiqaramiz.
  const initAuth = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setUser(null);
        setProfile(null);
        return;
      }

      await rewriteStoredTokens();

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const me = await meApi.getMe();
          setUser(me);

          if (me.role === 'CARRIER') {
            try {
              const carrierProfile = await carrierApi.getProfile();
              setProfile(carrierProfile);
            } catch (profileErr: unknown) {
              const err = profileErr as { status?: number; code?: string };
              if (err?.status === 404 || err?.code === 'NOT_FOUND') {
                setProfile(null);
              }
            }
          }
          return;
        } catch (err: unknown) {
          const apiErr = err as { status?: number; code?: string };
          if (shouldClearSessionOnInitError(apiErr)) {
            await clearTokens();
            setUser(null);
            setProfile(null);
            return;
          }
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void initAuth();

    const unsubscribe = onUnauthorized(() => {
      setUser(null);
      setProfile(null);
    });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void initAuth();
      }
    });

    return () => {
      unsubscribe();
      appStateSub.remove();
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
    // Profil foydalanuvchidan OLDIN olinadi: aks holda navigatsiya bir lahza "profil yo'q"
    // holatini ko'rib, tasdiqlangan haydovchini ro'yxatdan o'tish formasiga yuborib qo'yadi.
    let carrierProfile: ProfileDto | null = null;
    if (authResponse.user.role === 'CARRIER') {
      try {
        carrierProfile = await carrierApi.getProfile();
      } catch {
        carrierProfile = null;
      }
    }
    setProfile(carrierProfile);
    setUser(authResponse.user);
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
    setProfile(null);
  };

  const isAuthenticated = !!user;
  const isCarrier = user?.role === 'CARRIER';
  const isVerified = profile?.verificationStatus === 'APPROVED';

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
