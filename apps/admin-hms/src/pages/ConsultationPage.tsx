import { useState, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  User, 
  Activity, 
  FileText,
  AlertCircle,
  Monitor
} from 'lucide-react';
import { Button, Card, CardContent } from '@mediportal/ui-core';
import SoapNoteEditor from '../components/ehr/SoapNoteEditor';
import api from '../api/axios';

interface ConsultationPageProps {
  appointmentId: string | null;
  onEnd: () => void;
}

export default function ConsultationPage({ appointmentId, onEnd }: ConsultationPageProps) {
  const [appointment, setAppointment] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [status] = useState('WAITING');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
      const interval = setInterval(() => setDuration(d => d + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      setAppointment(res.data);
    } catch (err) {
      console.error('Failed to fetch appointment', err);
    }
  };

  const endCall = async () => {
    try {
      await api.post(`/telemedicine/end/${appointmentId}`, { duration });
      onEnd();
    } catch (err) {
      onEnd();
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!appointmentId) return (
    <div className="h-[600px] flex items-center justify-center bg-white rounded-[40px] border border-dashed border-slate-200">
      <div className="text-center">
        <Video className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-400 font-bold">Select an appointment to start a consultation</p>
      </div>
    </div>
  );

  if (!appointment) return <div className="h-full flex items-center justify-center">Loading session...</div>;

  return (
    <div className="h-[calc(100vh-100px)] flex bg-slate-900 overflow-hidden rounded-[40px] shadow-2xl border border-slate-800">
      {/* Left Pane: Video Feed */}
      <div className="flex-1 relative flex flex-col">
        <div className="flex-1 items-center justify-center bg-slate-800 m-6 rounded-[32px] overflow-hidden relative border border-slate-700">
          {/* Main Video (Patient) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {status === 'WAITING' ? (
              <div className="items-center text-center">
                <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <User className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Waiting for patient...</p>
              </div>
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                 <span className="text-white text-lg font-bold">LIVE VIDEO FEED</span>
              </div>
            )}
          </div>

          {/* Local Video (Doctor) */}
          <div className="absolute bottom-6 right-6 w-40 h-28 bg-slate-700 rounded-2xl border-2 border-slate-600 shadow-xl overflow-hidden">
             {isCameraOff ? (
               <div className="w-full h-full flex items-center justify-center">
                 <VideoOff className="text-slate-500 w-6 h-6" />
               </div>
             ) : (
               <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                 <span className="text-white text-[10px] font-bold">DR. YOU</span>
               </div>
             )}
          </div>

          {/* Call Stats Overlay */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
             <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-white font-black text-xs">{formatTime(duration)}</span>
             </div>
             <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest">SECURE • AES-256</span>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="h-28 flex items-center justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full border-2 ${isMuted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800 border-slate-700 text-white'}`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsCameraOff(!isCameraOff)}
            className={`w-12 h-12 rounded-full border-2 ${isCameraOff ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800 border-slate-700 text-white'}`}
          >
            {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </Button>
          <Button 
            variant="outline" 
            className="w-12 h-12 rounded-full bg-slate-800 border-slate-700 text-white"
          >
            <Monitor size={20} />
          </Button>
          <Button 
            onClick={endCall}
            className="w-16 h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-900/20"
          >
            <PhoneOff size={28} />
          </Button>
        </div>
      </div>

      {/* Right Pane: Clinical Workflow */}
      <div className="w-[450px] bg-white m-6 ml-0 rounded-[32px] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-brand-600 p-1.5 rounded-lg">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Clinical Rounds</h2>
          </div>
          <p className="text-slate-400 font-bold text-xs">{appointment.patient?.name} • {appointment.patient?.uhid}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <Card className="border-indigo-100 bg-indigo-50/30">
             <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="text-indigo-600 w-5 h-5" />
                <p className="text-[10px] font-bold text-indigo-900 leading-relaxed">
                  Active virtual session. Documentation recorded here will be instantly synced with the patient chart.
                </p>
             </CardContent>
           </Card>

           <div className="space-y-4">
             <div className="flex items-center gap-2">
                <FileText className="w-3 h-3 text-slate-400" />
                <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">SOAP Documentation</h4>
             </div>
             <SoapNoteEditor 
               patientId={appointment.patientId} 
               uhid={appointment.patient?.uhid}
               doctorId={appointment.doctorId}
               appointmentId={appointmentId}
               onSuccess={() => {}}
             />
           </div>
        </div>
      </div>
    </div>
  );
}
