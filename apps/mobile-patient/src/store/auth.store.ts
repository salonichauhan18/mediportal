import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const TOKEN_KEY = 'mediportal_access_token';
const REFRESH_KEY = 'mediportal_refresh_token';
const BIOMETRIC_ENROLLED_KEY = 'mediportal_biometric_enrolled';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: PatientUser | null;
  isBiometricEnrolled: boolean;

  login: (token: string, refreshToken: string, user: PatientUser) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  triggerBiometric: () => Promise<boolean>;
  enrollBiometric: () => Promise<void>;
}

export interface PatientUser {
  id: string;
  name: string;
  email: string;
  role: string;
  patientId?: string;
  uhid?: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,
  isBiometricEnrolled: false,

  login: async (token: string, refreshToken: string, user: PatientUser) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    await SecureStore.setItemAsync('mediportal_user', JSON.stringify(user));
    set({ token, refreshToken, user, isAuthenticated: true });

    // Auto-enroll biometrics on first successful login
    const enrolled = await SecureStore.getItemAsync(BIOMETRIC_ENROLLED_KEY);
    if (!enrolled) {
      await get().enrollBiometric();
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync('mediportal_user');
    await SecureStore.deleteItemAsync(BIOMETRIC_ENROLLED_KEY);
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isBiometricEnrolled: false });
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    const userStr = await SecureStore.getItemAsync('mediportal_user');
    const biometricEnrolled = await SecureStore.getItemAsync(BIOMETRIC_ENROLLED_KEY);

    if (token && userStr) {
      set({
        token,
        refreshToken,
        user: JSON.parse(userStr),
        isAuthenticated: true,
        isBiometricEnrolled: biometricEnrolled === 'true',
      });
    }
  },

  enrollBiometric: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (compatible && enrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Face ID / Fingerprint for quick access to MediPortal',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Skip',
      });

      if (result.success) {
        await SecureStore.setItemAsync(BIOMETRIC_ENROLLED_KEY, 'true');
        set({ isBiometricEnrolled: true });
      }
    }
  },

  triggerBiometric: async (): Promise<boolean> => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible || !enrolled) {
      return true; // Fallback: allow access without biometric on unsupported devices
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Access your health records',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
    });

    return result.success;
  },
}));
