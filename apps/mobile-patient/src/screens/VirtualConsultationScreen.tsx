import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiClient } from '@/api/client';

export default function VirtualConsultationScreen({ route, navigation }: any) {
  const { appointmentId, roomUrl } = route.params;
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('JOINING');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // In a real app, initialize WebRTC here
    const timer = setTimeout(() => {
      setLoading(false);
      setStatus('LIVE');
    }, 2000);

    const callTimer = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(callTimer);
    };
  }, []);

  const endCall = async () => {
    try {
      await apiClient.post(`/telemedicine/end/${appointmentId}`, { duration });
      navigation.goBack();
    } catch (err) {
      navigation.goBack();
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-1 bg-slate-900">
      {/* Remote Video (Doctor) Placeholder */}
      <View className="flex-1 items-center justify-center">
        {loading ? (
          <View className="items-center">
            <ActivityIndicator color="white" size="large" />
            <Text className="text-white font-black mt-4 uppercase tracking-widest">Joining Secure Room...</Text>
          </View>
        ) : (
          <View className="items-center">
            <Text className="text-white/20 text-4xl font-black mb-4">👨‍⚕️</Text>
            <Text className="text-white font-black text-xl">DR. SARAH J.</Text>
            <Text className="text-emerald-400 font-bold text-xs uppercase tracking-widest mt-2">Live • Encrypted</Text>
          </View>
        )}
      </View>

      {/* Local Video Placeholder */}
      <View className="absolute bottom-32 right-6 w-32 h-44 bg-slate-800 rounded-3xl border-2 border-slate-700 shadow-2xl overflow-hidden">
         <View className="flex-1 items-center justify-center">
            <Text className="text-white/20 text-2xl">👤</Text>
            <Text className="text-white/40 text-[8px] font-black uppercase mt-1">You</Text>
         </View>
      </View>

      {/* Call Info & Controls */}
      <View className="bg-slate-800/80 backdrop-blur-xl p-8 pb-12 rounded-t-[48px]">
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Consultation Time</Text>
            <Text className="text-white text-2xl font-black">{formatTime(duration)}</Text>
          </View>
          <View className="bg-emerald-500/20 px-4 py-2 rounded-2xl border border-emerald-500/30">
            <Text className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">High Quality</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-center gap-8">
          <TouchableOpacity className="w-16 h-16 bg-slate-700 rounded-full items-center justify-center">
             <Text className="text-2xl">🎤</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={endCall}
            className="w-20 h-20 bg-red-500 rounded-[32px] items-center justify-center shadow-lg shadow-red-500/20"
          >
             <Text className="text-3xl">📵</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-16 h-16 bg-slate-700 rounded-full items-center justify-center">
             <Text className="text-2xl">📷</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
