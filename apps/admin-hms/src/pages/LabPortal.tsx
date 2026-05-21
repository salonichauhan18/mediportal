import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge } from '@mediportal/ui-core';
import { 
  Microscope, 
  Search, 
  Filter, 
  Clock, 
  User, 
  ClipboardList, 
  Beaker,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import { format } from 'date-fns';
import ResultEntryModal from '../components/ehr/ResultEntryModal';

const LabPortalPage: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeTest, setActiveTest] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ehr/lab/queue');
      setQueue(res.data);
    } catch (err) {
      console.error('Failed to fetch lab queue', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/ehr/lab/orders/${orderId}/status`, { status });
      fetchQueue();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex items-end justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-600/20">
              <Microscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Diagnostic Hub</h1>
              <p className="text-slate-500 font-bold text-sm">Laboratory Technician Portal • {queue.length} Pending Orders</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by UHID or Patient Name..." 
              className="pl-11 pr-6 py-3 rounded-2xl border-none bg-white shadow-sm font-bold text-sm w-80 outline-none focus:ring-2 focus:ring-amber-600/20 transition-all"
            />
          </div>
          <Button variant="outline" className="rounded-2xl bg-white border-none shadow-sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Order Queue Column */}
        <div className="col-span-8 space-y-4">
          <h2 className="text-xs font-black text-slate-400 p-2 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Order Queue
          </h2>
          
          <div className="space-y-4">
            {queue.map((order) => (
              <Card 
                key={order.id} 
                className={`border-none shadow-sm hover:shadow-xl transition-all rounded-[32px] overflow-hidden cursor-pointer group ${
                  selectedOrder?.id === order.id ? 'ring-2 ring-amber-600 ring-offset-4 bg-amber-50/30' : 'bg-white'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    <div className={`w-2 ${
                      order.priority === 'STAT' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 leading-tight">{order.patient.user.name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">UHID: {order.patient.uhid}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">{format(new Date(order.createdAt), 'hh:mm a')}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                            order.priority === 'STAT' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {order.priority}
                          </span>
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black tracking-widest uppercase">
                            {order.status}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase pl-2">
                            <Beaker className="w-3.5 h-3.5" />
                            {order.tests.length} Tests
                          </span>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-300 transition-all ${
                          selectedOrder?.id === order.id ? 'translate-x-1 text-amber-600' : ''
                        }`} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {queue.length === 0 && !loading && (
              <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center mb-4">
                  <ClipboardList className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Queue is empty</h3>
                <p className="text-slate-400 font-medium">All diagnostic orders have been processed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Order Detail Column */}
        <div className="col-span-4">
          <div className="sticky top-8 space-y-6">
            {selectedOrder ? (
              <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-white">
                <div className="bg-slate-900 p-8 text-white">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Processing Station</p>
                  <h3 className="text-2xl font-black mb-2">{selectedOrder.patient.user.name}</h3>
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Dr. {selectedOrder.doctor?.user?.name}</span>
                  </div>
                </div>
                
                <CardContent className="p-8 space-y-8">
                  {/* Workflow buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      disabled={selectedOrder.status === 'COLLECTED' || selectedOrder.status === 'COMPLETED'}
                      onClick={() => updateOrderStatus(selectedOrder.id, 'COLLECTED')}
                      className="rounded-2xl h-14 font-black text-xs border-slate-100 hover:bg-amber-50 hover:text-amber-600"
                    >
                      Mark Collected
                    </Button>
                    <Button 
                      variant="outline"
                      disabled={selectedOrder.status === 'PROCESSING' || selectedOrder.status === 'COMPLETED'}
                      onClick={() => updateOrderStatus(selectedOrder.id, 'PROCESSING')}
                      className="rounded-2xl h-14 font-black text-xs border-slate-100 hover:bg-amber-50 hover:text-amber-600"
                    >
                      Start Processing
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tests Requested</h4>
                    {selectedOrder.tests.map((test: any) => (
                      <div key={test.id} className="group p-5 rounded-3xl bg-slate-50 border border-slate-100/50 hover:border-amber-200 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                              <Activity className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-sm font-black text-slate-800">{test.testName}</span>
                          </div>
                          {test.status === 'COMPLETED' ? (
                            <Badge className="bg-teal-50 text-teal-600 border-none rounded-full px-3 py-1 font-black text-[9px] uppercase">Done</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 border-none rounded-full px-3 py-1 font-black text-[9px] uppercase">Pending</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-end justify-between gap-4">
                          <div className="space-y-1">
                            {test.resultValue ? (
                              <p className="text-lg font-black text-teal-600 leading-none">{test.resultValue} <span className="text-xs text-slate-400">{test.unit}</span></p>
                            ) : (
                              <p className="text-[10px] text-slate-400 font-bold italic">No result recorded</p>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            disabled={test.status === 'COMPLETED'}
                            onClick={() => setActiveTest({ id: test.id, name: test.testName })}
                            className="rounded-xl h-9 px-4 bg-amber-600 text-white shadow-lg shadow-amber-600/10 hover:shadow-amber-600/20 font-black text-[10px] uppercase"
                          >
                            Set Result
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedOrder.notes && (
                    <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-amber-500 space-y-1">
                      <p className="text-[10px] font-black uppercase text-amber-600 tracking-tighter">Clinical Notes</p>
                      <p className="text-xs text-slate-600 font-medium italic">{selectedOrder.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[40px] p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
                  <ArrowRight className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 font-bold">Select an order from the queue to start processing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTest && (
        <ResultEntryModal 
          testId={activeTest.id} 
          testName={activeTest.name} 
          onClose={() => setActiveTest(null)}
          onSuccess={() => {
            fetchQueue();
            // Also refresh selectedOrder data
            if (selectedOrder) {
              const fetchOrder = async () => {
                const res = await api.get('/ehr/lab/queue'); // Simplification: re-fetch queue and find order
                const updated = res.data.find((o: any) => o.id === selectedOrder.id);
                if (updated) setSelectedOrder(updated);
              }
              fetchOrder();
            }
          }}
        />
      )}
    </div>
  );
};

export default LabPortalPage;

const Activity = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);
