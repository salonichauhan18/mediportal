import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@mediportal/ui-core';
import { ShieldCheck, Loader2, PlayCircle, AlertTriangle, FileText, CheckCircle2, Bot, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const ClaimsDashboard: React.FC = () => {
  const [pipeline, setPipeline] = useState({ TOTAL: 0, AUDITING: 0, SUBMITTED: 0, SETTLED: 0, REJECTED: 0 });
  const [manualQueue, setManualQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling every 10s to see RPA in action
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [pipeRes, queueRes] = await Promise.all([
        api.get('/claims-rpa/pipeline'),
        api.get('/claims-rpa/manual-review')
      ]);
      setPipeline(pipeRes.data);
      setManualQueue(queueRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (claimId: string, status: 'SUBMITTED' | 'PAID') => {
    try {
      await api.post('/claims-rpa/manual-override', { claimId, status, reason: 'Manual review verified medical necessity.' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Insurance Control Center</h1>
          <p className="text-slate-500 font-medium text-sm">Robotic Process Automation & AI Claim Adjudication</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 text-emerald-700">
          <Bot className="w-5 h-5" />
          <span className="text-sm font-bold">RPA Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <CardContent className="p-6">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Total Claims
            </p>
            <h3 className="text-4xl font-black">{pipeline.TOTAL}</h3>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <p className="text-amber-600 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
              <PlayCircle className="w-3 h-3" /> AI Auditing
            </p>
            <h3 className="text-4xl font-black text-amber-900">{pipeline.AUDITING}</h3>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Auto-Submitted
            </p>
            <h3 className="text-4xl font-black text-blue-900">{pipeline.SUBMITTED}</h3>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> Settled (Paid)
            </p>
            <h3 className="text-4xl font-black text-emerald-900">{pipeline.SETTLED}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[24px] border-none shadow-sm">
        <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50 rounded-t-[24px]">
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Manual Audit Queue
          </h2>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
            {pipeline.REJECTED} Flagged
          </span>
        </div>
        <CardContent className="p-0">
          {manualQueue.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="font-bold">No claims pending manual review.</p>
              <p className="text-sm">The AI Scrubber successfully processed all current claims.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {manualQueue.map(claim => (
                <div key={claim.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-slate-900">{claim.invoice?.patient?.user?.name || 'Unknown Patient'}</h3>
                      <p className="text-sm font-medium text-slate-500">
                        {claim.provider.name} • Policy: {claim.policyNumber} • Amount: ${claim.claimAmount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Adjudication Score</p>
                      <p className={`text-xl font-black ${claim.aiConfidenceScore < 0.85 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {(claim.aiConfidenceScore * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <AlertCircle className="w-3 h-3" /> AI Rejection Rationale
                    </p>
                    <p className="text-sm text-red-700 font-medium">
                      {claim.rejectionReason || 'No clinical notes found or discrepancies identified.'}
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-slate-200"
                      onClick={() => handleOverride(claim.id, 'SUBMITTED')}
                    >
                      Force Submit
                    </Button>
                    <Button 
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleOverride(claim.id, 'PAID')}
                    >
                      Mark as Paid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClaimsDashboard;
