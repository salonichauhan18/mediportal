import React from 'react';
import { type LabOrderResponse } from '@mediportal/shared-types';
import { Card, CardContent, Button } from '@mediportal/ui-core';
import { Microscope, Calendar, User, FileText, ChevronRight, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface LabOrderPanelProps {
  labOrders: LabOrderResponse[];
  onNewOrder: () => void;
}

const LabOrderPanel: React.FC<LabOrderPanelProps> = ({ labOrders, onNewOrder }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Microscope className="w-5 h-5 text-amber-600" />
          </div>
          Laboratory history
        </h3>
        <Button 
          onClick={onNewOrder}
          className="rounded-2xl bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700"
        >
          Order Diagnostics
        </Button>
      </div>

      <div className="space-y-4">
        {labOrders.length > 0 ? (
          labOrders.map((order) => (
            <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[32px] overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex">
                  <div className={`w-2 ${
                    order.status === 'COMPLETED' ? 'bg-green-500' : 
                    order.status === 'PROCESSING' ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-800">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.priority === 'STAT' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {order.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                            order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            Dr. {order.doctor?.user?.name}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600 transition-colors" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {order.tests.map((test: any, idx: number) => (
                        <div key={idx} className={`p-5 rounded-2xl border ${
                          test.interpretation === 'CRITICAL' ? 'bg-red-50/50 border-red-200' : 
                          test.interpretation === 'ABNORMAL' ? 'bg-amber-50/50 border-amber-200' :
                          'bg-slate-50 border-slate-100/50'
                        }`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 bg-white`}>
                                <Activity className={`w-5 h-5 ${test.interpretation === 'CRITICAL' ? 'text-red-500 animate-pulse' : test.interpretation === 'ABNORMAL' ? 'text-amber-500' : 'text-primary'}`} />
                              </div>
                              <div>
                                <p className={`text-sm font-black ${test.interpretation === 'CRITICAL' ? 'text-red-700' : 'text-slate-700'}`}>{test.testName}</p>
                                {test.instructions && (
                                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 line-clamp-1 italic">{test.instructions}</p>
                                )}
                              </div>
                            </div>
                            {test.status === 'COMPLETED' && (
                              <div className="text-right">
                                {test.isVerified ? (
                                   <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">Verified</span>
                                ) : (
                                   <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">Draft</span>
                                )}
                                {test.performedAt && (
                                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{format(new Date(test.performedAt), 'MMM dd, hh:mm a')}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {test.status === 'COMPLETED' && test.resultValue ? (
                            <div className="ml-14 grid grid-cols-12 gap-4 items-end animate-in slide-in-from-bottom-2 duration-500">
                              <div className="col-span-4 space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Result</p>
                                <p className={`text-2xl font-black leading-none ${
                                  test.interpretation === 'CRITICAL' ? 'text-red-600 animate-pulse' :
                                  test.interpretation === 'ABNORMAL' ? 'text-amber-600' :
                                  'text-slate-800'
                                }`}>
                                  {test.resultValue} <span className="text-xs font-bold opacity-70">{test.unit}</span>
                                </p>
                              </div>
                              
                              {test.referenceRange && (
                                <div className="col-span-4 space-y-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Reference Range</p>
                                  <p className="text-sm font-black text-slate-600 leading-none">{test.referenceRange}</p>
                                </div>
                              )}

                              {test.interpretation && test.interpretation !== 'NORMAL' && (
                                <div className="col-span-3 space-y-1">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Flag</p>
                                   <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                     test.interpretation === 'CRITICAL' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-amber-100 text-amber-700'
                                   }`}>
                                     {test.interpretation}
                                   </span>
                                </div>
                              )}

                              {test.attachmentUrl && (
                                <div className="col-span-1 flex justify-end">
                                  <a href={test.attachmentUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all">
                                    <FileText className="w-4 h-4" />
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="ml-14 py-2 border-t border-slate-100 mt-2">
                              <p className="text-[10px] text-slate-400 font-bold italic">Waiting for diagnostic results...</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mt-4 p-4 bg-amber-50/50 rounded-2xl flex gap-3">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-600 font-bold italic leading-relaxed">{order.notes}</p>
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
              <Microscope className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-sm text-slate-400 font-bold">No diagnostic orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabOrderPanel;
