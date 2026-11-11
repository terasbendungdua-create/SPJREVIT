import React from 'react';
import { SchoolProfile, DashboardStats } from '../types';
import { formatIDR } from '../services/storage';
import {
  Menu,
  Settings,
  Printer,
  RotateCcw,
  PlusCircle,
  Coins,
  CreditCard,
  Wallet,
  Database,
  LayoutDashboard,
  FileSpreadsheet,
  BookOpen,
  PieChart,
  History,
} from 'lucide-react';

interface HeaderProps {
  profile: SchoolProfile;
  stats: DashboardStats;
  activeTab: string;
  onToggleSidebar: () => void;
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
  onToggleSidebar,
  onOpenSettings,
  onOpenAddTrx,
  onOpenPrint,
  onOpenBackupRestore,
  onResetData,
}) => {
  const getTabTitle = (id: string) => {
    switch (id) {
      case 'dashboard':
        return { title: 'Dasbor Ringkasan', icon: LayoutDashboard };
      case 'kertas-kerja':
        return { title: 'Kertas Kerja (RAB Revitalisasi)', icon: FileSpreadsheet };
      case 'bku':
        return { title: 'Buku Kas Umum (BKU)', icon: BookOpen };
      case 'buku-bank':
        return { title: 'Buku Pembantu Bank', icon: CreditCard };
      case 'buku-tunai':
        return { title: 'Buku Pembantu Kas Tunai', icon: Wallet };
      case 'rekap':
        return { title: 'Rekapitulasi Realisasi Anggaran', icon: PieChart };
      case 'logs':
        return { title: 'Log Aktivitas & Audit Trail', icon: History };
      default:
        return { title: 'Sistem SPJ Revitalisasi', icon: LayoutDashboard };
    }
  };

  const currentTab = getTabTitle(activeTab);
  const CurrentIcon = currentTab.icon;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-colors cursor-pointer"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <CurrentIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {currentTab.title}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                <span className="truncate">{profile.namaSekolah}</span>
                <span>·</span>
                <span className="font-mono text-slate-600">TA {profile.tahunAnggaran}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Balance Badges & Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Balance Indicators (Desktop / Tablet) */}
          <div className="hidden xl:flex items-center gap-2.5 text-xs font-mono mr-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-700">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-400 font-sans text-[11px]">Bank:</span>
              <span className="font-semibold">{formatIDR(stats.saldoBank)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-700">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-400 font-sans text-[11px]">Tunai:</span>
              <span className="font-semibold">{formatIDR(stats.saldoTunai)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md text-amber-900">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-700 font-sans text-[11px]">Total BKU:</span>
              <strong className="font-bold">{formatIDR(stats.saldoTotalKas)}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={onOpenAddTrx}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah Belanja</span>
          </button>

          <button
            onClick={onOpenPrint}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors cursor-pointer"
            title="Cetak Laporan / Ekspor PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cetak</span>
          </button>

          <button
            onClick={onOpenBackupRestore}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-md transition-colors cursor-pointer border border-blue-200"
            title="Cadangkan dan Pulihkan Data (Backup & Restore JSON)"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden lg:inline">Backup & Restore</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium rounded-md transition-colors cursor-pointer"
            title="Pengaturan Data Sekolah & Tim Revitalisasi"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Profil Sekolah</span>
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
    </header>
  );
};
