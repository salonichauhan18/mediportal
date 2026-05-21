import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Patient } from '@/types';

interface UHIDCardProps {
  patient: Patient;
}

export default function UHIDCard({ patient }: UHIDCardProps) {
  const qrPayload = JSON.stringify({
    uhid: patient.uhid,
    name: `${patient.firstName} ${patient.lastName}`,
    dob: patient.dateOfBirth,
  });

  return (
    <View className="bg-brand-600 rounded-[32px] p-6 mx-4" style={styles.shadow}>
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-white/60 text-[10px] font-black uppercase tracking-widest">
            Patient ID Card
          </Text>
          <Text className="text-white text-xl font-black mt-1">
            {patient.firstName} {patient.lastName}
          </Text>
          <Text className="text-white/70 text-sm font-semibold mt-0.5">
            {patient.bloodGroup?.replace('_', ' ')} • {patient.gender}
          </Text>
        </View>
        <View className="bg-white rounded-2xl p-3">
          <QRCode
            value={qrPayload}
            size={80}
            color="#4f46e5"
            backgroundColor="white"
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between bg-white/10 rounded-2xl px-4 py-3">
        <View>
          <Text className="text-white/60 text-[9px] font-black uppercase tracking-widest">UHID</Text>
          <Text className="text-white text-lg font-black tracking-wider">{patient.uhid}</Text>
        </View>
        <View className="items-end">
          <Text className="text-white/60 text-[9px] font-black uppercase tracking-widest">DOB</Text>
          <Text className="text-white text-sm font-bold">
            {new Date(patient.dateOfBirth).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>

      <Text className="text-white/40 text-[9px] text-center mt-4 font-medium uppercase tracking-widest">
        Present this QR code at any MediPortal facility for check-in
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#4f46e5',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
