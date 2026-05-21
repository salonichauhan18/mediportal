import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { type VitalsResponse, type ClinicalNoteResponse } from '@mediportal/shared-types';
import { Card, CardContent, Button } from '@mediportal/ui-core';
import VitalsTrendChart from '../components/ehr/VitalsTrendChart';
import SoapNoteEditor from '../components/ehr/SoapNoteEditor';
import ClinicalTimeline from '../components/ehr/ClinicalTimeline';
import LabOrderPanel from '../components/ehr/LabOrderPanel';
import RpmDashboard from '../components/ehr/RpmDashboard';
import PrecisionMedicinePanel from '../components/ehr/PrecisionMedicinePanel';
import { 
  Activity, 
  History, 
  Plus, 
  User, 
  Thermometer, 
  HeartPulse, 
  Scale,
  Pill,
  Microscope,
  Sparkles,
  BrainCircuit,
  TrendingUp,
  Loader2,
  Share2,
  Dna
} from 'lucide-react';
import { format } from 'date-fns';

import { useAuthStore } from '../store/auth.store';
import VitalsEntryForm from '../components/ehr/VitalsEntryForm';
import PrescriptionPanel from '../components/ehr/PrescriptionPanel';
import PrescriptionModal from '../components/ehr/PrescriptionModal';
import LabOrderModal from '../components/ehr/LabOrderModal';

interface PatientChartPageProps {
  id: string | null;
}

const PatientChartPage: React.FC<PatientChartPageProps> = ({ id }) => {
  const { user } = useAuthStore();
  
  const [patient, setPatient] = useState<any>(null);
  const [vitals, setVitals] = useState<VitalsResponse[]>([]);
  const [timeline, setTimeline] = useState<ClinicalNoteResponse[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'medications' | 'lab' | 'rpm' | 'genomics'>('timeline');
  const [selectedNote, setSelectedNote] = useState<ClinicalNoteResponse | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isRecordingVitals, setIsRecordingVitals] = useState(false);
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);
  const [isAddingLabOrder, setIsAddingLabOrder] = useState(false);
  const [analyzingTrends, setAnalyzingTrends] = useState(false);
  const [trendInsight, setTrendInsight] = useState<{ suggestion: string; reasoning: string; pattern: string } | null>(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, vRes, tRes, pxRes, labRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/ehr/patients/${id}/vitals`),
        api.get(`/ehr/patients/${id}/timeline`),
        api.get(`/ehr/patients/${id}/prescriptions`),
        api.get(`/ehr/patients/${id}/lab-orders`)
      ]);
      setPatient(pRes.data);
      setVitals(vRes.data);
      setTimeline(tRes.data);
      setPrescriptions(pxRes.data);
      setLabOrders(labRes.data);
    } catch (err) {
      console.error('Failed to fetch patient data', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeLongitudinalTrends = async (parameter: string) => {
    setAnalyzingTrends(true);
    setTrendInsight(null);
    try {
      const res = await api.post('/ai/analyze-trends', {
        patientId: id,
        uhid: patient?.uhid,
        doctorId: user?.id,
        parameter
      });
      setTrendInsight(res.data);
    } catch (err) {
      console.error('Trend analysis failed', err);
    } finally {
      setAnalyzingTrends(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const latestVitals = vitals[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Patient Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border-2 border-primary/20">
            <User className="text-primary w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{patient?.user.name}</h1>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold tracking-tighter uppercase">
                {patient?.uhid}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-400 mt-1">
              {patient?.gender || 'N/A'} • {patient?.dob ? format(new Date(patient.dob), 'MMM dd, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            onClick={() => window.open(`${api.defaults.baseURL}/v1/fhir/Patient/${id}/download`, '_blank')}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Download FHIR
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200"
            onClick={() => setIsRecordingVitals(true)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Vitals Entry
          </Button>
          <Button 
            className="rounded-xl bg-primary shadow-lg shadow-primary/20"
            onClick={() => {
              setSelectedNote(null);
              setIsAddingNote(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Encounter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Metrics & Graph */}
        <div className="col-span-8 space-y-8">
          {/* Vitals Summary Grid */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Weight', value: latestVitals?.weight ? `${latestVitals.weight} kg` : '--', icon: Scale, color: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'Blood Pressure', value: latestVitals?.bloodPressure || '--', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Pulse Rate', value: latestVitals?.pulseRate ? `${latestVitals.pulseRate} bpm` : '--', icon: HeartPulse, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'BMI', value: latestVitals?.bmi || '--', icon: Thermometer, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <p className="text-lg font-black text-slate-700 leading-none">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trending Chart */}
          <Card className="border-none shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Vitals Trending
              </h3>
              <select className="text-xs font-bold bg-slate-50 border-none rounded-lg px-3 py-2 outline-none">
                <option>Last 6 Months</option>
                <option>All Time</option>
              </select>
            </div>
            <VitalsTrendChart vitals={vitals} />
            
            {/* AI Trend Insight Panel */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-black text-slate-800 text-sm tracking-tight">AI Longitudinal Analyzer</h4>
                </div>
                {!trendInsight && !analyzingTrends && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-lg border-indigo-200 text-indigo-600 font-bold text-[10px]"
                    onClick={() => analyzeLongitudinalTrends('heartRate')}
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    ANALYZE TRENDS
                  </Button>
                )}
              </div>

              {analyzingTrends ? (
                <div className="flex items-center gap-3 py-4 bg-indigo-50/30 rounded-2xl px-6">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <p className="text-xs font-bold text-indigo-500 animate-pulse">Detecting patterns in 12-month historical data...</p>
                </div>
              ) : trendInsight ? (
                <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-4 bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Detected Pattern</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <p className="text-sm font-black text-slate-700">{trendInsight.pattern || 'Stable / Improving'}</p>
                      </div>
                    </div>
                    <div className="col-span-8 space-y-3">
                      <div className="bg-white/80 p-4 rounded-2xl border border-indigo-50">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Clinical Insight & Suggestions</p>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed">{trendInsight.suggestion}</p>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center italic">
                        ⚠️ AI-Generated: Review Required by a Medical Professional.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTrendInsight(null)}
                    className="mt-4 text-[10px] font-black text-indigo-400 hover:text-indigo-600 block mx-auto"
                  >
                    REFRESH ANALYSIS
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium italic px-2">
                  Click analyze to evaluate the patient's heart rate patterns over the last 12 months.
                </p>
              )}
            </div>
          </Card>

          {/* Clinical Insights Section with Tabs */}
          <div className="space-y-6">
            <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-100 self-start w-fit">
              {[
                { id: 'timeline', label: 'Timeline', icon: History },
                { id: 'medications', label: 'Prescriptions', icon: Pill },
                { id: 'lab', label: 'Laboratory', icon: Microscope },
                { id: 'rpm', label: 'RPM', icon: TrendingUp },
                { id: 'genomics', label: 'Genomics', icon: Dna },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'timeline' && (
              <ClinicalTimeline 
                entries={timeline} 
                onSelectNote={(note) => {
                  setSelectedNote(note);
                  setIsAddingNote(true);
                }}
              />
            )}

            {activeTab === 'medications' && (
              <PrescriptionPanel 
                prescriptions={prescriptions} 
                onNewOrder={() => setIsAddingPrescription(true)} 
              />
            )}

            {activeTab === 'lab' && (
              <LabOrderPanel 
                labOrders={labOrders} 
                onNewOrder={() => setIsAddingLabOrder(true)} 
              />
            )}
            
            {activeTab === 'rpm' && <RpmDashboard patientId={id!} />}

            {activeTab === 'genomics' && <PrecisionMedicinePanel patientId={id!} />}
          </div>
        </div>

        {/* Right Column: Active Editor / Context */}
        <div className="col-span-4">
          <div className="sticky top-8 space-y-6">
            {isRecordingVitals && (
              <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
                <div className="bg-teal-700 px-6 py-4 flex items-center justify-between">
                  <span className="text-white font-bold text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Record Vitals
                  </span>
                  <button onClick={() => setIsRecordingVitals(false)} className="text-teal-200 hover:text-white">✕</button>
                </div>
                <CardContent className="p-6">
                  <VitalsEntryForm 
                    patientId={id!} 
                    onSuccess={() => {
                      setIsRecordingVitals(false);
                      fetchData();
                    }} 
                  />
                </CardContent>
              </Card>
            )}

            {isAddingNote || selectedNote ? (
              <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                  <span className="text-white font-bold text-sm">
                    {selectedNote ? 'Editing Note' : 'New Clinical Note'}
                  </span>
                  <button 
                    onClick={() => {
                      setIsAddingNote(false);
                      setSelectedNote(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <CardContent className="p-6">
                  <SoapNoteEditor 
                    patientId={id!} 
                    uhid={patient?.uhid || ''}
                    doctorId={user?.id || ''} 
                    initialData={selectedNote}
                    onSuccess={() => {
                      setIsAddingNote(false);
                      setSelectedNote(null);
                      fetchData();
                    }}
                  />
                </CardContent>
              </Card>
            ) : !isRecordingVitals && (
              <div className="bg-primary/5 rounded-[32px] p-8 border-2 border-dashed border-primary/20 text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                  <Plus className="text-primary w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Medical Record</h4>
                  <p className="text-xs text-slate-500 font-medium">Select a note from the timeline or start a fresh documentation session.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => setIsAddingNote(true)}
                    className="w-full rounded-2xl bg-primary"
                  >
                    Create New Note
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsRecordingVitals(true)}
                    className="w-full rounded-2xl border-primary text-primary"
                  >
                    Record Vitals
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAddingPrescription && (
        <PrescriptionModal 
          patientId={id!} 
          doctorId={user?.id || ''} 
          onClose={() => setIsAddingPrescription(false)}
          onSuccess={fetchData}
        />
      )}

      {isAddingLabOrder && (
        <LabOrderModal 
          patientId={id!} 
          doctorId={user?.id || ''} 
          onClose={() => setIsAddingLabOrder(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default PatientChartPage;
