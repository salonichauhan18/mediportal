import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateAppointmentSchema, type CreateAppointmentInput, type Slot } from '@mediportal/shared-types';
import api from '../api/axios';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@mediportal/ui-core';
import { Search, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface QuickBookSidebarProps {
  onSuccess: () => void;
  selectedDate?: Date;
  selectedDoctor?: string;
  selectedBranch?: string;
}

const QuickBookSidebar: React.FC<QuickBookSidebarProps> = ({ onSuccess, selectedDate, selectedDoctor, selectedBranch }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateAppointmentInput>({
    resolver: zodResolver(CreateAppointmentSchema),
    defaultValues: {
      type: 'OPD',
      branchId: selectedBranch,
      doctorId: selectedDoctor,
      startTime: selectedDate?.toISOString(),
    }
  });

  const watchDoctor = watch('doctorId');
  const watchBranch = watch('branchId');
  const watchDate = watch('startTime');

  useEffect(() => {
    if (watchDoctor && watchBranch && watchDate) {
      fetchSlots();
    }
  }, [watchDoctor, watchBranch, watchDate]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const dateStr = format(new Date(watchDate), 'yyyy-MM-dd');
      const res = await api.get<Slot[]>(`/availability/slots?doctorId=${watchDoctor}&branchId=${watchBranch}&date=${dateStr}`);
      setSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const onSubmit = async (data: CreateAppointmentInput) => {
    setBooking(true);
    setError(null);
    try {
      await api.post('/appointments', data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Quick Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient UHID / ID</Label>
            <div className="relative">
              <Input 
                id="patientId" 
                placeholder="Search patient..." 
                {...register('patientId')}
                className="pl-9"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            </div>
            {errors.patientId && <p className="text-xs text-destructive">{errors.patientId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Consultation Type</Label>
            <div className="flex gap-2">
              {['OPD', 'FOLLOW_UP', 'TELECONSULTATION'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('type', type as any)}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-md border transition-all ${
                    watch('type') === type 
                      ? 'bg-primary text-white border-primary shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Time Slot</Label>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {slots.length > 0 ? (
                  slots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => {
                        const date = new Date(watchDate);
                        const [h, m] = slot.startTime.split(':');
                        date.setHours(parseInt(h), parseInt(m), 0, 0);
                        setValue('startTime', date.toISOString());
                      }}
                      className={`py-2 text-xs font-medium rounded-md border text-center transition-all ${
                        !slot.isAvailable 
                          ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                          : watchDate && format(new Date(watchDate), 'HH:mm') === slot.startTime
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-4 text-xs text-muted-foreground border border-dashed rounded-md">
                    No slots available for this day.
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-[10px] p-2 rounded flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={booking || !watchDate}>
            {booking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm Appointment'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuickBookSidebar;
