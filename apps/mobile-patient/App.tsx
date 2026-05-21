import "./src/styles/global.css";
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';

import { useAuthStore } from '@/store/auth.store';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import DocumentsScreen from '@/screens/DocumentsScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import SymptomCheckerScreen from './src/screens/SymptomCheckerScreen';
import DoctorWorklistScreen from './src/screens/DoctorWorklistScreen';
import RoundingFormScreen from './src/screens/RoundingFormScreen';
import VirtualConsultationScreen from './src/screens/VirtualConsultationScreen';
import RpmSettingsScreen from './src/screens/RpmSettingsScreen';

// ── Deep Linking Config ────────────────────────────────────────────────────────
const linking = {
  prefixes: [Linking.createURL('/'), 'mediportal://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Documents: 'documents',
          Appointments: 'appointments',
          SymptomChecker: 'symptom-checker',
        },
      },
      DoctorTabs: {
        screens: {
          Worklist: 'worklist',
        },
      },
      RoundingForm: 'rounding/:patientId',
      VirtualConsultation: 'consultation/:appointmentId',
      Login: 'login',
    },
  },
};

// ── TanStack Query Client ──────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Navigators ─────────────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Custom Tab Bar Icon ───────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: '🏠', inactive: '🏡' },
  Documents: { active: '📋', inactive: '📄' },
  Appointments: { active: '📅', inactive: '🗓️' },
};

function TabIcon({ route, focused }: { route: any; focused: boolean }) {
  const icons = TAB_ICONS[route.name] ?? { active: '●', inactive: '○' };
  return (
    <View className="items-center">
      <Text style={{ fontSize: focused ? 22 : 20 }}>
        {focused ? icons.active : icons.inactive}
      </Text>
    </View>
  );
}

// ── Main Tabs (Authenticated) ─────────────────────────────────────────────────
function MainTabs() {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon route={route} focused={focused} />,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 72,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.5,
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'My Health' }} />
      <Tab.Screen 
        name="Appointments" 
        component={AppointmentsScreen} 
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📅</Text> }}
      />
      <Tab.Screen 
        name="SymptomChecker" 
        component={SymptomCheckerScreen} 
        options={{ title: 'AI Triage', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>✨</Text> }}
      />
      <Tab.Screen name="Documents" component={DocumentsScreen} options={{ tabBarLabel: 'Documents' }} />
      <Tab.Screen 
        name="RPM" 
        component={RpmSettingsScreen} 
        options={{ title: 'Health Sync', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⌚</Text> }}
      />
    </Tab.Navigator>
  );
}

// ── Doctor Tabs (Authenticated Staff) ─────────────────────────────────────────
function DoctorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { height: 72, paddingBottom: 8, paddingTop: 8 },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Worklist" 
        component={DoctorWorklistScreen} 
        options={{ title: 'Patients', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👨‍⚕️</Text> }}
      />
      <Tab.Screen 
        name="SymptomChecker" 
        component={SymptomCheckerScreen} 
        options={{ title: 'AI Triage', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>✨</Text> }}
      />
    </Tab.Navigator>
  );
}

// ── Splash / Loading Screen ───────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View className="flex-1 bg-brand-600 items-center justify-center">
      <Text className="text-white text-5xl mb-6">🏥</Text>
      <Text className="text-white text-2xl font-black">MediPortal</Text>
      <Text className="text-white/60 text-sm font-semibold mt-1">Patient Portal</Text>
      <ActivityIndicator color="rgba(255,255,255,0.6)" style={{ marginTop: 32 }} />
    </View>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
const NavTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#f8fafc' },
};

function RootNavigator() {
  const { isAuthenticated, loadFromStorage, triggerBiometric } = useAuthStore();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [biometricPassed, setBiometricPassed] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      await loadFromStorage();
      setBootstrapping(false);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!bootstrapping && isAuthenticated && !biometricPassed) {
      const check = async () => {
        const passed = await triggerBiometric();
        if (passed) {
          setBiometricPassed(true);
        } else {
          // User cancelled biometric — force logout
          useAuthStore.getState().logout();
        }
      };
      check();
    }
  }, [bootstrapping, isAuthenticated]);

  if (bootstrapping) return <LoadingScreen />;

  return (
    <NavigationContainer linking={linking as any} theme={NavTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated || !biometricPassed ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {useAuthStore.getState().user?.role === 'PATIENT' ? (
              <Stack.Screen name="MainTabs" component={MainTabs} />
            ) : (
              <>
                <Stack.Screen name="DoctorTabs" component={DoctorTabs} />
                <Stack.Screen name="RoundingForm" component={RoundingFormScreen} />
                <Stack.Screen name="VirtualConsultation" component={VirtualConsultationScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── App Entry ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}
