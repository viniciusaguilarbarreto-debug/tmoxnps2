import { DashboardData, AnalysisSettings } from '../types';

export interface TmoRangeStats {
  cola: string;
  rangeStart: number;
  rangeEnd: number;
  faixaLabel: string;
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
  faixaLabel: string;
  status: 'DENTRO' | 'PROXIMO' | 'ACIMA';
  npsOptimal: number;
  npsMeta: number;
  avgTmoOptimal: number;
  metaTmo: number;
  recommendation: string;
}

export function formatSeconds(seconds: number): string {
  if (seconds === undefined || seconds === null) return '00:00:00';
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
    
    // Group by USER_FAIXA_ORDEM
    const ranges: Record<number, { 
      tmoSum: number, 
      npsPondSum: number, 
      volSum: number, 
      surveysSum: number,
      metaTmoFirst: number,
      metaNpsFirst: number,
      silenceSum: number,
      faixaLabel: string
    }> = {};

    colaData.forEach(d => {
      const start = d.USER_FAIXA_ORDEM;
      if (!ranges[start]) {
        ranges[start] = { 
          tmoSum: 0, npsPondSum: 0, volSum: 0, surveysSum: 0, 
          metaTmoFirst: d.META, metaNpsFirst: d.META_NPS, silenceSum: 0,
          faixaLabel: d.USER_FAIXA_HISTOGRAMA
        };
      }
      
      ranges[start].tmoSum += d.TMO_SEC;
      ranges[start].volSum += 1; // Each row is 1 case
      ranges[start].silenceSum += d.SILENCE_DURATION_SEC;
      
      // Use only PIVOT columns to aggregate NPS avoiding duplication
      if (d.QTD_PESQUISAS_PARA_PIVOT > 0) {
        ranges[start].surveysSum += d.QTD_PESQUISAS_PARA_PIVOT;
        ranges[start].npsPondSum += d.NPS_PONDERADO_PARA_PIVOT;
      }
    });

    const sortedStarts = Object.keys(ranges).map(Number).sort((a, b) => a - b);

    const colaStats: TmoRangeStats[] = sortedStarts.map((start, idx) => {
      const r = ranges[start];
      const nextStart = sortedStarts[idx + 1];
      
      return {
        cola,
        rangeStart: start,
        rangeEnd: nextStart || (start + 300), 
        faixaLabel: r.faixaLabel,
        avgNps: r.surveysSum > 0 ? (r.npsPondSum / r.surveysSum) : null,
        avgTmo: r.volSum > 0 ? (r.tmoSum / r.volSum) : 0,
        avgSilence: r.volSum > 0 ? (r.silenceSum / r.volSum) : 0,
        metaTmo: r.metaTmoFirst,
        metaNps: r.metaNpsFirst * 100, // Fraction to Percentage
        volume: r.volSum,
        surveys: r.surveysSum,
        balanceScore: 0,
        isOptimal: false,
        normNps: 0,
        normTmo: 0,
        normVol: 0
      };
    });

    // JERUSALÉM 2.0 LOGIC: Normalization and Tripartite Weighted Scoring
    // Filter valid stats for normalization (at least 5 surveys as per Jerusalem rules)
    const validStats = colaStats.filter(s => s.avgNps !== null && s.surveys >= 5);
    
    // If no ranges have 5+ surveys, fall back to any range with NPS
    const statsForNorm = validStats.length > 0 ? validStats : colaStats.filter(s => s.avgNps !== null);

    if (statsForNorm.length > 0) {
      const minNps = Math.min(...statsForNorm.map(s => s.avgNps!));
      const maxNps = Math.max(...statsForNorm.map(s => s.avgNps!));
      const npsRange = maxNps - minNps || 1;

      const minTmo = Math.min(...statsForNorm.map(s => s.avgTmo));
      const maxTmo = Math.max(...statsForNorm.map(s => s.avgTmo));
      const tmoRange = maxTmo - minTmo || 1;

      const minVol = Math.min(...statsForNorm.map(s => s.volume));
      const maxVol = Math.max(...statsForNorm.map(s => s.volume));
      const volRange = maxVol - minVol || 1;

      colaStats.forEach(s => {
        // Normalization (0 to 1)
        s.normNps = s.avgNps !== null ? (s.avgNps - minNps) / npsRange : 0;
        // TMO Efficiency: Lower TMO is better
        s.normTmo = (maxTmo - s.avgTmo) / tmoRange;
        s.normVol = (s.volume - minVol) / volRange;

        // Ensure normalized values stay within [0, 1] for items outside the valid set
        s.normNps = Math.max(0, Math.min(1, s.normNps));
        s.normTmo = Math.max(0, Math.min(1, s.normTmo));
        s.normVol = Math.max(0, Math.min(1, s.normVol));

        // Weighted Score (Balance Score) - Default 0.33 each or dynamic
        const wNps = settings.weightNps;
        const wTmo = settings.weightTmo;
        const wVol = settings.weightVol;
        const totalWeight = wNps + wTmo + wVol || 1;

        s.balanceScore = (
          ((s.normNps * wNps) + 
          (s.normTmo * wTmo) + 
          (s.normVol * wVol)) / totalWeight
        ) * 100;
      });

      // Jerusalem 2.0: The Ideal range is the one with the highest Balance Score.
      // We only consider ranges that have at least one NPS survey to ensure we have a tripartite balance.
      const candidates = colaStats.filter(s => s.avgNps !== null);
      
      if (candidates.length > 0) {
        const optimal = candidates.reduce((prev, curr) => (prev.balanceScore > curr.balanceScore ? prev : curr));
        optimal.isOptimal = true;
      }
    }

    allStats.push(...colaStats);
  });

  return allStats;
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
        faixaLabel: 'N/A',
        status: 'DENTRO',
        npsOptimal: 0,
        npsMeta: 0,
        avgTmoOptimal: 0,
        metaTmo: 0,
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
      recommendation = `Manter operação na faixa ${optimal.faixaLabel}. Foco em estabilidade de NPS.`;
    } else if (status === 'PROXIMO') {
      recommendation = `Otimizar processos para reduzir TMO em ${(diff || 0).toFixed(1)}% e atingir a meta sem sacrificar NPS.`;
    } else {
      recommendation = `Revisar gargalos operacionais na fila ${cola}. A faixa ideal identificada (${optimal.faixaLabel}) está significativamente acima da meta.`;
    }

    return {
      cola,
      optimalRange: [optimal.rangeStart, optimal.rangeEnd],
      faixaLabel: optimal.faixaLabel,
      status,
      npsOptimal: (optimal.avgNps || 0),
      npsMeta: (optimal.metaNps || 0),
      avgTmoOptimal: optimal.avgTmo,
      metaTmo: optimal.metaTmo || 0,
      recommendation
    };
  });
}
