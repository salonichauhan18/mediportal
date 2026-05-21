import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, Button, Input, Label } from '@mediportal/ui-core';
import {
  Receipt, Search, Plus, X, CreditCard, Banknote, Smartphone,
  ShieldCheck, Loader2, Download, User,
  Trash2, AlertCircle, CheckCircle2
} from 'lucide-react';
import api from '../api/axios';
import { format } from 'date-fns';

// ─── Payment Modal ───
const PaymentModal: React.FC<{
  invoice: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ invoice, onClose, onSuccess }) => {
  const [method, setMethod] = useState<string>('CASH');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paidSoFar = (invoice.transactions || []).reduce(
    (acc: number, t: any) => acc + Number(t.amount), 0
  );
  const outstanding = (Number(invoice.grandTotal) - paidSoFar).toFixed(2);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/billing/invoices/${invoice.id}/pay`, {
        amount: parseFloat(amount),
        paymentMethod: method,
        referenceNumber: reference || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { id: 'CASH', label: 'Cash', icon: Banknote, color: 'text-green-600 bg-green-50' },
    { id: 'CARD', label: 'Card', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
    { id: 'UPI', label: 'UPI', icon: Smartphone, color: 'text-purple-600 bg-purple-50' },
    { id: 'INSURANCE', label: 'Insurance', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-lg shadow-2xl border-none rounded-[32px] overflow-hidden">
        <div className="bg-emerald-600 px-8 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><CreditCard className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Process Payment</h2>
              <p className="text-xs font-medium text-white/70">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
              <p className="text-xl font-black text-slate-800">₹{Number(invoice.grandTotal).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</p>
              <p className="text-xl font-black text-emerald-600">₹{paidSoFar.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due</p>
              <p className="text-xl font-black text-red-600">₹{outstanding}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Payment Method</Label>
            <div className="grid grid-cols-4 gap-3">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    method === m.id ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                    <m.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Amount (₹)</Label>
              <Input
                type="number" step="0.01"
                value={amount}
                onChange={(e: any) => setAmount(e.target.value)}
                placeholder={outstanding}
                className="rounded-xl border-slate-200 text-lg font-black"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Reference #</Label>
              <Input
                value={reference}
                onChange={(e: any) => setReference(e.target.value)}
                placeholder="Transaction ID"
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl px-6">Cancel</Button>
            <Button
              onClick={handlePay}
              disabled={loading || !amount}
              className="rounded-2xl px-10 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" />Confirm Payment</>}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── Main Billing Portal ───
const BillingPortal: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'pending' | 'create'>('pending');
  const [payingInvoice, setPayingInvoice] = useState<any | null>(null);

  // ─── Create Invoice State ───
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [lineItems, setLineItems] = useState<Array<{ serviceName: string; quantity: number; unitPrice: number; taxPercentage: number }>>([]);
  const [discount, setDiscount] = useState(0);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, svcRes] = await Promise.all([
        api.get('/billing/pending'),
        api.get('/billing/services'),
      ]);
      setInvoices(invRes.data);
      setServices(svcRes.data);
    } catch (err) {
      console.error('Failed to fetch billing data', err);
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async (query: string) => {
    setPatientSearch(query);
    if (query.length < 2) { setPatientResults([]); return; }
    try {
      const res = await api.get(`/patients?search=${query}`);
      setPatientResults(res.data || []);
    } catch { setPatientResults([]); }
  };

  const addServiceLine = (svc: any) => {
    setLineItems((prev) => [
      ...prev,
      { serviceName: svc.name, quantity: 1, unitPrice: Number(svc.basePrice), taxPercentage: Number(svc.taxPercentage) },
    ]);
  };

  const removeLineItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLineItem = (idx: number, field: string, value: any) => {
    setLineItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  // Compute totals client-side for preview
  const totals = useMemo(() => {
    let sub = 0, tax = 0;
    lineItems.forEach((item) => {
      const lineSub = item.unitPrice * item.quantity;
      const lineTax = (lineSub * item.taxPercentage) / 100;
      sub += lineSub;
      tax += lineTax;
    });
    return { sub, tax, grand: sub + tax - discount };
  }, [lineItems, discount]);

  const handleCreateInvoice = async () => {
    if (!selectedPatient || lineItems.length === 0) return;
    setCreating(true);
    try {
      await api.post('/billing/invoices', {
        patientId: selectedPatient.id,
        branchId: selectedPatient.branchId,
        items: lineItems,
        discount,
      });
      setActiveView('pending');
      setLineItems([]);
      setSelectedPatient(null);
      setDiscount(0);
      fetchData();
    } catch (err) {
      console.error('Failed to create invoice', err);
    } finally {
      setCreating(false);
    }
  };

  const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const res = await api.get(`/billing/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF download failed', err);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing & Accounts</h1>
              <p className="text-slate-500 font-bold text-sm">Revenue Cycle Management • {invoices.length} Pending</p>
            </div>
          </div>
        </div>

        <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-100 self-start w-fit">
          {[
            { id: 'pending', label: 'Pending Bills' },
            { id: 'create', label: 'New Invoice' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeView === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Pending Bills View ─── */}
      {activeView === 'pending' && (
        <div className="space-y-4">
          {invoices.length > 0 ? invoices.map((inv) => {
            const paidSoFar = (inv.transactions || []).reduce((a: number, t: any) => a + Number(t.amount), 0);
            const due = Number(inv.grandTotal) - paidSoFar;
            return (
              <Card key={inv.id} className="border-none shadow-sm hover:shadow-xl transition-all rounded-[32px] overflow-hidden bg-white group">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className={`w-2 ${inv.status === 'UNPAID' ? 'bg-red-500' : inv.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div className="flex-1 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 leading-tight">{inv.patient?.user?.name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">#{inv.invoiceNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                            inv.status === 'UNPAID' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>{inv.status}</span>
                          <span className="text-xs font-bold text-slate-400">{format(new Date(inv.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between">
                        <div className="flex gap-8">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                            <p className="text-xl font-black text-slate-800">₹{Number(inv.grandTotal).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paid</p>
                            <p className="text-xl font-black text-emerald-600">₹{paidSoFar.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due</p>
                            <p className="text-xl font-black text-red-600">₹{due.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => downloadPdf(inv.id, inv.invoiceNumber)}
                            className="rounded-xl h-10 px-4 border-slate-200 text-slate-600"
                          >
                            <Download className="w-4 h-4 mr-1" /> PDF
                          </Button>
                          <Button
                            onClick={() => setPayingInvoice(inv)}
                            className="rounded-xl h-10 px-6 bg-emerald-600 text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 font-black text-xs uppercase"
                          >
                            <CreditCard className="w-4 h-4 mr-1" /> Pay
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center mb-4">
                <Receipt className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">All Clear!</h3>
              <p className="text-slate-400 font-medium">No pending invoices.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Create Invoice View (POS) ─── */}
      {activeView === 'create' && (
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Line Items */}
          <div className="col-span-8 space-y-6">
            {/* Patient Selector */}
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Patient</Label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><User className="w-5 h-5 text-emerald-600" /></div>
                      <div>
                        <p className="font-black text-slate-800">{selectedPatient.user?.name}</p>
                        <p className="text-xs font-bold text-slate-400">UHID: {selectedPatient.uhid}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="p-1 hover:bg-emerald-200 rounded-lg transition-colors"><X className="w-4 h-4 text-emerald-700" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={patientSearch}
                      onChange={(e: any) => searchPatients(e.target.value)}
                      placeholder="Search by name or UHID..."
                      className="pl-11 rounded-xl border-slate-200"
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full bg-white shadow-xl rounded-2xl border border-slate-100 max-h-48 overflow-y-auto">
                        {patientResults.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPatient(p); setPatientResults([]); setPatientSearch(''); }}
                            className="w-full p-4 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-sm text-slate-700">{p.user?.name}</span>
                            <span className="ml-auto text-[10px] font-bold text-slate-400">UHID: {p.uhid}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Catalog Quick-Add */}
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Service Catalog — Quick Add</Label>
                <div className="flex flex-wrap gap-2">
                  {services.map((svc: any) => (
                    <button
                      key={svc.id}
                      onClick={() => addServiceLine(svc)}
                      className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 text-sm font-bold text-slate-700 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      {svc.name}
                      <span className="text-[10px] text-slate-400">₹{Number(svc.basePrice).toFixed(0)} • {Number(svc.taxPercentage)}%</span>
                    </button>
                  ))}
                  {services.length === 0 && <p className="text-xs text-slate-400 italic">No services configured for this branch yet.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Line Items Table */}
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Invoice Line Items</Label>
                {lineItems.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="col-span-4">Service</div>
                      <div className="col-span-2">Qty</div>
                      <div className="col-span-2">Price (₹)</div>
                      <div className="col-span-2">Tax %</div>
                      <div className="col-span-1">Total</div>
                      <div className="col-span-1"></div>
                    </div>
                    {lineItems.map((item, idx) => {
                      const lineSub = item.unitPrice * item.quantity;
                      const lineTax = (lineSub * item.taxPercentage) / 100;
                      return (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="col-span-4">
                            <Input value={item.serviceName} onChange={(e: any) => updateLineItem(idx, 'serviceName', e.target.value)} className="rounded-lg border-slate-200 text-sm font-bold" />
                          </div>
                          <div className="col-span-2">
                            <Input type="number" min={1} value={item.quantity} onChange={(e: any) => updateLineItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="rounded-lg border-slate-200 text-sm font-bold" />
                          </div>
                          <div className="col-span-2">
                            <Input type="number" step="0.01" value={item.unitPrice} onChange={(e: any) => updateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="rounded-lg border-slate-200 text-sm font-bold" />
                          </div>
                          <div className="col-span-2">
                            <Input type="number" step="0.01" value={item.taxPercentage} onChange={(e: any) => updateLineItem(idx, 'taxPercentage', parseFloat(e.target.value) || 0)} className="rounded-lg border-slate-200 text-sm font-bold" />
                          </div>
                          <div className="col-span-1">
                            <p className="text-sm font-black text-slate-700">₹{(lineSub + lineTax).toFixed(2)}</p>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button onClick={() => removeLineItem(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-10 border-2 border-dashed border-slate-200 text-center">
                    <p className="text-sm text-slate-400 font-bold">Add services from the catalog above, or manually add a line item.</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setLineItems((prev) => [...prev, { serviceName: '', quantity: 1, unitPrice: 0, taxPercentage: 0 }])}
                  className="rounded-xl border-dashed border-slate-300 text-slate-500 w-full hover:border-emerald-400 hover:text-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Custom Line Item
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Total Summary + Actions */}
          <div className="col-span-4">
            <div className="sticky top-8 space-y-6">
              <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-white">
                <div className="bg-slate-900 p-8 text-white">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Invoice Summary</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="font-bold">₹{totals.sub.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Tax (GST)</span><span className="font-bold">₹{totals.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm text-red-400"><span>Discount</span><span className="font-bold">-₹{discount.toFixed(2)}</span></div>
                    <div className="border-t border-slate-700 pt-3 flex justify-between text-lg"><span className="text-emerald-400 font-black">Grand Total</span><span className="font-black text-white">₹{totals.grand.toFixed(2)}</span></div>
                  </div>
                </div>

                <CardContent className="p-8 space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Discount (₹)</Label>
                    <Input
                      type="number" step="0.01" min="0"
                      value={discount}
                      onChange={(e: any) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  <Button
                    onClick={handleCreateInvoice}
                    disabled={creating || !selectedPatient || lineItems.length === 0}
                    className="w-full rounded-2xl h-14 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 font-black text-sm uppercase tracking-wider"
                  >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Receipt className="w-5 h-5 mr-2" /> Generate Invoice</>}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default BillingPortal;
