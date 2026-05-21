import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { patientApi, apiClient } from '@/api/client';
import { LabOrder, Prescription, Invoice } from '@/types';
import { format } from 'date-fns';

type Tab = 'labs' | 'prescriptions' | 'invoices';

const FLAG_CONFIG: Record<string, { color: string; bg: string }> = {
  NORMAL: { color: '#10b981', bg: '#ecfdf5' },
  HIGH: { color: '#f59e0b', bg: '#fffbeb' },
  LOW: { color: '#3b82f6', bg: '#eff6ff' },
  CRITICAL: { color: '#ef4444', bg: '#fef2f2' },
};

export default function DocumentsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('labs');
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<{ suggestion: string; reasoning: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { user } = useAuthStore();
  const patientId = user?.patientId ?? '';

  const { data: labOrders = [], isLoading: labsLoading } = useQuery<LabOrder[]>({
    queryKey: ['labOrders', patientId],
    queryFn: async () => {
      const res = await patientApi.getMyLabOrders(patientId);
      return res.data.data ?? res.data ?? [];
    },
    enabled: !!patientId,
  });

  const { data: prescriptions = [], isLoading: rxLoading } = useQuery<Prescription[]>({
    queryKey: ['prescriptions', patientId],
    queryFn: async () => {
      const res = await patientApi.getMyPrescriptions(patientId);
      return res.data.data ?? res.data ?? [];
    },
    enabled: !!patientId,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', patientId],
    queryFn: async () => {
      const res = await patientApi.getMyInvoices(patientId);
      return res.data.data ?? res.data ?? [];
    },
    enabled: !!patientId,
  });

  const isLoading = labsLoading || rxLoading || invoicesLoading;

  const openPDF = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Unable to open PDF. Please try again.');
    }
  };

  const explainReport = async (labOrder: LabOrder) => {
    setAiLoading(true);
    setExplainingId(labOrder.id);
    try {
      const resultsText = labOrder.tests
        .map(t => `${t.testName}: ${t.value} ${t.unit} (${t.flag || 'NORMAL'})`)
        .join('\n');
      
      const res = await apiClient.post('/ai/explain-report', {
        labResults: resultsText,
        uhid: user?.uhid,
        patientId: user?.patientId
      });
      setExplanation(res.data);
    } catch (err) {
      Alert.alert('AI Offline', 'Unable to explain report right now. Please try again later.');
    } finally {
      setAiLoading(false);
    }
  };

  const renderLabOrder = ({ item }: { item: LabOrder }) => (
    <View className="bg-white rounded-[24px] p-5 mb-3 mx-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-slate-900 font-black text-sm">Lab Report</Text>
          <Text className="text-slate-400 text-xs font-medium mt-0.5">
            {format(new Date(item.createdAt), 'MMM dd, yyyy')}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${
          item.status === 'REPORTED' ? 'bg-emerald-50' : 'bg-amber-50'
        }`}>
          <Text className={`text-[10px] font-black uppercase ${
            item.status === 'REPORTED' ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {item.status}
          </Text>
        </View>
      </View>

      {item.tests.slice(0, 3).map((test) => {
        const flag = test.flag ? FLAG_CONFIG[test.flag] : null;
        return (
          <View key={test.id} className="flex-row items-center justify-between py-2 border-b border-slate-50">
            <Text className="text-slate-600 text-sm font-medium flex-1">{test.testName}</Text>
            {test.value && (
              <View className="flex-row items-center gap-2">
                <Text className="text-slate-900 text-sm font-black">
                  {test.value} {test.unit}
                </Text>
                {flag && (
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: flag.bg }}>
                    <Text className="text-[9px] font-black" style={{ color: flag.color }}>
                      {test.flag}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

      {item.reportAttachmentUrl && (
        <TouchableOpacity
          onPress={() => openPDF(item.reportAttachmentUrl!)}
          className="mt-3 flex-row items-center justify-center bg-brand-50 rounded-xl py-3"
        >
          <Text className="text-brand-600 font-black text-sm">📄 View Full Report PDF</Text>
        </TouchableOpacity>
      )}

      {item.status === 'REPORTED' && (
        <TouchableOpacity
          onPress={() => explainReport(item)}
          className="mt-2 flex-row items-center justify-center bg-indigo-600 rounded-xl py-3 shadow-md"
        >
          <Text className="text-white font-black text-sm">✨ Health Explain (AI)</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPrescription = ({ item }: { item: Prescription }) => (
    <View className="bg-white rounded-[24px] p-5 mb-3 mx-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-slate-900 font-black text-sm">Prescription</Text>
          <Text className="text-slate-500 text-xs font-medium mt-0.5">
            By {item.staff?.user?.name} • {format(new Date(item.createdAt), 'MMM dd, yyyy')}
          </Text>
        </View>
        <Text className="text-2xl">💊</Text>
      </View>
      {item.diagnosis && (
        <View className="bg-slate-50 rounded-xl px-3 py-2 mb-3">
          <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Diagnosis</Text>
          <Text className="text-slate-800 text-sm font-bold mt-0.5">{item.diagnosis}</Text>
        </View>
      )}
      {item.items.map((rx) => (
        <View key={rx.id} className="flex-row items-start gap-3 py-2 border-b border-slate-50">
          <View className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0" />
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-sm">{rx.medicineName}</Text>
            <Text className="text-slate-400 text-xs font-medium">{rx.dosage} • {rx.frequency} • {rx.duration}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const statusColor = {
      PAID: '#10b981', FINALIZED: '#6366f1', DRAFT: '#f59e0b',
      CANCELLED: '#ef4444', REFUNDED: '#94a3b8',
    }[item.status] ?? '#94a3b8';

    return (
      <View className="bg-white rounded-[24px] p-5 mb-3 mx-4"
        style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Invoice</Text>
            <Text className="text-slate-900 font-black text-base">{item.invoiceNumber}</Text>
            <Text className="text-slate-400 text-xs font-medium mt-0.5">
              {format(new Date(item.createdAt), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-slate-900 text-xl font-black">
              ₹{Number(item.totalAmount).toFixed(2)}
            </Text>
            <View className="mt-1 px-3 py-1 rounded-full" style={{ backgroundColor: `${statusColor}20` }}>
              <Text className="text-[10px] font-black" style={{ color: statusColor }}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
        {item.pdfUrl && (
          <TouchableOpacity
            onPress={() => openPDF(item.pdfUrl!)}
            className="mt-4 flex-row items-center justify-center bg-slate-50 rounded-xl py-3"
          >
            <Text className="text-slate-600 font-black text-sm">🧾 Download Invoice PDF</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'labs', label: 'Lab Reports', emoji: '🔬' },
    { id: 'prescriptions', label: 'Prescriptions', emoji: '💊' },
    { id: 'invoices', label: 'Invoices', emoji: '🧾' },
  ];

  const currentData = activeTab === 'labs' ? labOrders
    : activeTab === 'prescriptions' ? prescriptions
    : invoices;

  const currentRenderer = activeTab === 'labs' ? renderLabOrder
    : activeTab === 'prescriptions' ? renderPrescription
    : renderInvoice;

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 pt-16 pb-4">
        <Text className="text-slate-900 text-2xl font-black tracking-tight">My Documents</Text>
        <Text className="text-slate-400 text-sm font-medium mt-1">
          Your complete medical & financial records
        </Text>
      </View>

      {/* Tabs */}
      <View className="bg-white px-4 pb-4">
        <View className="flex-row bg-slate-50 p-1.5 rounded-2xl">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-1 items-center py-2.5 rounded-xl ${
                activeTab === tab.id ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text className="text-base">{tab.emoji}</Text>
              <Text className={`text-[9px] font-black mt-0.5 uppercase tracking-wider ${
                activeTab === tab.id ? 'text-brand-600' : 'text-slate-400'
              }`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlashList
          data={currentData as any[]}
          renderItem={currentRenderer as any}
          estimatedItemSize={180}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-4xl mb-3">📂</Text>
              <Text className="text-slate-500 font-semibold">No documents found</Text>
            </View>
          }
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        />
      )}

      {/* AI Explanation Modal */}
      <Modal
        visible={!!explainingId}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setExplainingId(null);
          setExplanation(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-[40px] p-8 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-3">
                <View className="bg-indigo-100 p-2 rounded-xl">
                  <Text className="text-xl">✨</Text>
                </View>
                <View>
                  <Text className="text-slate-900 text-xl font-black tracking-tight">Health Explain</Text>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">MediPortal AI Intelligence</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setExplainingId(null);
                  setExplanation(null);
                }}
                className="bg-slate-100 p-2 rounded-full"
              >
                <Text className="text-slate-400 font-bold">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {aiLoading ? (
                <View className="py-20 items-center justify-center">
                  <ActivityIndicator size="large" color="#4f46e5" />
                  <Text className="text-slate-500 font-bold mt-4 animate-pulse">Reading your report...</Text>
                </View>
              ) : explanation ? (
                <View className="space-y-6">
                  <View className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
                    <Text className="text-indigo-900 text-lg font-bold leading-relaxed">
                      {explanation.suggestion}
                    </Text>
                  </View>
                  
                  <View>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Medical Reasoning</Text>
                    <Text className="text-slate-600 text-sm italic leading-relaxed">
                      {explanation.reasoning}
                    </Text>
                  </View>

                  <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Text className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">
                      ⚠️ AI-Generated: This is not a diagnosis. Review Required by a Medical Professional.
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => {
                      setExplainingId(null);
                      setExplanation(null);
                    }}
                    className="bg-brand-600 rounded-2xl py-5 items-center mt-4"
                  >
                    <Text className="text-white font-black">Got it, thanks!</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
