import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LabResultInputSchema, type LabResultInput } from '@mediportal/shared-types';
import { Button, Input, Label, Card } from '@mediportal/ui-core';
import { Microscope, X, AlertCircle, CheckCircle2, UploadCloud, File, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import api from '../../api/axios';

interface ResultEntryModalProps {
  testId: string;
  testName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ResultEntryModal: React.FC<ResultEntryModalProps> = ({ 
  testId, 
  testName, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAttachment(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1
  });

  const { register, handleSubmit, formState: { errors } } = useForm<LabResultInput>({
    resolver: zodResolver(LabResultInputSchema),
    defaultValues: {
      isVerified: false
    }
  });

  const onSubmit = async (data: LabResultInput) => {
    setLoading(true);
    setError(null);
    try {
      let attachmentUrl = null;

      if (attachment) {
        // Mock S3 upload
        const uploadRes = await api.post('/storage/upload-url', null, {
          params: { fileName: attachment.name, fileType: attachment.type }
        });
        // Imagine we PUT the file to uploadRes.data.uploadUrl here
        attachmentUrl = uploadRes.data.publicUrl;
      }

      const payload = {
        ...data,
        attachmentUrl
      };

      await api.patch(`/ehr/lab/tests/${testId}/result`, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit test result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-4 py-10 animate-in fade-in duration-300 overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-2xl border-none rounded-[32px] overflow-hidden my-auto shrink-0">
        <div className="bg-amber-600 px-8 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Enter Result</h2>
              <p className="text-xs font-medium text-white/70">{testName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Primary Result</Label>
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-3 space-y-1.5">
                  <Input 
                    {...register('resultValue')} 
                    placeholder="Display Value (e.g. '12.5', 'Positive')"
                    className="rounded-xl border-slate-200"
                  />
                  {errors.resultValue && <p className="text-xs text-destructive font-bold">{errors.resultValue.message}</p>}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Input 
                    type="number"
                    step="0.01"
                    {...register('valueNumeric', { valueAsNumber: true })} 
                    placeholder="Numeric Value"
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <Input 
                    {...register('unit')} 
                    placeholder="Unit"
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Reference Ranges</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  type="number" step="0.01"
                  {...register('minRange', { valueAsNumber: true })} 
                  placeholder="Min Normal"
                  className="rounded-xl border-slate-200"
                />
                <Input 
                  type="number" step="0.01"
                  {...register('maxRange', { valueAsNumber: true })} 
                  placeholder="Max Normal"
                  className="rounded-xl border-slate-200"
                />
                <Input 
                  {...register('referenceRange')} 
                  placeholder="Display String (e.g. 70-110)"
                  className="rounded-xl border-slate-200 col-span-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-red-400 tracking-tighter">Critical Thresholds</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  type="number" step="0.01"
                  {...register('minCritical', { valueAsNumber: true })} 
                  placeholder="Min Critical"
                  className="rounded-xl border-red-200 focus:border-red-500"
                />
                <Input 
                  type="number" step="0.01"
                  {...register('maxCritical', { valueAsNumber: true })} 
                  placeholder="Max Critical"
                  className="rounded-xl border-red-200 focus:border-red-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Values outside this range flag as CRITICAL.</p>
            </div>

            <div className="col-span-2 space-y-4 mt-2 border-t border-slate-100 pt-6">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Report Attachment</Label>
              
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                {attachment ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <File className="w-6 h-6 text-amber-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">{attachment.name}</p>
                    <p className="text-[10px] font-medium text-slate-500">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <UploadCloud className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Drag & drop a file here, or click to select</p>
                    <p className="text-[10px] font-medium text-slate-500">Supports PDF, JPG, PNG up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-span-2 bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-4">
              <input 
                type="checkbox" 
                id="isVerified"
                {...register('isVerified')}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
              />
              <div>
                <Label htmlFor="isVerified" className="text-sm font-black text-amber-900 cursor-pointer">Verify & Finalize Result</Label>
                <p className="text-xs text-amber-700/70 font-medium leading-tight">Once verified, this result becomes read-only and is published to the doctor's chart.</p>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl px-6 border-slate-200">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-2xl px-10 bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Result
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ResultEntryModal;
