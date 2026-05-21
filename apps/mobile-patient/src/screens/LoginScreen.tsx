import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { authApi, patientApi } from '@/api/client';
import { useAuthStore, PatientUser } from '@/store/auth.store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      const body = res.data;
      const accessToken = body.data?.accessToken ?? body.accessToken;
      const refreshToken = body.data?.refreshToken ?? body.refreshToken;

      // Fetch full user profile
      const meRes = await authApi.me();
      const me = meRes.data.data ?? meRes.data;

      const user: PatientUser = {
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        patientId: me.patient?.id,
        uhid: me.patient?.uhid,
      };

      await login(accessToken, refreshToken, user);
      // Navigation handled automatically by App.tsx auth state
    } catch (error: any) {
      const message =
        error.response?.data?.message ?? 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header Banner */}
        <View className="bg-brand-600 pt-20 pb-16 px-6 rounded-b-[48px]">
          <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-6">
            <Text className="text-4xl">🏥</Text>
          </View>
          <Text className="text-white text-4xl font-black tracking-tight">MediPortal</Text>
          <Text className="text-white/70 text-base font-semibold mt-1">Patient Portal</Text>
        </View>

        {/* Form */}
        <View className="px-6 pt-10 pb-8 flex-1">
          <Text className="text-slate-900 text-2xl font-black mb-1">Welcome Back</Text>
          <Text className="text-slate-500 text-sm font-medium mb-8">
            Sign in to access your health records
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-medium text-base"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View>
              <Text className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-medium text-base"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-brand-600 rounded-2xl py-5 items-center mt-8 shadow-lg"
            style={{ shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-black text-base">Sign In Securely</Text>
            )}
          </TouchableOpacity>

          <Text className="text-center text-slate-400 text-xs font-medium mt-8">
            🔒 Your data is encrypted and protected by HIPAA-compliant standards.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
