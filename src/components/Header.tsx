import React from 'react';
import { SchoolProfile, DashboardStats } from '../types';
import { formatIDR } from '../services/storage';
import {
  Building2,
  Settings,
  Printer,
  RotateCcw,
  PlusCircle,
  FileSpreadsheet,
  Coins,
  CreditCard,
  Wallet,
  Database
} from 'lucide-react';

interface HeaderProps {
  profile: SchoolProfile;
  stats: DashboardStats;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenAddTrx: () => void;
  onOpenPrint: () => void;
  onOpenBackupRestore: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  stats,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenAddTrx,
  onOpenPrint,
  onOpenBackupRestore,
  onResetData,
}) => {
  const navTabs = [
    { id: 'dashboard', label: 'Dasbor Ringkasan' },
    { id: 'kertas-kerja', label: 'Kertas Kerja (RAB)' },
    { id: 'bku', label: 'Buku Kas Umum (BKU)' },
    { id: 'buku-bank', label: 'Buku Pembantu Bank' },
    { id: 'buku-tunai', label: 'Buku Pembantu Kas' },
    { id: 'rekap', label: 'Rekap Anggaran' },
    { id: 'logs', label: 'Log Aktivitas' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top institution bar */}
      <div className="bg-slate-900 text-slate-100 px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm tracking-wide text-white">
                  SI-SPJ REVITALISASI SEKOLAH
                </h1>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-blue-300 font-medium">{profile.namaSekolah}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400">TA {profile.tahunAnggaran}</span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xl">
                {profile.namaProgram} · Sumber: {profile.sumberDana}
              </p>
            </div>
          </div>

          {/* Quick Balance Indicators */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Bank:</span>
              <span className="font-semibold text-white">{formatIDR(stats.saldoBank)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Tunai:</span>
              <span className="font-semibold text-white">{formatIDR(stats.saldoTunai)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 bg-slate-800/80 px-2 py-1 rounded">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">Total BKU:</span>
              <span className="font-bold text-amber-300">{formatIDR(stats.saldoTotalKas)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation & quick actions */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">
          {/* Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onOpenAddTrx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Tambah Belanja SPJ
            </button>

            <button
              onClick={onOpenPrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors cursor-pointer"
              title="Cetak Laporan / Ekspor PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / PDF
            </button>

            <button
              onClick={onOpenBackupRestore}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-md transition-colors cursor-pointer border border-blue-200"
              title="Cadangkan dan Pulihkan Data (Backup & Restore JSON)"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Backup & Restore</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium rounded-md transition-colors cursor-pointer"
              title="Pengaturan Data Sekolah & Tim Revitalisasi"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Profil Sekolah</span>
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs rounded-md transition-colors cursor-pointer"
              title="Reset ke Sampel Awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
