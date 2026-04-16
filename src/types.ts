export interface DashboardData {
  CASE_ID?: string;
  COLA: string;
  USER_FAIXA_ORDEM: number;
  USER_FAIXA_HISTOGRAMA: string;
  TMO_SEC: number;
  META: number;
  SILENCE_DURATION_SEC: number;
  QTD_PESQUISAS_PARA_PIVOT: number;
  NPS_PONDERADO_PARA_PIVOT: number;
  META_NPS: number;
  // Common metadata
  PERIODO: 'CONSOLIDADO' | 'D-1';
  DATA: string | null;
  USER_LDAP: string;
  ASSIGN_CI_CURRENT_CHANNEL?: string;
}

export interface AnalysisSettings {
  weightNps: number;
  weightTmo: number;
  weightVol: number;
}

export interface FilterState {
  cola: string[];
  channel: string[];
  ldap: string;
}
