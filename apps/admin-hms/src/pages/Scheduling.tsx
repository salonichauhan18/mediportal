import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../api/axios';
import type { Appointment } from '@mediportal/shared-types';
import { Card, CardContent } from '@mediportal/ui-core';
import QuickBookSidebar from '../components/QuickBookSidebar';
import { Loader2, Plus, Calendar as CalendarIcon, Filter, Video } from 'lucide-react';
import { format } from 'date-fns';

interface SchedulingProps {
  onStartConsultation?: (appointmentId: string) => void;
}

const SchedulingPage: React.FC<SchedulingProps> = ({ onStartConsultation }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const calendarRef = useRef<any>(null);

  // Mock IDs for demo - in real app these come from filters/state
  const branchId = 'branch-1-uuid';
  const doctorId = 'sarah-j-uuid'; // This needs to be the staff ID from seed

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // In real app, we'd fetch for the visible range
      const res = await api.get<Appointment[]>(`/appointments/dashboard?branchId=${branchId}&date=${selectedDate.toISOString()}`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date);
    setShowSidebar(true);
  };

  const handleEventClick = (arg: any) => {
    setSelectedAppointment(arg.event.extendedProps);
    setShowSidebar(true);
  };

  const startConsultation = async () => {
    if (!selectedAppointment) return;
    try {
      await api.post(`/telemedicine/init/${selectedAppointment.id}`);
      onStartConsultation?.(selectedAppointment.id);
    } catch (err) {
      console.error('Failed to start consultation', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'mr-10' : ''}`}>
        <Card className="h-full border-none shadow-md overflow-hidden flex flex-col">
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <CalendarIcon className="w-5 h-5" />
                <span>Appointment Scheduler</span>
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex gap-1">
                <button className="px-3 py-1 text-xs font-medium bg-gray-100 rounded-md hover:bg-gray-200">Today</button>
                <div className="flex items-center px-2 text-sm font-semibold text-gray-700">
                  {format(selectedDate, 'MMMM yyyy')}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"><Filter className="w-4 h-4" /></button>
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                Quick Book
              </button>
            </div>
          </div>
          
          <CardContent className="flex-1 p-0 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <div className="h-full p-4 full-calendar-custom">
              <FullCalendar
                ref={calendarRef as any}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridDay"
                headerToolbar={false}
                height="100%"
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                events={appointments.map(app => ({
                  id: app.id,
                  title: app.patient?.user.name || 'Patient',
                  start: app.startTime,
                  end: app.endTime,
                  backgroundColor: 
                    app.status === 'CONFIRMED' ? '#0D9488' : 
                    app.status === 'IN_PROGRESS' ? '#F59E0B' : '#6B7280',
                  borderColor: 'transparent',
                  extendedProps: { ...app }
                }))}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                nowIndicator={true}
                editable={true}
                selectable={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {showSidebar && (
        <div className="w-96 bg-white border-l shadow-2xl p-6 transition-all duration-300 animate-in slide-in-from-right">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{selectedAppointment ? 'Consultation' : 'Scheduling'}</h2>
            <button 
              onClick={() => {
                setShowSidebar(false);
                setSelectedAppointment(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {selectedAppointment ? (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient Details</p>
                <h3 className="text-lg font-black text-slate-900">{selectedAppointment.patient?.user.name}</h3>
                <p className="text-xs font-bold text-slate-500">{selectedAppointment.patient?.uhid}</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Actions</p>
                <button 
                  onClick={startConsultation}
                  className="w-full bg-brand-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-brand-100 flex items-center justify-center gap-3"
                >
                  <Video className="w-5 h-5" />
                  START VIRTUAL CALL
                </button>
                <button className="w-full bg-white border-2 border-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-50">
                  VIEW FULL CHART
                </button>
              </div>
            </div>
          ) : (
            <QuickBookSidebar 
              onSuccess={() => {
                fetchAppointments();
                setShowSidebar(false);
              }} 
              selectedDate={selectedDate}
              selectedBranch={branchId}
              selectedDoctor={doctorId}
            />
          )}
        </div>
      )}

      <style>{`
        .full-calendar-custom .fc {
          --fc-border-color: #f1f5f9;
          --fc-today-bg-color: #f8fafc;
          font-family: inherit;
        }
        .full-calendar-custom .fc-timegrid-slot {
          height: 3rem !important;
        }
        .full-calendar-custom .fc-event {
          border-radius: 6px;
          padding: 2px 4px;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default SchedulingPage;
