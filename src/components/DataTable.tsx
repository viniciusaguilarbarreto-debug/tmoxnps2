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
            <HeaderCell label="Case ID" columnKey="CASE_ID" onSort={requestSort} icon={<SortIcon columnKey="CASE_ID" />} />
            <HeaderCell label="Agent" columnKey="USER_LDAP" onSort={requestSort} icon={<SortIcon columnKey="USER_LDAP" />} />
            <HeaderCell label="Queue" columnKey="COLA" onSort={requestSort} icon={<SortIcon columnKey="COLA" />} />
            <HeaderCell label="Faixa" columnKey="USER_FAIXA_HISTOGRAMA" onSort={requestSort} icon={<SortIcon columnKey="USER_FAIXA_HISTOGRAMA" />} />
            <HeaderCell label="TMO" columnKey="TMO_SEC" onSort={requestSort} icon={<SortIcon columnKey="TMO_SEC" />} />
            <HeaderCell label="Silence" columnKey="SILENCE_DURATION_SEC" onSort={requestSort} icon={<SortIcon columnKey="SILENCE_DURATION_SEC" />} />
            <HeaderCell label="NPS (Pond)" columnKey="NPS_PONDERADO_PARA_PIVOT" onSort={requestSort} icon={<SortIcon columnKey="NPS_PONDERADO_PARA_PIVOT" />} />
            <HeaderCell label="Surveys" columnKey="QTD_PESQUISAS_PARA_PIVOT" onSort={requestSort} icon={<SortIcon columnKey="QTD_PESQUISAS_PARA_PIVOT" />} />
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, idx) => (
            <tr key={`${item.CASE_ID}-${idx}`} className="hover:bg-slate-50 transition-colors group">
              <td className="data-grid-cell font-mono text-[10px] text-slate-500">{item.CASE_ID}</td>
              <td className="data-grid-cell font-medium text-slate-900">{item.USER_LDAP}</td>
              <td className="data-grid-cell">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                  {item.COLA}
                </span>
              </td>
              <td className="data-grid-cell text-[10px] text-slate-500">{item.USER_FAIXA_HISTOGRAMA}</td>
              <td className="data-grid-cell font-mono text-xs">{formatDuration(item.TMO_SEC)}</td>
              <td className="data-grid-cell font-mono text-xs">{item.SILENCE_DURATION_SEC}s</td>
              <td className="data-grid-cell font-mono text-xs">
                {item.QTD_PESQUISAS_PARA_PIVOT > 0 ? (
                  <span className={(item.NPS_PONDERADO_PARA_PIVOT / item.QTD_PESQUISAS_PARA_PIVOT) >= 70 ? 'text-emerald-600' : 'text-slate-600'}>
                    {(item.NPS_PONDERADO_PARA_PIVOT / item.QTD_PESQUISAS_PARA_PIVOT).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="data-grid-cell font-mono text-xs text-slate-500">{item.QTD_PESQUISAS_PARA_PIVOT}</td>
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
