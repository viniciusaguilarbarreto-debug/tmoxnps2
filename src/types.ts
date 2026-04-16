export interface DashboardData {
  CASE_ID?: string;
  PERIODO: 'CONSOLIDADO' | 'D-1';
  COLA: string;
  DATA: string | null;
  USER_FAIXA_ORDEM: number;
  USER_LDAP: string;
  ASSIGN_CI_CURRENT_CHANNEL?: string;
  VOL: number; // For case level, this is usually 1
  TMO_SEC: number;
  META_TMO: number;
  QTD_PESQUISAS_NPS: number;
  NPS_REP: number | null;
  META_NPS_REP: number | null;
  SILENCE_DURATION_HH: number;
  MEDIA_SILENCIO_CHAT_AGENTE_HH: number;
  // Metadata for impact if pre-calculated
  IMPACTO_TMO_MEDIA_MES?: number;
  IMPACTO_NPS_META_COLA?: number;
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
