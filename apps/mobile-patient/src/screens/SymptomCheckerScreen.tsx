import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/api/client';

type TriageResult = {
  urgencyLevel: 'RED' | 'YELLOW' | 'GREEN';
  suggestion: string;
  reasoning: string;
  disclaimer: string;
};

export default function SymptomCheckerScreen() {
  const { user } = useAuthStore();
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('Moderate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const runTriage = async () => {
    if (!symptoms || !duration) {
      Alert.alert('Incomplete', 'Please describe your symptoms and duration.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await apiClient.post('/ai/triage', {
        symptoms,
        duration,
        severity,
        uhid: user?.uhid,
        patientId: user?.patientId,
      });
      setResult(res.data);
    } catch (err) {
      Alert.alert('Error', 'Unable to connect to the AI Triage engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallEmergency = () => {
    Linking.openURL('tel:102'); // Example emergency number
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="bg-white px-6 pt-16 pb-8 border-b border-slate-100">
        <View className="flex-row items-center gap-3">
          <View className="bg-indigo-600 p-2.5 rounded-2xl">
            <Text className="text-xl">✨</Text>
          </View>
          <View>
            <Text className="text-slate-900 text-2xl font-black tracking-tight">AI Symptom Triage</Text>
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">MediPortal Smart Assistant</Text>
          </View>
        </View>
      </View>

      <View className="p-6 space-y-6">
        {!result ? (
          <>
            <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <Text className="text-slate-900 font-black text-sm mb-4">What's bothering you today?</Text>
              
              <View className="space-y-4">
                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Primary Symptoms</Text>
                  <TextInput
                    className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-medium border border-slate-100"
                    placeholder="e.g. Sharp chest pain, cough, fever..."
                    value={symptoms}
                    onChangeText={setSymptoms}
                    multiline
                  />
                </View>

                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Duration</Text>
                  <TextInput
                    className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-medium border border-slate-100"
                    placeholder="e.g. 2 hours, 3 days..."
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>

                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Severity Level</Text>
                  <View className="flex-row gap-2">
                    {['Mild', 'Moderate', 'Severe'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setSeverity(s)}
                        className={`flex-1 py-3 rounded-xl border items-center ${
                          severity === s ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-100'
                        }`}
                      >
                        <Text className={`font-black text-[10px] uppercase ${severity === s ? 'text-white' : 'text-slate-400'}`}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={runTriage}
                disabled={loading}
                className="bg-indigo-600 rounded-2xl py-5 items-center mt-8 shadow-lg shadow-indigo-200"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black text-base">Analyze Symptoms ✨</Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
              <Text className="text-amber-900 font-bold text-sm mb-1">🏥 Emergency Warning</Text>
              <Text className="text-amber-700 text-xs leading-relaxed">
                If you are experiencing chest pain, difficulty breathing, or signs of a stroke, do not wait for AI analysis.
              </Text>
              <TouchableOpacity
                onPress={handleCallEmergency}
                className="bg-red-600 rounded-xl py-3 items-center mt-4"
              >
                <Text className="text-white font-black text-sm">📞 Call Emergency Services</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View className="animate-in slide-in-from-bottom-5 duration-500">
            <View className={`rounded-[40px] p-8 border-t-[8px] ${
              result.urgencyLevel === 'RED' ? 'bg-red-50 border-red-500' : 
              result.urgencyLevel === 'YELLOW' ? 'bg-amber-50 border-amber-500' : 
              'bg-emerald-50 border-emerald-500'
            }`}>
              <View className="flex-row items-center justify-between mb-6">
                <Text className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                  result.urgencyLevel === 'RED' ? 'bg-red-100 text-red-600' :
                  result.urgencyLevel === 'YELLOW' ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  Urgency: {result.urgencyLevel}
                </Text>
                <Text className="text-2xl">{result.urgencyLevel === 'RED' ? '🚨' : result.urgencyLevel === 'YELLOW' ? '⚠️' : '✅'}</Text>
              </View>

              <Text className="text-slate-900 text-xl font-black mb-4 leading-tight">
                {result.suggestion}
              </Text>

              <View className="bg-white/60 p-5 rounded-3xl mb-6">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">AI Reasoning</Text>
                <Text className="text-slate-600 text-sm leading-relaxed italic">
                  {result.reasoning}
                </Text>
              </View>

              {result.urgencyLevel === 'RED' ? (
                <TouchableOpacity
                  onPress={handleCallEmergency}
                  className="bg-red-600 rounded-2xl py-5 items-center shadow-lg shadow-red-200"
                >
                  <Text className="text-white font-black text-base uppercase">Visit ER Immediately</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => Alert.alert('Redirect', 'Going to appointments page...')}
                  className="bg-indigo-600 rounded-2xl py-5 items-center shadow-lg shadow-indigo-200"
                >
                  <Text className="text-white font-black text-base uppercase">Book Recommended Specialty</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                setResult(null);
                setSymptoms('');
              }}
              className="mt-6 self-center"
            >
              <Text className="text-slate-400 font-bold">Start New Assessment</Text>
            </TouchableOpacity>

            <View className="mt-8 p-4 border border-slate-200 rounded-2xl">
              <Text className="text-[10px] font-black text-slate-400 text-center uppercase leading-tight">
                {result.disclaimer}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
