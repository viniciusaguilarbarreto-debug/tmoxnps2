import React, { useState } from 'react';
import { Filter, Search, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardData, FilterState } from '../types';

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  data: DashboardData[];
}

function CollapsibleFilter({ 
  label, 
  options, 
  selected, 
  onToggle, 
  onSelectOnly 
}: { 
  label: string, 
  options: string[], 
  selected: string[], 
  onToggle: (val: string) => void,
  onSelectOnly: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleItemClick = (e: React.MouseEvent, opt: string) => {
    if (e.ctrlKey || e.metaKey) {
      onToggle(opt);
    } else {
      onSelectOnly(opt);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              {selected.length}
            </span>
          )}
          {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3 border-t border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input 
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredOptions.map(opt => (
                  <div 
                    key={opt}
                    onClick={(e) => handleItemClick(e, opt)}
                    className={`
                      flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-[11px] transition-colors
                      ${selected.includes(opt) 
                        ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                        : 'hover:bg-slate-50 text-slate-600'}
                    `}
                  >
                    <span className="truncate">{opt}</span>
                    {selected.includes(opt) && <Check size={12} />}
                  </div>
                ))}
                {filteredOptions.length === 0 && (
                  <div className="text-[10px] text-slate-400 text-center py-2 italic">No results found</div>
                )}
              </div>
              <div className="text-[9px] text-slate-400 italic border-t border-slate-50 pt-2">
                Tip: Click to select one, Ctrl+Click for multiple
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Filters({ filters, setFilters, data }: FiltersProps) {
  const colas = Array.from(new Set(data.map(d => d.COLA))).sort();
  const channels = Array.from(new Set(data.map(d => d.ASSIGN_CI_CURRENT_CHANNEL))).sort();

  const toggleCola = (cola: string) => {
    setFilters(prev => ({
      ...prev,
      cola: prev.cola.includes(cola) 
        ? prev.cola.filter(c => c !== cola) 
        : [...prev.cola, cola]
    }));
  };

  const selectOnlyCola = (cola: string) => {
    setFilters(prev => ({
      ...prev,
      cola: [cola]
    }));
  };

  const toggleChannel = (channel: string) => {
    setFilters(prev => ({
      ...prev,
      channel: prev.channel.includes(channel) 
        ? prev.channel.filter(c => c !== channel) 
        : [...prev.channel, channel]
    }));
  };

  const selectOnlyChannel = (channel: string) => {
    setFilters(prev => ({
      ...prev,
      channel: [channel]
    }));
  };

  const clearFilters = () => {
    setFilters({ cola: [], channel: [], ldap: '' });
  };

  const hasFilters = filters.cola.length > 0 || filters.channel.length > 0 || filters.ldap !== '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <Filter size={14} className="text-indigo-600" />
          Filters
        </h3>
        {hasFilters && (
          <button 
            onClick={clearFilters}
            className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-tight"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* LDAP Search */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Agent LDAP</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={filters.ldap}
              onChange={(e) => setFilters(prev => ({ ...prev, ldap: e.target.value }))}
              placeholder="Search agent..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-white"
            />
          </div>
        </div>

        <CollapsibleFilter 
          label="Queues" 
          options={colas} 
          selected={filters.cola} 
          onToggle={toggleCola}
          onSelectOnly={selectOnlyCola}
        />

        <CollapsibleFilter 
          label="Channels" 
          options={channels} 
          selected={filters.channel} 
          onToggle={toggleChannel}
          onSelectOnly={selectOnlyChannel}
        />
      </div>
    </div>
  );
}
