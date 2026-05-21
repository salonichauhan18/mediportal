import React from 'react';
import { format } from 'date-fns';
import { FileText, Activity, Calendar, ChevronRight } from 'lucide-react';
import { type ClinicalNoteResponse } from '@mediportal/shared-types';

interface ClinicalTimelineProps {
  entries: ClinicalNoteResponse[];
  onSelectNote: (note: ClinicalNoteResponse) => void;
}

const ClinicalTimeline: React.FC<ClinicalTimelineProps> = ({ entries, onSelectNote }) => {
  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {entries.length > 0 ? (
        entries.map((entry) => (
          <div key={entry.id} className="relative flex items-start gap-6 group">
            <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md z-10 transition-all duration-300 ${
              entry.status === 'FINALIZED' ? 'bg-primary text-white scale-110' : 'bg-slate-100 text-slate-500'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            
            <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => onSelectNote(entry)}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                    {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                  </span>
                  <div className="h-1 w-1 bg-slate-300 rounded-full" />
                  <span className="text-xs font-bold text-primary">
                    {entry.doctor?.user.name}
                  </span>
                </div>
                {entry.status === 'DRAFT' && (
                  <span className="text-[10px] font-black tracking-tighter uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 italic">
                    Draft
                  </span>
                )}
              </div>
              
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                Clinical Encounter
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </h4>
              
              <p className="text-sm text-slate-600 line-clamp-2 italic">
                {entry.assessment || 'No assessment recorded...'}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  OPD VISIT
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium italic">No clinical history found for this patient.</p>
        </div>
      )}
    </div>
  );
};

export default ClinicalTimeline;
