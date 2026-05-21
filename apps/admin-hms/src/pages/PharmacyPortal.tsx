import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Button, Input, Label } from '@mediportal/ui-core';
import {
  Pill, Search, Plus, AlertTriangle, Clock, Package, Loader2,
  Beaker, TrendingDown, Calendar, X, CheckCircle2, Trash2
} from 'lucide-react';
import api from '../api/axios';
import { format, differenceInDays } from 'date-fns';

// ─── Purchase Entry Form ───
const PurchaseForm: React.FC<{
  medicines: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ medicines, onClose, onSuccess }) => {
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{
    medicineId: '', batchNumber: '', expiryDate: '', mrp: 0, salePrice: 0, purchasePrice: 0, quantity: 1
  }]);

  const addItem = () => setItems(prev => [...prev, {
    medicineId: '', batchNumber: '', expiryDate: '', mrp: 0, salePrice: 0, purchasePrice: 0, quantity: 1
  }]);

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: string, value: any) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/pharmacy/purchase', { supplier, notes, items });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 py-10 animate-in fade-in duration-300 overflow-y-auto">
      <Card className="w-full max-w-5xl shadow-2xl border-none rounded-[32px] overflow-hidden my-auto shrink-0">
        <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Package className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Receive Purchase</h2>
              <p className="text-xs font-medium text-white/70">Stock-In Batch Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Supplier / Vendor</Label>
              <Input value={supplier} onChange={(e: any) => setSupplier(e.target.value)} placeholder="e.g. Apollo Pharma Distributors" className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Notes</Label>
              <Input value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Optional delivery notes" className="rounded-xl border-slate-200" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-8 gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
              <div className="col-span-2">Medicine</div>
              <div>Batch #</div>
              <div>Expiry</div>
              <div>MRP (₹)</div>
              <div>Sale (₹)</div>
              <div>Cost (₹)</div>
              <div>Qty</div>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-8 gap-3 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="col-span-2">
                  <select
                    value={item.medicineId}
                    onChange={(e) => updateItem(idx, 'medicineId', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select medicine...</option>
                    {medicines.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <Input value={item.batchNumber} onChange={(e: any) => updateItem(idx, 'batchNumber', e.target.value)} placeholder="B001" className="rounded-xl border-slate-200 text-sm" />
                <Input type="date" value={item.expiryDate} onChange={(e: any) => updateItem(idx, 'expiryDate', e.target.value)} className="rounded-xl border-slate-200 text-sm" />
                <Input type="number" step="0.01" value={item.mrp} onChange={(e: any) => updateItem(idx, 'mrp', parseFloat(e.target.value) || 0)} className="rounded-xl border-slate-200 text-sm" />
                <Input type="number" step="0.01" value={item.salePrice} onChange={(e: any) => updateItem(idx, 'salePrice', parseFloat(e.target.value) || 0)} className="rounded-xl border-slate-200 text-sm" />
                <Input type="number" step="0.01" value={item.purchasePrice} onChange={(e: any) => updateItem(idx, 'purchasePrice', parseFloat(e.target.value) || 0)} className="rounded-xl border-slate-200 text-sm" />
                <div className="flex items-center gap-1">
                  <Input type="number" min={1} value={item.quantity} onChange={(e: any) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="rounded-xl border-slate-200 text-sm" />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addItem} className="w-full rounded-xl border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600">
              <Plus className="w-4 h-4 mr-2" /> Add Another Batch
            </Button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={onClose} className="rounded-2xl px-6">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !supplier} className="rounded-2xl px-10 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 font-black">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" />Receive Stock</>}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── Main Pharmacy Portal ───
const PharmacyPortal: React.FC = () => {
  const [activeView, setActiveView] = useState<'stock' | 'expiry' | 'purchase'>('stock');
  const [stockData, setStockData] = useState<any[]>([]);
  const [expiryData, setExpiryData] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expiryDays, setExpiryDays] = useState(60);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockRes, expiryRes, medRes] = await Promise.all([
        api.get('/pharmacy/inventory/stock'),
        api.get(`/pharmacy/inventory/expiry-watch?days=${expiryDays}`),
        api.get('/pharmacy/medicines'),
      ]);
      setStockData(stockRes.data);
      setExpiryData(expiryRes.data);
      setMedicines(medRes.data);
    } catch (err) {
      console.error('Failed to fetch pharmacy data', err);
    } finally {
      setLoading(false);
    }
  }, [expiryDays]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredStock = stockData.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = stockData.filter((m) => m.isLowStock).length;
  const nearExpiryCount = expiryData.length;

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  }

  const categoryColors: Record<string, string> = {
    TABLET: 'bg-blue-100 text-blue-700',
    CAPSULE: 'bg-purple-100 text-purple-700',
    SYRUP: 'bg-amber-100 text-amber-700',
    INJECTION: 'bg-red-100 text-red-700',
    OINTMENT: 'bg-green-100 text-green-700',
    DROPS: 'bg-cyan-100 text-cyan-700',
    INHALER: 'bg-indigo-100 text-indigo-700',
    OTHER: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pharmacy</h1>
            <p className="text-slate-500 font-bold text-sm">Inventory Control Center</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Alert badges */}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-200">
              <TrendingDown className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="text-xs font-black text-red-600">{lowStockCount} Low Stock</span>
            </div>
          )}
          {nearExpiryCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black text-amber-600">{nearExpiryCount} Near Expiry</span>
            </div>
          )}
          <Button onClick={() => setShowPurchaseForm(true)} className="rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 font-black">
            <Plus className="w-4 h-4 mr-2" /> Receive Stock
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-100 w-fit">
        {[
          { id: 'stock', label: 'Stock Status', icon: Package },
          { id: 'expiry', label: 'Expiry Watch', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeView === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Stock Status View ─── */}
      {activeView === 'stock' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="Search medicines..."
              className="pl-11 rounded-2xl border-slate-200 bg-white shadow-sm w-80"
            />
          </div>

          <div className="grid gap-4">
            {filteredStock.map((med) => (
              <Card
                key={med.id}
                className={`border-none shadow-sm hover:shadow-md transition-all rounded-[28px] overflow-hidden bg-white ${
                  med.isLowStock ? 'ring-2 ring-red-200' : ''
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    <div className={`w-2 ${med.isLowStock ? 'bg-red-500 animate-pulse' : med.hasNearExpiry ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div className="flex-1 px-6 py-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryColors[med.category] || 'bg-slate-100 text-slate-600'}`}>
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800">{med.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${categoryColors[med.category] || 'bg-slate-100 text-slate-600'}`}>
                                {med.category}
                              </span>
                              {med.composition && (
                                <span className="text-[10px] text-slate-400 font-medium italic">{med.composition}</span>
                              )}
                              {med.hsnCode && (
                                <span className="text-[10px] font-bold text-slate-400">HSN: {med.hsnCode}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Stock</p>
                            <p className={`text-2xl font-black ${med.isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                              {med.totalQty}
                              {med.isLowStock && <AlertTriangle className="inline w-4 h-4 ml-1 mb-1" />}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Level</p>
                            <p className="text-xl font-black text-slate-400">{med.minThreshold}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Batches</p>
                            <p className="text-xl font-black text-slate-600">{med.batches.length}</p>
                          </div>
                        </div>
                      </div>

                      {med.isLowStock && (
                        <div className="mt-3 px-4 py-2 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
                          <p className="text-xs font-bold text-red-600">
                            Low Stock Alert — Current level ({med.totalQty}) is at or below minimum threshold ({med.minThreshold}). Reorder required.
                          </p>
                        </div>
                      )}
                      {med.hasNearExpiry && !med.isLowStock && (
                        <div className="mt-3 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          <p className="text-xs font-bold text-amber-600">
                            Near Expiry — One or more batches expiring within 30 days.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredStock.length === 0 && (
              <div className="bg-white rounded-[32px] p-16 text-center border-2 border-dashed border-slate-100">
                <Beaker className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-bold">No medicines found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Expiry Watch View ─── */}
      {activeView === 'expiry' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter shrink-0">Show batches expiring within:</Label>
            <div className="flex gap-2">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setExpiryDays(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                    expiryDays === d ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {expiryData.map((batch) => {
              const daysLeft = differenceInDays(new Date(batch.expiryDate), new Date());
              const urgency = daysLeft <= 30 ? 'critical' : daysLeft <= 60 ? 'warning' : 'info';
              return (
                <Card key={batch.id} className={`border-none shadow-sm rounded-[28px] overflow-hidden bg-white ${urgency === 'critical' ? 'ring-2 ring-red-200' : ''}`}>
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className={`w-2 ${urgency === 'critical' ? 'bg-red-500 animate-pulse' : urgency === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${urgency === 'critical' ? 'bg-red-100' : urgency === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            <Calendar className={`w-6 h-6 ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800">{batch.medicine.name}</h3>
                            <p className="text-xs font-bold text-slate-400">Batch #{batch.batchNumber}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 text-right">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</p>
                            <p className="font-black text-slate-800">{format(new Date(batch.expiryDate), 'MMM dd, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Days Left</p>
                            <p className={`text-2xl font-black ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
                              {daysLeft}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</p>
                            <p className="text-2xl font-black text-slate-700">{batch.quantity}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MRP</p>
                            <p className="font-black text-slate-700">₹{Number(batch.mrp).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {expiryData.length === 0 && (
              <div className="bg-white rounded-[32px] p-16 text-center border-2 border-dashed border-slate-100">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800">All Clear</h3>
                <p className="text-slate-400 font-medium">No batches expiring within {expiryDays} days.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Form Modal */}
      {showPurchaseForm && (
        <PurchaseForm
          medicines={medicines}
          onClose={() => setShowPurchaseForm(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default PharmacyPortal;
