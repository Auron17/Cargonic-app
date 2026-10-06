import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { generateUuid } from '../utils/uuid';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './storage';
import {
  AuthResponse,
  BatchResult,
  BidRequest,
  BidView,
  CancelRequest,
  DocumentDto,
  DocumentRequest,
  ErrorResponse,
  FeedItem,
  LiveTripDto,
  LoadDto,
  LocationBatch,
  LocationRequest,
  MyBid,
  OtpRequest,
  ProfileDto,
  ProfileRequest,
  RefreshRequest,
  StatusRequest,
  TrackDto,
  TripDetailDto,
  TripListItem,
  UploadResponse,
  UserDto,
  VehicleDto,
  VehicleRequest,
  VerifyRequest,
  WalletDto,
} from './types';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Global auth-event listeners (e.g. for logout when refresh fails)
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Idempotency-Key header generation for state-mutating POST requests
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add Idempotency-Key to POST requests if not already set and not an auth or read-like endpoint
  if (config.method?.toUpperCase() === 'POST' && !config.headers['Idempotency-Key']) {
    const url = config.url || '';
    const isAuth = url.includes('/auth/');
    const isFiles = url.includes('/files');
    if (!isAuth && !isFiles) {
      config.headers['Idempotency-Key'] = generateUuid();
    }
  }

  return config;
});

// Mutex for handling concurrent 401 refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const isAuthUrl = originalRequest.url?.includes('/auth/');

      if (isAuthUrl) {
        // Auth endpoints failing with 401 should not trigger refresh
        return Promise.reject(parseApiError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(async () => {
            const token = await getAccessToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await getRefreshToken();
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshRes = await axios.post<AuthResponse>(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refreshToken: storedRefreshToken } as RefreshRequest
        );

        const { accessToken, refreshToken: newRefreshToken } = refreshRes.data;
        await setAccessToken(accessToken);
        if (newRefreshToken) {
          await setRefreshToken(newRefreshToken);
        }

        processQueue(null);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        await clearTokens();
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
        return Promise.reject(parseApiError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(parseApiError(error));
  }
);

function parseApiError(error: AxiosError<ErrorResponse>): ApiError {
  if (error.response?.data && error.response.data.code) {
    const { code, message, details } = error.response.data;
    return new ApiError(code, message || 'Xatolik yuz berdi', error.response.status, details);
  }

  if (error.response) {
    return new ApiError(
      `HTTP_${error.response.status}`,
      `Server xatosi: ${error.response.status}`,
      error.response.status
    );
  }

  if (error.request) {
    return new ApiError(
      'NETWORK_ERROR',
      'Internet bilan aloqa yo‘q yoki server javob bermadi',
      0
    );
  }

  return new ApiError('UNKNOWN_ERROR', error.message || 'Noma’lum xatolik', 0);
}

// -------------------------------------------------------------
// Sub-modules
// -------------------------------------------------------------

export const authApi = {
  requestOtp: async (phone: string): Promise<void> => {
    await apiClient.post('/auth/otp/request', { phone } as OtpRequest);
  },

  verifyOtp: async (phone: string, code: string, role: 'CARRIER' = 'CARRIER'): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/otp/verify', {
      phone,
      code,
      role,
    } as VerifyRequest);
    return res.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    } as RefreshRequest);
    return res.data;
  },
};

export const meApi = {
  getMe: async (): Promise<UserDto> => {
    const res = await apiClient.get<UserDto>('/me');
    return res.data;
  },

  updateFcmToken: async (token: string): Promise<void> => {
    await apiClient.put('/me/fcm-token', { token });
  },
};

export const carrierApi = {
  getProfile: async (): Promise<ProfileDto> => {
    const res = await apiClient.get<ProfileDto>('/carrier/profile');
    return res.data;
  },

  createProfile: async (data: ProfileRequest): Promise<ProfileDto> => {
    const res = await apiClient.post<ProfileDto>('/carrier/profile', data);
    return res.data;
  },

  updateProfile: async (data: ProfileRequest): Promise<ProfileDto> => {
    const res = await apiClient.put<ProfileDto>('/carrier/profile', data);
    return res.data;
  },

  updateLocation: async (lat: number, lng: number): Promise<void> => {
    await apiClient.post('/carrier/location', { lat, lng } as LocationRequest);
  },

  getVehicles: async (): Promise<VehicleDto[]> => {
    const res = await apiClient.get<VehicleDto[]>('/carrier/vehicles');
    return res.data;
  },

  createVehicle: async (data: VehicleRequest): Promise<VehicleDto> => {
    const res = await apiClient.post<VehicleDto>('/carrier/vehicles', data);
    return res.data;
  },

  updateVehicle: async (data: VehicleRequest): Promise<VehicleDto> => {
    const res = await apiClient.put<VehicleDto>('/carrier/vehicles', data);
    return res.data;
  },

  getDocuments: async (): Promise<DocumentDto[]> => {
    const res = await apiClient.get<DocumentDto[]>('/carrier/documents');
    return res.data;
  },

  uploadDocument: async (data: DocumentRequest): Promise<DocumentDto> => {
    const res = await apiClient.post<DocumentDto>('/carrier/documents', data);
    return res.data;
  },

  getWallet: async (): Promise<WalletDto> => {
    const res = await apiClient.get<WalletDto>('/carrier/wallet');
    return res.data;
  },

  getMyBids: async (): Promise<MyBid[]> => {
    const res = await apiClient.get<MyBid[]>('/carrier/bids');
    return res.data;
  },
};

export const filesApi = {
  uploadFile: async (fileUri: string, mimeType = 'image/jpeg', fileName = 'upload.jpg'): Promise<UploadResponse> => {
    const formData = new FormData();
    // React Native FormData accepts an object with uri, name, type
    const filePayload = {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob;

    formData.append('file', filePayload);

    const token = await getAccessToken();
    const res = await apiClient.post<UploadResponse>('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      transformRequest: (data) => data, // prevent Axios from altering FormData in React Native
    });
    return res.data;
  },

  getFileContentUrl: (key: string): string => {
    return `${API_BASE_URL}/api/v1/files/content?key=${encodeURIComponent(key)}`;
  },
};

export const loadsApi = {
  getFeed: async (): Promise<FeedItem[]> => {
    const res = await apiClient.get<FeedItem[]>('/feed');
    return res.data;
  },

  getLoad: async (id: string): Promise<LoadDto> => {
    const res = await apiClient.get<LoadDto>(`/loads/${id}`);
    return res.data;
  },

  bookLoad: async (id: string): Promise<TripDetailDto> => {
    const res = await apiClient.post<TripDetailDto>(`/loads/${id}/book`);
    return res.data;
  },
};

export const bidsApi = {
  placeBid: async (loadId: string, data: BidRequest): Promise<BidView> => {
    const res = await apiClient.post<BidView>(`/loads/${loadId}/bids`, data);
    return res.data;
  },

  updateBid: async (id: string, data: BidRequest): Promise<BidView> => {
    const res = await apiClient.put<BidView>(`/bids/${id}`, data);
    return res.data;
  },

  withdrawBid: async (id: string): Promise<void> => {
    await apiClient.post(`/bids/${id}/withdraw`);
  },
};

export const tripsApi = {
  getTrips: async (status?: string): Promise<TripListItem[]> => {
    const params = status ? { status } : {};
    const res = await apiClient.get<TripListItem[]>('/trips', { params });
    return res.data;
  },

  getTrip: async (id: string): Promise<TripDetailDto> => {
    const res = await apiClient.get<TripDetailDto>(`/trips/${id}`);
    return res.data;
  },

  updateStatus: async (id: string, data: StatusRequest): Promise<TripDetailDto> => {
    const res = await apiClient.post<TripDetailDto>(`/trips/${id}/status`, data);
    return res.data;
  },

  cancelTrip: async (id: string, data: CancelRequest): Promise<TripDetailDto> => {
    const res = await apiClient.post<TripDetailDto>(`/trips/${id}/cancel`, data);
    return res.data;
  },

  sendLocations: async (id: string, batch: LocationBatch): Promise<BatchResult> => {
    const res = await apiClient.post<BatchResult>(`/trips/${id}/locations`, batch);
    return res.data;
  },

  getTrack: async (id: string): Promise<TrackDto> => {
    const res = await apiClient.get<TrackDto>(`/trips/${id}/track`);
    return res.data;
  },
};

export const trackingApi = {
  sendLocations: async (tripId: string, batch: LocationBatch): Promise<BatchResult> => {
    return tripsApi.sendLocations(tripId, batch);
  },
};
