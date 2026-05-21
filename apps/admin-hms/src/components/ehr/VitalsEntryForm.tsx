import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VitalsSchema, type VitalsInput } from '@mediportal/shared-types';
import { Button, Input, Label, Card, CardContent } from '@mediportal/ui-core';
import { Activity, Thermometer, Droplets, HeartPulse, Scale, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

interface VitalsEntryFormProps {
  patientId: string;
  onSuccess: () => void;
}

const VitalsEntryForm: React.FC<VitalsEntryFormProps> = ({ patientId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<VitalsInput>({
    resolver: zodResolver(VitalsSchema),
    defaultValues: {
      patientId
    }
  });

  const onSubmit = async (data: VitalsInput) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/ehr/vitals', data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Scale className="w-3 h-3" /> Height (cm)</Label>
              <Input type="number" {...register('height', { valueAsNumber: true })} placeholder="175" />
              {errors.height && <p className="text-[10px] text-destructive">{errors.height.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Scale className="w-3 h-3" /> Weight (kg)</Label>
              <Input type="number" {...register('weight', { valueAsNumber: true })} placeholder="70" />
              {errors.weight && <p className="text-[10px] text-destructive">{errors.weight.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Activity className="w-3 h-3" /> Blood Pressure</Label>
              <Input {...register('bloodPressure')} placeholder="120/80" />
              {errors.bloodPressure && <p className="text-[10px] text-destructive">{errors.bloodPressure.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><HeartPulse className="w-3 h-3" /> Pulse Rate (bpm)</Label>
              <Input type="number" {...register('pulseRate', { valueAsNumber: true })} placeholder="72" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Thermometer className="w-3 h-3" /> Temp (F)</Label>
              <Input type="number" step="0.1" {...register('temperature', { valueAsNumber: true })} placeholder="98.6" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Droplets className="w-3 h-3" /> SpO2 (%)</Label>
              <Input type="number" {...register('spO2', { valueAsNumber: true })} placeholder="98" />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-[10px] p-2 rounded flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Vitals'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VitalsEntryForm;
