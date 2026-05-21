import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@mediportal/ui-core';
import { 
  Users, Calendar, AlertCircle, 
  ArrowUpRight, ArrowDownRight, Activity, DollarSign, Loader2,
  ShieldCheck, Zap, HeartPulse, Microscope, Bot, TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar,
} from 'recharts';
import api from '../api/axios';
import { useLocale } from '../components/LocaleProvider';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const PillarCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtitle: string;
  icon: any;
  color: string;
  trend?: string;
}> = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <Card className="border-none shadow-sm rounded-[32px] overflow-hidden group hover:shadow-xl transition-all duration-500 bg-white border border-slate-100">
    <CardContent className="p-8">
      <div className="flex items-start justify-between">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 transition-transform group-hover:scale-110 duration-500`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div className="mt-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{value}</h3>
        <p className="text-xs font-bold text-slate-500 mt-1">{subtitle}</p>
      </div>
    </CardContent>
  </Card>
);

const ExecutiveDashboard: React.FC = () => {
  const { formatCurrency, formatDate } = useLocale();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [cmdRes, actRes] = await Promise.all([
          api.get('/reports/command-center'),
          api.get('/reports/activity')
        ]);
        
        setData(cmdRes.data);
        setRecentActivity(actRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const pillars = [
    { 
      title: 'Clinical Intelligence', 
      value: `${data.clinical.totalTriaged}`, 
      subtitle: `${data.clinical.triage.RED} Emergency Cases Identified`,
      icon: HeartPulse, 
      color: 'bg-red-600',
      trend: 'AI Active'
    },
    { 
      title: 'Operational Pulse', 
      value: `${data.operational.occupancyRate.toFixed(1)}%`, 
      subtitle: `${data.operational.occupiedBeds} of ${data.operational.totalBeds} Beds Occupied`,
      icon: Activity, 
      color: 'bg-amber-600',
      trend: 'Forecast Stable'
    },
    { 
      title: 'Genomic Shields', 
      value: data.genomic.totalShields, 
      subtitle: 'Active Pharmacogenomic Profiles',
      icon: Microscope, 
      color: 'bg-indigo-600',
      trend: 'Vault Secured'
    },
    { 
      title: 'Financial RPA', 
      value: `${data.financial.settlementRate.toFixed(1)}%`, 
      subtitle: `${formatCurrency(data.financial.savedRevenue)} Operational Savings`,
      icon: Bot, 
      color: 'bg-emerald-600',
      trend: 'RPA Optimized'
    },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
              v2.0.0 Global Launch Edition
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> System Healthy
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Command Center</h1>
          <p className="text-slate-500 font-bold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Unified Real-time Health Intelligence & Automation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 px-6 font-bold text-slate-600">Enterprise Export</Button>
          <Button className="rounded-2xl bg-primary text-white px-8 font-black shadow-lg shadow-primary/20 hover:bg-primary/90">Global Health Pulse</Button>
        </div>
      </div>

      {/* 4 Pillars of Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pillars.map((pillar, idx) => (
          <PillarCard key={idx} {...pillar} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Operational Forecast Chart */}
        <Card className="col-span-8 border-none shadow-sm rounded-[40px] bg-white overflow-hidden border border-slate-100">
          <CardContent className="p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">7-Day Bed Occupancy Forecast</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Prediction Engine</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-slate-600">Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary/20" />
                  <span className="text-slate-400">AI Forecast</span>
                </div>
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.operational.forecast}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#004de6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#004de6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    itemStyle={{ fontWeight: 900, fontSize: '14px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#004de6" 
                    strokeDasharray="5 5"
                    strokeWidth={2} 
                    fill="transparent"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#004de6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Triage Distribution */}
        <Card className="col-span-4 border-none shadow-sm rounded-[40px] bg-white overflow-hidden border border-slate-100">
          <CardContent className="p-10">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">AI Triage Distribution</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Clinical Severity Split</p>
            
            <div className="h-[300px] w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Red', value: data.clinical.triage.RED, fill: '#ef4444' },
                  { name: 'Yellow', value: data.clinical.triage.YELLOW, fill: '#f59e0b' },
                  { name: 'Green', value: data.clinical.triage.GREEN, fill: '#10b981' },
                ]}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4 mt-6">
              {[
                { label: 'Emergency (Red)', value: data.clinical.triage.RED, color: 'bg-red-500' },
                { label: 'Urgent (Yellow)', value: data.clinical.triage.YELLOW, color: 'bg-amber-500' },
                { label: 'Routine (Green)', value: data.clinical.triage.GREEN, color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-bold text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{item.value} Cases</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Recent Activity Stream */}
        <Card className="col-span-12 border-none shadow-sm rounded-[40px] bg-white overflow-hidden border border-slate-100">
          <CardContent className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Global System Activity</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Enterprise event stream</p>
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs px-6">View Audit Center</Button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-6 p-5 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">
                      Transaction: <span className="text-primary">{formatCurrency(Number(activity.amount))}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                      Patient: {activity.invoice?.patient?.user?.name} • Channel: {activity.paymentMethod} • Status: COMPLETED
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{formatDate(activity.createdAt, 'hh:mm a')}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(activity.createdAt, 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-bold italic">No recent activity detected.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
