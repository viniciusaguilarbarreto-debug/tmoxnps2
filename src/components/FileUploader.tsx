import React, { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DashboardData } from '../types';

interface FileUploaderProps {
  onDataLoaded: (data: DashboardData[]) => void;
}

export function FileUploader({ onDataLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<{ name: string, status: 'loading' | 'success' | 'error' }[]>([]);

  const processFile = (file: File) => {
    setFiles(prev => [...prev, { name: file.name, status: 'loading' }]);

    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data as any[];
          const mappedData = mapToDashboardData(parsedData);
          onDataLoaded(mappedData);
          updateFileStatus(file.name, 'success');
        },
        error: () => {
          updateFileStatus(file.name, 'error');
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const mappedData = mapToDashboardData(jsonData);
          onDataLoaded(mappedData);
          updateFileStatus(file.name, 'success');
        } catch (err) {
          updateFileStatus(file.name, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      updateFileStatus(file.name, 'error');
    }
  };

  const updateFileStatus = (name: string, status: 'success' | 'error') => {
    setFiles(prev => prev.map(f => f.name === name ? { ...f, status } : f));
  };

  const parseNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'string') {
      const isPercent = val.includes('%');
      const cleaned = val.replace(/[^\d,.-]/g, '').replace(',', '.');
      let num = Number(cleaned);
      if (isPercent) num = num / 100;
      return isNaN(num) ? 0 : num;
    }
    return Number(val || 0);
  };

  const parseTime = (val: any): number => {
    if (!val || typeof val !== 'string') return 0;
    const parts = val.split(':');
    if (parts.length === 3) {
      const [h, m, s] = parts.map(v => Number(v.trim()));
      return (isNaN(h) ? 0 : h * 3600) + (isNaN(m) ? 0 : m * 60) + (isNaN(s) ? 0 : s);
    }
    return 0;
  };

  const mapToDashboardData = (data: any[]): DashboardData[] => {
    return data.map(item => ({
      CASE_ID: (item.CAS_CASE_ID || item.CASE_ID) ? String(item.CAS_CASE_ID || item.CASE_ID) : undefined,
      COLA: String(item.COLA || ''),
      USER_FAIXA_ORDEM: parseNum(item.USER_FAIXA_ORDEM),
      USER_FAIXA_HISTOGRAMA: String(item.USER_FAIXA_HISTOGRAMA || ''),
      TMO_SEC: parseNum(item.TMO_SEC),
      META: parseNum(item.META),
      SILENCE_DURATION_SEC: parseNum(item.SILENCE_DURATION_SEC),
      QTD_PESQUISAS_PARA_PIVOT: parseNum(item.QTD_PESQUISAS_PARA_PIVOT),
      NPS_PONDERADO_PARA_PIVOT: parseNum(item.NPS_PONDERADO_PARA_PIVOT),
      META_NPS: parseNum(item.META_NPS),
      // Metadata
      PERIODO: item.PERIODO || (item.DATA === '01/04/2026' ? 'D-1' : 'CONSOLIDADO'), // Heuristic for period if missing
      DATA: item.DATA ? String(item.DATA) : null,
      USER_LDAP: String(item.USER_LDAP || ''),
      ASSIGN_CI_CURRENT_CHANNEL: item.ASSIGN_CI_CURRENT_CHANNEL ? String(item.ASSIGN_CI_CURRENT_CHANNEL) : undefined,
    }));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(processFile);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      selectedFiles.forEach(processFile);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
          isDragging 
            ? "border-indigo-500 bg-indigo-50/50" 
            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
        }`}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          id="fileInput"
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={onFileSelect}
        />
        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-600 mb-4">
          <Upload size={24} />
        </div>
        <h4 className="text-sm font-semibold text-slate-900">Click or drag files to upload</h4>
        <p className="text-xs text-slate-500 mt-1">Support for CSV, XLSX and XLS bases</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{file.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{file.status}</span>
                </div>
              </div>
              {file.status === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
              {file.status === 'error' && <AlertCircle size={18} className="text-rose-500" />}
              {file.status === 'loading' && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
