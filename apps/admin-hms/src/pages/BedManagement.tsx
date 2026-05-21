import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@mediportal/ui-core';
import { BedDouble, AlertTriangle, TrendingUp, RefreshCcw, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';

const BedManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [occupancyData, setOccupancyData] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  useEffect(() => {
    fetchOccupancy();

    const socket = io('http://localhost:3002'); // Assuming backend URL
    
    socket.on('connect', () => {
      // Register with a dummy staff ID and branch to receive updates
      socket.emit('register', { staffId: 'admin-dashboard', branchId: 'default-branch', role: 'ADMIN' });
    });

    socket.on('occupancyUpdate', (data) => {
      console.log('Real-time occupancy update received:', data);
      fetchOccupancy(); // Refresh the grid
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchOccupancy = async () => {
    setLoading(true);
    try {
      const response = await api.get('/beds/occupancy/default-branch'); // Assuming default branch logic
      setOccupancyData(response.data);
    } catch (err) {
      console.error('Failed to load occupancy', err);
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async () => {
    setIsForecasting(true);
    try {
      const response = await api.post('/ai/predict-occupancy', {
        branchId: 'default-branch'
      });
      
      // Parse the AI suggestion text into a chartable format (mocked visualization for dashboard)
      const mockForecastChart = [
        { day: 'Day 1', predicted: 12 },
        { day: 'Day 3', predicted: 18 },
        { day: 'Day 7', predicted: 25 },
        { day: 'Day 14', predicted: 40 },
      ];
      
      setForecast({
        text: response.data.suggestion,
        chart: mockForecastChart
      });
    } catch (err) {
      console.error('Failed to generate forecast', err);
    } finally {
      setIsForecasting(false);
    }
  };

  const autoSuggestBed = async () => {
    try {
      // Simulate an admission flow where triage severity is assessed.
      const mockTriageSeverities = ['RED', 'YELLOW', 'GREEN'];
      const randomSeverity = mockTriageSeverities[Math.floor(Math.random() * mockTriageSeverities.length)];
      
      await api.post('/beds/auto-suggest', {
        branchId: 'default-branch',
        patientId: 'dummy-patient-id', // In a real flow, this comes from a modal selection
        triageSeverity: randomSeverity
      });
      fetchOccupancy(); // Refresh
      alert('Bed successfully assigned via Smart Allocation.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign bed.');
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><RefreshCcw className="animate-spin text-indigo-600" /></div>;
  }

  const isCapacityCritical = occupancyData?.stats?.occupancyRate >= 85;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BedDouble className="text-indigo-600" /> Bed & Resource Management
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">AI-Driven Predictive Operations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={autoSuggestBed} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg">
            <CheckCircle className="w-4 h-4 mr-2" /> Auto-Suggest Bed
          </Button>
          <Button onClick={generateForecast} disabled={isForecasting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg">
            {isForecasting ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
            AI Forecast
          </Button>
        </div>
      </div>

      {isCapacityCritical && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
          <AlertTriangle className="text-red-500 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-black">Capacity Threshold Alert</h3>
            <p className="text-red-600 text-sm font-semibold">Current occupancy is at {occupancyData.stats.occupancyRate}%. Consider activating contingency protocols or postponing elective procedures.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 lg:col-span-2 border-none shadow-sm rounded-3xl">
          <CardContent className="p-8">
            <h2 className="text-xl font-black mb-6">Live Occupancy Map</h2>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {occupancyData?.beds?.map((bed: any) => (
                <div 
                  key={bed.id} 
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all ${
                    bed.status === 'OCCUPIED' ? 'bg-red-50 border border-red-200 text-red-700' :
                    bed.status === 'VACANT' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                    'bg-slate-50 border border-slate-200 text-slate-500'
                  }`}
                  title={`${bed.wardName} - Room ${bed.roomNumber}`}
                >
                  <BedDouble className="w-6 h-6 mb-1 opacity-80" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{bed.roomNumber}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-1 space-y-8">
          <Card className="border-none shadow-sm rounded-3xl bg-indigo-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-1">Current Occupancy</h3>
              <div className="text-5xl font-black tracking-tighter">{occupancyData?.stats?.occupancyRate}%</div>
              <div className="mt-4 flex justify-between text-sm font-bold text-indigo-100">
                <span>Total: {occupancyData?.stats?.total}</span>
                <span>Vacant: {occupancyData?.stats?.vacant}</span>
              </div>
            </CardContent>
          </Card>

          {forecast && (
            <Card className="border-none shadow-sm rounded-3xl">
              <CardContent className="p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">AI 14-Day Surge Forecast</h3>
                <div className="h-40 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast.chart}>
                      <defs>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <Tooltip />
                      <Area type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={3} fill="url(#colorForecast)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed">
                  <TrendingUp className="w-4 h-4 text-amber-500 inline mr-2" />
                  {forecast.text}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BedManagement;
