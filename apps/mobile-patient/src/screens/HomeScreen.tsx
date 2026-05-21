import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/auth.store';
import { patientApi } from '@/api/client';
import { Appointment, Patient, Vital } from '@/types';
import UHIDCard from '@/components/UHIDCard';
import VitalsChart from '@/components/VitalsChart';
import { format, isAfter, parseISO } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: 'Confirmed', color: '#10b981', bg: '#ecfdf5' },
  PENDING: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb' },
  IN_PROGRESS: { label: 'In Progress', color: '#6366f1', bg: '#eef2ff' },
  COMPLETED: { label: 'Completed', color: '#94a3b8', bg: '#f8fafc' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' },
  NO_SHOW: { label: 'No Show', color: '#ef4444', bg: '#fef2f2' },
};

export default function HomeScreen() {
  const { user } = useAuthStore();
  const patientId = user?.patientId ?? '';

  const { data: patientData, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const res = await patientApi.getMyProfile(patientId);
      return res.data.data ?? res.data;
    },
    enabled: !!patientId,
  });

  const { data: appointments = [], isLoading: apptLoading, refetch } = useQuery<Appointment[]>({
    queryKey: ['appointments', patientId],
    queryFn: async () => {
      const res = await patientApi.getMyAppointments(patientId);
      return res.data.data ?? res.data ?? [];
    },
    enabled: !!patientId,
  });

  const { data: vitals = [] } = useQuery<Vital[]>({
    queryKey: ['vitals', patientId],
    queryFn: async () => {
      const res = await patientApi.getMyVitals(patientId);
      return res.data.data ?? res.data ?? [];
    },
    enabled: !!patientId,
  });

  const upcomingAppointments = appointments
    .filter((a) => isAfter(parseISO(a.appointmentTime), new Date()) && a.status !== 'CANCELLED')
    .slice(0, 3);

  const isLoading = patientLoading || apptLoading;

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-slate-500 font-semibold mt-4">Loading your health data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#4f46e5" />}
      >
        {/* Greeting Header */}
        <View className="bg-white px-6 pt-16 pb-6">
          <Text className="text-slate-400 text-sm font-semibold">Good day,</Text>
          <Text className="text-slate-900 text-2xl font-black tracking-tight">
            {user?.name?.split(' ')[0] ?? 'Patient'} 👋
          </Text>
        </View>

        <View className="py-6 space-y-6">
          {/* UHID Card */}
          {patientData && <UHIDCard patient={patientData} />}

          {/* Upcoming Appointments */}
          <View className="mt-6 px-4">
            <Text className="text-slate-900 font-black text-lg mb-3">Upcoming Appointments</Text>
            {upcomingAppointments.length === 0 ? (
              <View className="bg-white rounded-[28px] p-6 items-center">
                <Text className="text-3xl mb-2">📅</Text>
                <Text className="text-slate-500 font-semibold text-sm">No upcoming appointments</Text>
              </View>
            ) : (
              upcomingAppointments.map((appt) => {
                const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.PENDING;
                return (
                  <View
                    key={appt.id}
                    className="bg-white rounded-[24px] p-5 mb-3"
                    style={{
                      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
                      shadowOffset: { width: 0, height: 4 },
                    }}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-slate-900 font-black text-base">
                          {appt.staff?.user?.name ?? 'Doctor'}
                        </Text>
                        <Text className="text-slate-500 text-sm font-medium mt-0.5">
                          {appt.staff?.specialty ?? appt.staff?.department?.name}
                        </Text>
                      </View>
                      <View className="px-3 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
                        <Text className="text-[10px] font-black" style={{ color: cfg.color }}>
                          {cfg.label}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-slate-400 text-xs">📅</Text>
                        <Text className="text-slate-600 font-bold text-xs">
                          {format(parseISO(appt.appointmentTime), 'MMM dd, yyyy')}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-slate-400 text-xs">🕐</Text>
                        <Text className="text-slate-600 font-bold text-xs">
                          {format(parseISO(appt.appointmentTime), 'hh:mm a')}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-slate-400 text-xs">🏥</Text>
                        <Text className="text-slate-600 font-bold text-xs" numberOfLines={1}>
                          {appt.branch?.name}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Vitals Chart */}
          <View className="mt-2">
            <VitalsChart vitals={vitals} />
          </View>

          {/* Bottom Spacer */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </View>
  );
}
