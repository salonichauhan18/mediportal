import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Environment ────────────────────────────────────────────────────────────────
// Change to your local IP for physical device testing (e.g., '192.168.1.x')
// For Expo Go on a simulator, localhost works.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request Interceptor — Auto-attach JWT ──────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('mediportal_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor — Token Refresh on 401 ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('mediportal_refresh_token');
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        const newToken = res.data.data?.accessToken || res.data.accessToken;
        await SecureStore.setItemAsync('mediportal_access_token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — clear storage and redirect to login handled by app
        await SecureStore.deleteItemAsync('mediportal_access_token');
        await SecureStore.deleteItemAsync('mediportal_refresh_token');
      }
    }

    return Promise.reject(error);
  },
);

// ── Typed API Helpers ─────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  me: () => apiClient.get('/auth/me'),
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }),
};

export const patientApi = {
  getMyProfile: (patientId: string) =>
    apiClient.get(`/patients/${patientId}`),
  getMyAppointments: (patientId: string) =>
    apiClient.get(`/appointments?patientId=${patientId}`),
  getMyVitals: (patientId: string) =>
    apiClient.get(`/ehr/vitals?patientId=${patientId}`),
  getMyLabOrders: (patientId: string) =>
    apiClient.get(`/ehr/lab-orders?patientId=${patientId}`),
  getMyPrescriptions: (patientId: string) =>
    apiClient.get(`/ehr/prescriptions?patientId=${patientId}`),
  getMyInvoices: (patientId: string) =>
    apiClient.get(`/billing/invoices?patientId=${patientId}`),
};
