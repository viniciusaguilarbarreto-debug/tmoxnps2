import { DashboardData } from './types';

const generateMockItem = (periodo: 'CONSOLIDADO' | 'D-1', i: number): DashboardData => {
  const cola = ['BANKING', 'BUYERS_COMPRA', 'POS_ENTREGA_CHAT', 'PRE_ENTREGA_CHAT', 'SECURITY_CHAT'][Math.floor(Math.random() * 5)];
  const tmoSec = Math.floor(Math.random() * 2000);
  const metaTmo = 1700;
  
  const h = Math.floor(tmoSec / 3600);
  const m = Math.floor((tmoSec % 3600) / 60);
  const s = Math.floor(tmoSec % 60);
  const tmoHh = [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');

  return {
    PERIODO: periodo,
    COLA: cola,
    DATA: periodo === 'D-1' ? '09/04/2026' : null,
    USER_FAIXA_ORDEM: Math.floor(Math.random() * 2000),
    USER_LDAP: `agent_${i % 10}`,
    VOL: Math.floor(Math.random() * 200),
    TMO_HH: tmoHh,
    TMO_SEC: tmoSec,
    META_TMO: metaTmo,
    IMPACTO_TMO_MEDIA_MES: (tmoSec - metaTmo) / 1000,
    QTD_PESQUISAS_NPS: Math.floor(Math.random() * 20),
    NPS_REP: (Math.random() * 2) - 1, // -1 to 1
    META_NPS_REP: 0.5,
    IMPACTO_NPS_META_COLA: (Math.random() - 0.5) * 0.1,
    SILENCE_DURATION_HH: Math.floor(Math.random() * 100),
    MEDIA_SILENCIO_CHAT_AGENTE_HH: Math.floor(Math.random() * 10),
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
