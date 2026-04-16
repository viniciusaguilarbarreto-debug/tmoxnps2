import { DashboardData, AnalysisSettings } from '../types';

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
  // Normalized components for debugging/UI
  normNps: number;
  normTmo: number;
  normVol: number;
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

export function calculateIdealTmo(data: DashboardData[], settings: AnalysisSettings) {
  const colas = Array.from(new Set(data.map(d => d.COLA)));
  const allStats: TmoRangeStats[] = [];

  colas.forEach(cola => {
    const colaData = data.filter(d => d.COLA === cola);
    
    // Group by USER_FAIXA_ORDEM (Base summarized at Case ID level or aggregated)
    const ranges: Record<number, { 
      tmoSum: number, 
      npsSum: number, 
      npsCount: number, 
      volSum: number, 
      surveysSum: number,
      metaTmoSum: number,
      metaNpsSum: number,
      silenceSum: number
    }> = {};

    colaData.forEach(d => {
      const start = d.USER_FAIXA_ORDEM;
      if (!ranges[start]) {
        ranges[start] = { 
          tmoSum: 0, npsSum: 0, npsCount: 0, volSum: 0, surveysSum: 0, 
          metaTmoSum: 0, metaNpsSum: 0, silenceSum: 0
        };
      }
      
      ranges[start].tmoSum += d.TMO_SEC;
      // In Case ID structure, d.VOL should be 1, but we use d.VOL to be safe with pre-aggregated data
      ranges[start].volSum += (d.VOL || 1); 
      ranges[start].metaTmoSum += (d.META_TMO * (d.VOL || 1));
      ranges[start].silenceSum += d.SILENCE_DURATION_HH;
      
      if (d.QTD_PESQUISAS_NPS > 0) {
        ranges[start].surveysSum += d.QTD_PESQUISAS_NPS;
        ranges[start].metaNpsSum += ((d.META_NPS_REP || 0) * d.QTD_PESQUISAS_NPS);
        if (d.NPS_REP !== null) {
          // NPS is already -1 to 1 or 0 to 1 usually. We sum weighted by surveys if aggregating.
          // Since it's case level, surveys usually = 1.
          ranges[start].npsSum += (d.NPS_REP * d.QTD_PESQUISAS_NPS);
          ranges[start].npsCount += 1;
        }
      }
    });

    const sortedStarts = Object.keys(ranges).map(Number).sort((a, b) => a - b);

    const colaStats: TmoRangeStats[] = sortedStarts.map((start, idx) => {
      const r = ranges[start];
      const nextStart = sortedStarts[idx + 1];
      
      return {
        cola,
        rangeStart: start,
        rangeEnd: nextStart || start + 300,
        avgNps: r.surveysSum > 0 ? r.npsSum / r.surveysSum : null,
        avgTmo: r.volSum > 0 ? r.tmoSum / r.volSum : 0,
        avgSilence: r.volSum > 0 ? r.silenceSum / r.volSum : 0,
        metaTmo: r.volSum > 0 ? r.metaTmoSum / r.volSum : 0,
        metaNps: r.surveysSum > 0 ? r.metaNpsSum / r.surveysSum : 0,
        volume: r.volSum,
        surveys: r.surveysSum,
        balanceScore: 0,
        isOptimal: false,
        normNps: 0,
        normTmo: 0,
        normVol: 0
      };
    });

    // JERUSALÉM 2.0 LOGIC: Normalization and Weighted Scoring
    // 1. Min/Max for each metric within the COLA
    const validStats = colaStats.filter(s => s.avgNps !== null);
    if (validStats.length > 0) {
      const minNps = Math.min(...validStats.map(s => s.avgNps!));
      const maxNps = Math.max(...validStats.map(s => s.avgNps!));
      const npsRange = maxNps - minNps || 1;

      const minTmo = Math.min(...colaStats.map(s => s.avgTmo));
      const maxTmo = Math.max(...colaStats.map(s => s.avgTmo));
      const tmoRange = maxTmo - minTmo || 1;

      const minVol = Math.min(...colaStats.map(s => s.volume));
      const maxVol = Math.max(...colaStats.map(s => s.volume));
      const volRange = maxVol - minVol || 1;

      colaStats.forEach(s => {
        // Normalization (0 to 1)
        s.normNps = s.avgNps !== null ? (s.avgNps - minNps) / npsRange : 0;
        // TMO Efficiency: Lower TMO is better, so we invert
        s.normTmo = (maxTmo - s.avgTmo) / tmoRange;
        s.normVol = (s.volume - minVol) / volRange;

        // Weighted Score (Balance Score)
        s.balanceScore = (
          (s.normNps * settings.weightNps) + 
          (s.normTmo * settings.weightTmo) + 
          (s.normVol * settings.weightVol)
        ) * 100;
      });

      // Constraint: Ideal NPS must not be lower than the meta (if meta exists)
      const meetMeta = colaStats.filter(s => s.avgNps !== null && s.avgNps >= (s.metaNps || -1));
      let optimal: TmoRangeStats | undefined;
      
      if (meetMeta.length > 0) {
        optimal = meetMeta.reduce((prev, curr) => (prev.balanceScore > curr.balanceScore ? prev : curr));
      } else {
        // Fallback: Pick highest NPS range if none meet the meta
        const withNps = colaStats.filter(s => s.avgNps !== null);
        if (withNps.length > 0) {
          optimal = withNps.reduce((prev, curr) => (prev.avgNps! > curr.avgNps! ? prev : curr));
        } else {
          optimal = colaStats[0];
        }
      }

      if (optimal) optimal.isOptimal = true;
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
    
    if (!optimal) {
      return {
        cola,
        optimalRange: [0, 0],
        status: 'DENTRO',
        npsOptimal: 0,
        npsMeta: 0,
        recommendation: 'Sem dados suficientes para análise.'
      };
    }

    const meta = optimal.metaTmo || 1;
    const diff = ((optimal.avgTmo - meta) / meta) * 100;
    let status: 'DENTRO' | 'PROXIMO' | 'ACIMA' = 'DENTRO';
    if (diff > 10) status = 'ACIMA';
    else if (diff > 0) status = 'PROXIMO';

    let recommendation = '';
    if (status === 'DENTRO') {
      recommendation = `Manter operação na faixa de ${formatSeconds(optimal.rangeStart)}-${formatSeconds(optimal.rangeEnd)}. Foco em estabilidade de NPS.`;
    } else if (status === 'PROXIMO') {
      recommendation = `Otimizar processos para reduzir TMO em ${(diff || 0).toFixed(1)}% e atingir a meta sem sacrificar NPS.`;
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
