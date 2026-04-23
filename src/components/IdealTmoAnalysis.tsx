import React, { useMemo, useState } from 'react';
import { DashboardData, AnalysisSettings } from '../types';
import { calculateIdealTmo, generateExecutiveSummary, TmoRangeStats, formatSeconds } from '../lib/analysis';
import { cn } from '../lib/utils';
import { CheckCircle2, AlertCircle, XCircle, TrendingUp, Target, BarChart3, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IdealTmoAnalysisProps {
  data: DashboardData[];
}

export function IdealTmoAnalysis({ data }: IdealTmoAnalysisProps) {
  const [selectedCola, setSelectedCola] = useState<string | 'ALL'>('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AnalysisSettings>({
    weightNps: 0.3,
    weightTmo: 0.3,
    weightVol: 0.3
  });
  
  const stats = useMemo(() => calculateIdealTmo(data, settings), [data, settings]);
  const summary = useMemo(() => generateExecutiveSummary(stats), [stats]);

  const filteredSummary = selectedCola === 'ALL' 
    ? summary 
    : summary.filter(s => s.cola === selectedCola);

  const colas = Array.from(new Set(summary.map(s => s.cola))).sort();

  const handleWeightChange = (key: keyof AnalysisSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Estudo de TMO Ideal</h2>
          <p className="text-sm text-slate-500">Análise de equilíbrio entre NPS, TMO e Volume (Jerusalém 2.0)</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              showSettings 
                ? 'bg-indigo-600 border-indigo-600 text-white' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
            }`}
          >
            <Settings2 size={16} />
            Pesos do Score
          </button>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">COLA:</label>
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
      </div>

      {/* Dynamic Weight Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Configuração de Pesos Dinâmicos</h3>
                <span className="text-[10px] text-slate-500 italic">Total: {((settings?.weightNps ?? 0) + (settings?.weightTmo ?? 0) + (settings?.weightVol ?? 0)).toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* NPS Weight */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300">Peso NPS</label>
                    <span className="text-xs font-mono text-indigo-400">{(settings?.weightNps ?? 0).toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={settings?.weightNps ?? 0} 
                    onChange={(e) => handleWeightChange('weightNps', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">Influência da satisfação do cliente no score final.</p>
                </div>

                {/* TMO Weight */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300">Peso TMO</label>
                    <span className="text-xs font-mono text-indigo-400">{(settings?.weightTmo ?? 0).toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={settings?.weightTmo ?? 0} 
                    onChange={(e) => handleWeightChange('weightTmo', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">Influência da velocidade de atendimento (Eficiência).</p>
                </div>

                {/* Vol Weight */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300">Peso Volume</label>
                    <span className="text-xs font-mono text-indigo-400">{(settings?.weightVol ?? 0).toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={settings?.weightVol ?? 0} 
                    onChange={(e) => handleWeightChange('weightVol', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">Influência da carga de trabalho/amostragem.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                        {item.faixaLabel}
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
                      {(item.npsOptimal ?? 0).toFixed(1).replace('.', ',')}%
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                      {(item.npsMeta ?? 0).toFixed(1).replace('.', ',')}%
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
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">Faixa</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">TMO Médio</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">Vol</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">Silêncio Médio</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">NPS Médio</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">Vol. Pesquisas</th>
                        <th className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase">Score Equilíbrio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {colaStats.map((s, idx) => (
                        <tr 
                          key={idx} 
                          className={cn(
                            "group transition-all border-l-4",
                            s.isOptimal 
                              ? "bg-indigo-50/50 border-indigo-500 font-bold" 
                              : "hover:bg-slate-50 border-transparent"
                          )}
                        >
                          <td className="px-3 py-2 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              {s.faixaLabel}
                              {s.isOptimal && (
                                <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">
                                  Ideal
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {formatSeconds(s.avgTmo)}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {s.volume.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {s.avgSilence.toFixed(1)}s
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {s.avgNps !== null ? `${s.avgNps.toFixed(1).replace('.', ',')}%` : '—'}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">{s.surveys}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${s.balanceScore}%` }}
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    s.isOptimal ? "bg-indigo-600" : "bg-slate-300 group-hover:bg-slate-400"
                                  )}
                                />
                              </div>
                              <span className={cn(
                                "text-[10px] font-mono w-8 text-right",
                                s.isOptimal ? "text-indigo-600 font-black" : "text-slate-500"
                              )}>
                                {s.balanceScore.toFixed(1)}
                              </span>
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
              const tmoRatio = item.metaTmo > 0 ? item.avgTmoOptimal / item.metaTmo : 1;
              const npsRatio = item.npsMeta > 0 ? item.npsOptimal / item.npsMeta : 1;
              
              return (
                <div key={item.cola} className="p-4 rounded-lg border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all space-y-3">
                  <div className="font-bold text-sm text-slate-800 truncate border-b pb-2">{item.cola}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">TMO Ótimo / Meta:</span>
                      <span className={cn(
                        "font-mono font-bold",
                        tmoRatio <= 1 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {tmoRatio.toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">NPS Ótimo / Meta:</span>
                      <span className={cn(
                        "font-mono font-bold",
                        npsRatio >= 1 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {npsRatio.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                  {/* Visual Quadrant indicator */}
                  <div className="h-10 w-full bg-slate-50 rounded border border-slate-100 relative overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-10">
                      <div className="bg-amber-400 border-r border-b border-white"></div>
                      <div className="bg-emerald-400 border-b border-white"></div>
                      <div className="bg-rose-400 border-r border-white"></div>
                      <div className="bg-amber-400"></div>
                    </div>
                    <motion.div 
                      className="absolute w-2 h-2 bg-indigo-600 rounded-full border border-white shadow-md -translate-x-1/2 -translate-y-1/2"
                      initial={false}
                      animate={{ 
                        left: `${Math.min(90, Math.max(10, (1/tmoRatio) * 50))}%`, 
                        top: `${Math.min(90, Math.max(10, (1 - npsRatio + 0.5) * 50))}%` 
                      }}
                    />
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
