import { Card, CardContent } from '@mediportal/ui-core';
import { Share2, ArrowRight, ArrowLeft, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export default function Interoperability() {
  const logs = [
    { id: 1, type: 'OUTBOUND', resource: 'ServiceRequest', target: 'City Lab Partners', status: 'SUCCESS', time: '10 mins ago' },
    { id: 2, type: 'INBOUND', resource: 'Observation', target: 'HealthFit App', status: 'SUCCESS', time: '2 hours ago' },
    { id: 3, type: 'OUTBOUND', resource: 'DocumentReference', target: 'Central Insurance', status: 'PENDING', time: '5 hours ago' },
  ];

  return (
    <div className="p-10 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Interoperability Layer</h1>
          <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
            <Share2 size={16} /> HL7 FHIR R4 Standard Data Exchange
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2 border border-emerald-100">
             <CheckCircle size={14} /> FHIR VALIDATOR: PASS
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricCard label="Resources Dispatched" value="1,248" color="indigo" />
         <MetricCard label="Incoming Observations" value="8,432" color="emerald" />
         <MetricCard label="Partner Endpoints" value="12 Active" color="amber" />
      </div>

      <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-900">
           <h3 className="text-white font-black text-lg">Exchange Audit Trail</h3>
           <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Real-time Traffic</span>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {logs.map((log) => (
              <div key={log.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${log.type === 'OUTBOUND' ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                    {log.type === 'OUTBOUND' ? <ArrowRight className="text-indigo-600" /> : <ArrowLeft className="text-emerald-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                       <span className="font-black text-slate-900">{log.resource}</span>
                       <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase">{log.type}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-1">Target: {log.target}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="text-right">
                      <div className={`flex items-center gap-2 font-black text-xs ${log.status === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
                         <Clock size={12} /> {log.time}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{log.status}</span>
                   </div>
                   <button className="p-3 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ExternalLink size={18} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, color }: any) {
  return (
    <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
      <CardContent className="p-8">
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">{label}</p>
        <h4 className={`text-4xl font-black text-${color}-600`}>{value}</h4>
      </CardContent>
    </Card>
  );
}
