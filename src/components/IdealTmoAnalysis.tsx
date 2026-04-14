import React, { useMemo, useState } from 'react';
import { DashboardData } from '../types';
import { calculateIdealTmo, generateExecutiveSummary, TmoRangeStats } from '../lib/analysis';
import { CheckCircle2, AlertCircle, XCircle, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface IdealTmoAnalysisProps {
  data: DashboardData[];
}

export function IdealTmoAnalysis({ data }: IdealTmoAnalysisProps) {
  const [selectedCola, setSelectedCola] = useState<string | 'ALL'>('ALL');
  
  const stats = useMemo(() => calculateIdealTmo(data), [data]);
  const summary = useMemo(() => generateExecutiveSummary(stats), [stats]);

  const filteredSummary = selectedCola === 'ALL' 
    ? summary 
    : summary.filter(s => s.cola === selectedCola);

  const colas = Array.from(new Set(summary.map(s => s.cola))).sort();

  return (
    <div className="space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Estudo de TMO Ideal</h2>
          <p className="text-sm text-slate-500">Análise de equilíbrio entre NPS e eficiência operacional por COLA</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrar COLA:</label>
          <select 
            value={selectedCola}
            onChange={(e) => setSelectedCola(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50"
          >
            <option value="ALL">Todas as COLAs</option>
            {colas.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-800">Resumo Executivo</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">COLA</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Faixa Ótima</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status vs Meta</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">NPS Ótimo</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">NPS Meta</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recomendação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummary.map((item) => (
                  <tr key={item.cola} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.cola}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-mono font-bold">
                        {item.optimalRange[0]}-{item.optimalRange[1]}s
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.status === 'DENTRO' && <CheckCircle2 size={16} className="text-emerald-500" />}
                        {item.status === 'PROXIMO' && <AlertCircle size={16} className="text-amber-500" />}
                        {item.status === 'ACIMA' && <XCircle size={16} className="text-rose-500" />}
                        <span className={`text-xs font-bold ${
                          item.status === 'DENTRO' ? 'text-emerald-700' : 
                          item.status === 'PROXIMO' ? 'text-amber-700' : 'text-rose-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-bold text-slate-700">
                      {item.npsOptimal.toFixed(1).replace('.', ',')}%
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                      {item.npsMeta.toFixed(1).replace('.', ',')}%
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 italic max-w-xs">
                      {item.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed View per COLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {colas.filter(c => selectedCola === 'ALL' || c === selectedCola).map(cola => {
          const colaStats = stats.filter(s => s.cola === cola).sort((a, b) => a.rangeStart - b.rangeStart);
          return (
            <div key={cola} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-600" />
                  <h3 className="font-bold text-slate-800">{cola} - Detalhe por Faixa</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">Faixa (s)</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">NPS Médio</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">Vol. Pesquisas</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">Score Equilíbrio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {colaStats.map((s, idx) => (
                        <tr key={idx} className={`${s.isOptimal ? 'bg-amber-50/50' : ''} hover:bg-slate-50 transition-colors`}>
                          <td className="px-3 py-2 text-xs font-mono">
                            {s.rangeStart}-{s.rangeEnd}
                            {s.isOptimal && <span className="ml-2 text-[8px] bg-amber-200 text-amber-800 px-1 rounded font-bold">ÓTIMO</span>}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {s.avgNps !== null ? `${(s.avgNps * 100).toFixed(1).replace('.', ',')}%` : '—'}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">{s.surveys}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${s.balanceScore}%` }}
                                  className={`h-full ${s.isOptimal ? 'bg-amber-500' : 'bg-indigo-400'}`}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 w-8">{s.balanceScore.toFixed(1)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Target size={18} className="text-indigo-600" />
          <h3 className="font-bold text-slate-800">Matriz NPS × TMO (Razão Ótimo/Meta)</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {summary.map(item => {
              const tmoRatio = item.optimalRange[0] / stats.find(s => s.cola === item.cola)?.metaTmo!;
              const npsRatio = item.npsOptimal / (item.npsMeta || 1);
              
              return (
                <div key={item.cola} className="p-4 rounded-lg border border-slate-100 bg-slate-50 space-y-3">
                  <div className="font-bold text-sm text-slate-800 truncate">{item.cola}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">TMO Ótimo / Meta:</span>
                      <span className={`font-bold ${tmoRatio <= 1 ? 'text-emerald-600' : tmoRatio <= 1.1 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {tmoRatio.toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">NPS Ótimo / Meta:</span>
                      <span className={`font-bold ${npsRatio >= 1 ? 'text-emerald-600' : npsRatio >= 0.8 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {npsRatio.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
