import { DashboardData } from './types';

// Real samples from the attached base
const SAMPLES = [
  {
    CASE_ID: "447882780",
    COLA: "SECURITY_CHAT",
    USER_FAIXA_ORDEM: 1710,
    USER_FAIXA_HISTOGRAMA: "1710 - 1854",
    TMO_SEC: 1114,
    SILENCE_DURATION_SEC: 0,
    QTD_PESQUISAS_PARA_PIVOT: 25,
    NPS_PONDERADO_PARA_PIVOT: 2100,
    META: 1597,
    META_NPS: 0.7,
    PERIODO: "CONSOLIDADO",
    DATA: "01/04/2026",
    USER_LDAP: "ext_abcarlos",
    ASSIGN_CI_CURRENT_CHANNEL: "CHAT"
  },
  {
    CASE_ID: "447887181",
    COLA: "SECURITY_CHAT",
    USER_FAIXA_ORDEM: 1710,
    USER_FAIXA_HISTOGRAMA: "1710 - 1854",
    TMO_SEC: 1173,
    SILENCE_DURATION_SEC: 0,
    QTD_PESQUISAS_PARA_PIVOT: 0,
    NPS_PONDERADO_PARA_PIVOT: 0,
    META: 1597,
    META_NPS: 0.7,
    PERIODO: "CONSOLIDADO",
    DATA: "01/04/2026",
    USER_LDAP: "ext_abcarlos",
    ASSIGN_CI_CURRENT_CHANNEL: "CHAT"
  },
  {
    CASE_ID: "447891944",
    COLA: "SECURITY_CHAT",
    USER_FAIXA_ORDEM: 1710,
    USER_FAIXA_HISTOGRAMA: "1710 - 1854",
    TMO_SEC: 2877,
    SILENCE_DURATION_SEC: 0,
    QTD_PESQUISAS_PARA_PIVOT: 0,
    NPS_PONDERADO_PARA_PIVOT: 0,
    META: 1597,
    META_NPS: 0.7,
    PERIODO: "CONSOLIDADO",
    DATA: "01/04/2026",
    USER_LDAP: "ext_abcarlos",
    ASSIGN_CI_CURRENT_CHANNEL: "CHAT"
  },
  {
    CASE_ID: "447900001",
    COLA: "SECURITY_CHAT",
    USER_FAIXA_ORDEM: 1710,
    USER_FAIXA_HISTOGRAMA: "1710 - 1854",
    TMO_SEC: 3076,
    SILENCE_DURATION_SEC: 0,
    QTD_PESQUISAS_PARA_PIVOT: 0,
    NPS_PONDERADO_PARA_PIVOT: 0,
    META: 1597,
    META_NPS: 0.7,
    PERIODO: "CONSOLIDADO",
    DATA: "01/04/2026",
    USER_LDAP: "ext_abcarlos",
    ASSIGN_CI_CURRENT_CHANNEL: "CHAT"
  },
  {
    CASE_ID: "447906377",
    COLA: "SECURITY_CHAT",
    USER_FAIXA_ORDEM: 1710,
    USER_FAIXA_HISTOGRAMA: "1710 - 1854",
    TMO_SEC: 3878,
    SILENCE_DURATION_SEC: 0,
    QTD_PESQUISAS_PARA_PIVOT: 0,
    NPS_PONDERADO_PARA_PIVOT: 0,
    META: 1597,
    META_NPS: 0.7,
    PERIODO: "CONSOLIDADO",
    DATA: "01/04/2026",
    USER_LDAP: "ext_abcarlos",
    ASSIGN_CI_CURRENT_CHANNEL: "CHAT"
  }
];

// Generator to reach 100+ items for a better visualization
const generateFromSamples = (count: number): DashboardData[] => {
  const data: DashboardData[] = [];
  
  // Add some D-1 data
  for (let i = 0; i < count; i++) {
    const sample = SAMPLES[i % SAMPLES.length];
    const isD1 = Math.random() > 0.5;
    
    data.push({
      ...sample,
      CASE_ID: `CS-${2000000 + i}`,
      TMO_SEC: sample.TMO_SEC + (Math.random() - 0.5) * 500,
      PERIODO: isD1 ? "D-1" : "CONSOLIDADO",
      DATA: isD1 ? "01/04/2026" : "08/04/2026", // 01/04 is mapped to D-1 in our heuristic
    });
  }
  
  return [...SAMPLES, ...data];
};

export const MOCK_DATA: DashboardData[] = generateFromSamples(500);
