import React from 'react';
import { SchoolProfile, DashboardStats } from '../types';
import { formatIDR } from '../services/storage';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BookOpen,
  CreditCard,
  Wallet,
  PieChart,
  History,
  Building2,
  PlusCircle,
  Printer,
  Database,
  Settings,
  RotateCcw,
  X,
  Coins,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: SchoolProfile;
  stats: DashboardStats;
  onOpenAddTrx: () => void;
  onOpenPrint: () => void;
  onOpenBackupRestore: () => void;
  onOpenSettings: () => void;
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  profile,
  stats,
  onOpenAddTrx,
  onOpenPrint,
  onOpenBackupRestore,
  onOpenSettings,
  onResetData,
}) => {
  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Dasbor Ringkasan',
      icon: LayoutDashboard,
      desc: 'Statistik & saldo kas',
    },
    {
      id: 'kertas-kerja',
      label: 'Kertas Kerja (RAB)',
      icon: FileSpreadsheet,
      desc: 'Pagu & rincian biaya',
    },
    {
      id: 'bku',
      label: 'Buku Kas Umum (BKU)',
      icon: BookOpen,
      desc: 'Buku induk transaksi',
    },
    {
      id: 'buku-bank',
      label: 'Buku Pembantu Bank',
      icon: CreditCard,
      desc: 'Mutasi rekening bank',
    },
    {
      id: 'buku-tunai',
      label: 'Buku Pembantu Kas',
      icon: Wallet,
      desc: 'Kas tunai operasional',
    },
    {
      id: 'rekap',
      label: 'Rekap Anggaran',
      icon: PieChart,
      desc: 'Realisasi per kategori',
    },
    {
      id: 'logs',
      label: 'Log Aktivitas',
      icon: History,
      desc: 'Riwayat audit sistem',
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-xs tracking-wider text-white uppercase">
                  SI-SPJ REVITALISASI
                </h1>
                <p className="text-[11px] text-blue-300 font-medium truncate mt-0.5">
                  {profile.namaSekolah}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono font-medium">
                    TA {profile.tahunAnggaran}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action: Tambah Belanja */}
          <button
            onClick={() => {
              onOpenAddTrx();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full mt-3.5 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Belanja SPJ</span>
          </button>
        </div>

        {/* Navigation Menus List (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Pembukuan SPJ
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-blue-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tools & Utilities */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Laporan & Pengaturan
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onOpenPrint();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>Cetak / Ekspor PDF</span>
              </button>

              <button
                onClick={() => {
                  onOpenBackupRestore();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-300 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/40 transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-blue-400" />
                <span>Backup & Restore Data</span>
              </button>

              <button
                onClick={() => {
                  onOpenSettings();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Profil Lembaga & SK</span>
              </button>
            </div>
          </div>

          {/* Quick Balance Summary Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono">
            <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider block">
              Ringkasan Kas Saat Ini
            </span>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-blue-400" /> Bank:
              </span>
              <span className="font-semibold text-white">
                {formatIDR(stats.saldoBank)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1">
                <Wallet className="w-3 h-3 text-emerald-400" /> Tunai:
              </span>
              <span className="font-semibold text-white">
                {formatIDR(stats.saldoTunai)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-amber-300">
              <span className="text-[11px] font-sans font-bold flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" /> Total BKU:
              </span>
              <strong className="font-bold">
                {formatIDR(stats.saldoTotalKas)}
              </strong>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">SI-SPJ Revitalisasi v1.2</span>
          <button
            onClick={() => {
              onResetData();
              if (window.innerWidth < 1024) onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Reset ke Sampel Awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </>
  );
};
