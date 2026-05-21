import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PrescriptionSchema, type PrescriptionInput } from '@mediportal/shared-types';
import { Button, Input, Label, Card } from '@mediportal/ui-core';
import { Pill, Plus, Trash2, Save, X, AlertCircle, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../../api/axios';

interface PrescriptionModalProps {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ 
  patientId, 
  doctorId, 
  appointmentId, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyChecks, setSafetyChecks] = useState<Record<number, { score: string, reasoning: string, checking: boolean }>>({});

  const { register, control, handleSubmit, watch } = useForm<PrescriptionInput>({
    resolver: zodResolver(PrescriptionSchema),
    defaultValues: {
      patientId,
      doctorId,
      appointmentId,
      items: [{ drugName: '', dosage: '', frequency: '', duration: '' }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      watchItems.forEach((item, index) => {
        if (item.drugName && item.drugName.length > 2) {
          checkDrugSafety(item.drugName, index);
        }
      });
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [JSON.stringify(watchItems.map(i => i.drugName))]);

  const checkDrugSafety = async (drugName: string, index: number) => {
    if (safetyChecks[index] && safetyChecks[index].score) return; // avoid duplicate calls
    
    setSafetyChecks(prev => ({ ...prev, [index]: { score: '', reasoning: '', checking: true } }));
    try {
      const res = await api.post('/ai/check-dgi', { drugName, patientId });
      setSafetyChecks(prev => ({
        ...prev,
        [index]: { score: res.data.safetyScore || 'Safe', reasoning: res.data.reasoning, checking: false }
      }));
    } catch (err) {
      setSafetyChecks(prev => ({
        ...prev,
        [index]: { score: 'Unknown', reasoning: 'Could not verify safety.', checking: false }
      }));
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/ehr/prescriptions', data);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-3xl shadow-2xl border-none rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-primary px-8 py-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">New Medication Order</h2>
              <p className="text-xs font-medium text-white/70">Prescribe medications for current encounter</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Medications</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ drugName: '', dosage: '', frequency: '', duration: '' })}
                className="rounded-xl border-primary text-primary hover:bg-primary/5 font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="relative bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-12 gap-4 animate-in slide-in-from-right-4 duration-300">
                  {fields.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute -top-2 -right-2 p-1.5 bg-white shadow-md rounded-full text-slate-400 hover:text-destructive transition-colors border"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="col-span-12 md:col-span-5 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Drug Name</Label>
                    <Input 
                      {...register(`items.${index}.drugName` as const)} 
                      placeholder="e.g. Paracetamol"
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Dosage</Label>
                    <Input 
                      {...register(`items.${index}.dosage` as const)} 
                      placeholder="500mg"
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  <div className="col-span-4 md:col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Frequency</Label>
                    <select 
                      {...register(`items.${index}.frequency` as const)} 
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <option value="OD">Once daily (OD)</option>
                      <option value="BD">Twice daily (BD)</option>
                      <option value="TID">Three times (TID)</option>
                      <option value="QID">Four times (QID)</option>
                      <option value="SOS">As needed (SOS)</option>
                      <option value="HS">At bedtime (HS)</option>
                    </select>
                  </div>

                  <div className="col-span-4 md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Duration</Label>
                    <Input 
                      {...register(`items.${index}.duration` as const)} 
                      placeholder="5 days"
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  <div className="col-span-12 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Special Instructions</Label>
                    <Input 
                      {...register(`items.${index}.instructions` as const)} 
                      placeholder="Take after meals"
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  {/* Safety Preview UI */}
                  {watchItems[index]?.drugName?.length > 2 && safetyChecks[index] && (
                    <div className="col-span-12 mt-2">
                      {safetyChecks[index].checking ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Running AI Pharmacogenomic Check...
                        </div>
                      ) : (
                        <div className={`p-4 rounded-2xl flex gap-3 ${
                          safetyChecks[index].score === 'Danger' ? 'bg-red-50 border border-red-100 text-red-700' :
                          safetyChecks[index].score === 'Caution' ? 'bg-amber-50 border border-amber-100 text-amber-700' :
                          'bg-emerald-50 border border-emerald-100 text-emerald-700'
                        }`}>
                          {safetyChecks[index].score === 'Safe' ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <ShieldAlert className={`w-5 h-5 shrink-0 ${safetyChecks[index].score === 'Danger' ? 'text-red-500' : 'text-amber-500'}`} />
                          )}
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest mb-0.5 opacity-80">
                              {safetyChecks[index].score === 'Safe' ? 'Genomic Safety Verified' : `Interaction Warning: ${safetyChecks[index].score}`}
                            </p>
                            <p className="text-sm font-medium">{safetyChecks[index].reasoning}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Clinical Notes / Rationale</Label>
            <textarea 
              {...register('notes')}
              className="w-full h-24 p-4 text-sm border border-slate-200 rounded-3xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              placeholder="Additional comments for the pharmacological order..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-2xl px-10 bg-primary shadow-lg shadow-primary/20">
              {loading ? 'Processing...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sign & Prescribe
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PrescriptionModal;
