import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Activity, Heart, Moon, Zap, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { apiClient } from '@/api/client';

export default function RpmSettingsScreen() {
  const [permissions, setPermissions] = useState({
    heartRate: false,
    steps: false,
    sleep: false,
    spo2: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const manualSync = async () => {
    setIsSyncing(true);
    try {
      // Mock data for demo
      const mockMetrics = {
        metrics: [
          { type: 'HEART_RATE', value: 72 + Math.random() * 20, unit: 'bpm', timestamp: new Date().toISOString(), source: 'AppleHealth' },
          { type: 'STEPS', value: Math.floor(Math.random() * 5000), unit: 'count', timestamp: new Date().toISOString(), source: 'AppleHealth' },
        ]
      };

      await apiClient.post('/rpm/sync', mockMetrics);
      Alert.alert('Sync Successful', 'Your health data has been securely uploaded to MediPortal.');
    } catch (err) {
      Alert.alert('Sync Failed', 'Could not connect to health services.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-8">
        <View className="mb-8">
          <Text className="text-3xl font-black text-slate-900">Health Sync</Text>
          <Text className="text-slate-400 font-bold mt-1">Remote Patient Monitoring (RPM)</Text>
        </View>

        <View className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-100 mb-8">
          <View className="flex-row items-center gap-4 mb-6">
            <View className="bg-emerald-100 p-3 rounded-2xl">
              <ShieldCheck color="#059669" size={24} />
            </View>
            <View className="flex-1">
              <Text className="font-black text-slate-900">Privacy & Consent</Text>
              <Text className="text-[10px] font-bold text-slate-400 leading-relaxed">
                MediPortal uses end-to-end encryption. Your doctor only sees aggregated health summaries.
              </Text>
            </View>
          </View>
          <Text className="text-[10px] font-bold text-indigo-600 bg-indigo-50 p-3 rounded-xl">
             You can revoke health access at any time from this page.
          </Text>
        </View>

        <View className="space-y-4">
          <SyncItem 
            icon={<Heart color="#EF4444" />} 
            label="Heart Rate" 
            enabled={permissions.heartRate} 
            onToggle={() => togglePermission('heartRate')} 
          />
          <SyncItem 
            icon={<Zap color="#F59E0B" />} 
            label="Activity & Steps" 
            enabled={permissions.steps} 
            onToggle={() => togglePermission('steps')} 
          />
          <SyncItem 
            icon={<Moon color="#6366F1" />} 
            label="Sleep Analysis" 
            enabled={permissions.sleep} 
            onToggle={() => togglePermission('sleep')} 
          />
          <SyncItem 
            icon={<Activity color="#10B981" />} 
            label="Oxygen Saturation" 
            enabled={permissions.spo2} 
            onToggle={() => togglePermission('spo2')} 
          />
        </View>

        <TouchableOpacity 
          onPress={manualSync}
          disabled={isSyncing}
          className={`mt-10 py-5 rounded-3xl flex-row items-center justify-center gap-3 ${isSyncing ? 'bg-slate-200' : 'bg-brand-600 shadow-xl shadow-brand-100'}`}
        >
          <RefreshCw color="white" className={isSyncing ? 'animate-spin' : ''} />
          <Text className="text-white font-black text-lg">
            {isSyncing ? 'SYNCING DATA...' : 'SYNC NOW'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SyncItem({ icon, label, enabled, onToggle }: any) {
  return (
    <View className="bg-white p-6 rounded-[32px] flex-row items-center justify-between border border-slate-50 shadow-sm">
      <View className="flex-row items-center gap-4">
        <View className="bg-slate-50 p-3 rounded-2xl">
          {icon}
        </View>
        <Text className="font-black text-slate-800">{label}</Text>
      </View>
      <Switch 
        value={enabled} 
        onValueChange={onToggle}
        trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
        thumbColor={enabled ? '#2563EB' : '#94A3B8'}
      />
    </View>
  );
}
