export interface DashboardData {
  PERIODO: 'CONSOLIDADO' | 'D-1';
  COLA: string;
  DATA: string | null;
  ASSIGN_CI_CURRENT_CHANNEL: string;
  USER_FAIXA_ORDEM: number;
  USER_LDAP: string;
  MANAGEMENT_TYPE_REASON: string;
  OUTGOING_FLAG_EVENT_NAME: string;
  Vol: number;
  TMO_HH: number;
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
  channel: string[];
  ldap: string;
}
