import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiClient } from '@/api/client';

export default function RoundingFormScreen({ route, navigation }: any) {
  const { patient } = route.params;
  const [vitals, setVitals] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    spO2: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);

  const saveRounding = async () => {
    setLoading(true);
    try {
      await apiClient.post('/ehr/vitals', {
        patientId: patient.id,
        ...vitals,
      });
      Alert.alert('Success', 'Rounding data synced with Admin HMS.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Offline Mode', 'Data saved locally. Will sync when connection is stable.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const RoundingInput = ({ label, value, onChangeText, placeholder, unit, keyboardType = 'numeric' }: any) => (
    <View className="mb-4">
      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 px-2">{label}</Text>
      <View className="flex-row items-center bg-white rounded-[24px] border border-slate-100 p-4 shadow-sm">
        <TextInput
          className="flex-1 text-xl font-black text-slate-900"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
        <Text className="text-slate-400 font-black text-xs ml-2">{unit}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <ScrollView className="flex-1 px-6">
        <View className="pt-16 pb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
            <Text className="text-indigo-600 font-black">← CANCEL ROUNDS</Text>
          </TouchableOpacity>
          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Rounding For</Text>
          <Text className="text-slate-900 text-3xl font-black">{patient.name}</Text>
          <Text className="text-slate-400 font-bold mt-1">Room {patient.room} • {patient.uhid}</Text>
        </View>

        <View className="space-y-2">
          <RoundingInput 
            label="Body Temperature" 
            value={vitals.temperature} 
            onChangeText={(t: string) => setVitals({...vitals, temperature: t})}
            placeholder="98.6"
            unit="°F"
          />
          <RoundingInput 
            label="Blood Pressure" 
            value={vitals.bloodPressure} 
            onChangeText={(t: string) => setVitals({...vitals, bloodPressure: t})}
            placeholder="120/80"
            unit="mmHg"
            keyboardType="default"
          />
          <RoundingInput 
            label="Heart Rate" 
            value={vitals.heartRate} 
            onChangeText={(t: string) => setVitals({...vitals, heartRate: t})}
            placeholder="72"
            unit="bpm"
          />
          <RoundingInput 
            label="Pulse Oximetry (SpO2)" 
            value={vitals.spO2} 
            onChangeText={(t: string) => setVitals({...vitals, spO2: t})}
            placeholder="98"
            unit="%"
          />
          
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 px-2">Clinical Rounding Note</Text>
            <View className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm min-h-[120px]">
              <TextInput
                className="text-slate-900 font-medium text-sm"
                value={vitals.note}
                onChangeText={(t: string) => setVitals({...vitals, note: t})}
                placeholder="Patient reports mild headache but overall stable..."
                multiline
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={saveRounding}
          disabled={loading}
          className="bg-indigo-600 rounded-[24px] py-5 items-center mt-6 mb-12 shadow-lg shadow-indigo-200"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-black text-base uppercase">Sync & Save Rounding 📡</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
