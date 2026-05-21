import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LabOrderSchema, type LabOrderInput } from '@mediportal/shared-types';
import { Button, Input, Label, Card } from '@mediportal/ui-core';
import { Microscope, Plus, Trash2, Save, X, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

interface LabOrderModalProps {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LabOrderModal: React.FC<LabOrderModalProps> = ({ 
  patientId, 
  doctorId, 
  appointmentId, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit } = useForm<LabOrderInput>({
    resolver: zodResolver(LabOrderSchema),
    defaultValues: {
      patientId,
      doctorId,
      appointmentId,
      tests: [{ testName: '' }],
      priority: 'ROUTINE',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tests"
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/ehr/lab-orders', data);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create laboratory order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl shadow-2xl border-none rounded-[32px] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-amber-600 px-8 py-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Diagnostics Order</h2>
              <p className="text-xs font-medium text-white/70">Order laboratory or imaging tests</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Order Priority</Label>
              <div className="flex gap-4">
                {['ROUTINE', 'STAT'].map((p) => (
                  <label key={p} className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    p === 'STAT' ? 'hover:border-red-500' : 'hover:border-primary'
                  } border-slate-100 has-[:checked]:border-amber-600 has-[:checked]:bg-amber-50`}>
                    <input 
                      type="radio" 
                      className="hidden" 
                      value={p} 
                      {...register('priority')} 
                    />
                    <span className={`text-sm font-black ${p === 'STAT' ? 'text-red-600' : 'text-slate-700'}`}>
                      {p} {p === 'STAT' && '🚨'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Tests Requested</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ testName: '' })}
                className="rounded-xl border-amber-600 text-amber-600 hover:bg-amber-50 font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Test
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="group flex items-start gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:shadow-sm">
                  <div className="flex-1 space-y-3">
                    <Input 
                      {...register(`tests.${index}.testName` as const)} 
                      placeholder="e.g. CBC / HbA1c / Chest X-Ray"
                      className="rounded-xl border-slate-200 bg-white"
                    />
                    <Input 
                      {...register(`tests.${index}.instructions` as const)} 
                      placeholder="e.g. Fasting 8-12 hours required"
                      className="rounded-xl border-slate-200 bg-white text-xs"
                    />
                  </div>
                  {fields.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-slate-400 hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Clinical Rationale / Notes</Label>
            <textarea 
              {...register('notes')}
              className="w-full h-24 p-4 text-sm border border-slate-200 rounded-3xl focus:ring-2 focus:ring-amber-600/20 transition-all outline-none"
              placeholder="Additional clinical context for the laboratory..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-2xl px-10 bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700">
              {loading ? 'Ordering...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Place Lab Order
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LabOrderModal;
