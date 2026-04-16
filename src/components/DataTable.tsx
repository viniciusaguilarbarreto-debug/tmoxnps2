import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { DashboardData } from '../types';

interface DataTableProps {
  data: DashboardData[];
}

type SortKey = keyof DashboardData;

export function DataTable({ data }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(null);

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null) return 1;
        if (bValue === null) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={12} className="ml-1 text-indigo-600" /> 
      : <ChevronDown size={12} className="ml-1 text-indigo-600" />;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <HeaderCell label="Agent" columnKey="USER_LDAP" onSort={requestSort} icon={<SortIcon columnKey="USER_LDAP" />} />
            <HeaderCell label="Queue" columnKey="COLA" onSort={requestSort} icon={<SortIcon columnKey="COLA" />} />
            <HeaderCell label="Channel" columnKey="ASSIGN_CI_CURRENT_CHANNEL" onSort={requestSort} icon={<SortIcon columnKey="ASSIGN_CI_CURRENT_CHANNEL" />} />
            <HeaderCell label="Volume" columnKey="VOL" onSort={requestSort} icon={<SortIcon columnKey="VOL" />} />
            <HeaderCell label="TMO" columnKey="TMO_SEC" onSort={requestSort} icon={<SortIcon columnKey="TMO_SEC" />} />
            <HeaderCell label="NPS" columnKey="NPS_REP" onSort={requestSort} icon={<SortIcon columnKey="NPS_REP" />} />
            <HeaderCell label="Silence" columnKey="SILENCE_DURATION_HH" onSort={requestSort} icon={<SortIcon columnKey="SILENCE_DURATION_HH" />} />
            <HeaderCell label="Avg Silence" columnKey="MEDIA_SILENCIO_CHAT_AGENTE_HH" onSort={requestSort} icon={<SortIcon columnKey="MEDIA_SILENCIO_CHAT_AGENTE_HH" />} />
            <HeaderCell label="Surveys" columnKey="QTD_PESQUISAS_NPS" onSort={requestSort} icon={<SortIcon columnKey="QTD_PESQUISAS_NPS" />} />
            <HeaderCell label="Impact" columnKey="IMPACTO_TMO_MEDIA_MES" onSort={requestSort} icon={<SortIcon columnKey="IMPACTO_TMO_MEDIA_MES" />} />
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, idx) => (
            <tr key={`${item.USER_LDAP}-${idx}`} className="hover:bg-slate-50 transition-colors group">
              <td className="data-grid-cell font-medium text-slate-900">{item.USER_LDAP}</td>
              <td className="data-grid-cell">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                  {item.COLA}
                </span>
              </td>
              <td className="data-grid-cell">
                <span className="text-[10px] font-medium text-slate-500 uppercase">
                  {item.ASSIGN_CI_CURRENT_CHANNEL || '—'}
                </span>
              </td>
              <td className="data-grid-cell font-mono text-xs">{item.VOL}</td>
              <td className="data-grid-cell font-mono text-xs">{formatDuration(item.TMO_SEC)}</td>
              <td className="data-grid-cell">
                {item.NPS_REP !== null ? (
                  <span className={`font-mono text-xs ${(item.NPS_REP * 100) >= 70 ? 'text-emerald-600' : (item.NPS_REP * 100) >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {(item.NPS_REP * 100).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="data-grid-cell font-mono text-xs">{formatDuration(item.SILENCE_DURATION_HH)}</td>
              <td className="data-grid-cell font-mono text-xs">{formatDuration(item.MEDIA_SILENCIO_CHAT_AGENTE_HH)}</td>
              <td className="data-grid-cell font-mono text-xs">{item.QTD_PESQUISAS_NPS}</td>
              <td className="data-grid-cell">
                <span className={`font-mono text-xs ${(item.IMPACTO_TMO_MEDIA_MES ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(item.IMPACTO_TMO_MEDIA_MES ?? 0) >= 0 ? '+' : ''}{(item.IMPACTO_TMO_MEDIA_MES ?? 0).toFixed(2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeaderCell({ label, columnKey, onSort, icon }: { label: string, columnKey: SortKey, onSort: (key: SortKey) => void, icon: React.ReactNode }) {
  return (
    <th 
      className="data-grid-header cursor-pointer hover:bg-slate-100 transition-colors select-none"
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center">
        {label}
        {icon}
      </div>
    </th>
  );
}
