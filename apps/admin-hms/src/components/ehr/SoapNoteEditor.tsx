import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClinicalNoteSchema, type ClinicalNoteInput } from '@mediportal/shared-types';
import { Button, Label } from '@mediportal/ui-core';
import { Save, CheckCircle, AlertTriangle, FileText, Sparkles, BrainCircuit, Wand2, Loader2 } from 'lucide-react';
import api from '../../api/axios';

interface SoapNoteEditorProps {
  patientId: string;
  uhid: string;
  doctorId: string;
  appointmentId?: string;
  onSuccess: () => void;
  initialData?: any;
}

const SoapNoteEditor: React.FC<SoapNoteEditorProps> = ({ patientId, uhid, doctorId, appointmentId, onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<{ suggestion: string; reasoning: string; confidenceScore: number } | null>(null);

  const { register, handleSubmit, getValues } = useForm<ClinicalNoteInput>({
    resolver: zodResolver(ClinicalNoteSchema),
    defaultValues: initialData || {
      patientId,
      doctorId,
      appointmentId,
      status: 'DRAFT',
    }
  });

  const runAiTool = async (task: 'SUMMARIZATION' | 'CODING') => {
    setAiLoading(true);
    setAiInsights(null);
    try {
      const vals = getValues();
      let res;
      if (task === 'SUMMARIZATION') {
        res = await api.post('/ai/summarize-encounter', {
          subjective: vals.subjective,
          objective: vals.objective,
          uhid,
          doctorId
        });
      } else {
        res = await api.post('/ai/suggest-codes', {
          assessment: vals.assessment,
          uhid,
          doctorId
        });
      }
      setAiInsights(res.data);
    } catch (err: any) {
      setError('AI Service failed to respond. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const saveNote = async (data: any, finalize = false) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...data, status: finalize ? 'FINALIZED' : 'DRAFT' };
      if (initialData?.id) {
        await api.patch(`/ehr/clinical-notes/${initialData.id}`, payload);
      } else {
        await api.post('/ehr/clinical-notes', payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          SOAP Encounter Note
        </h3>
        {initialData?.status === 'FINALIZED' && (
          <span className="bg-success/10 text-success text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            FINALIZED
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Subjective (S)</Label>
            <button 
              type="button"
              onClick={() => runAiTool('SUMMARIZATION')}
              className="text-[10px] font-black text-indigo-500 flex items-center gap-1 hover:text-indigo-600 transition-colors"
              disabled={aiLoading}
            >
              <BrainCircuit className="w-3 h-3" />
              AI SUMMARIZE
            </button>
          </div>
          <textarea 
            {...register('subjective')}
            placeholder="Patient's complaints, history of present illness..."
            className="w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Objective (O)</Label>
          <textarea 
            {...register('objective')}
            placeholder="Vital signs, physical exam findings, lab results..."
            className="w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Assessment (A)</Label>
            <button 
              type="button"
              onClick={() => runAiTool('CODING')}
              className="text-[10px] font-black text-indigo-500 flex items-center gap-1 hover:text-indigo-600 transition-colors"
              disabled={aiLoading}
            >
              <Wand2 className="w-3 h-3" />
              MAGIC SUGGEST
            </button>
          </div>
          <textarea 
            {...register('assessment')}
            placeholder="Diagnosis, differential diagnosis, ICD-10..."
            className="w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Plan (P)</Label>
          <textarea 
            {...register('plan')}
            placeholder="Treatment, follow-up, medications, referrals..."
            className="w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
      </div>

      {/* AI Intelligence Panel */}
      {(aiLoading || aiInsights) && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-black text-indigo-900 tracking-tight">MediPortal AI Intelligence</span>
            </div>
            {aiInsights && (
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                CONFIDENCE: {(aiInsights.confidenceScore * 100).toFixed(0)}%
              </span>
            )}
          </div>
          
          {aiLoading ? (
            <div className="flex items-center gap-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <p className="text-xs font-bold text-indigo-500 animate-pulse">Analyzing clinical data & performing medical reasoning...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Reasoning (Chain of Thought)</p>
                <p className="text-xs font-medium text-slate-600 italic leading-relaxed">{aiInsights?.reasoning}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-indigo-50 shadow-sm">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">AI Suggestion</p>
                <p className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-line">{aiInsights?.suggestion}</p>
              </div>
              <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest pt-1">
                ⚠️ AI-Generated: Review Required by a Medical Professional.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {initialData?.status !== 'FINALIZED' && (
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline"
            type="button"
            onClick={handleSubmit((d) => saveNote(d, false))}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit((d) => saveNote(d, true))}
            disabled={loading}
            className="flex items-center gap-2 bg-success hover:bg-success/90"
          >
            <CheckCircle className="w-4 h-4" />
            Finalize Note
          </Button>
        </div>
      )}
    </div>
  );
};

export default SoapNoteEditor;
