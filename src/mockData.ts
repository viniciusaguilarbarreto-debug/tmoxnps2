import { DashboardData } from './types';

const generateMockItem = (periodo: 'CONSOLIDADO' | 'D-1', i: number): DashboardData => {
  const cola = ['BANKING', 'BUYERS_COMPRA', 'POS_ENTREGA_CHAT', 'PRE_ENTREGA_CHAT', 'SECURITY_CHAT'][Math.floor(Math.random() * 5)];
  const channel = ['CHAT', 'WHATSAPP', 'VOICE'][Math.floor(Math.random() * 3)];
  const tmoSec = Math.floor(Math.random() * 2000);
  const metaTmo = 1700;
  const caseId = `CS-${Math.floor(Math.random() * 9000000) + 1000000}`;
  
  return {
    CASE_ID: caseId,
    PERIODO: periodo,
    COLA: cola,
    ASSIGN_CI_CURRENT_CHANNEL: channel,
    DATA: periodo === 'D-1' ? '09/04/2026' : '15/04/2026',
    USER_FAIXA_ORDEM: Math.floor(Math.random() * 10) * 200, // Normalized ranges like 0, 200, 400...
    USER_LDAP: `agent_${Math.floor(Math.random() * 10)}`,
    VOL: 1, // Case level always starts with 1
    TMO_SEC: tmoSec,
    META_TMO: metaTmo,
    QTD_PESQUISAS_NPS: Math.random() > 0.8 ? 1 : 0, // Roughly 20% survey rate
    NPS_REP: Math.random() > 0.8 ? [1, 0, -1][Math.floor(Math.random() * 3)] : null,
    META_NPS_REP: 0.5,
    SILENCE_DURATION_HH: Math.random() * 0.1, // Silence in hours
    MEDIA_SILENCIO_CHAT_AGENTE_HH: Math.random() * 0.05,
  };
};

export const MOCK_DATA: DashboardData[] = [];

// Generate 500 items for CONSOLIDADO to simulate case-level volume
for (let i = 0; i < 500; i++) {
  MOCK_DATA.push(generateMockItem('CONSOLIDADO', i));
}

// Generate 200 items for D-1
for (let i = 0; i < 200; i++) {
  MOCK_DATA.push(generateMockItem('D-1', i));
}
