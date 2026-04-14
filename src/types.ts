export interface DashboardData {
  PERIODO: 'CONSOLIDADO' | 'D-1';
  COLA: string;
  DATA: string | null;
  USER_FAIXA_ORDEM: number;
  USER_LDAP: string;
  VOL: number;
  TMO_HH: string;
  TMO_SEC: number;
  META_TMO: number;
  IMPACTO_TMO_MEDIA_MES: number;
  QTD_PESQUISAS_NPS: number;
  NPS_REP: number | null;
  META_NPS_REP: number | null;
  IMPACTO_NPS_META_COLA: number;
  SILENCE_DURATION_HH: number;
  MEDIA_SILENCIO_CHAT_AGENTE_HH: number;
}

export interface FilterState {
  cola: string[];
  ldap: string;
}
