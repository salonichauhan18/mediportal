import { useState, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Heart, Activity, Moon, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, Button } from '@mediportal/ui-core';
import api from '../../api/axios';

interface RpmDashboardProps {
  patientId: string;
}

export default function RpmDashboard({ patientId }: RpmDashboardProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, insightsRes] = await Promise.all([
        api.get(`/rpm/patient/${patientId}?days=7`),
        api.get(`/rpm/insights/${patientId}`)
      ]);
      setMetrics(metricsRes.data);
      setInsights(insightsRes.data);
    } catch (err) {
      console.error('Failed to fetch RPM data', err);
    } finally {
      setLoading(false);
    }
  };

  const hrData = metrics.filter(m => m.type === 'HEART_RATE').map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: m.value
  }));

  const stepsData = metrics.filter(m => m.type === 'STEPS').map(m => ({
    date: new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    value: m.value
  }));

  if (loading) return <div className="p-8 text-center">Analyzing wearable data...</div>;

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Heart className="text-red-500" />} 
          label="Avg. Heart Rate" 
          value="72 bpm" 
          trend="+2% vs last week"
          color="red"
        />
        <StatCard 
          icon={<Activity className="text-emerald-500" />} 
          label="Daily Steps" 
          value="6,432" 
          trend="-15% vs last week"
          color="emerald"
        />
        <StatCard 
          icon={<Moon className="text-indigo-500" />} 
          label="Sleep Quality" 
          value="7h 20m" 
          trend="Stable"
          color="indigo"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Heart Rate (24h)
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LIVE SYNC</span>
          </div>
          <CardContent className="p-8 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hrData}>
                <defs>
                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} domain={[40, 140]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Activity Trends (7d)
            </h3>
          </div>
          <CardContent className="p-8 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stepsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <Card className="rounded-[40px] border-2 border-indigo-100 bg-indigo-50/30 overflow-hidden">
        <CardContent className="p-10">
          <div className="flex items-start gap-6">
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h4 className="font-black text-indigo-900 text-xl tracking-tight">Gemini AI RPM Analysis</h4>
                <div className="bg-white px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-indigo-600 uppercase">Live Insight</span>
                </div>
              </div>
              <p className="text-indigo-800/80 font-bold leading-relaxed mb-6">
                {insights || "Analyzing data patterns for cardiovascular and activity anomalies..."}
              </p>
              <div className="flex gap-4">
                <Button className="bg-indigo-600 text-white rounded-2xl px-6 py-2.5 font-black text-xs hover:bg-indigo-700">
                  FLAG FOR REVIEW
                </Button>
                <Button variant="outline" className="bg-white border-indigo-200 text-indigo-600 rounded-2xl px-6 py-2.5 font-black text-xs hover:bg-indigo-50">
                  SCHEDULE FOLLOW-UP
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color }: any) {
  return (
    <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`bg-${color}-50 p-3 rounded-2xl`}>
            {icon}
          </div>
          <span className={`text-[10px] font-black text-${color === 'emerald' ? 'red' : 'slate'}-500 bg-${color === 'emerald' ? 'red' : 'slate'}-50 px-2 py-1 rounded-lg`}>
            {trend}
          </span>
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-2xl font-black text-slate-900">{value}</h4>
      </CardContent>
    </Card>
  );
}
