import { DashboardData } from '../types';

export interface TmoRangeStats {
  cola: string;
  rangeStart: number;
  rangeEnd: number;
  avgNps: number | null;
  avgTmo: number;
  avgSilence: number;
  metaTmo: number;
  metaNps: number | null;
  volume: number;
  surveys: number;
  balanceScore: number;
  isOptimal: boolean;
}

export interface ExecutiveSummaryItem {
  cola: string;
  optimalRange: [number, number];
  status: 'DENTRO' | 'PROXIMO' | 'ACIMA';
  npsOptimal: number;
  npsMeta: number;
  recommendation: string;
}

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

export function calculateIdealTmo(data: DashboardData[]) {
  const colas = Array.from(new Set(data.map(d => d.COLA)));
  const rangeSize = 200; // Standard range size

  const allStats: TmoRangeStats[] = [];

  colas.forEach(cola => {
    const colaData = data.filter(d => d.COLA === cola);
    const ranges: Record<number, { 
      tmoSum: number, 
      silenceSum: number,
      npsSum: number, 
      npsCount: number, 
      volSum: number, 
      surveysSum: number,
      metaTmo: number,
      metaNps: number | null
    }> = {};

    colaData.forEach(d => {
      const rangeStart = Math.floor(d.TMO_SEC / rangeSize) * rangeSize;
      if (!ranges[rangeStart]) {
        ranges[rangeStart] = { 
          tmoSum: 0, 
          silenceSum: 0,
          npsSum: 0, 
          npsCount: 0, 
          volSum: 0, 
          surveysSum: 0,
          metaTmo: d.META_TMO,
          metaNps: d.META_NPS_REP
        };
      }
      ranges[rangeStart].tmoSum += d.TMO_SEC;
      ranges[rangeStart].silenceSum += d.SILENCE_DURATION_HH;
      ranges[rangeStart].volSum += d.VOL;
      ranges[rangeStart].surveysSum += d.QTD_PESQUISAS_NPS;
      if (d.NPS_REP !== null) {
        ranges[rangeStart].npsSum += d.NPS_REP;
        ranges[rangeStart].npsCount += 1;
      }
    });

    const colaStats: TmoRangeStats[] = Object.entries(ranges).map(([start, r]) => {
      const count = colaData.filter(d => Math.floor(d.TMO_SEC / rangeSize) * rangeSize === Number(start)).length;
      return {
        cola,
        rangeStart: Number(start),
        rangeEnd: Number(start) + rangeSize,
        avgNps: r.npsCount > 0 ? r.npsSum / r.npsCount : null,
        avgTmo: r.tmoSum / count,
        avgSilence: r.silenceSum / count,
        metaTmo: r.metaTmo,
        metaNps: r.metaNps,
        volume: r.volSum,
        surveys: r.surveysSum,
        balanceScore: 0,
        isOptimal: false
      };
    });

    // Calculate Balance Score
    // Methodology: (60% NPS normalizado + 40% eficiência de TMO) × peso por volume de pesquisas
    const validRanges = colaStats.filter(r => r.avgNps !== null && r.surveys >= 5);
    
    if (validRanges.length > 0) {
      const minNps = Math.min(...validRanges.map(r => r.avgNps!));
      const maxNps = Math.max(...validRanges.map(r => r.avgNps!));
      const npsRange = maxNps - minNps || 1;

      validRanges.forEach(r => {
        const normNps = (r.avgNps! - minNps) / npsRange;
        const tmoEff = Math.max(0, (r.metaTmo * 1.2 - r.avgTmo) / (r.metaTmo * 1.2)); // Efficiency relative to meta + 20%
        const volWeight = r.surveys / Math.max(1, d3Sum(validRanges.map(vr => vr.surveys)));
        
        r.balanceScore = (0.6 * normNps + 0.4 * tmoEff) * volWeight * 100;
      });

      // Find optimal
      const optimal = validRanges.reduce((prev, current) => (prev.balanceScore > current.balanceScore) ? prev : current);
      optimal.isOptimal = true;
    }

    allStats.push(...colaStats);
  });

  return allStats;
}

function d3Sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

export function generateExecutiveSummary(stats: TmoRangeStats[]): ExecutiveSummaryItem[] {
  const colas = Array.from(new Set(stats.map(s => s.cola)));
  
  return colas.map(cola => {
    const colaStats = stats.filter(s => s.cola === cola);
    const optimal = colaStats.find(s => s.isOptimal) || colaStats[0];
    
    const diff = ((optimal.avgTmo - optimal.metaTmo) / optimal.metaTmo) * 100;
    let status: 'DENTRO' | 'PROXIMO' | 'ACIMA' = 'DENTRO';
    if (diff > 10) status = 'ACIMA';
    else if (diff > 0) status = 'PROXIMO';

    let recommendation = '';
    if (status === 'DENTRO') {
      recommendation = `Manter operação na faixa de ${formatSeconds(optimal.rangeStart)}-${formatSeconds(optimal.rangeEnd)}. Foco em estabilidade de NPS.`;
    } else if (status === 'PROXIMO') {
      recommendation = `Otimizar processos para reduzir TMO em ${diff.toFixed(1)}% e atingir a meta sem sacrificar NPS.`;
    } else {
      recommendation = `Revisar gargalos operacionais. A faixa ideal identificada (${formatSeconds(optimal.rangeStart)}-${formatSeconds(optimal.rangeEnd)}) está significativamente acima da meta.`;
    }

    return {
      cola,
      optimalRange: [optimal.rangeStart, optimal.rangeEnd],
      status,
      npsOptimal: (optimal.avgNps || 0) * 100,
      npsMeta: (optimal.metaNps || 0) * 100,
      recommendation
    };
  });
}
