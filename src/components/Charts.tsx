import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  Legend,
  ComposedChart,
  LabelList
} from 'recharts';
import { DashboardData } from '../types';

interface ChartProps {
  data: DashboardData[];
}

export function VolumeHistogram({ data }: ChartProps) {
  const { chartData, r2, pearson } = useMemo(() => {
    // Group by USER_FAIXA_ORDEM (ranges)
    const groups: Record<number, { 
      range: number, 
      agents: Set<string>, 
      totalTmo: number, 
      totalSilence: number,
      totalNps: number,
      npsCount: number,
      count: number 
    }> = {};
    
    // For Correlation calculation
    let n = 0;
    let sumX = 0; // TMO
    let sumY = 0; // NPS
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    data.forEach(item => {
      const range = Math.floor(item.USER_FAIXA_ORDEM / 200) * 200;
      if (!groups[range]) {
        groups[range] = { range, agents: new Set(), totalTmo: 0, totalSilence: 0, totalNps: 0, npsCount: 0, count: 0 };
      }
      groups[range].agents.add(item.USER_LDAP);
      groups[range].totalTmo += item.TMO_SEC;
      groups[range].totalSilence += item.MEDIA_SILENCIO_CHAT_AGENTE_HH * 3600; // Convert to seconds
      groups[range].count += 1;

      if (item.NPS_REP !== null) {
        // Convert -1..1 to -100..100 for consistent display
        const npsVal = item.NPS_REP * 100;
        groups[range].totalNps += npsVal;
        groups[range].npsCount += 1;
        
        const x = item.TMO_SEC;
        const y = npsVal;
        n++;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
      }
    });

    const numerator = (n * sumXY - sumX * sumY);
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    const pearsonValue = n > 1 && denominator !== 0 ? numerator / denominator : 0;
    const r2Value = Math.pow(pearsonValue, 2);

    const formattedData = Object.values(groups).map(g => ({
      range: g.range,
      agentCount: g.agents.size,
      avgTmo: g.totalTmo / g.count,
      avgSilence: g.totalSilence / g.count,
      avgNps: g.npsCount > 0 ? g.totalNps / g.npsCount : null
    })).sort((a, b) => a.range - b.range);

    return { chartData: formattedData, r2: r2Value, pearson: pearsonValue };
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end gap-2 mb-2">
        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600" title="Pearson Correlation between TMO and NPS">
          Pearson (TMO/NPS): {(pearson * 100).toFixed(2)}%
        </span>
        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600" title="Coefficient of Determination (R²) between TMO and NPS">
          R² (TMO/NPS): {(r2 * 100).toFixed(2)}%
        </span>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="range" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(val) => `${val}-${val + 199}`}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }} 
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }} 
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number, name: string) => [
                value.toFixed(name.includes('Count') ? 0 : 2) + (name.includes('Count') ? '' : 's'), 
                name
              ]}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }}
            />
            <Bar 
              yAxisId="left"
              name="Agent Count"
              dataKey="agentCount" 
              fill="#4f46e5" 
              radius={[4, 4, 0, 0]} 
              barSize={40} 
            />
            <Line 
              yAxisId="right"
              name="Avg TMO"
              type="monotone" 
              dataKey="avgTmo" 
              stroke="#f43f5e" 
              strokeWidth={2}
              dot={{ r: 3, fill: '#f43f5e', strokeWidth: 1, stroke: '#fff' }}
            >
              <LabelList 
                dataKey="avgNps" 
                position="top" 
                formatter={(val: number) => val !== null ? `${val.toFixed(1)}%` : ''}
                style={{ fontSize: '10px', fill: '#f43f5e', fontWeight: 'bold' }}
              />
            </Line>
            <Line 
              yAxisId="right"
              name="Avg Silence"
              type="monotone" 
              dataKey="avgSilence" 
              stroke="#0ea5e9" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 1, stroke: '#fff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SilenceChart({ data }: ChartProps) {
  const chartData = useMemo(() => {
    // Average silence by Queue (COLA)
    const groups: Record<string, { name: string, silence: number, count: number }> = {};
    
    data.forEach(item => {
      if (!groups[item.COLA]) {
        groups[item.COLA] = { name: item.COLA, silence: 0, count: 0 };
      }
      groups[item.COLA].silence += item.MEDIA_SILENCIO_CHAT_AGENTE_HH;
      groups[item.COLA].count += 1;
    });

    return Object.values(groups).map(g => ({
      name: g.name,
      avgSilence: (g.silence / g.count) * 3600 // Convert to seconds for better visualization
    })).sort((a, b) => b.avgSilence - a.avgSilence);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
        <YAxis 
          dataKey="name" 
          type="category" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#64748b' }}
          width={80}
        />
        <Tooltip 
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            fontSize: '12px'
          }}
          formatter={(val: number) => [`${val.toFixed(2)}s`, 'Avg Silence']}
        />
        <Bar dataKey="avgSilence" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
