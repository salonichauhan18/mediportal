import React from 'react';
import {
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { patientApi } from '@/api/client';
import { Appointment } from '@/types';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  CONFIRMED: { label: 'Confirmed', color: '#10b981', bg: '#ecfdf5', emoji: '✅' },
  PENDING: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb', emoji: '⏳' },
  IN_PROGRESS: { label: 'In Progress', color: '#6366f1', bg: '#eef2ff', emoji: '🩺' },
  COMPLETED: { label: 'Completed', color: '#94a3b8', bg: '#f8fafc', emoji: '✔️' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2', emoji: '❌' },
  NO_SHOW: { label: 'No Show', color: '#ef4444', bg: '#fef2f2', emoji: '🚫' },
};

export default function AppointmentsScreen() {
  const { user } = useAuthStore();
  const patientId = user?.patientId ?? '';

  const { data: appointments = [], isLoading, refetch, isRefetching } = useQuery<Appointment[]>({
    queryKey: ['appointments', patientId],
    queryFn: async () => {
      const res = await patientApi.getMyAppointments(patientId);
      return res.data.data ?? res.data ?? [];
    },
    enabled: !!patientId,
  });

  const upcoming = appointments.filter(
    (a) => isAfter(parseISO(a.appointmentTime), new Date()) && a.status !== 'CANCELLED',
  );
  const past = appointments.filter(
    (a) => isBefore(parseISO(a.appointmentTime), new Date()) || a.status === 'COMPLETED',
  );

  const renderItem = ({ item }: { item: Appointment }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        className="bg-white rounded-[24px] p-5 mb-3 mx-4"
        style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-slate-900 font-black text-base">
              {item.staff?.user?.name ?? 'Doctor'}
            </Text>
            <Text className="text-slate-500 text-sm font-medium mt-0.5">
              {item.staff?.specialty ?? item.staff?.department?.name ?? 'General'}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-xl">{cfg.emoji}</Text>
            <View className="mt-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
              <Text className="text-[9px] font-black" style={{ color: cfg.color }}>
                {cfg.label}
              </Text>
            </View>
          </View>
        </View>

        {item.reason && (
          <View className="mt-3 bg-slate-50 rounded-xl px-3 py-2">
            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Reason</Text>
            <Text className="text-slate-700 text-sm font-medium mt-0.5" numberOfLines={2}>
              {item.reason}
            </Text>
          </View>
        )}

        <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-slate-50">
          <Text className="text-slate-500 text-xs font-semibold">
            📅 {format(parseISO(item.appointmentTime), 'EEE, MMM dd yyyy')}
          </Text>
          <Text className="text-slate-500 text-xs font-semibold">
            🕐 {format(parseISO(item.appointmentTime), 'hh:mm a')}
          </Text>
        </View>
        {item.branch?.name && (
          <Text className="text-slate-400 text-xs font-medium mt-1">
            🏥 {item.branch.name}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 pt-16 pb-4">
        <Text className="text-slate-900 text-2xl font-black tracking-tight">Appointments</Text>
        <Text className="text-slate-400 text-sm font-medium mt-1">
          {upcoming.length} upcoming · {past.length} past
        </Text>
      </View>

      <FlashList
        data={[...upcoming, ...past]}
        renderItem={renderItem}
        estimatedItemSize={160}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />
        }
        ListHeaderComponent={
          <View>
            {upcoming.length > 0 && (
              <Text className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 pt-4 pb-2">
                Upcoming
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-5xl mb-3">📅</Text>
            <Text className="text-slate-500 font-semibold text-base">No appointments found</Text>
            <Text className="text-slate-400 text-sm mt-1 text-center px-8">
              Contact reception to book your next visit.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
      />
    </View>
  );
}
