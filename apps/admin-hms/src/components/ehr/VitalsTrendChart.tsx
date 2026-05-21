import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { type VitalsResponse } from '@mediportal/shared-types';
import { format } from 'date-fns';

interface VitalsTrendChartProps {
  vitals: VitalsResponse[];
}

const VitalsTrendChart: React.FC<VitalsTrendChartProps> = ({ vitals }) => {
  // Prepare data (reverse because history comes desc)
  const data = [...vitals].reverse().map(v => ({
    date: format(new Date(v.recordedAt), 'MMM dd'),
    weight: v.weight,
    pulse: v.pulseRate,
    sys: v.bloodPressure ? parseInt(v.bloodPressure.split('/')[0]) : undefined,
    dia: v.bloodPressure ? parseInt(v.bloodPressure.split('/')[1]) : undefined,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8' }}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
            }}
          />
          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
          <Line 
            type="monotone" 
            dataKey="weight" 
            name="Weight (kg)" 
            stroke="#0D9488" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#0D9488' }} 
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="sys" 
            name="Systolic BP" 
            stroke="#F59E0B" 
            strokeWidth={2} 
            dot={{ r: 3 }} 
          />
          <Line 
            type="monotone" 
            dataKey="pulse" 
            name="Pulse Rate" 
            stroke="#EF4444" 
            strokeWidth={2} 
            dot={{ r: 3 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalsTrendChart;
