import React from 'react';
import { type PrescriptionResponse } from '@mediportal/shared-types';
import { Card, CardContent, Button } from '@mediportal/ui-core';
import { Pill, Calendar, User, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface PrescriptionPanelProps {
  prescriptions: PrescriptionResponse[];
  onNewOrder: () => void;
}

const PrescriptionPanel: React.FC<PrescriptionPanelProps> = ({ prescriptions, onNewOrder }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          Medication History
        </h3>
        <Button 
          onClick={onNewOrder}
          className="rounded-2xl bg-primary shadow-lg shadow-primary/20"
        >
          New Prescription
        </Button>
      </div>

      <div className="space-y-4">
        {prescriptions.length > 0 ? (
          prescriptions.map((px) => (
            <Card key={px.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[32px] overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex">
                  <div className={`w-2 ${px.status === 'ACTIVE' ? 'bg-teal-500' : 'bg-slate-300'}`} />
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-800">Order #{px.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            px.status === 'ACTIVE' 
                              ? 'bg-teal-100 text-teal-600' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {px.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(px.createdAt), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            Dr. {px.doctor?.user?.name}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>

                    <div className="space-y-3">
                      {px.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <Pill className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-700">{item.drugName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.dosage} • {item.frequency}</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-100">
                            {item.duration}
                          </span>
                        </div>
                      ))}
                    </div>

                    {px.notes && (
                      <div className="mt-4 p-4 bg-primary/5 rounded-2xl flex gap-3 italic">
                        <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{px.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="bg-slate-50 rounded-[32px] p-12 border-2 border-dashed border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-sm">
              <Pill className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-sm text-slate-400 font-bold">No active prescriptions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionPanel;
