import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Flame, AlertCircle } from 'lucide-react';
import { HistoricalTrendPoint } from '../types';

interface TrendChartProps {
  data: HistoricalTrendPoint[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  return (
    <div className="trend-chart-card">
      <div className="panel-header">
        <div className="panel-header-title">
          <Flame className="panel-header-icon" />
          <div>
            <h3>Historical Fire Occurrences vs Average Temperature</h3>
            <span className="panel-subtitle">Monthly longitudinal aggregation for region assessment</span>
          </div>
        </div>

        <span className="demo-badge-pill">
          <AlertCircle className="pill-icon" /> DEMO HISTORICAL TREND
        </span>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
            <YAxis yAxisId="left" stroke="#d9534f" fontSize={12} label={{ value: 'Fire Incidents', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#e67e22" fontSize={12} domain={[20, 40]} label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', offset: 10, fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f291e', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
              formatter={(value: any, name: any) => [
                value, 
                name === 'recordedFires' ? 'Fire Incidents (Demo)' : 'Avg Temp °C (Demo)'
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar yAxisId="left" dataKey="recordedFires" name="Fire Incidents (Demo)" fill="#d9534f" radius={[4, 4, 0, 0]} barSize={24} />
            <Line yAxisId="right" type="monotone" dataKey="avgTemperature" name="Avg Temperature °C (Demo)" stroke="#e67e22" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer-note">
        <em>Note: Historical fire statistics shown above are synthetic mock values for interface testing. Real historical FIRMS / MODIS records will be loaded in Stage 3.</em>
      </div>
    </div>
  );
};
