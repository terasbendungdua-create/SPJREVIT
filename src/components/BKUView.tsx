import React, { useState, useMemo } from 'react';
import { TransaksiSPJ, SchoolProfile } from '../types';
import { formatIDR, formatDateIndo } from '../services/storage';
import { exportBKUToExcel } from '../services/excelExport';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckSquare,
  Square,
  PlusCircle,
  Receipt
} from 'lucide-react';

interface BKUViewProps {
  transaksi: TransaksiSPJ[];
  profile: SchoolProfile;
  onEditTransaksi: (trx: TransaksiSPJ) => void;
  onDeleteTransaksi: (id: string) => void;
  onBulkDeleteTransaksi: (ids: string[]) => void;
  onOpenAddModal: () => void;
  onOpenPrintModal: (type?: 'BKU' | 'BANK' | 'TUNAI' | 'REKAP', month?: string) => void;
  onPrintReceipt: (trx: TransaksiSPJ) => void;
}

export const BKUView: React.FC<BKUViewProps> = ({
  transaksi,
  profile,
  onEditTransaksi,
  onDeleteTransaksi,
  onBulkDeleteTransaksi,
  onOpenAddModal,
  onOpenPrintModal,
  onPrintReceipt,
}) => {
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // In-app Delete Confirmation State
  const [trxToDelete, setTrxToDelete] = useState<TransaksiSPJ | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Sort transactions chronologically
  const sortedTransaksi = useMemo(() => {
    return [...transaksi].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
  }, [transaksi]);

  // Compute running balance across all transactions
  const transaksiWithSaldo = useMemo(() => {
    let runningSaldo = 0;
    return sortedTransaksi.map((trx) => {
      let debet = 0;
      let kredit = 0;

      if (trx.jenisTransaksi === 'PENERIMAAN') {
        debet = trx.nilaiBruto;
        runningSaldo += debet;
      } else if (trx.jenisTransaksi === 'PENGELUARAN') {
        kredit = trx.nilaiBruto;
        runningSaldo -= kredit;
      } else if (trx.jenisTransaksi === 'TARIK_TUNAI' || trx.jenisTransaksi === 'SETOR_BANK') {
        debet = trx.nilaiBruto;
        kredit = trx.nilaiBruto;
      }

      return {
        ...trx,
        debet,
        kredit,
        saldo: runningSaldo,
      };
    });
  }, [sortedTransaksi]);

  // Filter based on search & month
  const filteredTransaksi = useMemo(() => {
    return transaksiWithSaldo.filter((t) => {
      const matchSearch =
        t.uraian.toLowerCase().includes(search.toLowerCase()) ||
        t.nomorBukti.toLowerCase().includes(search.toLowerCase()) ||
        t.penerima.toLowerCase().includes(search.toLowerCase());

      let matchMonth = true;
      if (selectedMonth !== 'ALL') {
        const trxMonth = t.tanggal.substring(0, 7); // YYYY-MM
        matchMonth = trxMonth === selectedMonth;
      }

      return matchSearch && matchMonth;
    });
  }, [transaksiWithSaldo, search, selectedMonth]);

  // Get unique months list for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transaksi.forEach((t) => {
      if (t.tanggal) {
        months.add(t.tanggal.substring(0, 7));
      }
    });
    return Array.from(months).sort();
  }, [transaksi]);

  // Multi-select handlers
  const isAllSelected =
    filteredTransaksi.length > 0 &&
    filteredTransaksi.every((item) => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransaksi.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const executeDeleteSingle = () => {
    if (trxToDelete) {
      onDeleteTransaksi(trxToDelete.id);
      setSelectedIds((prev) => prev.filter((id) => id !== trxToDelete.id));
      setTrxToDelete(null);
    }
  };

  const executeBulkDelete = () => {
    if (selectedIds.length > 0) {
      onBulkDeleteTransaksi(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  // Summary statistics for filtered list
  const totalDebet = filteredTransaksi.reduce((acc, t) => acc + t.debet, 0);
  const totalKredit = filteredTransaksi.reduce((acc, t) => acc + t.kredit, 0);
  const totalPajak = filteredTransaksi.reduce((acc, t) => acc + (t.totalPajak || 0), 0);

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Buku Kas Induk</span>
              <span>·</span>
              <span>Rekapitulasi Mutasi Kas dan Bank</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Buku Kas Umum (BKU)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Catatan seluruh transaksi keuangan dana revitalisasi secara kronologis
              dengan kalkulasi saldo berjalan akurat.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => exportBKUToExcel(filteredTransaksi, profile, selectedMonth)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Ekspor Excel
            </button>
            <button
              onClick={() => onOpenPrintModal('BKU', selectedMonth)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              Cetak BKU
            </button>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Tambah Transaksi
            </button>
          </div>
        </div>

        {/* Search & Month Filter */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari uraian, nomor bukti, penerima..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Periode / Bulan</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Bulan {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Delete Notification Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold">{selectedIds.length} transaksi dipilih</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">
              Penghapusan sekaligus transaksi BKU
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Sekaligus ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Main BKU Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-3 px-3 text-center w-10">
                  <button
                    onClick={handleSelectAll}
                    className="cursor-pointer text-slate-600 hover:text-slate-900"
                    title={isAllSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2 text-center w-10">No</th>
                <th className="py-3 px-3 whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-3 whitespace-nowrap">No. Bukti</th>
                <th className="py-3 px-3 min-w-[240px]">Uraian Kegiatan / Belanja</th>
                <th className="py-3 px-3">Metode</th>
                <th className="py-3 px-3">Penerima</th>
                <th className="py-3 px-3 text-right">Penerimaan (Debet)</th>
                <th className="py-3 px-3 text-right">Pengeluaran (Kredit)</th>
                <th className="py-3 px-3 text-right font-semibold">Saldo Kas</th>
                <th className="py-3 px-3 text-right">Pajak (PPN/PPh)</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    Tidak ada catatan transaksi pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredTransaksi.map((trx, idx) => {
                  const isSelected = selectedIds.includes(trx.id);
                  return (
                    <tr
                      key={trx.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(trx.id)}
                          className="cursor-pointer text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {trx.tanggal}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {trx.nomorBukti}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900">{trx.uraian}</div>
                        {trx.jenisTransaksi === 'PENGELUARAN' && trx.kuantitas > 0 && (
                          <div className="text-[11px] text-slate-500">
                            {trx.kuantitas} {trx.satuan} @ {formatIDR(trx.hargaSatuan)}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-semibold text-[11px] ${
                            trx.metodePembayaran === 'BANK'
                              ? 'text-blue-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {trx.metodePembayaran}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                        {trx.penerima}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-emerald-600 font-medium">
                        {trx.debet > 0 ? formatIDR(trx.debet) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-rose-600 font-medium">
                        {trx.kredit > 0 ? formatIDR(trx.kredit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap text-slate-900">
                        {formatIDR(trx.saldo)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-slate-600">
                        {trx.totalPajak > 0 ? formatIDR(trx.totalPajak) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {trx.jenisTransaksi === 'PENGELUARAN' && (
                            <button
                              onClick={() => onPrintReceipt(trx)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              title="Cetak Kuitansi SPJ"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditTransaksi(trx)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTrxToDelete(trx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredTransaksi.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={7} className="py-3 px-3 text-right">
                    JUMLAH (DEBET / KREDIT):
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700">
                    {formatIDR(totalDebet)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-700">
                    {formatIDR(totalKredit)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-900 font-bold">
                    {formatIDR(filteredTransaksi[filteredTransaksi.length - 1]?.saldo || 0)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatIDR(totalPajak)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* In-app Single Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={trxToDelete !== null}
        title="Hapus Transaksi BKU"
        message="Apakah Anda yakin ingin menghapus data transaksi ini dari Buku Kas Umum?"
        itemDescription={
          trxToDelete
            ? `[${trxToDelete.nomorBukti}] ${trxToDelete.uraian} - Nilai: ${formatIDR(trxToDelete.nilaiBruto)}`
            : undefined
        }
        warningNote="Penghapusan akan otomatis memperbarui saldo kas BKU, buku pembantu terkait, serta realisasi pada Kertas Kerja."
        confirmText="Hapus Transaksi"
        onConfirm={executeDeleteSingle}
        onCancel={() => setTrxToDelete(null)}
      />

      {/* In-app Bulk Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleteModalOpen}
        title="Hapus Sekaligus Transaksi BKU"
        message={`Apakah Anda yakin ingin menghapus sekaligus ${selectedIds.length} transaksi yang dipilih dari BKU?`}
        warningNote="Perubahan ini akan langsung menyesuaikan kalkulasi saldo berjalan dan realisasi anggaran."
        confirmText={`Hapus ${selectedIds.length} Transaksi`}
        onConfirm={executeBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />
    </div>
  );
};
