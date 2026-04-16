import { DashboardData } from './types';

const generateMockItem = (periodo: 'CONSOLIDADO' | 'D-1', i: number): DashboardData => {
  const cola = ['BANKING', 'BUYERS_COMPRA', 'POS_ENTREGA_CHAT', 'PRE_ENTREGA_CHAT', 'SECURITY_CHAT'][Math.floor(Math.random() * 5)];
  const channel = ['CHAT', 'WHATSAPP', 'VOICE'][Math.floor(Math.random() * 3)];
  const tmoSec = Math.floor(Math.random() * 2000);
  const metaTmo = 1700;
  const rangeStart = Math.floor(Math.random() * 10) * 200;
  const isFirstOfAgent = Math.random() > 0.7; // Only some cases carry NPS to avoid duplication
  
  return {
    CASE_ID: `CS-${Math.floor(Math.random() * 9000000) + 1000000}`,
    COLA: cola,
    USER_FAIXA_ORDEM: rangeStart,
    USER_FAIXA_HISTOGRAMA: `${rangeStart} - ${rangeStart + 200}`,
    TMO_SEC: tmoSec,
    META: metaTmo,
    SILENCE_DURATION_SEC: Math.floor(Math.random() * 300),
    QTD_PESQUISAS_PARA_PIVOT: isFirstOfAgent ? (Math.random() > 0.5 ? 1 : 0) : 0,
    NPS_PONDERADO_PARA_PIVOT: isFirstOfAgent ? (Math.random() > 0.3 ? (Math.random() > 0.5 ? 100 : -100) : 0) : 0,
    META_NPS: 0.73,
    // Common metadata
    PERIODO: periodo,
    DATA: periodo === 'D-1' ? '09/04/2026' : '15/04/2026',
    USER_LDAP: `agent_${Math.floor(Math.random() * 10)}`,
    ASSIGN_CI_CURRENT_CHANNEL: channel,
  };
};

export const MOCK_DATA: DashboardData[] = [];

// Generate 1000 items to simulate case-level data
for (let i = 0; i < 1000; i++) {
  MOCK_DATA.push(generateMockItem('CONSOLIDADO', i));
}

for (let i = 0; i < 400; i++) {
  MOCK_DATA.push(generateMockItem('D-1', i));
}
