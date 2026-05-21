import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { format } from 'date-fns';

type PatientRounding = {
  id: string;
  name: string;
  uhid: string;
  room: string;
  urgency: 'RED' | 'YELLOW' | 'GREEN';
  lastVitals: string;
};

export default function DoctorWorklistScreen({ navigation }: any) {
  const { data: patients, isLoading } = useQuery({
    queryKey: ['doctor-worklist'],
    queryFn: async () => {
      // In a real app, this would fetch from a specific doctor/rounding endpoint
      const res = await apiClient.get('/patients');
      // For demo, we enrich with mock rounding data
      return res.data.map((p: any, i: number) => ({
        ...p,
        room: `Ward ${101 + i}`,
        urgency: i === 0 ? 'RED' : i === 1 ? 'YELLOW' : 'GREEN',
        lastVitals: '120/80 mmHg, 98.6°F',
      })) as PatientRounding[];
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="bg-indigo-600 px-6 pt-16 pb-8">
        <Text className="text-white/60 text-xs font-black uppercase tracking-widest">Doctor Rounds</Text>
        <Text className="text-white text-3xl font-black tracking-tight">Active Worklist</Text>
        <Text className="text-white/80 text-sm font-medium mt-1">{patients?.length} Patients assigned to you</Text>
      </View>

      <View className="p-4 space-y-3">
        {patients?.map((patient) => (
          <TouchableOpacity
            key={patient.id}
            onPress={() => navigation.navigate('RoundingForm', { patient })}
            className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className={`w-3 h-3 rounded-full ${
                  patient.urgency === 'RED' ? 'bg-red-500' :
                  patient.urgency === 'YELLOW' ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`} />
                <View>
                  <Text className="text-slate-900 font-black text-lg">{patient.name}</Text>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{patient.uhid} • Room {patient.room}</Text>
                </View>
              </View>
              <View className="bg-slate-50 px-3 py-1.5 rounded-full">
                <Text className="text-slate-400 text-[10px] font-black">{patient.urgency}</Text>
              </View>
            </View>

            <View className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Last Recorded Vitals</Text>
                <Text className="text-slate-700 text-xs font-bold">{patient.lastVitals}</Text>
              </View>
              <Text className="text-indigo-600 font-black text-xs">GO ROUND ➔</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
