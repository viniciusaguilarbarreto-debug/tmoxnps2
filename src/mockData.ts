import { DashboardData } from './types';

const generateMockItem = (periodo: 'CONSOLIDADO' | 'D-1', i: number): DashboardData => {
  const cola = ['BANKING', 'BUYERS_COMPRA', 'POS_ENTREGA_CHAT', 'PRE_ENTREGA_CHAT', 'SECURITY_CHAT'][Math.floor(Math.random() * 5)];
  const channel = ['CHAT', 'OFFLINE'][Math.floor(Math.random() * 2)];
  const tmoSec = Math.floor(Math.random() * 2000);
  const metaTmo = channel === 'OFFLINE' ? 1400 : 1700;
  
  return {
    PERIODO: periodo,
    COLA: cola,
    DATA: periodo === 'D-1' ? '09/04/2026' : null,
    ASSIGN_CI_CURRENT_CHANNEL: channel,
    USER_FAIXA_ORDEM: Math.floor(Math.random() * 2000),
    USER_LDAP: `agent_${i % 10}`,
    MANAGEMENT_TYPE_REASON: 'Standard',
    OUTGOING_FLAG_EVENT_NAME: 'Inbound',
    Vol: Math.floor(Math.random() * 200),
    TMO_HH: tmoSec / 3600,
    TMO_SEC: tmoSec,
    META_TMO: metaTmo,
    IMPACTO_TMO_MEDIA_MES: (tmoSec - metaTmo) / 1000,
    QTD_PESQUISAS_NPS: Math.floor(Math.random() * 20),
    NPS_REP: (Math.random() * 2) - 1, // -1 to 1
    META_NPS_REP: 0.5,
    IMPACTO_NPS_META_COLA: (Math.random() - 0.5) * 0.1,
    SILENCE_DURATION_HH: Math.random() * 0.005,
    MEDIA_SILENCIO_CHAT_AGENTE_HH: Math.random() * 0.005,
  };
};

export const MOCK_DATA: DashboardData[] = [];

// Generate 50 items for CONSOLIDADO
for (let i = 0; i < 50; i++) {
  MOCK_DATA.push(generateMockItem('CONSOLIDADO', i));
}

// Generate 50 items for D-1
for (let i = 0; i < 50; i++) {
  MOCK_DATA.push(generateMockItem('D-1', i));
}
