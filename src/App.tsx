import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings, 
  Menu, 
  X, 
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Table as TableIcon,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MOCK_DATA } from './mockData';
import { DashboardData, FilterState } from './types';
import { VolumeHistogram, SilenceChart } from './components/Charts';
import { DataTable } from './components/DataTable';
import { Filters } from './components/Filters';
import { FileUploader } from './components/FileUploader';
import { BoxPlotChart } from './components/BoxPlotChart';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data'>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData[]>(MOCK_DATA);
  const [periodo, setPeriodo] = useState<'CONSOLIDADO' | 'D-1'>('CONSOLIDADO');
  const [boxPlotMetric, setBoxPlotMetric] = useState<'TMO_SEC' | 'NPS_REP' | 'SILENCE_DURATION_HH'>('TMO_SEC');
  const [filters, setFilters] = useState<FilterState>({
    cola: [],
    channel: [],
    ldap: ''
  });

  const filteredData = useMemo(() => {
    return dashboardData.filter(item => {
      const matchPeriodo = item.PERIODO === periodo;
      const matchCola = filters.cola.length === 0 || filters.cola.includes(item.COLA);
      const matchChannel = filters.channel.length === 0 || filters.channel.includes(item.ASSIGN_CI_CURRENT_CHANNEL);
      const matchLdap = filters.ldap === '' || item.USER_LDAP.toLowerCase().includes(filters.ldap.toLowerCase());
      return matchPeriodo && matchCola && matchChannel && matchLdap;
    });
  }, [dashboardData, filters, periodo]);

  const handleDataLoaded = (newData: DashboardData[]) => {
    setDashboardData(prev => [...prev, ...newData]);
  };

  const stats = useMemo(() => {
    const totalVol = filteredData.reduce((acc, curr) => acc + curr.Vol, 0);
    const avgTmo = filteredData.length > 0 
      ? filteredData.reduce((acc, curr) => acc + curr.TMO_SEC, 0) / filteredData.length 
      : 0;
    
    // NPS in the new structure is -1 to 1. Let's show it as -100 to 100 for standard NPS score
    const npsData = filteredData.filter(d => d.NPS_REP !== null);
    const avgNps = npsData.length > 0
      ? (npsData.reduce((acc, curr) => acc + (curr.NPS_REP || 0), 0) / npsData.length) * 100
      : 0;
    
    return { totalVol, avgTmo, avgNps };
  }, [filteredData]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-white border-r border-slate-200 flex flex-col relative z-20"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 font-bold text-slate-900"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <LayoutDashboard size={20} />
                </div>
                <span className="truncate">Performance</span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-small"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white mx-auto"
              >
                <LayoutDashboard size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem 
            icon={<TableIcon size={20} />} 
            label="Data Bases" 
            active={activeTab === 'data'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveTab('data')}
          />
          <SidebarItem icon={<Users size={20} />} label="Agents" isOpen={isSidebarOpen} />
          <SidebarItem icon={<MessageSquare size={20} />} label="Channels" isOpen={isSidebarOpen} />
          <SidebarItem icon={<Settings size={20} />} label="Settings" isOpen={isSidebarOpen} />
        </nav>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-6 py-6 border-t border-slate-100 overflow-y-auto max-h-[50vh]"
            >
              <Filters filters={filters} setFilters={setFilters} data={dashboardData} />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-all"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-slate-900">Performance Overview</h1>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['CONSOLIDADO', 'D-1'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wider",
                    periodo === p 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <Clock size={14} />
              <span>Last updated: Just now</span>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'dashboard' ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Volume" value={stats.totalVol.toLocaleString()} trend="+12.5%" isTech />
                <StatCard label="Avg TMO" value={`${stats.avgTmo.toFixed(0)}s`} trend="-5.2%" trendNegative isTech />
                <StatCard label="Avg NPS" value={stats.avgNps.toFixed(1)} trend="+2.1%" isTech />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Charts Area */}
                <div className="lg:col-span-3 space-y-8">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="dashboard-card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <BarChart3 size={18} className="text-indigo-600" />
                          Volume by Range (HC)
                        </h3>
                      </div>
                      <div className="h-[300px]">
                        <VolumeHistogram data={filteredData} />
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <BarChart3 size={18} className="text-indigo-600" />
                        Distribution Analysis (Box Plot)
                      </h3>
                      <div className="flex gap-2">
                        {(['TMO_SEC', 'NPS_REP', 'SILENCE_DURATION_HH'] as const).map(m => (
                          <button
                            key={m}
                            onClick={() => setBoxPlotMetric(m)}
                            className={cn(
                              "px-2 py-1 text-[10px] font-bold rounded transition-all uppercase",
                              boxPlotMetric === m 
                                ? "bg-indigo-600 text-white" 
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            )}
                          >
                            {m.split('_')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <BoxPlotChart 
                      data={filteredData} 
                      metric={boxPlotMetric} 
                      title={`${boxPlotMetric.split('_')[0]} Dispersion by Queue`} 
                    />
                  </div>

                  <div className="dashboard-card">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <TableIcon size={18} className="text-indigo-600" />
                        Agent Performance Data
                      </h3>
                      <span className="text-xs font-mono text-slate-500">{filteredData.length} records found</span>
                    </div>
                    <DataTable data={filteredData} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="dashboard-card p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Import Data Bases</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Upload your CSV or Excel files to populate the dashboard. The system will automatically map the columns based on your SQL query structure.
                  </p>
                </div>
                <FileUploader onDataLoaded={handleDataLoaded} />
              </div>

              <div className="dashboard-card">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Currently Loaded Data</h3>
                </div>
                <div className="p-0">
                  <DataTable data={dashboardData.slice(0, 10)} />
                  {dashboardData.length > 10 && (
                    <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                      <p className="text-xs text-slate-500">Showing first 10 of {dashboardData.length} records</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, isOpen, onClick }: { icon: React.ReactNode, label: string, active?: boolean, isOpen: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "sidebar-item w-full",
        active ? "sidebar-item-active" : "sidebar-item-inactive",
        !isOpen && "justify-center px-0"
      )}
    >
      {icon}
      {isOpen && <span className="ml-3 truncate">{label}</span>}
    </button>
  );
}

function StatCard({ 
  label, 
  value, 
  trend, 
  trendNegative = false,
  isFlower = false,
  isTech = false
}: { 
  label: string, 
  value: string, 
  trend: string, 
  trendNegative?: boolean,
  isFlower?: boolean,
  isTech?: boolean
}) {
  return (
    <div className={cn(
      "dashboard-card p-6 relative overflow-hidden group transition-all duration-500",
      isFlower && "bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100 shadow-rose-100/50",
      isTech && "bg-slate-900 border-slate-800 shadow-xl shadow-indigo-900/20"
    )}>
      {isFlower && (
        <>
          {/* Decorative Petals */}
          <div className="absolute -right-4 -top-4 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
            <div className="absolute inset-0 bg-rose-400 rounded-full blur-2xl animate-pulse" />
            <svg viewBox="0 0 100 100" className="w-full h-full text-rose-500 fill-current animate-[spin_10s_linear_infinite]">
              <path d="M50 0 C60 20 80 20 100 50 C80 80 60 80 50 100 C40 80 20 80 0 50 C20 20 40 20 50 0" />
              <path d="M50 0 C60 20 80 20 100 50 C80 80 60 80 50 100 C40 80 20 80 0 50 C20 20 40 20 50 0" transform="rotate(45 50 50)" />
              <path d="M50 0 C60 20 80 20 100 50 C80 80 60 80 50 100 C40 80 20 80 0 50 C20 20 40 20 50 0" transform="rotate(90 50 50)" />
              <path d="M50 0 C60 20 80 20 100 50 C80 80 60 80 50 100 C40 80 20 80 0 50 C20 20 40 20 50 0" transform="rotate(135 50 50)" />
            </svg>
          </div>
          <div className="absolute -left-8 -bottom-8 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
            <svg viewBox="0 0 100 100" className="w-full h-full text-orange-500 fill-current animate-[spin_15s_linear_infinite_reverse]">
              <circle cx="50" cy="50" r="20" />
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <ellipse key={deg} cx="50" cy="25" rx="15" ry="25" transform={`rotate(${deg} 50 50)`} />
              ))}
            </svg>
          </div>
        </>
      )}

      {isTech && (
        <>
          {/* Tech Clock Elements */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            {/* Grid Pattern */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            
            {/* Rotating Gear/Clock Face */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 text-indigo-500/30 animate-[spin_30s_linear_infinite]">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current stroke-[0.5]">
                <circle cx="50" cy="50" r="45" strokeDasharray="2 4" />
                <circle cx="50" cy="50" r="35" strokeDasharray="1 8" />
                {[...Array(12)].map((_, i) => (
                  <line key={i} x1="50" y1="10" x2="50" y2="15" transform={`rotate(${i * 30} 50 50)`} strokeWidth="2" />
                ))}
              </svg>
            </div>

            {/* Scanning Line */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent h-1/2 w-full animate-[pan-y_4s_linear_infinite]" style={{ top: '-100%' }} />
          </div>
          
          {/* Clock Hands (Static but techy) */}
          <div className="absolute right-6 top-6 w-12 h-12 opacity-40">
            <div className="absolute inset-0 border border-indigo-500/30 rounded-full" />
            <div className="absolute top-1/2 left-1/2 w-4 h-[1px] bg-indigo-400 origin-left -rotate-45" />
            <div className="absolute top-1/2 left-1/2 w-3 h-[1px] bg-cyan-400 origin-left rotate-[120deg]" />
          </div>
        </>
      )}

      <div className="relative z-10">
        <p className={cn(
          "text-sm font-medium",
          isFlower ? "text-rose-600/80" : (isTech ? "text-indigo-300/70 uppercase tracking-widest text-[10px]" : "text-slate-500")
        )}>{label}</p>
        <div className="mt-2 flex items-baseline justify-between">
          <h4 className={cn(
            "text-2xl font-bold",
            isFlower ? "text-rose-900" : (isTech ? "text-white font-mono tracking-tight" : "text-slate-900")
          )}>{value}</h4>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trendNegative 
              ? (isFlower ? "bg-rose-100 text-rose-700" : (isTech ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-rose-50 text-rose-600")) 
              : (isFlower ? "bg-emerald-100 text-emerald-700" : (isTech ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-600"))
          )}>
            {trend}
          </span>
        </div>
        {isTech && (
          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-2/3 animate-[shimmer_2s_infinite]" />
          </div>
        )}
      </div>
    </div>
  );
}
