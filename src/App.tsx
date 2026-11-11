/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  KertasKerjaItem,
  TransaksiSPJ,
  SchoolProfile,
  DashboardStats,
  ActivityLog,
} from './types';
import {
  loadProfile,
  saveProfile,
  loadKertasKerja,
  saveKertasKerja,
  loadTransaksi,
  saveTransaksi,
  loadLogs,
  logActivity,
  resetAllDataToDefault,
} from './services/storage';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { KertasKerjaView } from './components/KertasKerjaView';
import { BKUView } from './components/BKUView';
import { BukuBankView } from './components/BukuBankView';
import { BukuTunaiView } from './components/BukuTunaiView';
import { RekapAnggaranView } from './components/RekapAnggaranView';
import { ActivityLogView } from './components/ActivityLogView';
import { TransaksiFormModal } from './components/TransaksiFormModal';
import { PrintReportModal } from './components/PrintReportModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<SchoolProfile>(loadProfile);
  const [kertasKerja, setKertasKerja] = useState<KertasKerjaItem[]>(loadKertasKerja);
  const [transaksi, setTransaksi] = useState<TransaksiSPJ[]>(loadTransaksi);
  const [logs, setLogs] = useState<ActivityLog[]>(loadLogs);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Modals state
  const [isAddTrxModalOpen, setIsAddTrxModalOpen] = useState(false);
  const [editingTrx, setEditingTrx] = useState<TransaksiSPJ | null>(null);
  const [selectedKKIdForTrx, setSelectedKKIdForTrx] = useState<string | undefined>(undefined);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printReportType, setPrintReportType] = useState<
    'BKU' | 'BANK' | 'TUNAI' | 'REKAP' | 'KUITANSI'
  >('BKU');
  const [printTrx, setPrintTrx] = useState<TransaksiSPJ | null>(null);
  const [printMonth, setPrintMonth] = useState<string>('ALL');

  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);

  // Sync state changes with persistence
  const refreshLogs = () => {
    setLogs(loadLogs());
  };

  const handleDataRestored = (
    newProfile: SchoolProfile,
    newKK: KertasKerjaItem[],
    newTrx: TransaksiSPJ[],
    newLogs: ActivityLog[],
    message: string
  ) => {
    setProfile(newProfile);
    setKertasKerja(newKK);
    setTransaksi(newTrx);
    setLogs(newLogs);
    showToast(message);
  };

  const handleUpdateProfile = (newProfile: SchoolProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
    refreshLogs();
    showToast('Profil sekolah dan tim revitalisasi berhasil disimpan.');
  };

  // KERTAS KERJA ACTIONS
  const handleAddKertasKerja = (item: Omit<KertasKerjaItem, 'id' | 'createdAt'>) => {
    const newItem: KertasKerjaItem = {
      ...item,
      id: `KK-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...kertasKerja, newItem];
    setKertasKerja(updated);
    saveKertasKerja(updated);

    logActivity({
      operator: profile.namaBendahara,
      action: 'TAMBAH',
      modul: 'KERTAS_KERJA',
      deskripsi: `Menambah paket pekerjaan "${newItem.uraian}" kode ${newItem.kodeAkun}`,
      nominal: newItem.totalAnggaran,
    });
    refreshLogs();
    showToast(`Item "${newItem.uraian}" berhasil ditambahkan ke Kertas Kerja.`);
  };

  const handleAddMultipleKertasKerja = (
    items: Array<Omit<KertasKerjaItem, 'id' | 'createdAt'>>,
    insertAfterIndex?: number
  ) => {
    const newItems: KertasKerjaItem[] = items.map((item, idx) => ({
      ...item,
      id: `KK-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    let updated: KertasKerjaItem[];
    if (insertAfterIndex !== undefined && insertAfterIndex >= 0 && insertAfterIndex < kertasKerja.length) {
      updated = [
        ...kertasKerja.slice(0, insertAfterIndex + 1),
        ...newItems,
        ...kertasKerja.slice(insertAfterIndex + 1),
      ];
    } else {
      updated = [...kertasKerja, ...newItems];
    }

    setKertasKerja(updated);
    saveKertasKerja(updated);

    const totalNominal = newItems.reduce((acc, i) => acc + i.totalAnggaran, 0);
    logActivity({
      operator: profile.namaBendahara,
      action: 'TAMBAH',
      modul: 'KERTAS_KERJA',
      deskripsi: `Menyisipkan/menambah ${newItems.length} item kertas kerja baru`,
      nominal: totalNominal,
    });
    refreshLogs();
    showToast(`${newItems.length} item berhasil disimpan ke Kertas Kerja.`);
  };


  const handleEditKertasKerja = (updatedItem: KertasKerjaItem) => {
    const updated = kertasKerja.map((k) => (k.id === updatedItem.id ? updatedItem : k));
    setKertasKerja(updated);
    saveKertasKerja(updated);

    logActivity({
      operator: profile.namaBendahara,
      action: 'EDIT',
      modul: 'KERTAS_KERJA',
      deskripsi: `Memperbarui paket pekerjaan "${updatedItem.uraian}" kode ${updatedItem.kodeAkun}`,
      nominal: updatedItem.totalAnggaran,
    });
    refreshLogs();
    showToast(`Item "${updatedItem.uraian}" berhasil diperbarui.`);
  };

  const handleDeleteKertasKerja = (id: string) => {
    const target = kertasKerja.find((k) => k.id === id);
    const updated = kertasKerja.filter((k) => k.id !== id);
    setKertasKerja(updated);
    saveKertasKerja(updated);

    logActivity({
      operator: profile.namaBendahara,
      action: 'HAPUS',
      modul: 'KERTAS_KERJA',
      deskripsi: `Menghapus item kertas kerja "${target?.uraian || id}"`,
      nominal: target?.totalAnggaran,
    });
    refreshLogs();
    showToast(`Item "${target?.uraian || 'Kertas Kerja'}" berhasil dihapus.`);
  };

  const handleBulkDeleteKertasKerja = (ids: string[]) => {
    const count = ids.length;
    const updated = kertasKerja.filter((k) => !ids.includes(k.id));
    setKertasKerja(updated);
    saveKertasKerja(updated);

    logActivity({
      operator: profile.namaBendahara,
      action: 'HAPUS_MASSAL',
      modul: 'KERTAS_KERJA',
      deskripsi: `Menghapus ${count} item kertas kerja secara sekaligus`,
    });
    refreshLogs();
    showToast(`${count} item kertas kerja berhasil dihapus sekaligus.`);
  };

  // TRANSAKSI SPJ ACTIONS
  const handleSaveTransaksi = (
    data: Omit<TransaksiSPJ, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newTrx: TransaksiSPJ = {
      ...data,
      id: `TRX-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...transaksi, newTrx];
    setTransaksi(updated);
    saveTransaksi(updated);

    logActivity({
      operator: profile.namaBendahara,
      action: 'TAMBAH',
      modul:
        newTrx.metodePembayaran === 'BANK'
          ? 'BUKU_BANK'
          : newTrx.metodePembayaran === 'TUNAI'
          ? 'BUKU_TUNAI'
          : 'BKU',
      deskripsi: `Tambah transaksi [${newTrx.nomorBukti}]: ${newTrx.uraian}`,
      nominal: newTrx.nilaiBruto,
    });
    refreshLogs();
    showToast(`Transaksi ${newTrx.nomorBukti} berhasil dicatat.`);
  };

  const handleUpdateTransaksi = (updatedTrx: TransaksiSPJ) => {
    const updated = transaksi.map((t) =>
      t.id === updatedTrx.id
        ? { ...updatedTrx, updatedAt: new Date().toISOString() }
        : t
    );
    setTransaksi(updated);
    saveTransaksi(updated);

    logActivity({
      operator: profile.namaBendahara,
      action: 'EDIT',
      modul: 'BKU',
      deskripsi: `Ubah data transaksi [${updatedTrx.nomorBukti}]: ${updatedTrx.uraian}`,
      nominal: updatedTrx.nilaiBruto,
    });
    refreshLogs();
    showToast(`Transaksi ${updatedTrx.nomorBukti} berhasil diperbarui.`);
  };

  const handleDeleteTransaksi = (id: string) => {
    const target = transaksi.find((t) => t.id === id);
    const updated = transaksi.filter((t) => t.id !== id);
    setTransaksi(updated);
    saveTransaksi(updated);

    logActivity({
      operator: profile.namaBendahara,
      action: 'HAPUS',
      modul: 'BKU',
      deskripsi: `Hapus transaksi nomor bukti [${target?.nomorBukti || id}]: ${
        target?.uraian || ''
      }`,
      nominal: target?.nilaiBruto,
    });
    refreshLogs();
    showToast(`Transaksi [${target?.nomorBukti || 'ID: ' + id}] berhasil dihapus.`);
  };

  const handleBulkDeleteTransaksi = (ids: string[]) => {
    const count = ids.length;
    const updated = transaksi.filter((t) => !ids.includes(t.id));
    setTransaksi(updated);
    saveTransaksi(updated);

    logActivity({
      operator: profile.namaBendahara,
      action: 'HAPUS_MASSAL',
      modul: 'BKU',
      deskripsi: `Menghapus massal ${count} transaksi kas/SPJ sekaligus`,
    });
    refreshLogs();
    showToast(`${count} transaksi berhasil dihapus sekaligus.`);
  };

  const executeResetData = () => {
    resetAllDataToDefault();
    setProfile(loadProfile());
    setKertasKerja(loadKertasKerja());
    setTransaksi(loadTransaksi());
    setLogs(loadLogs());
    setIsResetModalOpen(false);
    showToast('Data aplikasi berhasil direset ke sampel awal Revitalisasi.');
  };

  // Helper to open edit transaction modal
  const handleOpenEditTrx = (trx: TransaksiSPJ) => {
    setEditingTrx(trx);
    setIsAddTrxModalOpen(true);
  };

  // Helper to quickly create SPJ spending directly from Kertas Kerja row
  const handleQuickAddBelanjaFromKK = (kertasKerjaId: string) => {
    setSelectedKKIdForTrx(kertasKerjaId);
    setEditingTrx(null);
    setIsAddTrxModalOpen(true);
  };

  // Helper to open Print modal
  const handleOpenPrintModal = (
    type: 'BKU' | 'BANK' | 'TUNAI' | 'REKAP' | 'KUITANSI' = 'BKU',
    month = 'ALL'
  ) => {
    setPrintReportType(type);
    setPrintMonth(month);
    setPrintTrx(null);
    setIsPrintModalOpen(true);
  };

  const handlePrintReceipt = (trx: TransaksiSPJ) => {
    setPrintReportType('KUITANSI');
    setPrintTrx(trx);
    setIsPrintModalOpen(true);
  };

  // REAL-TIME STATS CALCULATION
  const stats: DashboardStats = useMemo(() => {
    let saldoBank = 0;
    let saldoTunai = 0;
    let totalPajakPpn = 0;
    let totalPajakPph = 0;

    transaksi.forEach((t) => {
      // Pajak
      if (t.nilaiPpn) totalPajakPpn += t.nilaiPpn;
      if (t.nilaiPph) totalPajakPph += t.nilaiPph;

      // Arus Kas Bank
      if (t.jenisTransaksi === 'PENERIMAAN' || t.jenisTransaksi === 'SETOR_BANK') {
        saldoBank += t.nilaiBruto;
      } else if (t.jenisTransaksi === 'TARIK_TUNAI') {
        saldoBank -= t.nilaiBruto;
      } else if (t.jenisTransaksi === 'PENGELUARAN' && t.metodePembayaran === 'BANK') {
        saldoBank -= t.nilaiBruto;
      }

      // Arus Kas Tunai
      if (t.jenisTransaksi === 'TARIK_TUNAI') {
        saldoTunai += t.nilaiBruto;
      } else if (t.jenisTransaksi === 'PENERIMAAN' && t.metodePembayaran === 'TUNAI') {
        saldoTunai += t.nilaiBruto;
      } else if (t.jenisTransaksi === 'SETOR_BANK') {
        saldoTunai -= t.nilaiBruto;
      } else if (t.jenisTransaksi === 'PENGELUARAN' && t.metodePembayaran === 'TUNAI') {
        saldoTunai -= t.nilaiBruto;
      }
    });

    const totalPaguAnggaran = kertasKerja.reduce((acc, k) => acc + k.totalAnggaran, 0);
    const totalRealisasiBelanja = transaksi
      .filter((t) => t.jenisTransaksi === 'PENGELUARAN')
      .reduce((acc, t) => acc + t.nilaiBruto, 0);

    const sisaAnggaran = totalPaguAnggaran - totalRealisasiBelanja;
    const persentaseRealisasi =
      totalPaguAnggaran > 0
        ? Math.round((totalRealisasiBelanja / totalPaguAnggaran) * 1000) / 10
        : 0;

    return {
      saldoTotalKas: saldoBank + saldoTunai,
      saldoBank,
      saldoTunai,
      totalPaguAnggaran,
      totalRealisasiBelanja,
      sisaAnggaran,
      persentaseRealisasi,
      totalPajakDipungut: totalPajakPpn + totalPajakPph,
      totalPajakPpn,
      totalPajakPph,
    };
  }, [transaksi, kertasKerja]);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        stats={stats}
        onOpenAddTrx={() => {
          setEditingTrx(null);
          setSelectedKKIdForTrx(undefined);
          setIsAddTrxModalOpen(true);
        }}
        onOpenPrint={() => handleOpenPrintModal('BKU')}
        onOpenBackupRestore={() => setIsBackupRestoreOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetData={() => setIsResetModalOpen(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <Header
          profile={profile}
          stats={stats}
          activeTab={activeTab}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAddTrx={() => {
            setEditingTrx(null);
            setSelectedKKIdForTrx(undefined);
            setIsAddTrxModalOpen(true);
          }}
          onOpenPrint={() => handleOpenPrintModal('BKU')}
          onOpenBackupRestore={() => setIsBackupRestoreOpen(true)}
          onResetData={() => setIsResetModalOpen(true)}
        />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            profile={profile}
            kertasKerja={kertasKerja}
            transaksi={transaksi}
            onNavigateTab={setActiveTab}
            onOpenAddTrx={() => {
              setEditingTrx(null);
              setSelectedKKIdForTrx(undefined);
              setIsAddTrxModalOpen(true);
            }}
            onOpenKertasKerjaAdd={() => setActiveTab('kertas-kerja')}
          />
        )}

        {activeTab === 'kertas-kerja' && (
          <KertasKerjaView
            kertasKerja={kertasKerja}
            transaksi={transaksi}
            profile={profile}
            onAddKertasKerja={handleAddKertasKerja}
            onAddMultipleKertasKerja={handleAddMultipleKertasKerja}
            onEditKertasKerja={handleEditKertasKerja}
            onDeleteKertasKerja={handleDeleteKertasKerja}
            onBulkDeleteKertasKerja={handleBulkDeleteKertasKerja}
            onQuickAddBelanjaFromKK={handleQuickAddBelanjaFromKK}
          />
        )}

        {activeTab === 'bku' && (
          <BKUView
            transaksi={transaksi}
            profile={profile}
            onEditTransaksi={handleOpenEditTrx}
            onDeleteTransaksi={handleDeleteTransaksi}
            onBulkDeleteTransaksi={handleBulkDeleteTransaksi}
            onOpenAddModal={() => {
              setEditingTrx(null);
              setSelectedKKIdForTrx(undefined);
              setIsAddTrxModalOpen(true);
            }}
            onOpenPrintModal={handleOpenPrintModal}
            onPrintReceipt={handlePrintReceipt}
          />
        )}

        {activeTab === 'buku-bank' && (
          <BukuBankView
            transaksi={transaksi}
            profile={profile}
            onEditTransaksi={handleOpenEditTrx}
            onDeleteTransaksi={handleDeleteTransaksi}
            onBulkDeleteTransaksi={handleBulkDeleteTransaksi}
            onOpenAddModal={() => {
              setEditingTrx(null);
              setSelectedKKIdForTrx(undefined);
              setIsAddTrxModalOpen(true);
            }}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {activeTab === 'buku-tunai' && (
          <BukuTunaiView
            transaksi={transaksi}
            profile={profile}
            onEditTransaksi={handleOpenEditTrx}
            onDeleteTransaksi={handleDeleteTransaksi}
            onBulkDeleteTransaksi={handleBulkDeleteTransaksi}
            onOpenAddModal={() => {
              setEditingTrx(null);
              setSelectedKKIdForTrx(undefined);
              setIsAddTrxModalOpen(true);
            }}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {activeTab === 'rekap' && (
          <RekapAnggaranView
            kertasKerja={kertasKerja}
            transaksi={transaksi}
            profile={profile}
            stats={stats}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {activeTab === 'logs' && (
          <ActivityLogView logs={logs} profile={profile} />
        )}
      </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-3 px-4 text-xs text-slate-500 text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              SI-SPJ Revitalisasi Sekolah · {profile.namaSekolah} · Tahun Anggaran {profile.tahunAnggaran}
            </span>
            <span className="text-[11px] text-slate-400">
              Sistem Pertanggungjawaban Keuangan & Pembukuan Kas Sesuai Standar BOSP / DAK Fisik
            </span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <TransaksiFormModal
        isOpen={isAddTrxModalOpen}
        onClose={() => {
          setIsAddTrxModalOpen(false);
          setEditingTrx(null);
          setSelectedKKIdForTrx(undefined);
        }}
        kertasKerjaList={kertasKerja}
        transaksiList={transaksi}
        editingTrx={editingTrx}
        defaultKertasKerjaId={selectedKKIdForTrx}
        onSave={handleSaveTransaksi}
        onUpdate={handleUpdateTransaksi}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        profile={profile}
        transaksi={transaksi}
        kertasKerja={kertasKerja}
        stats={stats}
        initialReportType={printReportType}
        initialTrx={printTrx}
        initialMonth={printMonth}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleUpdateProfile}
      />

      <ConfirmDeleteModal
        isOpen={isResetModalOpen}
        title="Reset Seluruh Data Aplikasi"
        message="Apakah Anda yakin ingin mengembalikan seluruh data aplikasi ke contoh data awal revitalisasi sekolah?"
        warningNote="PERHATIAN: Seluruh perubahan data, penambahan transaksi, dan kertas kerja akan dikembalikan ke kondisi awal."
        confirmText="Reset ke Sampel Awal"
        onConfirm={executeResetData}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <BackupRestoreModal
        isOpen={isBackupRestoreOpen}
        onClose={() => setIsBackupRestoreOpen(false)}
        profile={profile}
        kertasKerja={kertasKerja}
        transaksi={transaksi}
        logs={logs}
        onDataRestored={handleDataRestored}
      />
    </div>
  );
}
