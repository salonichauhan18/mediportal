import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Card, CardContent, Button, Input, Label } from '@mediportal/ui-core';
import { Dna, Lock, AlertCircle, CheckCircle2, ShieldAlert, Plus, Loader2 } from 'lucide-react';

interface PrecisionMedicinePanelProps {
  patientId: string;
}

const PrecisionMedicinePanel: React.FC<PrecisionMedicinePanelProps> = ({ patientId }) => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMarker, setNewMarker] = useState({ markerName: '', result: '', clinicalSignificance: '' });

  useEffect(() => {
    checkConsent();
  }, [patientId]);

  const checkConsent = async () => {
    try {
      const res = await api.get(`/genetic/patients/${patientId}/consent`);
      setHasConsent(res.data.hasGeneticConsent);
      if (res.data.hasGeneticConsent) {
        fetchProfiles();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await api.get(`/genetic/patients/${patientId}/profiles`);
      setProfiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleConsent = async () => {
    setLoading(true);
    try {
      await api.post(`/genetic/patients/${patientId}/consent`, { consent: true });
      setHasConsent(true);
      fetchProfiles();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddMarker = async () => {
    if (!newMarker.markerName || !newMarker.result) return;
    try {
      await api.post(`/genetic/patients/${patientId}/profiles`, newMarker);
      setIsAdding(false);
      setNewMarker({ markerName: '', result: '', clinicalSignificance: '' });
      fetchProfiles();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasConsent) {
    return (
      <Card className="border-none shadow-sm overflow-hidden rounded-[32px]">
        <div className="bg-slate-900 px-8 py-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-800/50">
            <Lock className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Genetic Data Vault Locked</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8 font-medium">
            Access to this patient's genomic profile requires explicit, documented consent in accordance with privacy protocols.
          </p>
          <Button 
            onClick={toggleConsent}
            className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 py-6 h-auto text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <ShieldAlert className="w-5 h-5 mr-3" />
            Verify Patient Consent
          </Button>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6">
            All access requests are audited and logged
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
      <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Dna className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Precision Medicine Profile</h2>
            <p className="text-indigo-200 text-xs font-medium">Pharmacogenomics & Clinical Markers</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)}
          variant="outline" 
          className="border-white/20 text-white hover:bg-white/10 rounded-xl font-bold backdrop-blur-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Marker
        </Button>
      </div>

      <CardContent className="p-8">
        {isAdding && (
          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 mb-8 animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-sm font-black text-indigo-900 mb-4 tracking-tight">New Genetic Marker</h3>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 space-y-2">
                <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Gene/Marker</Label>
                <Input 
                  placeholder="e.g. CYP2C19" 
                  value={newMarker.markerName}
                  onChange={e => setNewMarker({...newMarker, markerName: e.target.value})}
                  className="rounded-xl border-indigo-200 focus-visible:ring-indigo-500/20"
                />
              </div>
              <div className="col-span-4 space-y-2">
                <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Result Variant</Label>
                <Input 
                  placeholder="e.g. Poor Metabolizer" 
                  value={newMarker.result}
                  onChange={e => setNewMarker({...newMarker, result: e.target.value})}
                  className="rounded-xl border-indigo-200 focus-visible:ring-indigo-500/20"
                />
              </div>
              <div className="col-span-12 space-y-2 mt-2">
                <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Clinical Significance</Label>
                <Input 
                  placeholder="e.g. Reduced efficacy for Clopidogrel" 
                  value={newMarker.clinicalSignificance}
                  onChange={e => setNewMarker({...newMarker, clinicalSignificance: e.target.value})}
                  className="rounded-xl border-indigo-200 focus-visible:ring-indigo-500/20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl text-indigo-600 hover:bg-indigo-100">Cancel</Button>
              <Button onClick={handleAddMarker} className="rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/20">Save Marker</Button>
            </div>
          </div>
        )}

        {profiles.length === 0 && !isAdding ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
            <Dna className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-700">No Markers Found</h3>
            <p className="text-slate-400 text-sm">Add a genetic marker to enable AI drug safety checks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {profiles.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 tracking-tight">
                      {p.markerName}
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </h4>
                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 font-black text-[10px] rounded-md uppercase tracking-widest mt-2 border border-amber-200">
                      {p.result}
                    </span>
                  </div>
                </div>
                {p.clinicalSignificance && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" />
                      Clinical Implication
                    </p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{p.clinicalSignificance}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrecisionMedicinePanel;
